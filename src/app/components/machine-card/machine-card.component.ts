import { Component, Input, computed, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Machine, MachineType } from '../../models/machine.model';
import { ResourcesService } from '../../services/resources.service';
import { MachinesService } from '../../services/machines.service';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ProgressBarComponent } from '../ui/progress-bar/progress-bar.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { INITIAL_RESOURCES } from '../../config/resources.config';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, ProgressBarComponent, TooltipComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="machine-card"
      [class.selected]="isSelected()"
      [class.locked]="isLocked()"
      (click)="selectMachine()"
    >
      <div class="machine-header">
        <div class="machine-title-group">
          <h3 class="machine-name">{{ translatedMachineName() }}</h3>
          <span class="machine-level" *ngIf="!isLocked()"
            >{{ translationService.t('common.level_short') }} {{ currentLevel() }}</span
          >
        </div>
        <div class="machine-controls">
          <app-button
            *ngIf="!isLocked()"
            [label]="
              currentIsActive()
                ? translationService.t('buttons.activa')
                : translationService.t('buttons.parada')
            "
            [variant]="currentIsActive() ? 'primary' : 'secondary'"
            size="sm"
            (clicked)="toggleMachine()"
          />
        </div>
        <div *ngIf="isLocked()" class="locked-info">
          <span class="locked-badge">🔒 {{ translationService.t('status.bloqueada') }}</span>
          <span class="unlock-requirements" *ngIf="unlockRequirementsText()">
            {{ unlockRequirementsText() }}
          </span>
        </div>
      </div>

      <div class="machine-recipe">
        <span class="recipe-inputs">
          <span *ngFor="let input of effectiveInputs(); let last = last">
            <app-tooltip [text]="getResourceName(input.resourceId)" [inline]="true">
              <img [src]="getResourceIcon(input.resourceId)" class="resource-icon" alt="Resource" />
            </app-tooltip>
            <span class="resource-amount">{{ input.amount }}</span>
            <span *ngIf="!last" class="separator">+</span>
          </span>
        </span>
        <span class="recipe-arrow">→</span>
        <span class="recipe-output">
          <app-tooltip [text]="getResourceName(currentBaseProduction().resourceId)" [inline]="true">
            <img
              [src]="getResourceIcon(currentBaseProduction().resourceId)"
              class="resource-icon"
              alt="Resource"
            />
          </app-tooltip>
          <span class="resource-amount">{{ effectiveOutput() }}</span>
        </span>
      </div>

      <div class="machine-stats" *ngIf="!isLocked()">
        <app-tooltip [text]="speedTooltip()" [inline]="true" [position]="'top-right'">
          <span class="stat-item">
            ⚡ {{ effectiveSpeed().toFixed(2) }}
            {{ translationService.t('upgrades.machine_tab.cycles_per_second') }}
          </span>
        </app-tooltip>
        <app-tooltip
          *ngIf="productionMultiplier() > 1"
          [text]="multiplierTooltip()"
          [inline]="true"
          [position]="'top-right'"
        >
          <span class="stat-item"> ×{{ productionMultiplier() }} </span>
        </app-tooltip>
      </div>

      <app-progress-bar
        [progress]="progressPercent() / 100"
        [label]="progressLabel()"
        [inline]="true"
      />

      <div class="machine-status">
        <span
          class="status-label"
          [ngClass]="{
            'status-produciendo': statusText() === translationService.t('status.produciendo'),
            'status-parada': statusText() === translationService.t('status.parada'),
            'status-bloqueada': statusText() === translationService.t('status.bloqueada'),
            'status-input': statusText() === translationService.t('status.falta_input'),
            'status-output': statusText() === translationService.t('status.output_lleno'),
          }"
        >
          {{ statusText() }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .machine-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        cursor: pointer;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .machine-card:hover {
        border-color: var(--color-accent-main);
      }

      .machine-card.locked {
        opacity: 0.6;
        cursor: default;
      }

      .machine-card.locked:hover {
        border-color: var(--color-border);
      }

      .machine-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .machine-adge {
        font-size: 12px;
        color: var(--color-text-secondary);
        padding: 4px 8px;
        background: var(--color-bg-main);
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .machine-card.selected {
        border-color: var(--color-accent-main);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        background: rgba(139, 92, 246, 0.03);
      }

      .machine-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .machine-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .machine-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
      }

      .machine-level {
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-secondary);
        background: var(--color-bg-main);
        padding: 2px 6px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .locked-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .locked-badge {
        font-size: 11px;
        font-weight: 500;
        color: #9e9e9e;
        background: rgba(158, 158, 158, 0.1);
        padding: 4px 8px;
        border-radius: var(--border-radius-small);
        border: 1px solid rgba(158, 158, 158, 0.3);
      }

      .unlock-requirements {
        font-size: 10px;
        color: var(--color-text-secondary);
        background: var(--color-bg-elevated);
        padding: 4px 8px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
        line-height: 1.4;
        text-align: right;
        max-width: min(300px, 100%);
      }

      .machine-recipe {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: var(--space-2);
        font-size: 12px;
        color: var(--color-text-secondary);
        opacity: 0.9;
      }

      .recipe-inputs,
      .recipe-output {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .resource-icon {
        width: 40px;
        height: 40px;
        object-fit: contain;
      }

      .resource-amount {
        font-weight: 500;
        margin-right: 2px;
      }

      .separator {
        margin: 0 3px;
        font-weight: 500;
      }

      .recipe-arrow {
        color: var(--color-accent-main);
      }

      .machine-stats {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: var(--space-2);
        padding-top: var(--space-2);
        font-size: 11px;
      }

      .stat-item {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        font-weight: 500;
        color: var(--color-accent-positive);
      }

      .machine-status {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 13px;
      }

      .status-label {
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--border-radius-small);
        border: 1px solid;
      }

      .status-produciendo {
        color: #22c55e !important;
        background: rgba(34, 197, 94, 0.15) !important;
        border-color: rgba(34, 197, 94, 0.3) !important;
      }

      .status-parada {
        color: #94a3b8 !important;
        background: rgba(148, 163, 184, 0.1) !important;
        border-color: rgba(148, 163, 184, 0.2) !important;
      }

      .status-bloqueada {
        color: #64748b !important;
        background: rgba(100, 116, 139, 0.1) !important;
        border-color: rgba(100, 116, 139, 0.2) !important;
      }

      .status-input {
        color: #f59e0b !important;
        background: rgba(245, 158, 11, 0.15) !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }

      .status-output {
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.15) !important;
        border-color: rgba(239, 68, 68, 0.3) !important;
      }
    `,
  ],
})
export class MachineCardComponent {
  @Input() machine!: Machine;

  private upgradesService = inject(UpgradesService);
  private machineUnlockService = inject(MachineUnlockService);

  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
    private machineSelectionService: MachineSelectionService,
    public translationService: TranslationService,
  ) {}

  private currentMachine = computed(
    () => this.machinesService.getMachine(this.machine.id) || this.machine,
  );

  currentLevel = computed(() => {
    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(this.machine.id);
    return upgradeId ? this.upgradesService.getLevel(upgradeId) : this.currentMachine().level;
  });
  currentIsActive = computed(() => this.currentMachine().isActive);
  currentBaseProduction = computed(() => this.currentMachine().baseProduction);

  progressPercent = computed(() => {
    const machine = this.currentMachine();
    return Math.round(machine.progress * 100);
  });

  isSelected = computed(
    () => this.machineSelectionService.getSelectedMachineId() === this.machine.id,
  );

  isLocked = computed(() => {
    const machine = this.currentMachine();
    return machine.level === 0;
  });

  unlockInfo = computed(() => {
    return this.machineUnlockService.getUnlockInfo(this.machine.id as MachineType);
  });

  unlockRequirementsText = computed(() => {
    const info = this.unlockInfo();
    if (info.isUnlocked || info.requirements.length === 0) {
      return '';
    }

    const reqs = info.requirements.map((req) => {
      const machineName = this.translationService.t(`machines.${req.machineType}`);
      const levelText = this.translationService.t('common.level_short');
      const status = req.isMet ? '✓' : '✗';
      return `${status} ${machineName} ${levelText} ${req.requiredLevel} (${req.currentLevel}/${req.requiredLevel})`;
    });

    return reqs.join(' • ');
  });

  getResourceIcon(resourceId: string): string {
    const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);
    return resource?.icon || '?';
  }

  getResourceName(resourceId: string): string {
    return this.translationService.t(`resources.${resourceId}`);
  }

  translatedMachineName = computed(() => {
    // El ID de la máquina ya es el tipo (crusher, separator, etc.)
    return this.translationService.t(`machines.${this.machine.id}`);
  });

  productionMultiplier = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateProductionMultiplier(machine.id);
  });

  consumptionMultiplier = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateConsumptionMultiplier(machine.id);
  });

  effectiveSpeed = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateEffectiveSpeed(machine.baseSpeed, machine.id);
  });

  effectiveInputs = computed(() => {
    const machine = this.currentMachine();
    const multiplier = this.consumptionMultiplier();
    return machine.baseConsumption.map((input) => ({
      resourceId: input.resourceId,
      amount: input.amount * multiplier,
    }));
  });

  effectiveOutput = computed(() => {
    const machine = this.currentMachine();
    const multiplier = this.productionMultiplier();
    return machine.baseProduction.amount * multiplier;
  });

  effectiveCycleTime = computed(() => {
    const speed = this.effectiveSpeed();
    return speed > 0 ? 1 / speed : 0;
  });

  remainingCycleTime = computed(() => {
    const machine = this.currentMachine();
    const cycleTime = this.effectiveCycleTime();
    const remainingProgress = 1 - machine.progress;
    return cycleTime * remainingProgress;
  });

  progressLabel = computed(() => {
    const machine = this.currentMachine();
    if (!machine.isActive || machine.progress === 0) {
      return '';
    }
    const remaining = this.remainingCycleTime();
    return `${remaining.toFixed(1)}s`;
  });

  speedTooltip = computed(() => {
    const cycleTime = this.effectiveCycleTime();
    return this.translationService.tp('tooltips.machine_speed', {
      time: cycleTime.toFixed(1),
    });
  });

  multiplierTooltip = computed(() => {
    const mult = this.productionMultiplier();
    const consumeMult = this.consumptionMultiplier();
    return this.translationService.tp('tooltips.machine_multiplier', {
      production: mult,
      consumption: consumeMult,
    });
  });

  get recipeInputs(): string {
    return this.machine.baseConsumption.map((c) => `${c.amount} ${c.resourceId}`).join(' + ');
  }

  get recipeOutput(): string {
    const p = this.machine.baseProduction;
    return `${p.amount} ${p.resourceId}`;
  }

  get cycleTime(): number {
    return Math.round(1 / this.machine.baseSpeed);
  }

  statusText = computed(() => {
    const machine = this.currentMachine();

    if (machine.level === 0) return this.translationService.t('status.bloqueada');

    if (!machine.isActive) return this.translationService.t('status.parada');

    // Si está en proceso de producción (progreso > 0), mostrar "Produciendo"
    // No verificar inputs porque ya fueron consumidos al inicio del ciclo
    if (machine.progress > 0) {
      return this.translationService.t('status.produciendo');
    }

    // Si está en progress = 0, verificar si puede empezar un nuevo ciclo
    const consumptionMultiplier = this.upgradesService.calculateConsumptionMultiplier(machine.id);
    const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

    const hasInputs = machine.baseConsumption.every((c) =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * consumptionMultiplier),
    );

    const outputAmount = machine.baseProduction.amount * productionMultiplier;
    const outputResourceId = machine.baseProduction.resourceId;
    const availableSpace = this.resourcesService.getAvailableSpace(outputResourceId);

    // Para recursos con capacidad infinita (Infinity), siempre hay espacio
    // Para recursos finitos, verificar que haya suficiente espacio
    const hasSpace = !isFinite(availableSpace) || availableSpace >= outputAmount;

    if (!hasInputs) return this.translationService.t('status.falta_input');
    if (!hasSpace) return this.translationService.t('status.output_lleno');

    // Máquina lista esperando para producir
    return this.translationService.t('status.produciendo');
  });

  selectMachine(): void {
    if (!this.isLocked()) {
      this.machineSelectionService.selectMachine(this.machine.id);
    }
  }

  toggleMachine(): void {
    this.machinesService.setActive(this.machine.id, !this.machine.isActive);
  }
}
