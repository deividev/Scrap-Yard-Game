import { Component, signal, computed, effect, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { MachinesService } from '../../services/machines.service';
import { UpgradesService } from '../../services/upgrades.service';
import { ResourcesService } from '../../services/resources.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradeId } from '../../models/upgrade.model';
import { ResourceType } from '../../models/resource.model';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { SCRAP_GENERATION_CONFIG, STORAGE_UPGRADE_CONFIG } from '../../config/game-balance.config';

@Component({
  selector: 'app-upgrades-panel',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, FormatNumberPipe],
  template: `
    <div class="upgrades-panel" [class.minimized]="isMinimized()">
      <div class="panel-header">
        <h2 class="section-title" *ngIf="!isMinimized()">
          {{ translationService.t('upgrades.title') }}
        </h2>
        <app-button
          [label]="isMinimized() ? '◀' : '▶'"
          variant="ghost"
          size="sm"
          (clicked)="toggleMinimize()"
        />
      </div>

      <div class="panel-content" *ngIf="!isMinimized()">
        <div class="tabs">
          <app-button
            *ngFor="let tab of tabs()"
            [label]="tab.label"
            variant="ghost"
            size="sm"
            [class.active]="activeTab() === tab.id"
            (clicked)="setActiveTab(tab.id)"
          />
        </div>

        <div class="tab-content">
          <div *ngIf="activeTab() === 'scrap'" class="scrap-upgrades">
            <div class="upgrade-item">
              <div class="upgrade-header">
                <span class="upgrade-icon">♻️</span>
                <div class="upgrade-info">
                  <h4 class="upgrade-name">{{ scrapAutoUpgrade().name }}</h4>
                  <p class="upgrade-description">
                    {{ translationService.t('upgrades.nivel') }} {{ scrapAutoUpgrade().level }} /
                    {{ SCRAP_GENERATION_CONFIG.MAX_LEVEL }}
                  </p>
                </div>
              </div>

              <div class="upgrade-details">
                <p class="detail-line">
                  <strong>{{ translationService.t('upgrades.scrap_details.manual_label') }}</strong>
                  +{{ SCRAP_GENERATION_CONFIG.MANUAL_GENERATION }}
                  {{ translationService.t('upgrades.scrap_details.per_click') }}
                </p>
                <p class="detail-line">
                  <strong>{{
                    translationService.t('upgrades.scrap_details.automatic_current_label')
                  }}</strong>
                  +{{ scrapAutoUpgrade().currentRate
                  }}{{ translationService.t('upgrades.scrap_details.per_second') }}
                </p>
                <p class="detail-line" *ngIf="!scrapAutoUpgrade().isMaxLevel">
                  <strong>{{
                    translationService.t('upgrades.scrap_details.next_level_label')
                  }}</strong>
                  +{{ scrapAutoUpgrade().nextRate
                  }}{{ translationService.t('upgrades.scrap_details.per_second') }}
                </p>
              </div>

              <div class="upgrade-cost" *ngIf="!scrapAutoUpgrade().isMaxLevel">
                <span class="cost-item">💰 {{ scrapAutoUpgrade().cost.money | formatNumber }}</span>
                <span *ngIf="scrapAutoUpgrade().cost.components > 0" class="cost-item"
                  >🔧 {{ scrapAutoUpgrade().cost.components | formatNumber }}</span
                >
              </div>

              <app-button
                *ngIf="!scrapAutoUpgrade().isMaxLevel"
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="!scrapAutoUpgrade().canAfford"
                (clicked)="purchaseScrapUpgrade()"
              />

              <p *ngIf="scrapAutoUpgrade().isMaxLevel" class="max-level">
                {{ translationService.t('upgrades.max_level') }}
              </p>
            </div>
          </div>

          <div *ngIf="activeTab() === 'storage'" class="storage-upgrades">
            <div *ngFor="let upgrade of storageUpgrades()" class="upgrade-item">
              <div class="upgrade-header">
                <span class="upgrade-icon">{{ upgrade.icon }}</span>
                <div class="upgrade-info">
                  <h4 class="upgrade-name">{{ upgrade.name }}</h4>
                  <p class="upgrade-description">
                    {{ translationService.t('upgrades.nivel') }} {{ upgrade.level }}
                  </p>
                </div>
              </div>

              <div class="upgrade-capacity">
                <span class="capacity-label">{{
                  translationService.t('upgrades.capacity_label')
                }}</span>
                <span class="capacity-current">{{ upgrade.currentCapacity | formatNumber }}</span>
                <span class="capacity-arrow">→</span>
                <span class="capacity-next">{{ upgrade.nextCapacity | formatNumber }}</span>
              </div>

              <div class="upgrade-cost" *ngIf="!upgrade.isMaxLevel">
                <span class="cost-item">💰 {{ upgrade.cost.money | formatNumber }}</span>
                <span *ngIf="upgrade.cost.components > 0" class="cost-item"
                  >🔧 {{ upgrade.cost.components | formatNumber }}</span
                >
              </div>

              <app-button
                *ngIf="!upgrade.isMaxLevel"
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="!upgrade.canAfford"
                (clicked)="purchaseStorageUpgrade(upgrade.upgradeId)"
              />

              <p *ngIf="upgrade.isMaxLevel" class="max-level">
                {{ translationService.t('upgrades.max_level') }}
              </p>
            </div>
          </div>

          <div *ngIf="activeTab() === 'machine'">
            <div *ngIf="selectedMachine(); else noMachine" class="machine-info">
              <div class="upgrade-item">
                <div class="upgrade-header">
                  <span class="upgrade-icon">⚙️</span>
                  <div class="upgrade-info">
                    <h4 class="upgrade-name">{{ translatedMachineName() }}</h4>
                    <p class="upgrade-description">
                      {{ translationService.t('upgrades.nivel') }}
                      {{ machineUpgrade().level }} / {{ machineUpgrade().maxLevel }}
                    </p>
                  </div>
                </div>

                <div class="upgrade-details">
                  <p class="detail-line">
                    <strong>{{
                      translationService.t('upgrades.machine_tab.base_speed_label')
                    }}</strong>
                    {{ machineUpgrade().baseSpeed }}
                    {{ translationService.t('upgrades.machine_tab.cycles_per_second') }}
                  </p>
                  <p class="detail-line">
                    <strong>{{
                      translationService.t('upgrades.machine_tab.effective_speed_label')
                    }}</strong>
                    {{ machineUpgrade().effectiveSpeed.toFixed(2) }}
                    {{ translationService.t('upgrades.machine_tab.cycles_per_second') }}
                    <span class="bonus"
                      >(+{{ (machineUpgrade().speedBonus * 100).toFixed(0) }}%)</span
                    >
                  </p>
                  <p class="detail-line" *ngIf="machineUpgrade().productionMultiplier > 1">
                    <strong>{{
                      translationService.t('upgrades.machine_tab.production_multiplier_label')
                    }}</strong>
                    ×{{ machineUpgrade().productionMultiplier }}
                  </p>
                  <p
                    class="detail-line"
                    *ngIf="!machineUpgrade().isMaxLevel && machineUpgrade().nextBonusAt > 0"
                  >
                    <strong>{{
                      translationService.t('upgrades.machine_tab.next_bonus_label')
                    }}</strong>
                    {{ translationService.t('upgrades.machine_tab.in_levels').replace('{{count}}',
                    machineUpgrade().nextBonusAt.toString()) }}
                  </p>
                </div>

                <div class="upgrade-cost" *ngIf="!machineUpgrade().isMaxLevel">
                  <span class="cost-item">💰 {{ machineUpgrade().cost.money | formatNumber }}</span>
                  <span *ngIf="machineUpgrade().cost.components > 0" class="cost-item">
                    🔧 {{ machineUpgrade().cost.components | formatNumber }}
                  </span>
                </div>

                <app-button
                  *ngIf="!machineUpgrade().isMaxLevel"
                  [label]="translationService.t('buttons.mejorar')"
                  variant="primary"
                  size="sm"
                  [disabled]="!machineUpgrade().canAfford"
                  (clicked)="purchaseMachineUpgrade()"
                />

                <p *ngIf="machineUpgrade().isMaxLevel" class="max-level">
                  {{ translationService.t('upgrades.max_level') }}
                </p>
              </div>
            </div>
            <ng-template #noMachine>
              <div class="placeholder">
                <p class="machine-hint">
                  {{ translationService.t('upgrades.machine_tab.no_selection') }}
                </p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .upgrades-panel {
        background: var(--color-bg-panel);
        border-left: 2px solid var(--color-border);
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: all 0.3s ease;
      }

      .panel-header {
        padding: var(--space-4);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--color-border);
      }

      .upgrades-panel.minimized .panel-header {
        justify-content: center;
        padding: var(--space-3);
        border-bottom: none;
      }

      .section-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .panel-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .tabs {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--color-border);
      }

      .tabs app-button {
        position: relative;
      }

      .tabs app-button.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--color-accent-main);
      }

      .tab-content {
        flex: 1;
        padding: var(--space-4);
        overflow-y: auto;
      }

      .placeholder {
        color: var(--color-text-secondary);
        text-align: center;
        padding: var(--space-5);
      }

      .machine-hint {
        margin: 0;
        font-size: 14px;
      }

      .machine-info {
        padding: var(--space-4);
      }

      .machine-title {
        margin: 0 0 var(--space-4) 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-accent-main);
      }

      .machine-details {
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        padding: var(--space-3);
        margin-bottom: var(--space-4);
      }

      .machine-details p {
        margin: var(--space-2) 0;
        font-size: 14px;
        color: var(--color-text-primary);
      }

      .storage-upgrades {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .scrap-upgrades {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .max-level {
        margin: 0;
        padding: var(--space-2);
        text-align: center;
        color: var(--color-accent-positive);
        background: rgba(102, 187, 106, 0.1);
        border-radius: var(--border-radius-small);
        font-size: 13px;
        font-weight: 500;
      }

      .upgrade-item {
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .upgrade-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .upgrade-icon {
        font-size: 24px;
      }

      .upgrade-info {
        flex: 1;
      }

      .upgrade-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .upgrade-description {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      .upgrade-details {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--color-bg-panel);
        border-radius: var(--border-radius-small);
      }

      .detail-line {
        margin: 0;
        font-size: 13px;
        color: var(--color-text-primary);
      }

      .upgrade-capacity {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 14px;
        font-weight: 500;
      }

      .capacity-current {
        color: var(--color-text-primary);
        white-space: pre-line;
      }

      .capacity-arrow {
        color: var(--color-accent-main);
      }

      .capacity-next {
        color: var(--color-accent-positive);
        white-space: pre-line;
      }

      .upgrade-cost {
        display: flex;
        gap: var(--space-3);
        font-size: 13px;
      }

      .cost-item {
        color: var(--color-text-secondary);
      }

      .bonus {
        color: var(--color-accent-positive);
        margin-left: var(--space-2);
      }

      .max-level {
        color: var(--color-accent-positive);
        font-weight: 600;
        text-align: center;
        margin: 0;
      }
    `,
  ],
})
export class UpgradesPanelComponent {
  @Output() minimizedChange = new EventEmitter<boolean>();

  // Exponer configs para usar en template
  readonly SCRAP_GENERATION_CONFIG = SCRAP_GENERATION_CONFIG;
  readonly STORAGE_UPGRADE_CONFIG = STORAGE_UPGRADE_CONFIG;

  isMinimized = signal(false);
  activeTab = signal('scrap');

  constructor(
    private machineSelectionService: MachineSelectionService,
    private machinesService: MachinesService,
    private upgradesService: UpgradesService,
    private resourcesService: ResourcesService,
    private scrapGenerationService: ScrapGenerationService,
    public translationService: TranslationService,
  ) {
    effect(() => {
      const selectedId = this.machineSelectionService.getSelectedMachineId();
      if (selectedId) {
        this.isMinimized.set(false);
        this.activeTab.set('machine');
        this.minimizedChange.emit(false);
      }
    });
  }

  selectedMachine = computed(() => {
    const selectedId = this.machineSelectionService.getSelectedMachineId();
    if (!selectedId) return null;
    return this.machinesService.getMachine(selectedId);
  });

  translatedMachineName = computed(() => {
    const machine = this.selectedMachine();
    if (!machine) return '';
    return this.translationService.t(`machines.${machine.id}`);
  });

  machineUpgrade = computed(() => {
    const machine = this.selectedMachine();
    if (!machine) {
      return {
        level: 0,
        maxLevel: 0,
        baseSpeed: 0,
        effectiveSpeed: 0,
        speedBonus: 0,
        productionMultiplier: 1,
        nextBonusAt: 0,
        cost: { money: 0, components: 0 },
        canAfford: false,
        isMaxLevel: true,
      };
    }

    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(machine.id);
    if (!upgradeId) {
      return {
        level: 0,
        maxLevel: 0,
        baseSpeed: machine.baseSpeed,
        effectiveSpeed: machine.baseSpeed,
        speedBonus: 0,
        productionMultiplier: 1,
        nextBonusAt: 0,
        cost: { money: 0, components: 0 },
        canAfford: false,
        isMaxLevel: true,
      };
    }

    const level = this.upgradesService.getLevel(upgradeId);
    const cost = this.upgradesService.getCostForNextLevel(upgradeId);
    const effectiveSpeed = this.upgradesService.calculateEffectiveSpeed(
      machine.baseSpeed,
      machine.id,
    );
    const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

    const speedBonus = level * 0.1;
    const nextBonusAt = productionMultiplier > 1 ? 10 - (level % 10) : 10 - level;

    const canAfford = cost
      ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
        this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
      : false;

    return {
      level,
      maxLevel: 50,
      baseSpeed: machine.baseSpeed,
      effectiveSpeed,
      speedBonus,
      productionMultiplier,
      nextBonusAt,
      cost: cost || { money: 0, components: 0 },
      canAfford,
      isMaxLevel: level >= 50,
    };
  });

  storageUpgrades = computed(() => {
    const storageUpgradeIds = [
      {
        id: UpgradeId.UPG_STORE_001,
        resourceId: ResourceType.SCRAP,
        nameKey: 'upgrades.storage.scrap',
      },
      {
        id: UpgradeId.UPG_STORE_002,
        resourceId: ResourceType.METAL,
        nameKey: 'upgrades.storage.metal',
      },
      {
        id: UpgradeId.UPG_STORE_003,
        resourceId: ResourceType.PLASTIC,
        nameKey: 'upgrades.storage.plastic',
      },
      {
        id: UpgradeId.UPG_STORE_004,
        resourceId: ResourceType.COMPONENTS,
        nameKey: 'upgrades.storage.components',
      },
    ];

    return storageUpgradeIds.map(({ id, resourceId, nameKey }) => {
      const level = this.upgradesService.getLevel(id);
      const cost = this.upgradesService.getCostForNextLevel(id);
      const baseCapacity = this.resourcesService.getBaseCapacity(resourceId);
      const currentCapacity = this.resourcesService.getCapacity(resourceId);

      // Calculate next capacity using the linear formula: baseCapacity + (increment * (level + 1))
      const nextCapacity = this.upgradesService.calculateStorageCapacity(
        id,
        level + 1,
        baseCapacity,
      );

      const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);

      const canAfford = cost
        ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
          this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
        : false;

      const isMaxLevel = level >= STORAGE_UPGRADE_CONFIG.MAX_LEVEL;

      return {
        upgradeId: id,
        name: this.translationService.t(nameKey),
        level,
        icon: resource?.icon || '?',
        currentCapacity,
        nextCapacity,
        cost: cost || { money: 0, components: 0 },
        canAfford: canAfford && !isMaxLevel,
        isMaxLevel,
      };
    });
  });

  scrapAutoUpgrade = computed(() => {
    const level = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    const cost = this.upgradesService.getCostForNextLevel(UpgradeId.UPG_SCRAP_002);
    const isMaxLevel = level >= SCRAP_GENERATION_CONFIG.MAX_LEVEL;

    const currentRate = this.scrapGenerationService.getAutoRateByLevel(level);
    const nextRate = this.scrapGenerationService.getAutoRateByLevel(level + 1);

    const canAfford = cost
      ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
        this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
      : false;

    return {
      name: this.translationService.t('upgrades.scrap_auto.name'),
      level,
      currentRate,
      nextRate,
      cost: cost || { money: 0, components: 0 },
      canAfford: canAfford && !isMaxLevel,
      isMaxLevel,
    };
  });

  tabs = computed(() => [
    { id: 'scrap', label: this.translationService.t('upgrades.tabs.scrap') },
    { id: 'storage', label: this.translationService.t('upgrades.tabs.storage') },
    { id: 'machine', label: this.translationService.t('upgrades.tabs.machine') },
  ]);

  toggleMinimize(): void {
    this.isMinimized.update((v) => !v);
    this.minimizedChange.emit(this.isMinimized());
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  purchaseStorageUpgrade(upgradeId: UpgradeId): void {
    const cost = this.upgradesService.getCostForNextLevel(upgradeId);
    if (!cost) return;

    const canAfford =
      this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
      this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components);

    if (!canAfford) return;

    const currentLevel = this.upgradesService.getLevel(upgradeId);
    if (currentLevel >= STORAGE_UPGRADE_CONFIG.MAX_LEVEL) return; // Max level

    this.resourcesService.subtract(ResourceType.MONEY, cost.money);
    this.resourcesService.subtract(ResourceType.COMPONENTS, cost.components);

    this.upgradesService.purchaseUpgrade(upgradeId);

    // Apply the new storage capacity immediately
    const definition = this.upgradesService.getDefinition(upgradeId);
    if (definition?.targetResourceId) {
      const newLevel = this.upgradesService.getLevel(upgradeId);
      const baseCapacity = this.resourcesService.getBaseCapacity(definition.targetResourceId);
      const newCapacity = this.upgradesService.calculateStorageCapacity(
        upgradeId,
        newLevel,
        baseCapacity,
      );
      this.resourcesService.setCapacity(definition.targetResourceId, newCapacity);
    }
  }

  purchaseScrapUpgrade(): void {
    const currentLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    if (currentLevel >= SCRAP_GENERATION_CONFIG.MAX_LEVEL) return;

    const upgradeCost = this.upgradesService.getCostForNextLevel(UpgradeId.UPG_SCRAP_002);
    if (!upgradeCost) return;

    const hasEnoughMoney = this.resourcesService.hasEnough(ResourceType.MONEY, upgradeCost.money);
    const hasEnoughComponents = this.resourcesService.hasEnough(
      ResourceType.COMPONENTS,
      upgradeCost.components,
    );

    if (!hasEnoughMoney || !hasEnoughComponents) return;

    this.resourcesService.subtract(ResourceType.MONEY, upgradeCost.money);
    if (upgradeCost.components > 0) {
      this.resourcesService.subtract(ResourceType.COMPONENTS, upgradeCost.components);
    }

    this.upgradesService.purchaseUpgrade(UpgradeId.UPG_SCRAP_002);

    const newLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    const newRate = this.scrapGenerationService.getAutoRateByLevel(newLevel);
    this.scrapGenerationService.setAutomaticGenerationRate(newRate);
  }

  purchaseMachineUpgrade(): void {
    const machine = this.selectedMachine();
    if (!machine) return;

    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(machine.id);
    if (!upgradeId) return;

    const currentLevel = this.upgradesService.getLevel(upgradeId);
    if (currentLevel >= 50) return;

    const cost = this.upgradesService.getCostForNextLevel(upgradeId);
    if (!cost) return;

    const hasEnoughMoney = this.resourcesService.hasEnough(ResourceType.MONEY, cost.money);
    const hasEnoughComponents = this.resourcesService.hasEnough(
      ResourceType.COMPONENTS,
      cost.components,
    );

    if (!hasEnoughMoney || !hasEnoughComponents) return;

    this.resourcesService.subtract(ResourceType.MONEY, cost.money);
    if (cost.components > 0) {
      this.resourcesService.subtract(ResourceType.COMPONENTS, cost.components);
    }

    this.upgradesService.purchaseUpgrade(upgradeId);
  }
}
