import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MachinesService } from '../../services/machines.service';
import { MachineType } from '../../models/machine.model';
import { DebugControlsComponent } from '../debug-controls/debug-controls.component';
import { ScrapButtonComponent } from '../scrap-button/scrap-button.component';
import { SellComponentsButtonComponent } from '../sell-components-button/sell-components-button.component';
import { SellMetalButtonComponent } from '../sell-metal-button/sell-metal-button.component';
import { ProgressionHintComponent } from '../progression-hint/progression-hint.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { GameStateService } from '../../services/game-state.service';
import { SaveService } from '../../services/save.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';

@Component({
  selector: 'app-resources-header',
  standalone: true,
  imports: [
    CommonModule,
    DebugControlsComponent,
    ScrapButtonComponent,
    SellComponentsButtonComponent,
    SellMetalButtonComponent,
    ProgressionHintComponent,
    FormatNumberPipe,
    TooltipComponent,
    AppButtonComponent,
  ],
  template: `
    <header class="resources-header">
      <!-- Barra superior: hint centrado + nav derecha -->
      <div class="header-topbar">
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
          <app-debug-controls></app-debug-controls>
        </div>
      </div>

      <!-- Fila de recursos: iconos + sell buttons debajo de cada uno -->
      <div class="resources-row">
        <div
          class="resource-item money"
          [class.feedback-up]="isFeedback(moneyResource().id, 'up')"
          [class.feedback-down]="isFeedback(moneyResource().id, 'down')"
        >
          <app-tooltip
            [text]="translationService.t('resources.money')"
            [inline]="true"
            [position]="'bottom'"
          >
            <img [src]="moneyResource().icon" class="resource-icon" alt="Money" />
          </app-tooltip>
          <span class="resource-amount">{{ moneyResource().amount }}</span>
        </div>

        <div class="resources-container">
          <!-- Chatarra -->
          <div class="resource-column">
            <div
              class="resource-item"
              data-tutorial-id="resource-scrap"
              [class.feedback-up]="isFeedback(scrapResource().id, 'up')"
              [class.feedback-down]="isFeedback(scrapResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(scrapResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.scrap')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img [src]="scrapResource().icon" class="resource-icon" alt="Chatarra" />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="scrapResource().amount >= scrapResource().capacity"
                >{{ scrapResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity">/ {{ scrapResource().capacity | formatNumber }}</span>
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
            >
              <app-tooltip
                [text]="translationService.t('resources.metal')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img [src]="metalResource().icon" class="resource-icon" alt="Metal" />
              </app-tooltip>
              <span
                class="resource-amount"
                [class.full]="metalResource().amount >= metalResource().capacity"
                >{{ metalResource().amount | formatNumber }}</span
              >
              <span class="resource-capacity">/ {{ metalResource().capacity | formatNumber }}</span>
            </div>
            <app-sell-metal-button></app-sell-metal-button>
          </div>

          <!-- Componentes -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(componentsResource().id, 'up')"
              [class.feedback-down]="isFeedback(componentsResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(componentsResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.components')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img [src]="componentsResource().icon" class="resource-icon" alt="Componentes" />
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
            @if (isSmelterUnlocked()) {
              <app-sell-components-button></app-sell-components-button>
            }
          </div>

          <!-- Plástico -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(plasticResource().id, 'up')"
              [class.feedback-down]="isFeedback(plasticResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(plasticResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.plastic')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img [src]="plasticResource().icon" class="resource-icon" alt="Plástico" />
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
          </div>

          <!-- Plástico Reciclado -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(recycledPlasticResource().id, 'up')"
              [class.feedback-down]="isFeedback(recycledPlasticResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(recycledPlasticResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.recycled_plastic')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="recycledPlasticResource().icon"
                  class="resource-icon"
                  alt="Plástico reciclado"
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
          </div>

          <!-- Componentes Eléctricos -->
          <div class="resource-column">
            <div
              class="resource-item"
              [class.feedback-up]="isFeedback(electricComponentsResource().id, 'up')"
              [class.feedback-down]="isFeedback(electricComponentsResource().id, 'down')"
              [class.capacity-pop]="isCapacityPop(electricComponentsResource().id)"
            >
              <app-tooltip
                [text]="translationService.t('resources.electric_components')"
                [inline]="true"
                [position]="'bottom'"
              >
                <img
                  [src]="electricComponentsResource().icon"
                  class="resource-icon"
                  alt="Componentes eléctricos"
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
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .resources-header {
        background: var(--color-bg-panel);
        border-bottom: 2px solid rgba(255, 152, 0, 0.35);
        border-top: 2px solid var(--color-accent-main);
        padding: var(--space-1) var(--space-4) var(--space-2);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .header-topbar {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        min-height: 28px;
      }

      .topbar-hint {
        flex: 1;
        display: flex;
        justify-content: center;
      }

      .resources-row {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
      }

      .resource-item {
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
        font-weight: 600;
        color: var(--color-accent-main);
        padding-right: var(--space-4);
        border-right: 1px solid var(--color-border);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .resources-container {
        display: flex;
        gap: var(--space-3);
        flex: 1;
      }

      .resource-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
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
        width: 56px;
        height: 56px;
        object-fit: contain;
        transition: transform 0.2s ease;
      }

      @media (max-width: 1400px) {
        .resource-icon {
          width: 40px;
          height: 40px;
        }
        .resource-item.money {
          font-size: 16px;
        }
        .resources-row {
          gap: var(--space-2);
        }
        .resources-container {
          gap: var(--space-2);
        }
      }

      @media (max-width: 1100px) {
        .resource-icon {
          width: 28px;
          height: 28px;
        }
        .resource-item.money {
          font-size: 14px;
        }
        .resources-row {
          gap: var(--space-1);
        }
        .resources-container {
          gap: var(--space-1);
        }
      }

      .resource-amount {
        font-weight: 600;
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
        color: #22c55e;
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
        color: #f87171;
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
        color: #f59e0b;
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

      .resource-capacity {
        color: var(--color-text-secondary);
        font-size: clamp(10px, 0.9vw, 13px);
        white-space: nowrap;
      }
    `,
  ],
})
export class ResourcesHeaderComponent implements OnDestroy {
  readonly ResourceType = ResourceType;

  private gameStateService = inject(GameStateService);
  private saveService = inject(SaveService);
  private feedbackState = signal<Record<string, 'idle' | 'up' | 'down'>>({});
  private capacityPopState = signal<Record<string, boolean>>({});
  private previousAmounts = new Map<string, number>();
  private feedbackTimers = new Map<string, number>();
  private capacityTimers = new Map<string, number>();

  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
    public translationService: TranslationService,
  ) {
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
          }
        }

        this.previousAmounts.set(resource.id, resource.amount);
      }
    });
  }

  ngOnDestroy(): void {
    this.feedbackTimers.forEach((timerId) => clearTimeout(timerId));
    this.capacityTimers.forEach((timerId) => clearTimeout(timerId));
    this.feedbackTimers.clear();
    this.capacityTimers.clear();
  }

  isFeedback(resourceId: string, state: 'up' | 'down'): boolean {
    return this.feedbackState()[resourceId] === state;
  }

  isCapacityPop(resourceId: string): boolean {
    return this.capacityPopState()[resourceId] === true;
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

  isSmelterUnlocked = computed(() => {
    const smelter = this.machinesService.getMachine(MachineType.SMELTER);
    return smelter ? smelter.level > 0 : false;
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
