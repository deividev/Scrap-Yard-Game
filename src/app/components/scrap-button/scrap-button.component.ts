import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
          <span>-{{ scrapCost }}</span>
          <img src="assets/icons/gold_resource.png" class="resource-icon" alt="Money" />
          <span>+{{ scrapAmount() }}</span>
          <img src="assets/icons/scrap_resource.png" class="resource-icon" alt="Scrap" />
        </span>
      </button>
    </app-tooltip>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 104px;
        max-width: 104px;
      }

      .scrap-action {
        width: 104px;
        min-width: 104px;
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
        border-color: rgba(255, 193, 7, 0.55);
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
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
      }

      .resource-icon {
        width: 28px;
        height: 28px;
        vertical-align: middle;
        object-fit: contain;
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
  private translationService = inject(TranslationService);
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

  generateScrap(): void {
    this.audioService.playUiClick();
    this.scrapGenerationService.generateManualScrap();
  }
}
