import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Contract } from '../models/contract.model';
import { SavedContract } from '../models/save-state.model';
import { SaveMarker } from '../models/save-marker.model';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';
import { ResourceType } from '../models/resource.model';
import { MachineType } from '../models/machine.model';
import { CONTRACT_TEMPLATES, CONTRACTS_CONFIG, ContractTemplate } from '../config/contracts.config';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private resourcesService = inject(ResourcesService);
  private machinesService = inject(MachinesService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private audioService = inject(AudioService);
  private saveService?: SaveMarker;

  private contracts = signal<Contract[]>([]);
  private ticksSinceSpawnCheck = 0;
  private warnedContractIds = new Set<string>();
  private _overdueOnLoadIds = new Set<string>();
  private readonly WARNING_THRESHOLD_SECONDS = 30;

  private _firstContractSpawned = signal(false);
  private _hasSeenContractIntro = signal(false);
  private _showContractIntro = signal(false);
  /** true once any first contract has been spawned/generated */
  readonly hasSpawnedFirstContract = this._firstContractSpawned.asReadonly();
  /** true once the player has dismissed the contracts intro modal */
  readonly hasSeenContractIntro = this._hasSeenContractIntro.asReadonly();
  /** true when the intro modal should be shown (first-ever contract spawned) */
  readonly showContractIntro = this._showContractIntro.asReadonly();

  private readonly _firstContractUnlockEffect = effect(() => {
    const assemblerLevel = this.machinesService.getMachine(MachineType.ASSEMBLER)?.level ?? 0;
    if (assemblerLevel < 1 || this._firstContractSpawned()) {
      return;
    }

    this.spawnForcedLocalContract();
  });

  readonly available = computed(() =>
    this.contracts().filter((c) => !c.isAccepted && Date.now() < c.availableUntil),
  );

  // Sorted newest-accepted-first so the last accepted contract appears at top
  readonly active = computed(() =>
    this.contracts()
      .filter((c) => c.isAccepted)
      .sort((a, b) => b.acceptedAt - a.acceptedAt),
  );

  dismissContractIntro(): void {
    this._showContractIntro.set(false);
    this._hasSeenContractIntro.set(true);
    this.saveService?.markDirty();
  }

  setSaveService(saveService: SaveMarker): void {
    this.saveService = saveService;
  }

  /**
   * Called every game tick (1 second). Handles expiry, failure, and spawning.
   */
  tick(): void {
    const now = Date.now();
    this.ticksSinceSpawnCheck++;

    // Remove expired available contracts
    this.contracts.update((cs) => cs.filter((c) => c.isAccepted || now < c.availableUntil));

    // Check for failed accepted contracts (deadline passed)
    const failed = this.contracts().filter(
      (c) => c.isAccepted && this.getRemainingSeconds(c) <= 0,
    );
    for (const contract of failed) {
      if (this._overdueOnLoadIds.has(contract.id)) {
        // Contract was already overdue when loaded — silently remove to avoid double-penalty
        this.contracts.update((cs) => cs.filter((c) => c.id !== contract.id));
        this._overdueOnLoadIds.delete(contract.id);
        this.warnedContractIds.delete(contract.id);
        this.saveService?.markDirty();
      } else {
        this.applyPenalty(contract);
      }
    }

    // Deadline warning — fire once per contract when <= WARNING_THRESHOLD_SECONDS remaining
    const nearDeadline = this.contracts().filter(
      (c) =>
        c.isAccepted &&
        !this.warnedContractIds.has(c.id) &&
        this.getRemainingSeconds(c) <= this.WARNING_THRESHOLD_SECONDS &&
        this.getRemainingSeconds(c) > 0,
    );
    for (const contract of nearDeadline) {
      this.warnedContractIds.add(contract.id);
      this.audioService.playContractWarning();
      const resourceName = this.translationService.t(`resources.${contract.resourceId}`);
      this.notificationService.show(
        this.translationService.tp('contracts.notifications.deadline_warning', {
          resource: resourceName,
        }),
        'warning',
      );
    }

    // Spawn check
    if (this.ticksSinceSpawnCheck >= CONTRACTS_CONFIG.SPAWN_CHECK_INTERVAL) {
      this.ticksSinceSpawnCheck = 0;
      this.trySpawn(now);
    }
  }

  accept(contractId: string): void {
    const now = Date.now();
    const contract = this.contracts().find((c) => c.id === contractId);
    if (!contract || contract.isAccepted || now >= contract.availableUntil) return;

    const activeCount = this.contracts().filter((c) => c.isAccepted).length;
    if (activeCount >= CONTRACTS_CONFIG.MAX_ACTIVE) return;

    this.contracts.update((cs) =>
      cs.map((c) =>
        c.id === contractId && !c.isAccepted ? { ...c, isAccepted: true, acceptedAt: now } : c,
      ),
    );
    this.saveService?.markDirty();
  }

  reject(contractId: string): void {
    const contract = this.contracts().find((c) => c.id === contractId);
    if (!contract || contract.isAccepted) return;
    this.contracts.update((cs) => cs.filter((c) => c.id !== contractId));
    this.saveService?.markDirty();
  }

  canDeliver(contract: Contract): boolean {
    return this.resourcesService.hasEnough(contract.resourceId, contract.amount);
  }

  deliver(contractId: string): void {
    const contract = this.contracts().find((c) => c.id === contractId);
    if (!contract || !contract.isAccepted) return;
    if (this.getRemainingSeconds(contract) <= 0) return;
    if (!this.canDeliver(contract)) return;

    this.resourcesService.subtract(contract.resourceId, contract.amount);
    this.resourcesService.add(ResourceType.MONEY, contract.reward);
    this.contracts.update((cs) => cs.filter((c) => c.id !== contractId));
    this.warnedContractIds.delete(contractId);
    this.saveService?.markDirty();

    const resourceName = this.translationService.t(`resources.${contract.resourceId}`);
    this.notificationService.show(
      this.translationService.tp('contracts.notifications.delivered', {
        reward: contract.reward,
        resource: resourceName,
      }),
      'success',
    );
  }

  /**
   * Returns seconds remaining for an accepted contract. Negative = overdue.
   */
  getRemainingSeconds(contract: Contract): number {
    if (!contract.isAccepted || contract.acceptedAt === 0) return contract.durationSeconds;
    const elapsed = (Date.now() - contract.acceptedAt) / 1000;
    return Math.ceil(contract.durationSeconds - elapsed);
  }

  /**
   * Returns seconds remaining before an available contract expires.
   */
  getAvailableSeconds(contract: Contract): number {
    return Math.ceil((contract.availableUntil - Date.now()) / 1000);
  }

  formatTimer(seconds: number): string {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // ─── Persistence ────────────────────────────────────────────────────────────

  serialize(): SavedContract[] {
    return this.contracts().map((c) => ({
      id: c.id,
      type: c.type,
      urgency: c.urgency,
      resourceId: c.resourceId,
      amount: c.amount,
      reward: c.reward,
      penaltyAmount: c.penaltyAmount,
      durationSeconds: c.durationSeconds,
      spawnedAt: c.spawnedAt,
      availableUntil: c.availableUntil,
      acceptedAt: c.acceptedAt,
      isAccepted: c.isAccepted,
    }));
  }

  hydrate(
    saved?: SavedContract[],
    options: { hasSeenIntro?: boolean; hasSpawnedFirstContract?: boolean } = {},
  ): void {
    this._hasSeenContractIntro.set(options.hasSeenIntro ?? false);
    this._firstContractSpawned.set(options.hasSpawnedFirstContract ?? false);
    this._overdueOnLoadIds.clear();
    this.warnedContractIds.clear();

    if (!saved || saved.length === 0) {
      this.contracts.set([]);
      this._showContractIntro.set(false);
      return;
    }

    const now = Date.now();
    const contracts: Contract[] = saved
      .map((s) => ({
        id: s.id,
        type: s.type,
        urgency: s.urgency,
        resourceId: s.resourceId as ResourceType,
        amount: s.amount,
        reward: s.reward,
        penaltyAmount: s.penaltyAmount,
        durationSeconds: s.durationSeconds,
        spawnedAt: s.spawnedAt ?? now,
        availableUntil: s.availableUntil ?? now + (s.durationSeconds ?? 120) * 1000,
        acceptedAt: s.acceptedAt,
        isAccepted: s.isAccepted,
      }))
      // Drop expired available contracts and already-failed active ones
      .filter((c) => {
        if (!c.isAccepted) return now < c.availableUntil;
        return this.getRemainingSeconds(c) > -60; // keep up to 60s grace period
      });

    // Track overdue-on-load contracts to suppress double-penalty in tick()
    for (const c of contracts) {
      if (c.isAccepted && this.getRemainingSeconds(c) <= 0) {
        this._overdueOnLoadIds.add(c.id);
      }
    }

    // Pre-warn contracts already within threshold so the warning doesn't re-fire on reload
    for (const c of contracts) {
      const remaining = this.getRemainingSeconds(c);
      if (c.isAccepted && remaining <= this.WARNING_THRESHOLD_SECONDS && remaining > 0) {
        this.warnedContractIds.add(c.id);
      }
    }

    this.contracts.set(contracts);

    // Show intro modal if player never dismissed it but already has contracts
    this._showContractIntro.set(!this._hasSeenContractIntro() && contracts.length > 0);
  }

  reset(): void {
    this.contracts.set([]);
    this.ticksSinceSpawnCheck = 0;
    this.warnedContractIds.clear();
    this._overdueOnLoadIds.clear();
    this._firstContractSpawned.set(false);
    this._hasSeenContractIntro.set(false);
    this._showContractIntro.set(false);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private trySpawn(now: number): void {
    // Contracts unlock once the assembler is available.
    const assembler = this.machinesService.getMachine(MachineType.ASSEMBLER);
    if (!assembler || assembler.level === 0) return;

    const visibleContracts = this.contracts().filter((c) => c.isAccepted || now < c.availableUntil);
    if (visibleContracts.length >= CONTRACTS_CONFIG.MAX_AVAILABLE) return;

    // Exclude resources already in available or active contracts to avoid duplicates
    const existingResourceIds = new Set(this.contracts().map((c) => c.resourceId));

    const producible = this.getProducibleResourceIds().filter(
      (id) => !existingResourceIds.has(id as ResourceType),
    );
    if (producible.length === 0) return;

    // Pick a random producible resource not already in the list
    const resourceId = producible[Math.floor(Math.random() * producible.length)];
    const template = CONTRACT_TEMPLATES.find((t) => t.resourceId === resourceId);
    if (!template) return;

    const isUrgent = Math.random() < CONTRACTS_CONFIG.URGENT_CHANCE;
    const duration = isUrgent
      ? Math.round(template.durationSeconds * CONTRACTS_CONFIG.URGENT_DURATION_MULT)
      : template.durationSeconds;
    const reward = isUrgent
      ? Math.round(template.reward * CONTRACTS_CONFIG.URGENT_REWARD_MULT)
      : template.reward;
    const penalty = isUrgent
      ? Math.round(template.penaltyAmount * CONTRACTS_CONFIG.URGENT_PENALTY_MULT)
      : template.penaltyAmount;

    this.registerSpawn(this.createContractFromTemplate(template, now, isUrgent));
  }

  private spawnForcedLocalContract(): void {
    const now = Date.now();
    const producible = new Set(this.getProducibleResourceIds());
    const firstLocalTemplate = CONTRACT_TEMPLATES.find(
      (template) => template.type === 'local' && producible.has(template.resourceId),
    );

    if (!firstLocalTemplate) {
      return;
    }

    this.registerSpawn(this.createContractFromTemplate(firstLocalTemplate, now, false));
  }

  private createContractFromTemplate(
    template: ContractTemplate,
    now: number,
    isUrgent: boolean,
  ): Contract {
    const duration = isUrgent
      ? Math.round(template.durationSeconds * CONTRACTS_CONFIG.URGENT_DURATION_MULT)
      : template.durationSeconds;
    const reward = isUrgent
      ? Math.round(template.reward * CONTRACTS_CONFIG.URGENT_REWARD_MULT)
      : template.reward;
    const penalty = isUrgent
      ? Math.round(template.penaltyAmount * CONTRACTS_CONFIG.URGENT_PENALTY_MULT)
      : template.penaltyAmount;

    return {
      id: `contract_${now}_${Math.random().toString(36).slice(2, 7)}`,
      type: template.type,
      urgency: isUrgent ? 'urgent' : 'normal',
      resourceId: template.resourceId,
      amount: template.amount,
      reward,
      penaltyAmount: penalty,
      durationSeconds: duration,
      spawnedAt: now,
      availableUntil: now + template.availableDurationSeconds * 1000,
      acceptedAt: 0,
      isAccepted: false,
    };
  }

  private registerSpawn(contract: Contract): void {
    this.contracts.update((cs) => [...cs, contract]);
    this._firstContractSpawned.set(true);
    this.saveService?.markDirty();

    if (!this._hasSeenContractIntro()) {
      this._showContractIntro.set(true);
    }

    const resourceName = this.translationService.t(`resources.${contract.resourceId}`);
    this.audioService.playContractNew();
    this.notificationService.show(
      this.translationService.tp('contracts.notifications.new', { resource: resourceName }),
      'info',
    );
  }

  private getProducibleResourceIds(): string[] {
    const machines = this.machinesService.getAll();
    const templateResourceIds = new Set(CONTRACT_TEMPLATES.map((t) => t.resourceId as string));
    return [
      ...new Set(
        machines
          .filter((m) => m.level > 0) // level > 0 = unlocked
          .map((m) => m.baseProduction.resourceId)
          .filter((id) => templateResourceIds.has(id)),
      ),
    ];
  }

  private applyPenalty(contract: Contract): void {
    let actualPenalty = 0;
    if (contract.penaltyAmount > 0) {
      const currentMoney = this.resourcesService.getAmount(ResourceType.MONEY);
      // Math.min caps the penalty to current money — intentional design floor.
      // The player cannot go into debt from a failed contract (idle-game AFK protection).
      actualPenalty = Math.min(contract.penaltyAmount, currentMoney);
      if (actualPenalty > 0) {
        this.resourcesService.subtract(ResourceType.MONEY, actualPenalty);
      }
    }
    this.notificationService.show(
      this.translationService.tp('contracts.notifications.failed', {
        penalty: actualPenalty,
      }),
      'warning',
    );
    // Remove failed contract
    this.contracts.update((cs) => cs.filter((c) => c.id !== contract.id));
    this.warnedContractIds.delete(contract.id);
    this.saveService?.markDirty();
  }
}
