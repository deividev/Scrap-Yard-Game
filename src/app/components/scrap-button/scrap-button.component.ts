import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../../config/game-balance.config';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { UpgradeId } from '../../models/upgrade.model';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-scrap-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipComponent],
  standalone: true,
  host: {
    'data-tutorial-id': 'scrap-button',
  },
  template: `
    <app-tooltip [text]="tooltipText()" [position]="'bottom'">
      <button
        class="scrap-action"
        type="button"
        [disabled]="!canAfford()"
        (click)="generateScrap()"
      >
        <span class="scrap-summary">
          <span class="scrap-cost-row">
            <span class="scrap-amount">-{{ scrapCost }}</span>
            <img
              src="assets/icons/gold_resource_1.png"
              class="scrap-icon"
              [attr.alt]="translationService.t('resources.money')"
            />
          </span>
          <span class="scrap-sep">·</span>
          <span class="scrap-gain-row">
            <span class="scrap-amount">+{{ scrapAmount() }}</span>
            <img
              src="assets/icons/scrap_resource.png"
              class="scrap-icon"
              [attr.alt]="translationService.t('resources.scrap')"
            />
          </span>
        </span>
      </button>
    </app-tooltip>
    @for (f of floatingTexts(); track f.id) {
      <span class="scrap-float-text" aria-hidden="true">+{{ scrapAmount() }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 110px;
        max-width: 110px;
        position: relative;
        overflow: visible;
      }

      .scrap-float-text {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        font-size: 13px;
        font-weight: 800;
        color: var(--color-accent-positive);
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
        pointer-events: none;
        white-space: nowrap;
        z-index: 100;
        animation: scrap-float-up 0.7s ease-out forwards;
      }

      @keyframes scrap-float-up {
        0% {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-50%) translateY(-38px);
          opacity: 0;
        }
      }

      .scrap-action {
        width: 110px;
        min-width: 110px;
        min-height: 40px;
        padding: 5px 10px;
        border: 1px solid rgba(255, 152, 0, 0.18);
        border-radius: 4px;
        background: linear-gradient(180deg, rgba(255, 152, 0, 0.95), rgba(214, 118, 10, 0.95));
        color: #16120d;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition:
          opacity 0.15s ease,
          transform 0.1s ease,
          border-color 0.15s ease,
          filter 0.15s ease;
      }

      .scrap-action:hover:not(:disabled) {
        border-color: rgba(255, 152, 0, 0.55);
        filter: brightness(1.04);
      }

      .scrap-action:active:not(:disabled) {
        transform: scale(0.97);
      }

      .scrap-action:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .scrap-summary {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 5px;
        width: 100%;
        line-height: 1;
      }

      .scrap-sep {
        font-size: 11px;
        opacity: 0.35;
        flex-shrink: 0;
      }

      .scrap-cost-row,
      .scrap-gain-row {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
      }

      .scrap-amount {
        font-size: 12px;
        white-space: nowrap;
      }

      .scrap-icon {
        width: 20px;
        height: 20px;
        vertical-align: middle;
        object-fit: contain;
      }

      @media (max-width: 1400px) {
        :host {
          width: 134px;
          max-width: 134px;
        }

        .scrap-action {
          width: 134px;
          min-width: 134px;
        }
      }

      @media (max-width: 1100px) {
        :host {
          width: 96px;
          max-width: 96px;
        }

        .scrap-action {
          width: 96px;
          min-width: 96px;
        }
      }
    `,
  ],
})
export class ScrapButtonComponent {
  private scrapGenerationService = inject(ScrapGenerationService);
  private resourcesService = inject(ResourcesService);
  private upgradesService = inject(UpgradesService);
  readonly translationService = inject(TranslationService);
  private audioService = inject(AudioService);

  scrapCost = SCRAP_GENERATION_CONFIG.MANUAL_COST;

  scrapAmount = computed(() => {
    const manualBoostLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_001);
    const manualBoost = manualBoostLevel - 1;
    return SCRAP_GENERATION_CONFIG.MANUAL_GENERATION + manualBoost;
  });

  tooltipText = computed(() => {
    return this.translationService.tp('tooltips.generate_scrap', {
      amount: this.scrapAmount(),
      cost: this.scrapCost,
    });
  });

  canAfford = computed(() => {
    // Verificar dinero
    if (!this.resourcesService.hasEnough(ResourceType.MONEY, this.scrapCost)) {
      return false;
    }

    // Verificar espacio disponible para chatarra
    const availableSpace = this.resourcesService.getAvailableSpace(ResourceType.SCRAP);
    return availableSpace >= this.scrapAmount();
  });

  private floatIdCounter = 0;
  floatingTexts = signal<{ id: number }[]>([]);

  generateScrap(): void {
    this.audioService.playUiClick();
    this.scrapGenerationService.generateManualScrap();
    const id = this.floatIdCounter++;
    this.floatingTexts.update((arr) => [...arr, { id }]);
    setTimeout(() => {
      this.floatingTexts.update((arr) => arr.filter((f) => f.id !== id));
    }, 700);
  }
}
