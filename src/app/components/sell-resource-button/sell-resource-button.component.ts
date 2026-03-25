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
            <span class="sell-summary">
              <span class="sell-source">
                <span class="sell-amount">{{ saleAmount() }}</span>
                <img [src]="resourceIcon()" class="sell-action-icon" [alt]="resourceName()" />
              </span>
              <span class="sell-gain-group">
                <span class="sell-yield">+{{ moneyGain() }}</span>
                <img src="assets/icons/gold_resource.png" class="sell-action-icon" alt="Money" />
                @if (bonusPercent() > 0) {
                  <span class="bonus-pill">+{{ bonusPercent() }}%</span>
                }
              </span>
            </span>
          </button>
        </app-tooltip>

        <button
          class="sell-toggle"
          type="button"
          [class.is-open]="isPanelOpen()"
          [attr.aria-expanded]="isPanelOpen()"
          aria-label="Adjust sell amount"
          (click)="togglePanel()"
        >
          <span class="sell-toggle-label">{{ saleAmount() }}</span>
          <span class="sell-toggle-caret">▾</span>
        </button>
      </div>

      @if (isPanelOpen()) {
        <div class="sell-panel" [class.is-disabled]="!canSell()">
          <div class="sell-panel-header">
            <span class="sell-panel-title">{{ resourceName() }}</span>
            <span class="sell-panel-meta">Stock {{ maxSellAmount() }}</span>
          </div>

          <div class="sell-panel-body">
            @if (bonusPercent() > 0) {
              <div class="sell-panel-bonus-strip">Bonus activo +{{ bonusPercent() }}%</div>
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
                MAX
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
        width: 146px;
        max-width: 146px;
      }

      .sell-inline {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
      }

      .sell-panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 30;
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
        color: #ffb74d;
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

      .sell-summary {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        width: 100%;
        min-width: 0;
        line-height: 1;
      }

      .sell-source,
      .sell-gain-group {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        min-width: 0;
      }

      .sell-amount,
      .sell-yield {
        white-space: nowrap;
      }

      .sell-amount {
        font-size: 12px;
      }

      .sell-yield {
        font-size: 11px;
      }

      .sell-toggle {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        flex-shrink: 0;
        width: 38px;
        min-width: 38px;
        align-self: stretch;
        justify-content: center;
        padding: 0 6px;
        font-size: 12px;
        font-weight: 700;
      }

      .sell-toggle.is-open {
        color: var(--color-text-primary);
        border-color: var(--color-accent-main);
        background: rgba(255, 152, 0, 0.14);
        box-shadow: 0 0 0 2px rgba(220, 174, 92, 0.12);
      }

      .sell-toggle-label {
        font-weight: 700;
      }

      .sell-toggle-caret {
        font-size: 11px;
        opacity: 0.8;
      }

      .resource-icon {
        width: 28px;
        height: 28px;
        vertical-align: middle;
        object-fit: contain;
      }

      .sell-action-icon {
        width: 15px;
        height: 15px;
        vertical-align: middle;
        object-fit: contain;
      }

      .bonus-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 15px;
        padding: 0 4px;
        border-radius: 999px;
        background: rgba(14, 38, 25, 0.72);
        color: #8fe6a8;
        font-weight: 700;
        font-size: 9px;
        white-space: nowrap;
        box-shadow: inset 0 0 0 1px rgba(143, 230, 168, 0.18);
      }

      .sell-preset-max {
        min-width: 0;
      }

      .sell-action {
        width: 104px;
        min-width: 104px;
        min-height: 40px;
        padding: 5px 10px;
        background: linear-gradient(180deg, rgba(255, 152, 0, 0.95), rgba(214, 118, 10, 0.95));
        color: #16120d;
        font-size: 13px;
        font-weight: 700;
      }

      .sell-action:hover:not(:disabled) {
        border-color: rgba(255, 193, 7, 0.55);
        filter: brightness(1.04);
      }

      @media (max-width: 1100px) {
        .sell-resource {
          width: 134px;
          max-width: 134px;
        }

        .sell-action {
          width: 96px;
          min-width: 96px;
        }

        .sell-panel {
          width: 162px;
        }

        .sell-step,
        .sell-preset,
        .sell-toggle {
          min-width: 18px;
          padding: 0 4px;
        }

        .sell-toggle {
          width: 34px;
          min-width: 34px;
        }
      }
    `,
  ],
})
export class SellResourceButtonComponent {
  resourceId = input.required<ResourceType>();
  tutorialId = input<string | null>(null);

  private hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private selectedAmount = signal(1);
  isPanelOpen = signal(false);
  private marketService = inject(MarketService);
  private resourcesService = inject(ResourcesService);
  private translationService = inject(TranslationService);
  private audioService = inject(AudioService);

  maxSellAmount = computed(() => this.marketService.getManualSaleAmount(this.resourceId()));

  saleAmount = computed(() => Math.max(1, this.selectedAmount()));

  inputAmount = computed(() => this.saleAmount());

  inputMax = computed(() => Math.max(this.maxSellAmount(), this.saleAmount(), 1));

  moneyGain = computed(() =>
    this.marketService.getManualSaleValue(this.resourceId(), this.saleAmount()),
  );

  bonusPercent = computed(() => this.marketService.getBatchBonusPercent(this.saleAmount()));

  resourceName = computed(() => this.translationService.t(`resources.${this.resourceId()}`));

  resourceIcon = computed(() => {
    return (
      this.resourcesService.getAll().find((resource) => resource.id === this.resourceId())?.icon ??
      ''
    );
  });

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

    const sold = this.marketService.sell(this.resourceId(), this.saleAmount());
    if (sold) {
      this.audioService.playResourceSold();
      this.closePanel();
    }
  }
}
