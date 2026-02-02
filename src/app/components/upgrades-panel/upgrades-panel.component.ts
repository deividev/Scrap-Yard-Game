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
                    {{ translationService.t('upgrades.nivel') }} {{ scrapAutoUpgrade().level }}
                  </p>
                </div>
              </div>

              <div class="upgrade-capacity">
                <span class="capacity-current">{{ scrapAutoUpgrade().currentRate }}</span>
                <span class="capacity-arrow">→</span>
                <span class="capacity-next">{{ scrapAutoUpgrade().nextRate }}</span>
              </div>

              <div class="upgrade-cost" *ngIf="scrapAutoUpgrade().level < 3">
                <span class="cost-item">💰 {{ scrapAutoUpgrade().cost.money | formatNumber }}</span>
              </div>

              <app-button
                *ngIf="scrapAutoUpgrade().level < 3"
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="!scrapAutoUpgrade().canAfford"
                (clicked)="purchaseScrapUpgrade()"
              />

              <p *ngIf="scrapAutoUpgrade().level >= 3" class="max-level">
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

              <div class="upgrade-cost">
                <span class="cost-item">💰 {{ upgrade.cost.money | formatNumber }}</span>
                <span *ngIf="upgrade.cost.components > 0" class="cost-item"
                  >🔧 {{ upgrade.cost.components | formatNumber }}</span
                >
              </div>

              <app-button
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="!upgrade.canAfford"
                (clicked)="purchaseStorageUpgrade(upgrade.upgradeId)"
              />
            </div>
          </div>

          <div *ngIf="activeTab() === 'machine'">
            <div *ngIf="selectedMachine(); else noMachine" class="machine-info">
              <h3 class="machine-title">{{ translatedMachineName() }}</h3>
              <div class="machine-details">
                <p>
                  <strong>{{ translationService.t('upgrades.machine_tab.level_label') }}</strong>
                  {{ selectedMachine()?.level }}
                </p>
                <p>
                  <strong>{{
                    translationService.t('upgrades.machine_tab.base_speed_label')
                  }}</strong>
                  {{ selectedMachine()?.baseSpeed }}
                  {{ translationService.t('upgrades.machine_tab.cycles_per_second') }}
                </p>
              </div>
              <div class="placeholder">
                <p>{{ translationService.t('upgrades.machine_tab.speed_upgrades_coming') }}</p>
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
    `,
  ],
})
export class UpgradesPanelComponent {
  @Output() minimizedChange = new EventEmitter<boolean>();

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
      const increment = this.upgradesService.getStorageIncrement(id);
      const nextCapacity = baseCapacity + increment * (level + 1);
      const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);

      const canAfford = cost
        ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
          this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
        : false;

      return {
        upgradeId: id,
        name: this.translationService.t(nameKey),
        level,
        icon: resource?.icon || '?',
        currentCapacity,
        nextCapacity,
        cost: cost || { money: 0, components: 0 },
        canAfford,
      };
    });
  });

  scrapAutoUpgrade = computed(() => {
    const level = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    const cost = this.upgradesService.getCostForNextLevel(UpgradeId.UPG_SCRAP_002);

    const rates = [0, 0.2, 0.5, 1.0];
    const currentRate = rates[level];
    const nextRate = rates[level + 1];

    const canAfford = cost
      ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money)
      : false;

    const manualText = this.translationService.t('upgrades.scrap_auto.manual');
    const autoText = this.translationService.t('upgrades.scrap_auto.automatic');
    const perSecondText = this.translationService.t('upgrades.scrap_auto.per_second');
    const noneText = this.translationService.t('upgrades.scrap_auto.none');

    const currentAuto = currentRate === 0 ? noneText : `+${currentRate}${perSecondText}`;
    const nextAuto = nextRate === undefined ? noneText : `+${nextRate}${perSecondText}`;

    const currentText = `${manualText}\n${autoText}: ${currentAuto}`;
    const nextText =
      level >= 3
        ? this.translationService.t('upgrades.max_level')
        : `${manualText}\n${autoText}: ${nextAuto}`;

    return {
      name: this.translationService.t('upgrades.scrap_auto.name'),
      level,
      currentRate: currentText,
      nextRate: nextText,
      cost: cost || { money: 0, components: 0 },
      canAfford,
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

    this.resourcesService.subtract(ResourceType.MONEY, cost.money);
    this.resourcesService.subtract(ResourceType.COMPONENTS, cost.components);

    this.upgradesService.purchaseUpgrade(upgradeId);

    const definition = this.upgradesService.getDefinition(upgradeId);
    if (definition?.targetResourceId) {
      const newLevel = this.upgradesService.getLevel(upgradeId);
      const baseCapacity = this.resourcesService.getBaseCapacity(definition.targetResourceId);
      const increment = this.upgradesService.getStorageIncrement(upgradeId);
      const newCapacity = baseCapacity + increment * newLevel;
      this.resourcesService.setCapacity(definition.targetResourceId, newCapacity);
    }
  }

  purchaseScrapUpgrade(): void {
    const currentLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    if (currentLevel >= 3) return;

    const upgradeCost = this.upgradesService.getCostForNextLevel(UpgradeId.UPG_SCRAP_002);
    if (!upgradeCost) return;

    const hasEnoughMoney = this.resourcesService.hasEnough(ResourceType.MONEY, upgradeCost.money);
    if (!hasEnoughMoney) return;

    this.resourcesService.subtract(ResourceType.MONEY, upgradeCost.money);
    this.upgradesService.purchaseUpgrade(UpgradeId.UPG_SCRAP_002);

    const newLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    const rates = [0, 0.2, 0.5, 1.0];
    this.scrapGenerationService.setAutomaticGenerationRate(rates[newLevel] || 0);
  }
}
