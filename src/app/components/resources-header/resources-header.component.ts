import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { ScrapButtonComponent } from '../scrap-button/scrap-button.component';
import { SellResourceButtonComponent } from '../sell-resource-button/sell-resource-button.component';
import { ProgressionHintComponent } from '../progression-hint/progression-hint.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { INITIAL_RESOURCES } from '../../config/resources.config';
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
    AppButtonComponent,
  ],
  template: `
    <aside class="resources-sidebar">

      <!-- HEADER: Money + nav buttons -->
      <div class="sidebar-header">
        <div
          class="money-display"
          [class.feedback-up]="isFeedback(moneyResource().id, 'up')"
          [class.feedback-down]="isFeedback(moneyResource().id, 'down')"
        >
          <img
            [src]="moneyResource().icon"
            class="res-icon"
            [attr.alt]="translationService.t('resources.money')"
          />
          <span class="money-amount">{{ moneyResource().amount | formatNumber }}</span>
        </div>
        <div class="sidebar-nav">
          <app-button
            [label]="'🌐'"
            variant="ghost"
            size="sm"
            (clicked)="toggleLanguage()"
          />
          <app-button
            [label]="'☰'"
            variant="ghost"
            size="sm"
            (clicked)="returnToMenu()"
          />
        </div>
      </div>

      <!-- Progression hint: always visible, no scroll needed -->
      <div class="sidebar-hint">
        <app-progression-hint></app-progression-hint>
      </div>

      <!-- SCRAP + scrap button -->
      <div
        class="resource-row resource-row--scrap"
        data-tutorial-id="resource-scrap"
        [class.feedback-up]="isFeedback(scrapResource().id, 'up')"
        [class.feedback-down]="isFeedback(scrapResource().id, 'down')"
        [class.capacity-pop]="isCapacityPop(scrapResource().id)"
        [class.storage-full]="isStorageFull(scrapResource().id)"
        [class.near-capacity]="isNearCapacity(scrapResource().id)"
      >
        <img
          [src]="scrapResource().icon"
          class="res-icon"
          [attr.alt]="translationService.t('resources.scrap')"
        />
        <div class="res-info">
          <span class="res-name">{{ translationService.t('resources.scrap') }}</span>
          <span class="res-amounts">
            <span
              class="res-amount"
              [class.full]="scrapResource().amount >= scrapResource().capacity"
            >{{ scrapResource().amount | formatNumber }}</span>
            <span class="res-cap"> / {{ scrapResource().capacity | formatNumber }}</span>
          </span>
        </div>
        @for (f of autoFloatingTexts(); track f.id) {
          <span class="auto-scrap-float" aria-hidden="true">+{{ formatAutoAmount(f.amount) }}</span>
        }
        <app-scrap-button></app-scrap-button>
      </div>

      <!-- BÁSICOS section -->
      <div class="sidebar-divider">{{ translationService.t('resources.section_basic') }}</div>
      <div class="sidebar-resources">
        <!-- Metal -->
        @if (machinesService.isUnlocked(MachineType.CRUSHER)) {
          <div
            class="resource-row"
            data-tutorial-id="resource-metal"
            [class.feedback-up]="isFeedback(metalResource().id, 'up')"
            [class.feedback-down]="isFeedback(metalResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(metalResource().id)"
            [class.storage-full]="isStorageFull(metalResource().id)"
            [class.near-capacity]="isNearCapacity(metalResource().id)"
          >
            <img [src]="metalResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.metal')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.metal') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="metalResource().amount >= metalResource().capacity">{{ metalResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ metalResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.METAL" [tutorialId]="'sell-metal-button'"></app-sell-resource-button>
          </div>
        }

        <!-- Plástico -->
        @if (machinesService.isUnlocked(MachineType.SEPARATOR)) {
          <div
            class="resource-row"
            [class.feedback-up]="isFeedback(plasticResource().id, 'up')"
            [class.feedback-down]="isFeedback(plasticResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(plasticResource().id)"
            [class.storage-full]="isStorageFull(plasticResource().id)"
            [class.near-capacity]="isNearCapacity(plasticResource().id)"
          >
            <img [src]="plasticResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.plastic')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.plastic') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="plasticResource().amount >= plasticResource().capacity">{{ plasticResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ plasticResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.PLASTIC"></app-sell-resource-button>
          </div>
        }

        <!-- Componentes -->
        @if (machinesService.isUnlocked(MachineType.ASSEMBLER)) {
          <div
            class="resource-row"
            [class.feedback-up]="isFeedback(componentsResource().id, 'up')"
            [class.feedback-down]="isFeedback(componentsResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(componentsResource().id)"
            [class.storage-full]="isStorageFull(componentsResource().id)"
            [class.near-capacity]="isNearCapacity(componentsResource().id)"
          >
            <img [src]="componentsResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.components')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.components') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="componentsResource().amount >= componentsResource().capacity">{{ componentsResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ componentsResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.COMPONENTS"></app-sell-resource-button>
          </div>
        }

        <!-- Cobre -->
        @if (machinesService.isUnlocked(MachineType.SMELTER)) {
          <div
            class="resource-row"
            [class.feedback-up]="isFeedback(copperResource().id, 'up')"
            [class.feedback-down]="isFeedback(copperResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(copperResource().id)"
            [class.storage-full]="isStorageFull(copperResource().id)"
            [class.near-capacity]="isNearCapacity(copperResource().id)"
          >
            <img [src]="copperResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.copper')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.copper') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="copperResource().amount >= copperResource().capacity">{{ copperResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ copperResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.COPPER"></app-sell-resource-button>
          </div>
        }

        <!-- Plástico Reciclado -->
        @if (machinesService.isUnlocked(MachineType.RECYCLER)) {
          <div
            class="resource-row"
            [class.feedback-up]="isFeedback(recycledPlasticResource().id, 'up')"
            [class.feedback-down]="isFeedback(recycledPlasticResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(recycledPlasticResource().id)"
            [class.storage-full]="isStorageFull(recycledPlasticResource().id)"
            [class.near-capacity]="isNearCapacity(recycledPlasticResource().id)"
          >
            <img [src]="recycledPlasticResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.recycled_plastic')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.recycled_plastic') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="recycledPlasticResource().amount >= recycledPlasticResource().capacity">{{ recycledPlasticResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ recycledPlasticResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.RECYCLED_PLASTIC"></app-sell-resource-button>
          </div>
        }

        <!-- Componentes Eléctricos -->
        @if (machinesService.isUnlocked(MachineType.ELECTRIC_ASSEMBLER)) {
          <div
            class="resource-row"
            [class.feedback-up]="isFeedback(electricComponentsResource().id, 'up')"
            [class.feedback-down]="isFeedback(electricComponentsResource().id, 'down')"
            [class.capacity-pop]="isCapacityPop(electricComponentsResource().id)"
            [class.storage-full]="isStorageFull(electricComponentsResource().id)"
            [class.near-capacity]="isNearCapacity(electricComponentsResource().id)"
          >
            <img [src]="electricComponentsResource().icon" class="res-icon" [attr.alt]="translationService.t('resources.electric_components')" />
            <div class="res-info">
              <span class="res-name">{{ translationService.t('resources.electric_components') }}</span>
              <span class="res-amounts">
                <span class="res-amount" [class.full]="electricComponentsResource().amount >= electricComponentsResource().capacity">{{ electricComponentsResource().amount | formatNumber }}</span>
                <span class="res-cap"> / {{ electricComponentsResource().capacity | formatNumber }}</span>
              </span>
            </div>
            <app-sell-resource-button [resourceId]="ResourceType.ELECTRIC_COMPONENTS"></app-sell-resource-button>
          </div>
        }

      </div><!-- /sidebar-resources BÁSICOS -->

    </aside>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-shrink: 0;
      }

      .resources-sidebar {
        width: 320px;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        background: var(--color-bg-section);
        border-right: 1px solid var(--color-border);
        border-top: 2px solid var(--color-accent-main);
        z-index: 100;
      }

      /* ── Sidebar Header: money + nav ── */
      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-3);
        min-height: 60px;
        border-bottom: 1px solid var(--color-border);
        background: var(--color-bg-panel);
        flex-shrink: 0;
      }

      .money-display {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 22px;
        font-weight: 700;
        color: var(--color-accent-main);
        border: 1px solid transparent;
        border-radius: var(--border-radius-small);
        padding: 2px 4px;
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }

      .money-display .res-icon {
        width: 44px;
        height: 44px;
      }

      /* ── Buttons always at right edge ── */
      .resource-row app-sell-resource-button {
        flex-shrink: 0;
        margin-left: auto;
        margin-right: 20px;
      }

      .money-display.feedback-up {
        animation: resource-gain 0.52s ease-out;
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(34, 197, 94, 0.45);
      }

      .money-display.feedback-down {
        animation: resource-loss 0.52s ease-out;
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
      }

      .money-amount {
        font-family: var(--font-mono);
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .sidebar-nav {
        display: flex;
        gap: var(--space-1);
      }

      /* ── Scrap row: same as any resource, scrap button sized like sell button ── */
      .resource-row--scrap {
        border-bottom: 1px solid var(--color-border);
      }
      .resource-row--scrap app-scrap-button {
        flex-shrink: 0;
        margin-left: auto;
        margin-right: 20px;
      }

      /* ── Divider labels ── */
      .sidebar-divider {
        font-size: 9px;
        font-weight: 700;
        color: var(--color-text-secondary);
        opacity: 0.55;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: var(--space-2) var(--space-3) var(--space-1);
        flex-shrink: 0;
      }

      /* ── Resource list ── */
      .sidebar-resources {
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
      }

      /* ── Footer ── */
      .sidebar-hint {
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
      }

      /* ── Resource row ── */
      .resource-row {
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 7px var(--space-3);
        border-left: 2px solid transparent;
        transition:
          background-color 0.2s ease,
          border-color 0.2s ease;
      }

      .resource-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .resource-row.feedback-up {
        animation: resource-gain 0.52s ease-out;
        background: rgba(34, 197, 94, 0.12);
        border-left-color: rgba(34, 197, 94, 0.55);
      }

      .resource-row.feedback-down {
        animation: resource-loss 0.52s ease-out;
        background: rgba(239, 68, 68, 0.1);
        border-left-color: rgba(239, 68, 68, 0.5);
      }

      .resource-row.capacity-pop {
        animation: capacity-bump 0.72s ease-in-out;
      }

      .resource-row.near-capacity {
        border-left-color: rgba(249, 115, 22, 0.5);
        background: rgba(249, 115, 22, 0.03);
      }

      .resource-row.storage-full {
        border-left-color: rgba(239, 68, 68, 0.6);
        background: rgba(239, 68, 68, 0.05);
        animation: storage-full-pulse 2s ease-in-out infinite;
      }

      /* ── Icons & text ── */
      .res-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }

      .resource-row.feedback-up .res-icon {
        transform: scale(1.14);
        filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.55));
      }

      .resource-row.feedback-down .res-icon {
        transform: scale(0.94);
        filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4));
      }

      .resource-row.storage-full .res-icon {
        animation: storage-full-icon 2s ease-in-out infinite;
      }

      .res-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .res-name {
        font-size: 10px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .res-amounts {
        display: flex;
        align-items: baseline;
        gap: 1px;
      }

      .res-amount {
        font-family: var(--font-mono);
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-primary);
        transition: color 0.2s ease;
      }

      .res-amount.full {
        color: var(--color-state-danger);
        animation: pulse-warning 1.5s ease-in-out infinite;
      }

      .resource-row.feedback-up .res-amount {
        color: var(--color-state-success);
        animation: amount-pop 0.52s ease-out;
      }

      .resource-row.feedback-down .res-amount {
        color: var(--color-state-danger-light);
        animation: amount-drop 0.52s ease-out;
      }

      .resource-row.near-capacity .res-amount {
        color: var(--color-state-warning);
      }

      .res-cap {
        font-family: var(--font-mono);
        font-size: 10px;
        color: var(--color-text-secondary);
        white-space: nowrap;
      }

      /* ── Auto-float texts ── */
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

      /* ── Animations ── */
      @keyframes resource-gain {
        0%   { background-color: transparent; }
        20%  { background-color: rgba(34, 197, 94, 0.28); }
        100% { background-color: rgba(34, 197, 94, 0.12); }
      }

      @keyframes resource-loss {
        0%   { background-color: transparent; }
        20%  { background-color: rgba(239, 68, 68, 0.22); }
        100% { background-color: rgba(239, 68, 68, 0.10); }
      }

      @keyframes amount-pop {
        0% { transform: translateY(0) scale(1); }
        30% { transform: translateY(-3px) scale(1.1); }
        65% { transform: translateY(-1px) scale(1.03); }
        100% { transform: translateY(0) scale(1); }
      }

      @keyframes amount-drop {
        0% { transform: translateY(0) scale(1); }
        30% { transform: translateY(2px) scale(0.94); }
        100% { transform: translateY(0) scale(1); }
      }

      @keyframes capacity-bump {
        0% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
        50% { box-shadow: inset 2px 0 0 rgba(245, 158, 11, 0.5); }
        100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
      }

      @keyframes pulse-warning {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      @keyframes storage-full-pulse {
        0%, 100% { background: rgba(239, 68, 68, 0.05); }
        50% { background: rgba(239, 68, 68, 0.1); }
      }

      @keyframes storage-full-icon {
        0%, 100% { filter: none; }
        50% { filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.6)); }
      }

      @keyframes auto-scrap-float-up {
        0% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-38px); opacity: 0; }
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
  readonly machinesService = inject(MachinesService);
  public translationService = inject(TranslationService);
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
