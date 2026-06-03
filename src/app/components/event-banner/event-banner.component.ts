import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MarketEventService } from '../../services/market-event.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-event-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    @if (event(); as activeEvent) {
      <div class="event-banner event-banner--{{ activeEvent.type }}" role="status" aria-live="polite">
        <div class="event-banner__summary">
          <span class="event-banner__icon" aria-hidden="true">{{ eventIcon() }}</span>
          <span class="event-banner__name">{{ t.t('events.name.' + activeEvent.type) }}</span>
          <span
            class="event-banner__multiplier"
            [class.event-banner__multiplier--positive]="activeEvent.priceMultiplier >= 1"
            [class.event-banner__multiplier--negative]="activeEvent.priceMultiplier < 1"
          >×{{ activeEvent.priceMultiplier }}</span>
          <span class="event-banner__time">{{ t.tp('events.banner.time_remaining', { time: activeEvent.timeRemaining }) }}</span>
        </div>
        <span class="event-banner__resources">{{ affectedResourcesText() }}</span>
      </div>
    }
  `,
  styles: `
    .event-banner {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-1);
      width: 100%;
      margin: 0;
      padding: var(--space-2) var(--space-3);
      box-sizing: border-box;
      background: rgba(18, 20, 24, 0.92);
      border: 1px solid var(--color-accent, #7c9cbf);
      border-radius: 4px;
      font-size: 0.85rem;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .event-banner__summary {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .event-banner--boom_pcs,
    .event-banner--boom_components,
    .event-banner--corporate_deal,
    .event-banner--tech_parts_rush,
    .event-banner--flash_sale,
    .event-banner--recycling_incentive {
      border-color: var(--color-success, #4caf50);
    }

    .event-banner--market_crash,
    .event-banner--materials_shortage {
      border-color: var(--color-danger, #f44336);
    }

    .event-banner__icon {
      font-size: 1rem;
      line-height: 1;
    }

    .event-banner__name {
      font-weight: 600;
      color: var(--color-text-primary, #e0e0e0);
    }

    .event-banner__multiplier {
      font-weight: bold;
      color: var(--color-accent, #7c9cbf);
    }

    .event-banner__multiplier--positive {
      color: var(--color-success, #4caf50);
    }

    .event-banner__multiplier--negative {
      color: var(--color-danger, #f44336);
    }

    .event-banner__resources {
      opacity: 0.8;
      font-size: 0.78rem;
      text-align: left;
      line-height: 1.2;
      max-width: 100%;
    }

    .event-banner__time {
      opacity: 0.65;
      font-size: 0.78rem;
    }
  `,
})
export class EventBannerComponent {
  private marketEventService = inject(MarketEventService);
  protected t = inject(TranslationService);

  protected event = this.marketEventService.activeEvent;
  protected affectedResourcesText = computed(() => {
    const activeEvent = this.event();

    if (activeEvent === null) {
      return '';
    }

    if (activeEvent.type === 'market_crash') {
      return this.t.t('events.banner.all_resources_affected');
    }

    return activeEvent.affectedResources
      .map((resource) => this.t.t(`resources.${resource}`))
      .join(', ');
  });

  protected eventIcon = computed(() => {
    switch (this.event()?.type) {
      case 'boom_pcs':
        return '📈';
      case 'boom_components':
        return '⚡';
      case 'market_crash':
        return '📉';
      case 'corporate_deal':
        return '💼';
      case 'tech_parts_rush':
        return '🔧';
      case 'materials_shortage':
        return '⚠️';
      case 'flash_sale':
        return '⏱️';
      case 'recycling_incentive':
        return '♻️';
      default:
        return '📊';
    }
  });
}
