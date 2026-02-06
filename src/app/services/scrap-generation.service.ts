import { Injectable, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../config/game-balance.config';

@Injectable({
  providedIn: 'root',
})
export class ScrapGenerationService {
  private automaticGenerationRate = signal(0);
  private saveService?: any;

  constructor(private resourcesService: ResourcesService) {}

  /**
   * Manual scrap generation: +1 scrap per click.
   * Respects capacity automatically via ResourcesService.add()
   */
  generateManualScrap(): void {
    this.resourcesService.add(ResourceType.SCRAP, SCRAP_GENERATION_CONFIG.MANUAL_GENERATION);
  }

  setAutomaticGenerationRate(rate: number): void {
    this.automaticGenerationRate.set(Math.max(0, rate));
    this.saveService?.markDirty();
  }

  getAutomaticGenerationRate(): number {
    return this.automaticGenerationRate();
  }

  getAutoRateByLevel(level: number): number {
    if (level < 1 || level > SCRAP_GENERATION_CONFIG.MAX_LEVEL) {
      return 0;
    }
    return SCRAP_GENERATION_CONFIG.AUTO_GENERATION_RATES[level] || 0;
  }

  processAutomaticGeneration(): void {
    const rate = this.automaticGenerationRate();
    if (rate > 0) {
      this.resourcesService.add(ResourceType.SCRAP, rate);
    }
  }

  setSaveService(saveService: any): void {
    this.saveService = saveService;
  }
}
