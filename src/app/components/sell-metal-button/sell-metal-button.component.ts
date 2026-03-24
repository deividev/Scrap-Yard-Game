import { Component, computed } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MarketService } from '../../services/market.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-sell-metal-button',
  imports: [AppButtonComponent, TooltipComponent],
  standalone: true,
  host: {
    'data-tutorial-id': 'sell-metal-button',
  },
  template: `
    <app-tooltip [text]="translationService.t('tooltips.sell_metal')" [position]="'bottom'">
      <app-button variant="primary" size="sm" [disabled]="!canSell()" (clicked)="sellMetal()">
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span>-{{ sellAmount }}</span>
          <img
            src="assets/icons/metal_resource.png"
            style="width: 28px; height: 28px; vertical-align: middle;"
            alt="Metal"
          />
          <span>+{{ moneyGain() }}</span>
          <img
            src="assets/icons/gold_resource.png"
            style="width: 28px; height: 28px; vertical-align: middle;"
            alt="Money"
          />
        </span>
      </app-button>
    </app-tooltip>
  `,
  styles: [],
})
export class SellMetalButtonComponent {
  sellAmount = 1;

  moneyGain = computed(() => this.marketService.getPrice(ResourceType.METAL) * this.sellAmount);

  canSell = computed(() => {
    return this.resourcesService.hasEnough(ResourceType.METAL, this.sellAmount);
  });

  constructor(
    private resourcesService: ResourcesService,
    private marketService: MarketService,
    public translationService: TranslationService,
    private audioService: AudioService,
  ) {}

  sellMetal(): void {
    if (!this.canSell()) {
      return;
    }

    this.marketService.sellMetal(this.sellAmount);
    this.audioService.playResourceSold();
  }
}
