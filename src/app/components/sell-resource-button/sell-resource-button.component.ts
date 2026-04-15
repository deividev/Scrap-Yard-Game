import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { MarketService } from '../../services/market.service';
import { ResourceType } from '../../models/resource.model';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-sell-resource-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipComponent],
  host: {
    '[attr.data-tutorial-id]': 'tutorialId() || null',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="sell-resource">
      <div class="sell-inline">
        <app-tooltip [text]="tooltipText()" [position]="'bottom'">
          <button class="sell-action" type="button" [disabled]="!canSell()" (click)="sell()">
            <span class="sell-money">
              <span class="sell-yield">+{{ moneyGain() }}</span>
              <img src="assets/icons/gold_resource_1.png" class="sell-action-icon" alt="Money" />
            </span>
          </button>
        </app-tooltip>

        <button
          class="sell-toggle"
          type="button"
          [class.is-open]="isPanelOpen()"
          [attr.aria-expanded]="isPanelOpen()"
          [disabled]="!hasStock()"
          [attr.aria-label]="translationService.t('tooltips.adjust_sell_amount')"
          (click)="togglePanel()"
        >
          <span class="sell-toggle-amount">{{ saleAmount() }}</span>
          <img [src]="resourceIcon()" class="sell-toggle-icon" [alt]="resourceName()" />
          <span class="sell-toggle-caret">▾</span>
        </button>
      </div>

      @for (f of floatingTexts(); track f.id) {
        <span class="sell-float-text" aria-hidden="true">+{{ f.amount }}</span>
      }

      @if (isPanelOpen()) {
        <div
          class="sell-panel"
          [class.is-disabled]="!canSell()"
          [style.top.px]="panelTop()"
          [style.left.px]="panelLeft()"
        >
          <div class="sell-panel-header">
            <span class="sell-panel-title">{{ resourceName() }}</span>
            <span class="sell-panel-meta">{{ translationService.t('common.stock_label') }} {{ maxSellAmount() }}</span>
          </div>

          <div class="sell-panel-body">
            @if (bonusPercent() > 0) {
              <div class="sell-panel-bonus-strip">{{ bonusActiveLabel() }}</div>
            }

            <div class="sell-controls">
              <button
                class="sell-step"
                type="button"
                [disabled]="!canDecrease()"
                (click)="decrease()"
              >
                -
              </button>

              <input
                class="sell-input"
                type="number"
                min="1"
                inputmode="numeric"
                [max]="inputMax()"
                [value]="inputAmount()"
                (input)="onAmountInput($event)"
              />

              <button
                class="sell-step"
                type="button"
                [disabled]="!canIncrease()"
                (click)="increase()"
              >
                +
              </button>
            </div>

            <div class="sell-presets">
              <button
                class="sell-preset"
                type="button"
                [disabled]="!canSell()"
                (click)="setAmount(1)"
              >
                1
              </button>
              <button
                class="sell-preset"
                type="button"
                [disabled]="maxSellAmount() < 5"
                (click)="setAmount(5)"
              >
                5
              </button>
              <button
                class="sell-preset"
                type="button"
                [disabled]="maxSellAmount() < 10"
                (click)="setAmount(10)"
              >
                10
              </button>
              <button
                class="sell-preset sell-preset-max"
                type="button"
                [disabled]="!canSell()"
                (click)="setMax()"
              >
                {{ translationService.t('common.max') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .sell-resource {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 90px;
        max-width: 90px;
      }

      .sell-inline {
        display: flex;
        align-items: center;
        gap: 0;
        width: 100%;
      }

      .sell-panel {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        width: 172px;
        border: 1px solid rgba(255, 152, 0, 0.18);
        border-top: 2px solid var(--color-accent-main);
        border-radius: 6px;
        overflow: hidden;
        background: var(--color-bg-panel);
        box-shadow:
          0 8px 18px rgba(0, 0, 0, 0.38),
          0 0 0 1px rgba(0, 0, 0, 0.22);
      }

      .sell-panel::before {
        content: '';
        position: absolute;
        top: -6px;
        right: 18px;
        width: 12px;
        height: 12px;
        background: var(--color-bg-panel);
        border-top: 1px solid rgba(255, 152, 0, 0.18);
        border-left: 1px solid rgba(255, 152, 0, 0.18);
        transform: rotate(45deg);
      }

      .sell-panel.is-disabled {
        opacity: 0.55;
      }

      .sell-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 8px 10px 7px;
        background: rgba(0, 0, 0, 0.16);
        border-bottom: 1px solid var(--color-border);
      }

      .sell-panel-title {
        color: var(--color-accent-main);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .sell-panel-meta {
        color: var(--color-text-secondary);
        font-size: 10px;
        text-transform: uppercase;
      }

      .sell-panel-body {
        padding: 8px;
        background: linear-gradient(180deg, rgba(32, 32, 32, 0.86), rgba(18, 18, 18, 0.92));
      }

      .sell-panel-bonus-strip {
        margin-bottom: 8px;
        padding: 4px 6px;
        border: 1px solid rgba(245, 158, 11, 0.28);
        border-radius: 4px;
        background: rgba(245, 158, 11, 0.1);
        color: var(--color-accent-light);
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: center;
      }

      .sell-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
      }

      .sell-input {
        flex: 1;
        min-width: 0;
        height: 32px;
        appearance: textfield;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        background: rgba(15, 15, 15, 0.85);
        color: var(--color-text-primary);
        text-align: center;
        padding: 0 2px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
      }

      .sell-input::-webkit-outer-spin-button,
      .sell-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .sell-input:focus {
        outline: none;
        border-color: var(--color-accent-main);
        box-shadow: 0 0 0 2px rgba(220, 174, 92, 0.18);
      }

      .sell-step,
      .sell-preset,
      .sell-toggle,
      .sell-action {
        border: 1px solid rgba(255, 152, 0, 0.18);
        border-radius: 4px;
        font: inherit;
        cursor: pointer;
        transition:
          opacity 0.15s ease,
          transform 0.1s ease,
          border-color 0.15s ease,
          background-color 0.15s ease;
      }

      .sell-step,
      .sell-preset,
      .sell-toggle {
        height: 40px;
        min-width: 20px;
        padding: 0 5px;
        background: rgba(0, 0, 0, 0.22);
        color: var(--color-text-secondary);
        font-size: 10px;
        line-height: 1;
      }

      .sell-step {
        height: 32px;
        min-width: 28px;
        border-color: var(--color-border);
        background: rgba(12, 12, 12, 0.85);
        font-size: 14px;
      }

      .sell-preset {
        height: 32px;
        border-color: var(--color-border);
        background: rgba(12, 12, 12, 0.78);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .sell-step:hover:not(:disabled),
      .sell-preset:hover:not(:disabled),
      .sell-toggle:hover:not(:disabled) {
        color: var(--color-text-primary);
        border-color: var(--color-accent-main);
        background: rgba(255, 152, 0, 0.1);
      }

      .sell-step:active:not(:disabled),
      .sell-preset:active:not(:disabled),
      .sell-toggle:active:not(:disabled),
      .sell-action:active:not(:disabled) {
        transform: scale(0.97);
      }

      .sell-step:disabled,
      .sell-preset:disabled,
      .sell-toggle:disabled,
      .sell-action:disabled,
      .sell-input:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .sell-presets {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: center;
        gap: 4px;
      }

      .sell-money {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        white-space: nowrap;
        line-height: 1;
      }

      .sell-yield {
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .sell-toggle {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        width: 52px;
        min-width: 52px;
        align-self: stretch;
        justify-content: center;
        padding: 0 5px;
        font-size: 12px;
        font-weight: 700;
        border-radius: 0 4px 4px 0;
        border-left: none;
        background: rgba(0, 0, 0, 0.35);
      }

      .sell-toggle.is-open {
        color: var(--color-text-primary);
        border-color: var(--color-accent-main);
        background: rgba(255, 152, 0, 0.18);
        box-shadow: inset 0 0 0 1px rgba(220, 174, 92, 0.2);
      }

      .sell-toggle-amount {
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        color: var(--color-text-secondary);
      }

      .sell-toggle-icon {
        width: 16px;
        height: 16px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .sell-toggle-caret {
        font-size: 10px;
        opacity: 0.65;
      }

      .resource-icon {
        width: 28px;
        height: 28px;
        vertical-align: middle;
        object-fit: contain;
      }

      .sell-action-icon {
        width: 20px;
        height: 20px;
        vertical-align: middle;
        object-fit: contain;
      }

      .sell-preset-max {
        min-width: 0;
      }

      .sell-action {
        flex: 1;
        min-width: 0;
        min-height: 40px;
        padding: 5px 10px;
        background: linear-gradient(180deg, rgba(255, 152, 0, 0.95), rgba(214, 118, 10, 0.95));
        color: #16120d;
        font-size: 13px;
        font-weight: 700;
        border-radius: 4px 0 0 4px;
        border-right: 1px solid rgba(0, 0, 0, 0.3);
      }

      .sell-action:hover:not(:disabled) {
        border-color: rgba(255, 152, 0, 0.55);
        border-right-color: rgba(0, 0, 0, 0.3);
        filter: brightness(1.04);
      }

      .sell-float-text {
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        font-size: 13px;
        font-weight: 700;
        color: var(--color-accent-light);
        pointer-events: none;
        white-space: nowrap;
        animation: sell-float-up 0.7s ease-out forwards;
        z-index: 10;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
      }

      @keyframes sell-float-up {
        0% {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateX(-50%) translateY(-38px);
        }
      }

      @media (max-width: 1100px) {
        .sell-resource {
          width: 112px;
          max-width: 112px;
        }

        .sell-panel {
          width: 162px;
        }

        .sell-step,
        .sell-preset {
          min-width: 18px;
          padding: 0 4px;
        }

        .sell-toggle {
          width: 44px;
          min-width: 44px;
        }
      }
    `,
  ],
})
export class SellResourceButtonComponent {
  resourceId = input.required<ResourceType>();
  tutorialId = input<string | null>(null);

  private floatIdCounter = 0;
  floatingTexts = signal<{ id: number; amount: number }[]>([]);

  private hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private selectedAmount = signal(1);
  isPanelOpen = signal(false);
  panelTop = signal(0);
  panelLeft = signal(0);
  private marketService = inject(MarketService);
  private resourcesService = inject(ResourcesService);
  readonly translationService = inject(TranslationService);
  private audioService = inject(AudioService);

  maxSellAmount = computed(() => this.marketService.getManualSaleAmount(this.resourceId()));

  saleAmount = computed(() => Math.max(1, this.selectedAmount()));

  inputAmount = computed(() => this.saleAmount());

  inputMax = computed(() => Math.max(this.maxSellAmount(), this.saleAmount(), 1));

  moneyGain = computed(() =>
    this.marketService.getManualSaleValue(this.resourceId(), this.saleAmount()),
  );

  bonusPercent = computed(() => this.marketService.getBatchBonusPercent(this.saleAmount()));

  bonusActiveLabel = computed(() =>
    this.translationService.tp('sell.bonus_active', { percent: this.bonusPercent() }),
  );

  resourceName = computed(() => this.translationService.t(`resources.${this.resourceId()}`));

  resourceIcon = computed(() => {
    return (
      this.resourcesService.getAll().find((resource) => resource.id === this.resourceId())?.icon ??
      ''
    );
  });

  resourceCapacity = computed(() => this.resourcesService.getCapacity(this.resourceId()));

  hasStock = computed(() => this.maxSellAmount() > 0);

  tooltipText = computed(() =>
    this.translationService.tp('tooltips.sell_resource', {
      amount: this.saleAmount(),
      resource: this.resourceName(),
      money: this.moneyGain(),
    }),
  );

  canSell = computed(() => {
    return (
      this.marketService.isManuallySellable(this.resourceId()) &&
      this.maxSellAmount() >= this.saleAmount()
    );
  });

  canDecrease = computed(() => this.saleAmount() > 1);
  canIncrease = computed(() => this.saleAmount() < this.maxSellAmount());

  constructor() {
    effect(() => {
      if (this.selectedAmount() < 1) {
        this.selectedAmount.set(1);
      }
    });
    effect(() => {
      if (!this.hasStock()) {
        this.isPanelOpen.set(false);
      }
    });
  }

  onAmountInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) {
      return;
    }

    this.setAmount(value);
  }

  setAmount(amount: number): void {
    const maxAmount = this.maxSellAmount();
    if (maxAmount <= 0) {
      return;
    }

    const clampedAmount = Math.min(Math.max(1, Math.floor(amount)), maxAmount);
    this.selectedAmount.set(clampedAmount);
  }

  setMax(): void {
    this.setAmount(this.maxSellAmount());
  }

  decrease(): void {
    this.setAmount(this.saleAmount() - 1);
  }

  increase(): void {
    this.setAmount(this.saleAmount() + 1);
  }

  togglePanel(): void {
    if (!this.isPanelOpen()) {
      const rect = this.hostElement.nativeElement.getBoundingClientRect();
      this.panelTop.set(rect.bottom + 6);
      this.panelLeft.set(rect.left);
    }
    this.isPanelOpen.update((isOpen) => !isOpen);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    if (!this.isPanelOpen()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!this.hostElement.nativeElement.contains(target)) {
      this.closePanel();
    }
  }

  sell(): void {
    if (!this.canSell()) {
      return;
    }

    const gain = this.moneyGain();
    const sold = this.marketService.sell(this.resourceId(), this.saleAmount());
    if (sold) {
      this.audioService.playResourceSold();
      this.closePanel();
      const id = ++this.floatIdCounter;
      this.floatingTexts.update((arr) => [...arr, { id, amount: gain }]);
      setTimeout(() => {
        this.floatingTexts.update((arr) => arr.filter((f) => f.id !== id));
      }, 700);
    }
  }
}
