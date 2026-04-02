import { Component, computed } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MarketService } from '../../services/market.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-sell-components-button',
  imports: [AppButtonComponent, TooltipComponent],
  standalone: true,
  template: `
    <app-tooltip [text]="translationService.t('tooltips.sell_components')" [position]="'bottom'">
      <app-button variant="primary" size="sm" [disabled]="!canSell()" (clicked)="sellComponents()">
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span>-{{ sellAmount() }}</span>
          <img
            src="assets/icons/components_resource.png"
            style="width: 28px; height: 28px; vertical-align: middle;"
            alt="Components"
          />
          <span>+{{ moneyGain() }}</span>
          @if (bonusPercent() > 0) {
            <span style="color: var(--color-accent-light); font-weight: 700;"
              >({{ bonusPercent() }}%)</span
            >
          }
          <img
            src="assets/icons/gold_resource_1.png"
            style="width: 28px; height: 28px; vertical-align: middle;"
            alt="Money"
          />
        </span>
      </app-button>
    </app-tooltip>
  `,
  styles: [],
})
export class SellComponentsButtonComponent {
  sellAmount = computed(() => this.marketService.getManualSaleAmount(ResourceType.COMPONENTS));

  moneyGain = computed(() =>
    this.marketService.getManualSaleValue(ResourceType.COMPONENTS, this.sellAmount()),
  );

  bonusPercent = computed(() => this.marketService.getBatchBonusPercent(this.sellAmount()));

  canSell = computed(() => {
    return this.sellAmount() > 0 && this.resourcesService.hasEnough(ResourceType.COMPONENTS, 1);
  });

  constructor(
    private resourcesService: ResourcesService,
    private marketService: MarketService,
    public translationService: TranslationService,
    private audioService: AudioService,
  ) {}

  sellComponents(): void {
    if (!this.canSell()) {
      return;
    }

    this.marketService.sellComponents(this.sellAmount());
    this.audioService.playResourceSold();
  }
}
