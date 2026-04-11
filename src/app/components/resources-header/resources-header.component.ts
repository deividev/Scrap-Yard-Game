import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { ScrapButtonComponent } from '../scrap-button/scrap-button.component';
import { SellResourceButtonComponent } from '../sell-resource-button/sell-resource-button.component';
import { ProgressionHintComponent } from '../progression-hint/progression-hint.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { GameStateService } from '../../services/game-state.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { SaveService } from '../../services/save.service';
import { AudioService } from '../../services/audio.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { MachinesService } from '../../services/machines.service';
import { MachineType } from '../../models/machine.model';

@Component({
  selector: 'app-resources-header',
  standalone: true,
  imports: [
    ScrapButtonComponent,
    SellResourceButtonComponent,
    ProgressionHintComponent,
    FormatNumberPipe,
    TooltipComponent,
    AppButtonComponent,
  ],
  template: `
    <header class="resources-header">
      <!-- Barra superior: hint centrado + nav derecha -->
      <div class="header-topbar">
        <!-- Dinero: siempre visible arriba a la izquierda -->
        <div
          class="resource-item money topbar-money"
          [class.feedback-up]="isFeedback(moneyResource().id, 'up')"
          [class.feedback-down]="isFeedback(moneyResource().id, 'down')"
        >
          <app-tooltip
            [text]="translationService.t('resources.money')"
            [inline]="true"
            [position]="'bottom'"
          >
            <img
              [src]="moneyResource().icon"
              class="resource-icon"
              [attr.alt]="translationService.t('resources.money')"
            />
          </app-tooltip>
          <span class="resource-amount">{{ moneyResource().amount | formatNumber }}</span>
        </div>

        <div class="topbar-hint">
          <app-progression-hint></app-progression-hint>
        </div>
        <div class="header-actions">
          <app-button
            [label]="'🌐 ' + currentLang()"
            variant="ghost"
            size="sm"
            (clicked)="toggleLanguage()"
          />
          <app-button
            [label]="translationService.t('main_menu.back_to_menu')"
            variant="ghost"
            size="sm"
            (clicked)="returnToMenu()"
          />
        </div>
      </div>

      <!-- Filas de recursos: básicos (fila 1) y avanzados T4+ (fila 2) -->
      <div class="resources-rows">
        <div class="resources-section">
          <span class="section-label">{{ translationService.t('resources.section_basic') }}</span>
          <div class="resources-row">
        <div class="resources-container">
          <!-- Chatarra -->
          <div class="resource-column">
            <div
              class="resource-item"
              data-tutorial-id="resource-scrap"
              [class.feedback-up]="isFeedback(scrapResource().id, 'up')"
              [class.feedback-down]="isFeedback(scrapResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(scrapResource().id)"
              [class.storage-full]="isStorageFull(scrapResource().id)"
              [class.near-capacity]="isNearCapacity(scrapResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.scrap')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="scrapResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.scrap')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="scrapResource().amount >= scrapResource().capacity"
                >{{ scrapResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity">/ {{ scrapResource().capacity | formatNumber }}</span>
              @for (f of autoFloatingTexts(); track f.id) {
                <span class="auto-scrap-float" aria-hidden="true"
                  >+{{ formatAutoAmount(f.amount) }}</span
                >
              }
            </div>
            <app-scrap-button></app-scrap-button>
          </div>

          <!-- Metal -->
          <div class="resource-column">
            <div
              class="resource-item"
              data-tutorial-id="resource-metal"
              [class.feedback-up]="isFeedback(metalResource().id, 'up')"
              [class.feedback-down]="isFeedback(metalResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(metalResource().id)"
              [class.storage-full]="isStorageFull(metalResource().id)"
              [class.near-capacity]="isNearCapacity(metalResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.metal')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="metalResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.metal')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="metalResource().amount >= metalResource().capacity"
                >{{ metalResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity">/ {{ metalResource().capacity | formatNumber }}</span>
            </div>
            @if (machinesService.isUnlocked(MachineType.CRUSHER)) {
              <app-sell-resource-button
                [resourceId]="ResourceType.METAL"
                [tutorialId]="'sell-metal-button'"
              ></app-sell-resource-button>
            }
          </div>

          <!-- Plástico -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(plasticResource().id, 'up')"
              [class.feedback-down]="isFeedback(plasticResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(plasticResource().id)"
              [class.storage-full]="isStorageFull(plasticResource().id)"
              [class.near-capacity]="isNearCapacity(plasticResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.plastic')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="plasticResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.plastic')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="plasticResource().amount >= plasticResource().capacity"
                >{{ plasticResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ plasticResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.SEPARATOR)) {
              <app-sell-resource-button
                [resourceId]="ResourceType.PLASTIC"
              ></app-sell-resource-button>
            }
          </div>

          <!-- Componentes -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(componentsResource().id, 'up')"
              [class.feedback-down]="isFeedback(componentsResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(componentsResource().id)"
              [class.storage-full]="isStorageFull(componentsResource().id)"
              [class.near-capacity]="isNearCapacity(componentsResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.components')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="componentsResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.components')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="componentsResource().amount >= componentsResource().capacity"
                >{{ componentsResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ componentsResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.ASSEMBLER)) {
              <app-sell-resource-button
                [resourceId]="ResourceType.COMPONENTS"
              ></app-sell-resource-button>
            }
          </div>

          <!-- Cobre -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(copperResource().id, 'up')"
              [class.feedback-down]="isFeedback(copperResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(copperResource().id)"
              [class.storage-full]="isStorageFull(copperResource().id)"
              [class.near-capacity]="isNearCapacity(copperResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.copper')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="copperResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.copper')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="copperResource().amount >= copperResource().capacity"
                >{{ copperResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ copperResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.SMELTER)) {
              <app-sell-resource-button [resourceId]="ResourceType.COPPER"></app-sell-resource-button>
            }
          </div>

          <!-- Plástico Reciclado -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(recycledPlasticResource().id, 'up')"
              [class.feedback-down]="isFeedback(recycledPlasticResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(recycledPlasticResource().id)"
              [class.storage-full]="isStorageFull(recycledPlasticResource().id)"
              [class.near-capacity]="isNearCapacity(recycledPlasticResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.recycled_plastic')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="recycledPlasticResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.recycled_plastic')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="
                  recycledPlasticResource().amount >= recycledPlasticResource().capacity
                "
                >{{ recycledPlasticResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ recycledPlasticResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.RECYCLER)) {
              <app-sell-resource-button
                [resourceId]="ResourceType.RECYCLED_PLASTIC"
              ></app-sell-resource-button>
            }
          </div>

          <!-- Componentes Eléctricos -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(electricComponentsResource().id, 'up')"
              [class.feedback-down]="isFeedback(electricComponentsResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(electricComponentsResource().id)"
              [class.storage-full]="isStorageFull(electricComponentsResource().id)"
              [class.near-capacity]="isNearCapacity(electricComponentsResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.electric_components')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="electricComponentsResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.electric_components')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="
                  electricComponentsResource().amount >= electricComponentsResource().capacity
                "
                >{{ electricComponentsResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ electricComponentsResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.ELECTRIC_ASSEMBLER)) {
              <app-sell-resource-button
                [resourceId]="ResourceType.ELECTRIC_COMPONENTS"
              ></app-sell-resource-button>
            }
          </div>
        </div>
          </div>
        </div>

        <!-- Fila 2: recursos manufacturados T4+ -->
        <div class="resources-section">
          <span class="section-label section-label--advanced">{{ translationService.t('resources.section_advanced') }}</span>
          <div class="resources-row">
        <div class="resources-container">

          <!-- Circuit Board -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(circuitBoardResource().id, 'up')"
              [class.feedback-down]="isFeedback(circuitBoardResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(circuitBoardResource().id)"
              [class.storage-full]="isStorageFull(circuitBoardResource().id)"
              [class.near-capacity]="isNearCapacity(circuitBoardResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.circuit_board')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="circuitBoardResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.circuit_board')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="
                  circuitBoardResource().amount >= circuitBoardResource().capacity
                "
                >{{ circuitBoardResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ circuitBoardResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.PCB_PRINTER)) {
              <app-sell-resource-button [resourceId]="ResourceType.CIRCUIT_BOARD"></app-sell-resource-button>
            }
          </div>

          <!-- HDD -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(hddResource().id, 'up')"
              [class.feedback-down]="isFeedback(hddResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(hddResource().id)"
              [class.storage-full]="isStorageFull(hddResource().id)"
              [class.near-capacity]="isNearCapacity(hddResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.hdd')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="hddResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.hdd')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="hddResource().amount >= hddResource().capacity"
                >{{ hddResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ hddResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.HDD_ASSEMBLER)) {
              <app-sell-resource-button [resourceId]="ResourceType.HDD"></app-sell-resource-button>
            }
          </div>

          <!-- Screen -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(screenResource().id, 'up')"
              [class.feedback-down]="isFeedback(screenResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(screenResource().id)"
              [class.storage-full]="isStorageFull(screenResource().id)"
              [class.near-capacity]="isNearCapacity(screenResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.screen')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="screenResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.screen')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="screenResource().amount >= screenResource().capacity"
                >{{ screenResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ screenResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.SCREEN_FABRICATOR)) {
              <app-sell-resource-button [resourceId]="ResourceType.SCREEN"></app-sell-resource-button>
            }
          </div>

          <!-- GPU -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(gpuResource().id, 'up')"
              [class.feedback-down]="isFeedback(gpuResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(gpuResource().id)"
              [class.storage-full]="isStorageFull(gpuResource().id)"
              [class.near-capacity]="isNearCapacity(gpuResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.gpu')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="gpuResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.gpu')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="gpuResource().amount >= gpuResource().capacity"
                >{{ gpuResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ gpuResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.GPU_FAB)) {
              <app-sell-resource-button [resourceId]="ResourceType.GPU"></app-sell-resource-button>
            }
          </div>

          <!-- Smartphone -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(smartphoneResource().id, 'up')"
              [class.feedback-down]="isFeedback(smartphoneResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(smartphoneResource().id)"
              [class.storage-full]="isStorageFull(smartphoneResource().id)"
              [class.near-capacity]="isNearCapacity(smartphoneResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.smartphone')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="smartphoneResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.smartphone')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="smartphoneResource().amount >= smartphoneResource().capacity"
                >{{ smartphoneResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ smartphoneResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.SMARTPHONE_FACTORY)) {
              <app-sell-resource-button [resourceId]="ResourceType.SMARTPHONE"></app-sell-resource-button>
            }
          </div>

          <!-- Laptop -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(laptopResource().id, 'up')"
              [class.feedback-down]="isFeedback(laptopResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(laptopResource().id)"
              [class.storage-full]="isStorageFull(laptopResource().id)"
              [class.near-capacity]="isNearCapacity(laptopResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.laptop')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="laptopResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.laptop')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="laptopResource().amount >= laptopResource().capacity"
                >{{ laptopResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ laptopResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.LAPTOP_WORKSHOP)) {
              <app-sell-resource-button [resourceId]="ResourceType.LAPTOP"></app-sell-resource-button>
            }
          </div>

          <!-- Desktop PC -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(desktopPcResource().id, 'up')"
              [class.feedback-down]="isFeedback(desktopPcResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(desktopPcResource().id)"
              [class.storage-full]="isStorageFull(desktopPcResource().id)"
              [class.near-capacity]="isNearCapacity(desktopPcResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.desktop_pc')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="desktopPcResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.desktop_pc')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="desktopPcResource().amount >= desktopPcResource().capacity"
                >{{ desktopPcResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ desktopPcResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.PC_BUILDER)) {
              <app-sell-resource-button [resourceId]="ResourceType.DESKTOP_PC"></app-sell-resource-button>
            }
          </div>

          <!-- Mining Rig -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(miningRigResource().id, 'up')"
              [class.feedback-down]="isFeedback(miningRigResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(miningRigResource().id)"
              [class.storage-full]="isStorageFull(miningRigResource().id)"
              [class.near-capacity]="isNearCapacity(miningRigResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.mining_rig')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="miningRigResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.mining_rig')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="miningRigResource().amount >= miningRigResource().capacity"
                >{{ miningRigResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ miningRigResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.MINING_RIG_ASSEMBLY)) {
              <app-sell-resource-button [resourceId]="ResourceType.MINING_RIG"></app-sell-resource-button>
            }
          </div>

          <!-- Server Rack -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(serverRackResource().id, 'up')"
              [class.feedback-down]="isFeedback(serverRackResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(serverRackResource().id)"
              [class.storage-full]="isStorageFull(serverRackResource().id)"
              [class.near-capacity]="isNearCapacity(serverRackResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.server_rack')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="serverRackResource().icon"
                  class="resource-icon"
                  [attr.alt]="translationService.t('resources.server_rack')"
                />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="serverRackResource().amount >= serverRackResource().capacity"
                >{{ serverRackResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity"
                >/ {{ serverRackResource().capacity | formatNumber }}</span
              >
            </div>
            @if (machinesService.isUnlocked(MachineType.DATA_CENTER_ASSEMBLY)) {
              <app-sell-resource-button [resourceId]="ResourceType.SERVER_RACK"></app-sell-resource-button>
            }
          </div>
        </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .resources-header {
        position: relative;
        z-index: 100;
        background: var(--color-bg-section);
        border-top: 2px solid var(--color-accent-main);
        border-bottom: 1px solid var(--color-border);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 4px 24px rgba(0, 0, 0, 0.55);
        padding: var(--space-2) var(--space-4) var(--space-3);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .header-topbar {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-height: 28px;
      }

      .topbar-money {
        flex-shrink: 0;
        padding-right: var(--space-4);
        border-right: 1px solid var(--color-border);
        font-size: 20px;
        font-weight: 700;
        color: var(--color-accent-main);
        white-space: nowrap;
        border-top: none;
        border-bottom: none;
        border-left: none;
        background: none;
      }

      @media (max-width: 1400px) {
        .topbar-money { font-size: 16px; }
      }

      @media (max-width: 1100px) {
        .topbar-money { font-size: 14px; }
      }

      .topbar-hint {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      .resources-rows {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .resources-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        overflow: visible;
        min-width: 0;
      }

      .resources-section + .resources-section {
        padding-top: var(--space-2);
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .section-label {
        font-size: 9px;
        font-weight: 700;
        color: var(--color-text-secondary);
        opacity: 0.55;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        white-space: nowrap;
        padding-left: 2px;
      }

      .section-label--advanced {
        color: var(--color-accent-main);
        opacity: 0.5;
      }

      .resources-row {
        display: flex;
        gap: var(--space-4);
        align-items: center;
        overflow: visible;
      }

      .resource-item {
        position: relative;
        overflow: visible;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        min-height: 28px;
        border: 1px solid transparent;
        border-radius: var(--border-radius-small);
        padding: 2px 6px;
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease,
          transform 0.2s ease;
      }

      .resource-item.money {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-accent-main);
        white-space: nowrap;
        flex-shrink: 0;
        border-color: transparent;
      }

      .resources-container {
        display: flex;
        flex-wrap: nowrap;
        gap: var(--space-4);
        flex: 1;
        overflow: visible;
      }

      .resource-column {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--space-2);
        min-width: fit-content;
      }

      .header-actions {
        margin-left: auto;
        display: flex;
        gap: var(--space-2);
        align-items: center;
        flex-shrink: 0;
      }

      .resource-icon {
        width: 44px;
        height: 44px;
        object-fit: contain;
        transition: transform 0.2s ease;
      }

      /* ── 1400px: iconos más chicos, gaps comprimidos ── */
      @media (max-width: 1400px) {
        .resource-icon {
          width: 36px;
          height: 36px;
        }
        .resources-row {
          gap: var(--space-2);
        }
        .resources-container {
          gap: var(--space-2);
        }
        .resource-column {
          gap: var(--space-1);
        }
      }

      /* ── 1200px: pasa a grid de 4 columnas por fila ── */
      @media (max-width: 1200px) {
        .resources-container {
          display: grid;
          grid-template-columns: repeat(4, auto);
          gap: var(--space-2) var(--space-3);
          flex: unset;
        }

        .resource-column {
          gap: var(--space-1);
        }

        .resource-icon {
          width: 30px;
          height: 30px;
        }

        .resource-capacity {
          display: none;
        }
      }

      /* ── 900px: iconos aún más chicos ── */
      @media (max-width: 900px) {
        .resources-container {
          grid-template-columns: repeat(4, auto);
          gap: var(--space-1) var(--space-2);
        }

        .resource-icon {
          width: 24px;
          height: 24px;
        }

        .topbar-money {
          font-size: 14px;
        }
      }

      .resource-amount {
        font-family: var(--font-mono);
        font-weight: 600;
        letter-spacing: 0.04em;
        color: var(--color-text-primary);
        transition:
          color 0.2s ease,
          transform 0.2s ease;
      }

      .resource-item.feedback-up {
        animation: resource-gain 0.52s ease-out;
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(34, 197, 94, 0.45);
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.18);
      }

      .resource-item.feedback-up .resource-amount {
        color: var(--color-state-success);
        animation: amount-pop 0.52s ease-out;
      }

      .resource-item.feedback-up .resource-icon {
        transform: scale(1.14);
        filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.55));
      }

      .resource-item.feedback-down {
        animation: resource-loss 0.52s ease-out;
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.12);
      }

      .resource-item.feedback-down .resource-amount {
        color: var(--color-state-danger-light);
        animation: amount-drop 0.52s ease-out;
      }

      .resource-item.feedback-down .resource-icon {
        transform: scale(0.94);
        filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4));
      }

      .resource-item.capacity-pop {
        animation: capacity-bump 0.72s ease-in-out;
      }

      .resource-amount.full {
        color: var(--color-state-danger);
        animation: pulse-warning 1.5s ease-in-out infinite;
      }

      @keyframes resource-gain {
        0% {
          transform: translateY(0) scale(1);
          filter: brightness(1);
        }
        28% {
          transform: translateY(-5px) scale(1.04);
          filter: brightness(1.22);
        }
        60% {
          transform: translateY(-2px) scale(1.015);
          filter: brightness(1.08);
        }
        100% {
          transform: translateY(0) scale(1);
          filter: brightness(1);
        }
      }

      @keyframes resource-loss {
        0% {
          transform: translateY(0) scale(1);
          filter: brightness(1);
        }
        28% {
          transform: translateY(4px) scale(0.97);
          filter: brightness(0.88);
        }
        100% {
          transform: translateY(0) scale(1);
          filter: brightness(1);
        }
      }

      @keyframes amount-pop {
        0% {
          transform: translateY(0) scale(1);
        }
        30% {
          transform: translateY(-4px) scale(1.12);
        }
        65% {
          transform: translateY(-1px) scale(1.04);
        }
        100% {
          transform: translateY(0) scale(1);
        }
      }

      @keyframes amount-drop {
        0% {
          transform: translateY(0) scale(1);
        }
        30% {
          transform: translateY(3px) scale(0.94);
        }
        100% {
          transform: translateY(0) scale(1);
        }
      }

      @keyframes capacity-bump {
        0% {
          box-shadow: 0 0 0 rgba(245, 158, 11, 0);
        }
        50% {
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
        }
        100% {
          box-shadow: 0 0 0 rgba(245, 158, 11, 0);
        }
      }

      @keyframes pulse-warning {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .resource-item.near-capacity {
        border-color: rgba(249, 115, 22, 0.38);
        background: rgba(249, 115, 22, 0.035);
      }

      .resource-item.near-capacity .resource-amount {
        color: var(--color-state-warning);
      }

      .resource-item.storage-full {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.05);
        animation: storage-full-pulse 2s ease-in-out infinite;
      }

      .resource-item.storage-full .resource-icon {
        animation: storage-full-icon 2s ease-in-out infinite;
      }

      @keyframes storage-full-pulse {
        0%,
        100% {
          box-shadow:
            0 0 0 1px rgba(239, 68, 68, 0.2),
            inset 0 0 6px rgba(239, 68, 68, 0.06);
        }
        50% {
          box-shadow:
            0 0 0 2px rgba(239, 68, 68, 0.45),
            inset 0 0 10px rgba(239, 68, 68, 0.12),
            0 0 14px rgba(239, 68, 68, 0.2);
        }
      }

      @keyframes storage-full-icon {
        0%,
        100% {
          filter: none;
        }
        50% {
          filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.6));
        }
      }

      .resource-capacity {
        color: var(--color-text-secondary);
        font-size: clamp(10px, 0.9vw, 13px);
        white-space: nowrap;
      }

      .auto-scrap-float {
        position: absolute;
        top: 0;
        left: 50%;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-accent-positive);
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        pointer-events: none;
        z-index: 100;
        white-space: nowrap;
        animation: auto-scrap-float-up 0.7s ease-out forwards;
      }

      @keyframes auto-scrap-float-up {
        0% {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-50%) translateY(-38px);
          opacity: 0;
        }
      }
    `,
  ],
})
export class ResourcesHeaderComponent implements OnDestroy {
  readonly ResourceType = ResourceType;
  readonly MachineType = MachineType;

  private resourcesService = inject(ResourcesService);
  private gameStateService = inject(GameStateService);
  private saveService = inject(SaveService);
  private audioService = inject(AudioService);
  public translationService = inject(TranslationService);
  readonly machinesService = inject(MachinesService);
  private scrapGenerationService = inject(ScrapGenerationService);
  private feedbackState = signal<Record<string, 'idle' | 'up' | 'down'>>({});
  private capacityPopState = signal<Record<string, boolean>>({});
  private previousAmounts = new Map<string, number>();
  private feedbackTimers = new Map<string, number>();
  private capacityTimers = new Map<string, number>();
  private autoFloatIdCounter = 0;
  private autoFloatTimers = new Map<number, number>();
  autoFloatingTexts = signal<{ id: number; amount: number }[]>([]);

  constructor() {
    effect(() => {
      const resources = this.resourcesService.getAll();

      for (const resource of resources) {
        const previous = this.previousAmounts.get(resource.id);

        if (previous !== undefined) {
          if (resource.amount > previous) {
            this.triggerFeedback(resource.id, 'up');
          } else if (resource.amount < previous) {
            this.triggerFeedback(resource.id, 'down');
          }

          const hasFiniteCapacity = Number.isFinite(resource.capacity) && resource.capacity > 0;
          if (
            hasFiniteCapacity &&
            previous < resource.capacity &&
            resource.amount >= resource.capacity
          ) {
            this.triggerCapacityPop(resource.id);
            this.audioService.playStorageFull();
          }
        }

        this.previousAmounts.set(resource.id, resource.amount);
      }
    });

    effect(() => {
      const event = this.scrapGenerationService.autoGenEvent();
      if (event.id < 0) return;
      const id = this.autoFloatIdCounter++;
      this.autoFloatingTexts.update((arr) => [...arr, { id, amount: event.amount }]);
      const timerId = window.setTimeout(() => {
        this.autoFloatingTexts.update((arr) => arr.filter((f) => f.id !== id));
        this.autoFloatTimers.delete(id);
      }, 700);
      this.autoFloatTimers.set(id, timerId);
    });
  }

  ngOnDestroy(): void {
    this.feedbackTimers.forEach((timerId) => clearTimeout(timerId));
    this.capacityTimers.forEach((timerId) => clearTimeout(timerId));
    this.autoFloatTimers.forEach((timerId) => clearTimeout(timerId));
    this.feedbackTimers.clear();
    this.capacityTimers.clear();
    this.autoFloatTimers.clear();
  }

  isFeedback(resourceId: string, state: 'up' | 'down'): boolean {
    return this.feedbackState()[resourceId] === state;
  }

  isCapacityPop(resourceId: string): boolean {
    return this.capacityPopState()[resourceId] === true;
  }

  private fullResourceIds = computed(() => {
    const result = new Set<string>();
    for (const r of this.resourcesService.getAll()) {
      if (Number.isFinite(r.capacity) && r.capacity > 0 && r.amount >= r.capacity) {
        result.add(r.id);
      }
    }
    return result;
  });

  isStorageFull(resourceId: string): boolean {
    return this.fullResourceIds().has(resourceId);
  }

  private nearCapacityIds = computed(() => {
    const result = new Set<string>();
    for (const r of this.resourcesService.getAll()) {
      const hasFinite = Number.isFinite(r.capacity) && r.capacity > 0;
      if (hasFinite) {
        const ratio = r.amount / r.capacity;
        if (ratio >= 0.8 && ratio < 1) result.add(r.id);
      }
    }
    return result;
  });

  isNearCapacity(resourceId: string): boolean {
    return this.nearCapacityIds().has(resourceId);
  }

  private triggerFeedback(resourceId: string, state: 'up' | 'down'): void {
    const previousTimer = this.feedbackTimers.get(resourceId);
    if (previousTimer) {
      clearTimeout(previousTimer);
    }

    this.feedbackState.update((current) => ({ ...current, [resourceId]: state }));

    const timerId = window.setTimeout(() => {
      this.feedbackState.update((current) => ({ ...current, [resourceId]: 'idle' }));
      this.feedbackTimers.delete(resourceId);
    }, 460);

    this.feedbackTimers.set(resourceId, timerId);
  }

  private triggerCapacityPop(resourceId: string): void {
    const previousTimer = this.capacityTimers.get(resourceId);
    if (previousTimer) {
      clearTimeout(previousTimer);
    }

    this.capacityPopState.update((current) => ({ ...current, [resourceId]: true }));

    const timerId = window.setTimeout(() => {
      this.capacityPopState.update((current) => ({ ...current, [resourceId]: false }));
      this.capacityTimers.delete(resourceId);
    }, 720);

    this.capacityTimers.set(resourceId, timerId);
  }

  getResourceIcon(resourceId: string): string {
    const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);
    return resource?.icon || '?';
  }

  formatAutoAmount(amount: number): string {
    if (amount === Math.floor(amount)) return String(amount);
    return amount.toFixed(2).replace(/\.?0+$/, '');
  }

  moneyResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.MONEY);
    return (
      resource || {
        id: ResourceType.MONEY,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.MONEY),
      }
    );
  });

  scrapResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.SCRAP);
    return (
      resource || {
        id: ResourceType.SCRAP,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.SCRAP),
      }
    );
  });

  metalResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.METAL);
    return (
      resource || {
        id: ResourceType.METAL,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.METAL),
      }
    );
  });

  componentsResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.COMPONENTS);
    return (
      resource || {
        id: ResourceType.COMPONENTS,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.COMPONENTS),
      }
    );
  });

  plasticResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.PLASTIC);
    return (
      resource || {
        id: ResourceType.PLASTIC,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.PLASTIC),
      }
    );
  });

  copperResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.COPPER);
    return (
      resource || {
        id: ResourceType.COPPER,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.COPPER),
      }
    );
  });

  recycledPlasticResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.RECYCLED_PLASTIC);
    return (
      resource || {
        id: ResourceType.RECYCLED_PLASTIC,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.RECYCLED_PLASTIC),
      }
    );
  });

  electricComponentsResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.ELECTRIC_COMPONENTS);
    return (
      resource || {
        id: ResourceType.ELECTRIC_COMPONENTS,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.ELECTRIC_COMPONENTS),
      }
    );
  });

  circuitBoardResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.CIRCUIT_BOARD);
    return (
      resource || {
        id: ResourceType.CIRCUIT_BOARD,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.CIRCUIT_BOARD),
      }
    );
  });

  hddResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.HDD);
    return (
      resource || {
        id: ResourceType.HDD,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.HDD),
      }
    );
  });

  screenResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.SCREEN);
    return (
      resource || {
        id: ResourceType.SCREEN,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.SCREEN),
      }
    );
  });

  gpuResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.GPU);
    return (
      resource || {
        id: ResourceType.GPU,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.GPU),
      }
    );
  });

  smartphoneResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.SMARTPHONE);
    return (
      resource || {
        id: ResourceType.SMARTPHONE,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.SMARTPHONE),
      }
    );
  });

  laptopResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.LAPTOP);
    return (
      resource || {
        id: ResourceType.LAPTOP,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.LAPTOP),
      }
    );
  });

  desktopPcResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.DESKTOP_PC);
    return (
      resource || {
        id: ResourceType.DESKTOP_PC,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.DESKTOP_PC),
      }
    );
  });

  miningRigResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.MINING_RIG);
    return (
      resource || {
        id: ResourceType.MINING_RIG,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.MINING_RIG),
      }
    );
  });

  serverRackResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.SERVER_RACK);
    return (
      resource || {
        id: ResourceType.SERVER_RACK,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.SERVER_RACK),
      }
    );
  });

  currentLang = computed(() => this.translationService.getLanguage().toUpperCase());

  toggleLanguage(): void {
    const current = this.translationService.getLanguage();
    this.translationService.setLanguage(current === 'es' ? 'en' : 'es');
  }

  returnToMenu(): void {
    // Guardar el juego antes de volver al menú
    this.saveService.save();
    this.gameStateService.returnToMenu();
  }
}
