import { Component, computed } from '@angular/core';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../../config/game-balance.config';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { UpgradeId } from '../../models/upgrade.model';

@Component({
  selector: 'app-scrap-button',
  imports: [AppButtonComponent, TooltipComponent],
  standalone: true,
  template: `
    <app-tooltip [text]="tooltipText()" [position]="'bottom'">
      <app-button
        variant="primary"
        size="sm"
        [disabled]="!canAfford()"
        (clicked)="generateScrap()"
      >
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span>-{{ scrapCost }}</span>
          <img src="assets/icons/gold_resource.png" style="width: 28px; height: 28px; vertical-align: middle;" alt="Money" />
          <span>+{{ scrapAmount() }}</span>
          <img src="assets/icons/scrap_resource.png" style="width: 28px; height: 28px; vertical-align: middle;" alt="Scrap" />
        </span>
      </app-button>
    </app-tooltip>
  `,
  styles: [],
})
export class ScrapButtonComponent {
  scrapCost = SCRAP_GENERATION_CONFIG.MANUAL_COST;
  
  scrapAmount = computed(() => {
    const manualBoostLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_001);
    const manualBoost = manualBoostLevel - 1;
    return SCRAP_GENERATION_CONFIG.MANUAL_GENERATION + manualBoost;
  });

  tooltipText = computed(() => {
    return this.translationService.tp('tooltips.generate_scrap', {
      amount: this.scrapAmount(),
      cost: this.scrapCost
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

  constructor(
    private scrapGenerationService: ScrapGenerationService,
    private resourcesService: ResourcesService,
    private upgradesService: UpgradesService,
    private translationService: TranslationService
  ) {}

  generateScrap(): void {
    this.scrapGenerationService.generateManualScrap();
  }
}
