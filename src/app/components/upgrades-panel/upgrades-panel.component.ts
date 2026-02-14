import { Component, signal, computed, effect, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ProgressBarComponent } from '../ui/progress-bar/progress-bar.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { MachinesService } from '../../services/machines.service';
import { UpgradesService } from '../../services/upgrades.service';
import { UpgradeProgressService } from '../../services/upgrade-progress.service';
import { ResourcesService } from '../../services/resources.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradeId } from '../../models/upgrade.model';
import { ResourceType } from '../../models/resource.model';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { SCRAP_GENERATION_CONFIG, STORAGE_UPGRADE_CONFIG } from '../../config/game-balance.config';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';

@Component({
  selector: 'app-upgrades-panel',
  standalone: true,
  imports: [
    CommonModule,
    AppButtonComponent,
    ProgressBarComponent,
    FormatNumberPipe,
    TooltipComponent,
  ],
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
            <!-- Manual Scrap Boost Upgrade -->
            <div class="upgrade-item">
              <div class="upgrade-header">
                <span class="upgrade-icon">🔨</span>
                <div class="upgrade-info">
                  <h4 class="upgrade-name">{{ scrapManualUpgrade().name }}</h4>
                  <p class="upgrade-description">
                    {{ translationService.t('upgrades.nivel') }} {{ scrapManualUpgrade().level }}
                  </p>
                </div>
              </div>

              <div class="upgrade-details">
                <p class="detail-line">
                  <strong>{{ translationService.t('upgrades.scrap_details.manual_label') }}</strong>
                  +{{ scrapManualUpgrade().currentGeneration }}
                  {{ translationService.t('upgrades.scrap_details.per_click') }}
                </p>
                <p class="detail-line" *ngIf="!scrapManualUpgrade().isMaxLevel">
                  <strong>{{
                    translationService.t('upgrades.scrap_details.next_level_label')
                  }}</strong>
                  +{{ scrapManualUpgrade().nextGeneration }}
                  {{ translationService.t('upgrades.scrap_details.per_click') }}
                </p>
              </div>

              <div class="upgrade-cost">
                <span class="cost-item">
                  <app-tooltip [text]="translationService.t('resources.money')" [inline]="true">
                    <img src="assets/icons/gold_resource.png" class="cost-icon" alt="Money" />
                  </app-tooltip>
                  {{ scrapManualUpgrade().cost.money | formatNumber }}
                </span>
                <span *ngIf="scrapManualUpgrade().cost.components > 0" class="cost-item">
                  <app-tooltip
                    [text]="translationService.t('resources.components')"
                    [inline]="true"
                  >
                    <img
                      src="assets/icons/components_resource.png"
                      class="cost-icon"
                      alt="Components"
                    />
                  </app-tooltip>
                  {{ scrapManualUpgrade().cost.components | formatNumber }}
                </span>
              </div>

              <!-- Barra de progreso -->
              <app-progress-bar
                *ngIf="isUpgradeInProgress(UpgradeId.UPG_SCRAP_001)"
                [progress]="getUpgradeProgress(UpgradeId.UPG_SCRAP_001)"
                [label]="
                  translationService.t('upgrades.upgrading') +
                  ': ' +
                  formatTime(getRemainingTime(UpgradeId.UPG_SCRAP_001))
                "
              />

              <app-button
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="
                  !scrapManualUpgrade().canAfford || isUpgradeInProgress(UpgradeId.UPG_SCRAP_001)
                "
                (clicked)="purchaseScrapManualUpgrade()"
              />
            </div>

            <!-- Automatic Scrap Generation Upgrade -->
            <div class="upgrade-item">
              <div class="upgrade-header">
                <img src="assets/icons/scrap_resource.png" class="upgrade-icon" alt="Scrap" />
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
                <span class="cost-item">
                  <app-tooltip [text]="translationService.t('resources.money')" [inline]="true">
                    <img src="assets/icons/gold_resource.png" class="cost-icon" alt="Money" />
                  </app-tooltip>
                  {{ scrapAutoUpgrade().cost.money | formatNumber }}
                </span>
                <span *ngIf="scrapAutoUpgrade().cost.components > 0" class="cost-item">
                  <app-tooltip
                    [text]="translationService.t('resources.components')"
                    [inline]="true"
                  >
                    <img
                      src="assets/icons/components_resource.png"
                      class="cost-icon"
                      alt="Components"
                    />
                  </app-tooltip>
                  {{ scrapAutoUpgrade().cost.components | formatNumber }}
                </span>
              </div>

              <!-- Barra de progreso -->
              <app-progress-bar
                *ngIf="isUpgradeInProgress(UpgradeId.UPG_SCRAP_002)"
                [progress]="getUpgradeProgress(UpgradeId.UPG_SCRAP_002)"
                [label]="
                  translationService.t('upgrades.upgrading') +
                  ': ' +
                  formatTime(getRemainingTime(UpgradeId.UPG_SCRAP_002))
                "
              />

              <app-button
                *ngIf="!scrapAutoUpgrade().isMaxLevel"
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="
                  !scrapAutoUpgrade().canAfford || isUpgradeInProgress(UpgradeId.UPG_SCRAP_002)
                "
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
                <img [src]="upgrade.icon" class="upgrade-icon" [alt]="upgrade.name" />
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
                <span class="cost-item">
                  <app-tooltip [text]="translationService.t('resources.money')" [inline]="true">
                    <img src="assets/icons/gold_resource.png" class="cost-icon" alt="Money" />
                  </app-tooltip>
                  {{ upgrade.cost.money | formatNumber }}
                </span>
                <span *ngIf="upgrade.cost.components > 0" class="cost-item">
                  <app-tooltip
                    [text]="translationService.t('resources.components')"
                    [inline]="true"
                  >
                    <img
                      src="assets/icons/components_resource.png"
                      class="cost-icon"
                      alt="Components"
                    />
                  </app-tooltip>
                  {{ upgrade.cost.components | formatNumber }}
                </span>
              </div>

              <!-- Barra de progreso -->
              <app-progress-bar
                *ngIf="isUpgradeInProgress(upgrade.upgradeId)"
                [progress]="getUpgradeProgress(upgrade.upgradeId)"
                [label]="
                  translationService.t('upgrades.upgrading') +
                  ': ' +
                  formatTime(getRemainingTime(upgrade.upgradeId))
                "
              />

              <app-button
                *ngIf="!upgrade.isMaxLevel"
                [label]="translationService.t('buttons.mejorar')"
                variant="primary"
                size="sm"
                [disabled]="!upgrade.canAfford || isUpgradeInProgress(upgrade.upgradeId)"
                (clicked)="purchaseStorageUpgrade(upgrade.upgradeId)"
              />

              <p *ngIf="upgrade.isMaxLevel" class="max-level">
                {{ translationService.t('upgrades.max_level') }}
              </p>
            </div>
          </div>

          <div *ngIf="activeTab() === 'machine'">
            <div *ngIf="selectedMachine(); else allMachinesView" class="machine-info">
              <div class="machine-focused-header">
                <h3 class="focused-title">
                  {{ translationService.t('upgrades.machine_tab.showing_upgrades_for') }}:
                  {{ translatedMachineName() }}
                </h3>
                <app-button
                  [label]="translationService.t('upgrades.machine_tab.view_all_machines')"
                  variant="ghost"
                  size="sm"
                  (clicked)="clearMachineSelection()"
                />
              </div>
              <div class="upgrade-item">
                <div class="upgrade-header">
                  <img src="assets/icons/metal_resource.png" class="upgrade-icon" alt="Machine" />
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
                  <p
                    class="detail-line"
                    *ngIf="
                      machineUpgrade().consumptionMultiplier > 1 ||
                      machineUpgrade().productionMultiplier > 1
                    "
                  >
                    <strong>{{
                      translationService.t('upgrades.machine_tab.efficiency_label')
                    }}</strong>
                    <span *ngIf="machineUpgrade().consumptionMultiplier > 1">
                      {{ translationService.t('upgrades.machine_tab.consumption_label') }}: ×{{
                        machineUpgrade().consumptionMultiplier
                      }}
                    </span>
                    <span
                      *ngIf="machineUpgrade().productionMultiplier > 1"
                      [class.efficiency-gain]="
                        machineUpgrade().productionMultiplier >
                        machineUpgrade().consumptionMultiplier
                      "
                    >
                      {{ translationService.t('upgrades.machine_tab.production_label') }}: ×{{
                        machineUpgrade().productionMultiplier
                      }}
                    </span>
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
                  <span class="cost-item">
                    <app-tooltip [text]="translationService.t('resources.money')" [inline]="true">
                      <img src="assets/icons/gold_resource.png" class="cost-icon" alt="Money" />
                    </app-tooltip>
                    {{ machineUpgrade().cost.money | formatNumber }}
                  </span>
                  <span *ngIf="machineUpgrade().cost.components > 0" class="cost-item">
                    <app-tooltip
                      [text]="translationService.t('resources.components')"
                      [inline]="true"
                    >
                      <img
                        src="assets/icons/components_resource.png"
                        class="cost-icon"
                        alt="Components"
                      />
                    </app-tooltip>
                    {{ machineUpgrade().cost.components | formatNumber }}
                  </span>
                </div>

                <!-- Barra de progreso -->
                <app-progress-bar
                  *ngIf="
                    currentMachineUpgradeId() && isUpgradeInProgress(currentMachineUpgradeId()!)
                  "
                  [progress]="getUpgradeProgress(currentMachineUpgradeId()!)"
                  [label]="
                    translationService.t('upgrades.upgrading') +
                    ': ' +
                    formatTime(getRemainingTime(currentMachineUpgradeId()!))
                  "
                />

                <app-button
                  *ngIf="!machineUpgrade().isMaxLevel"
                  [label]="translationService.t('buttons.mejorar')"
                  variant="primary"
                  size="sm"
                  [disabled]="
                    !machineUpgrade().canAfford ||
                    (currentMachineUpgradeId()
                      ? isUpgradeInProgress(currentMachineUpgradeId()!)
                      : false)
                  "
                  (clicked)="purchaseMachineUpgrade()"
                />

                <p *ngIf="machineUpgrade().isMaxLevel" class="max-level">
                  {{ translationService.t('upgrades.max_level') }}
                </p>
              </div>
            </div>
            <ng-template #allMachinesView>
              <div class="all-machines-view">
                <div class="global-view-header">
                  <h3>{{ translationService.t('upgrades.machine_tab.all_machines_title') }}</h3>
                  <p class="hint">
                    {{ translationService.t('upgrades.machine_tab.click_machine_hint') }}
                  </p>
                </div>

                <div class="machines-grid">
                  <div
                    *ngFor="let machineUpgrade of allMachineUpgrades()"
                    class="machine-upgrade-card"
                    [class.locked]="machineUpgrade.isLocked"
                  >
                    <div class="machine-card-header">
                      <h4 class="machine-card-name">{{ machineUpgrade.machineName }}</h4>
                      <span class="machine-card-level" *ngIf="!machineUpgrade.isLocked">
                        Nv {{ machineUpgrade.level }} / {{ machineUpgrade.maxLevel }}
                      </span>
                      <span class="machine-card-locked" *ngIf="machineUpgrade.isLocked">
                        🔒 {{ translationService.t('status.bloqueada') }}
                      </span>
                    </div>

                    <div class="machine-card-body" *ngIf="!machineUpgrade.isLocked">
                      <div class="upgrade-stat">
                        <span class="stat-label"
                          >{{ translationService.t('upgrades.machine_tab.speed_label') }}:</span
                        >
                        <span class="stat-value">
                          {{ (machineUpgrade.effectiveSpeed || 0).toFixed(2) }} c/s
                          <span class="bonus" *ngIf="(machineUpgrade.speedBonus || 0) > 0">
                            (+{{ ((machineUpgrade.speedBonus || 0) * 100).toFixed(0) }}%)
                          </span>
                        </span>
                      </div>

                      <div
                        class="upgrade-stat"
                        *ngIf="(machineUpgrade.productionMultiplier || 1) > 1"
                      >
                        <span class="stat-label"
                          >{{
                            translationService.t('upgrades.machine_tab.production_label')
                          }}:</span
                        >
                        <span class="stat-value efficiency-gain"
                          >×{{ machineUpgrade.productionMultiplier || 1 }}</span
                        >
                      </div>

                      <div
                        class="upgrade-stat"
                        *ngIf="(machineUpgrade.nextBonusAt || 0) > 0 && !machineUpgrade.isMaxLevel"
                      >
                        <span class="stat-label"
                          >{{
                            translationService.t('upgrades.machine_tab.next_bonus_label')
                          }}:</span
                        >
                        <span class="stat-value"
                          >{{ machineUpgrade.nextBonusAt || 0 }}
                          {{ translationService.t('upgrades.machine_tab.levels') }}</span
                        >
                      </div>

                      <div
                        class="machine-card-cost"
                        *ngIf="!machineUpgrade.isMaxLevel && machineUpgrade.cost"
                      >
                        <span class="cost-item">
                          <app-tooltip
                            [text]="translationService.t('resources.money')"
                            [inline]="true"
                          >
                            <img
                              src="assets/icons/gold_resource.png"
                              class="cost-icon"
                              alt="Money"
                            />
                          </app-tooltip>
                          {{ machineUpgrade.cost.money || 0 | formatNumber }}
                        </span>
                        <span *ngIf="(machineUpgrade.cost.components || 0) > 0" class="cost-item">
                          <app-tooltip
                            [text]="translationService.t('resources.components')"
                            [inline]="true"
                          >
                            <img
                              src="assets/icons/components_resource.png"
                              class="cost-icon"
                              alt="Components"
                            />
                          </app-tooltip>
                          {{ machineUpgrade.cost.components || 0 | formatNumber }}
                        </span>
                      </div>

                      <app-progress-bar
                        *ngIf="machineUpgrade.isInProgress && machineUpgrade.upgradeId"
                        [progress]="getUpgradeProgress(machineUpgrade.upgradeId)"
                        [label]="formatTime(getRemainingTime(machineUpgrade.upgradeId))"
                      />

                      <app-button
                        *ngIf="!machineUpgrade.isMaxLevel"
                        [label]="translationService.t('buttons.mejorar')"
                        variant="primary"
                        size="sm"
                        [disabled]="!machineUpgrade.canAfford || machineUpgrade.isInProgress"
                        (clicked)="purchaseMachineUpgradeById(machineUpgrade.machineId)"
                      />

                      <p *ngIf="machineUpgrade.isMaxLevel" class="max-level">
                        {{ translationService.t('upgrades.max_level') }}
                      </p>
                    </div>
                  </div>
                </div>
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

      .machine-focused-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
        margin-bottom: var(--space-4);
      }

      .focused-title {
        margin: 0;
        font-size: 14px;
        color: var(--color-text-primary);
      }

      .all-machines-view {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .global-view-header {
        text-align: center;
        padding: var(--space-3);
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
      }

      .global-view-header h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: 16px;
        color: var(--color-text-primary);
      }

      .global-view-header .hint {
        margin: 0;
        font-size: 12px;
        color: var(--color-text-secondary);
      }

      .machines-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-3);
      }

      .machine-upgrade-card {
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
        padding: var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        transition: border-color 0.2s ease;
      }

      .machine-upgrade-card:hover:not(.locked) {
        border-color: var(--color-accent-main);
      }

      .machine-upgrade-card.locked {
        opacity: 0.6;
      }

      .machine-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--color-border);
      }

      .machine-card-name {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .machine-card-level {
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-secondary);
        background: var(--color-bg-panel);
        padding: 2px 6px;
        border-radius: var(--border-radius-small);
      }

      .machine-card-locked {
        font-size: 11px;
        color: var(--color-text-secondary);
      }

      .machine-card-body {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .upgrade-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }

      .stat-label {
        color: var(--color-text-secondary);
      }

      .stat-value {
        color: var(--color-text-primary);
        font-weight: 500;
      }

      .machine-card-cost {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-2);
        background: var(--color-bg-panel);
        border-radius: var(--border-radius-small);
        font-size: 12px;
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
        width: 64px;
        height: 64px;
        object-fit: contain;
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
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .cost-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
        vertical-align: middle;
      }

      .bonus {
        color: var(--color-accent-positive);
        margin-left: var(--space-2);
      }

      .efficiency-gain {
        color: var(--color-accent-positive);
        font-weight: 600;
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
  readonly UpgradeId = UpgradeId; // Exponer enum para usar en template

  isMinimized = signal(false);
  activeTab = signal('scrap');

  constructor(
    private machineSelectionService: MachineSelectionService,
    private machinesService: MachinesService,
    private upgradesService: UpgradesService,
    private upgradeProgressService: UpgradeProgressService,
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

  currentMachineUpgradeId = computed(() => {
    const machine = this.selectedMachine();
    if (!machine) return null;
    return this.upgradesService.getMachineUpgradeIdByMachineType(machine.id);
  });

  /**
   * Mapa reactivo de progreso de upgrades
   * Se recalcula automáticamente cuando activeUpgrades$ cambia
   */
  upgradeProgressMap = computed(() => {
    const activeUpgrades = this.upgradeProgressService.activeUpgrades$();
    const progressMap = new Map<
      UpgradeId,
      { progress: number; remainingTime: number; isActive: boolean }
    >();

    for (const upgrade of activeUpgrades) {
      const progress = Math.min(upgrade.elapsedTime / upgrade.totalTime, 1);
      const remainingTime = Math.max(upgrade.totalTime - upgrade.elapsedTime, 0);
      progressMap.set(upgrade.upgradeId, {
        progress,
        remainingTime,
        isActive: true,
      });

      // Log de debug para ver valores
      console.log(
        `[UpgradePanel] ${upgrade.upgradeId}: progress=${(progress * 100).toFixed(1)}%, remaining=${remainingTime.toFixed(1)}s`,
      );
    }

    return progressMap;
  });

  allMachineUpgrades = computed(() => {
    const allMachines = this.machinesService.getAll();

    return allMachines.map((machine) => {
      const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(machine.id);
      const machineName = this.translationService.t(`machines.${machine.id}`);

      if (!upgradeId) {
        return {
          machineId: machine.id,
          machineName,
          upgradeId: null,
          level: machine.level,
          isLocked: machine.level === 0,
          upgrades: [],
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
      const isMaxLevel = level >= 50;

      const canAfford = cost
        ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
          this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
        : false;

      return {
        machineId: machine.id,
        machineName,
        upgradeId,
        level,
        maxLevel: 50,
        isLocked: machine.level === 0,
        baseSpeed: machine.baseSpeed,
        effectiveSpeed,
        speedBonus,
        productionMultiplier,
        nextBonusAt: productionMultiplier > 1 ? 10 - (level % 10) : 10 - level,
        cost: cost || { money: 0, components: 0 },
        canAfford,
        isMaxLevel,
        isInProgress: upgradeId
          ? this.upgradeProgressService.isUpgradeInProgress(upgradeId)
          : false,
      };
    });
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
        consumptionMultiplier: 1,
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
        consumptionMultiplier: 1,
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
    const consumptionMultiplier = this.upgradesService.calculateConsumptionMultiplier(machine.id);
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
      consumptionMultiplier,
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
      {
        id: UpgradeId.UPG_STORE_005,
        resourceId: ResourceType.RECYCLED_PLASTIC,
        nameKey: 'upgrades.storage.recycled_plastic',
      },
      {
        id: UpgradeId.UPG_STORE_006,
        resourceId: ResourceType.ELECTRIC_COMPONENTS,
        nameKey: 'upgrades.storage.electric_components',
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

  scrapManualUpgrade = computed(() => {
    const level = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_001);
    const cost = this.upgradesService.getCostForNextLevel(UpgradeId.UPG_SCRAP_001);

    // Level 1 is base state (no upgrades), so bonus = level - 1
    const currentGeneration = SCRAP_GENERATION_CONFIG.MANUAL_GENERATION + (level - 1);
    const nextGeneration = SCRAP_GENERATION_CONFIG.MANUAL_GENERATION + level;

    const canAfford = cost
      ? this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
        this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components)
      : false;

    return {
      name: this.translationService.t('upgrades.scrap_manual.name'),
      level,
      currentGeneration,
      nextGeneration,
      cost: cost || { money: 0, components: 0 },
      canAfford,
      isMaxLevel: false, // No max level for manual boost
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
    // Verificar si ya hay un upgrade en progreso
    if (this.upgradeProgressService.isUpgradeInProgress(upgradeId)) {
      console.warn('Este upgrade ya está en progreso');
      return;
    }

    const cost = this.upgradesService.getCostForNextLevel(upgradeId);
    if (!cost) return;

    const canAfford =
      this.resourcesService.hasEnough(ResourceType.MONEY, cost.money) &&
      this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components);

    if (!canAfford) return;

    const currentLevel = this.upgradesService.getLevel(upgradeId);
    if (currentLevel >= STORAGE_UPGRADE_CONFIG.MAX_LEVEL) return; // Max level

    // Restar recursos
    this.resourcesService.subtract(ResourceType.MONEY, cost.money);
    this.resourcesService.subtract(ResourceType.COMPONENTS, cost.components);

    // Iniciar el progreso del upgrade (no se aplica inmediatamente)
    this.upgradesService.purchaseUpgrade(upgradeId);
  }

  purchaseScrapUpgrade(): void {
    const upgradeId = UpgradeId.UPG_SCRAP_002;

    // Verificar si ya hay un upgrade en progreso
    if (this.upgradeProgressService.isUpgradeInProgress(upgradeId)) {
      console.warn('Este upgrade ya está en progreso');
      return;
    }

    const currentLevel = this.upgradesService.getLevel(upgradeId);
    if (currentLevel >= SCRAP_GENERATION_CONFIG.MAX_LEVEL) return;

    const upgradeCost = this.upgradesService.getCostForNextLevel(upgradeId);
    if (!upgradeCost) return;

    const hasEnoughMoney = this.resourcesService.hasEnough(ResourceType.MONEY, upgradeCost.money);
    const hasEnoughComponents = this.resourcesService.hasEnough(
      ResourceType.COMPONENTS,
      upgradeCost.components,
    );

    if (!hasEnoughMoney || !hasEnoughComponents) return;

    // Restar recursos
    this.resourcesService.subtract(ResourceType.MONEY, upgradeCost.money);
    if (upgradeCost.components > 0) {
      this.resourcesService.subtract(ResourceType.COMPONENTS, upgradeCost.components);
    }

    // Iniciar el progreso del upgrade
    this.upgradesService.purchaseUpgrade(upgradeId);
  }

  purchaseMachineUpgrade(): void {
    const machine = this.selectedMachine();
    if (!machine) return;

    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(machine.id);
    if (!upgradeId) return;

    // Verificar si ya hay un upgrade en progreso
    if (this.upgradeProgressService.isUpgradeInProgress(upgradeId)) {
      console.warn('Este upgrade ya está en progreso');
      return;
    }

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

    // Restar recursos
    this.resourcesService.subtract(ResourceType.MONEY, cost.money);
    if (cost.components > 0) {
      this.resourcesService.subtract(ResourceType.COMPONENTS, cost.components);
    }

    // Iniciar el progreso del upgrade
    this.upgradesService.purchaseUpgrade(upgradeId);
  }

  purchaseScrapManualUpgrade(): void {
    const upgradeId = UpgradeId.UPG_SCRAP_001;

    // Verificar si ya hay un upgrade en progreso
    if (this.upgradeProgressService.isUpgradeInProgress(upgradeId)) {
      console.warn('Este upgrade ya está en progreso');
      return;
    }

    const upgradeCost = this.upgradesService.getCostForNextLevel(upgradeId);

    if (!upgradeCost) return;

    const canAfford =
      this.resourcesService.hasEnough(ResourceType.MONEY, upgradeCost.money) &&
      this.resourcesService.hasEnough(ResourceType.COMPONENTS, upgradeCost.components);

    if (!canAfford) return;

    // Restar recursos
    this.resourcesService.subtract(ResourceType.MONEY, upgradeCost.money);
    this.resourcesService.subtract(ResourceType.COMPONENTS, upgradeCost.components);

    // Iniciar el progreso del upgrade
    this.upgradesService.purchaseUpgrade(upgradeId);
  }

  /**
   * Obtiene el progreso de un upgrade (0-1) - REACTIVO
   */
  getUpgradeProgress(upgradeId: UpgradeId): number {
    const progressMap = this.upgradeProgressMap();
    return progressMap.get(upgradeId)?.progress ?? 0;
  }

  /**
   * Obtiene el tiempo restante de un upgrade en segundos - REACTIVO
   */
  getRemainingTime(upgradeId: UpgradeId): number {
    const progressMap = this.upgradeProgressMap();
    return progressMap.get(upgradeId)?.remainingTime ?? 0;
  }

  /**
   * Verifica si un upgrade está en progreso - REACTIVO
   */
  isUpgradeInProgress(upgradeId: UpgradeId): boolean {
    const progressMap = this.upgradeProgressMap();
    return progressMap.get(upgradeId)?.isActive ?? false;
  }

  /**
   * Formatea el tiempo restante para mostrar en UI
   */
  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.ceil(seconds)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.ceil(seconds % 60);
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Limpia la selección de máquina para volver a la vista global
   */
  clearMachineSelection(): void {
    this.machineSelectionService.clearSelection();
  }

  /**
   * Compra una mejora de máquina específica por su ID
   */
  purchaseMachineUpgradeById(machineId: string): void {
    const machine = this.machinesService.getMachine(machineId);
    if (!machine) return;

    // Seleccionar la máquina temporalmente para usar la lógica existente
    this.machineSelectionService.selectMachine(machineId);
    this.purchaseMachineUpgrade();
  }
}
