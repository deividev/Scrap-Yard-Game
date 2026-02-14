import { Component, computed } from '@angular/core';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MarketService } from '../../services/market.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-sell-components-button',
  imports: [AppButtonComponent, TooltipComponent],
  standalone: true,
  template: `
    <app-tooltip [text]="translationService.t('tooltips.sell_components')" [position]="'bottom'">
      <app-button
        variant="primary"
        size="sm"
        [disabled]="!canSell()"
        (clicked)="sellComponents()"
      >
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span>-1</span>
          <img src="assets/icons/components_resource.png" style="width: 28px; height: 28px; vertical-align: middle;" alt="Components" />
          <span>+3</span>
          <img src="assets/icons/gold_resource.png" style="width: 28px; height: 28px; vertical-align: middle;" alt="Money" />
        </span>
      </app-button>
    </app-tooltip>
  `,
  styles: [],
})
export class SellComponentsButtonComponent {
  sellAmount = 1;
  moneyGain = 3;
  
  canSell = computed(() => {
    return this.resourcesService.hasEnough(ResourceType.COMPONENTS, this.sellAmount);
  });

  constructor(
    private resourcesService: ResourcesService,
    private marketService: MarketService,
    public translationService: TranslationService
  ) {}

  sellComponents(): void {
    if (!this.canSell()) {
      return;
    }

    this.marketService.sellComponents(this.sellAmount);
  }
}
