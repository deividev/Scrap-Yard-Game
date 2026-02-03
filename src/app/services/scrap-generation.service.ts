import { Injectable, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../config/game-balance.config';

@Injectable({
  providedIn: 'root',
})
export class ScrapGenerationService {
  private automaticGenerationRate = signal(0);

  constructor(private resourcesService: ResourcesService) {}

  /**
   * Manual scrap generation: +1 scrap per click.
   * Respects capacity automatically via ResourcesService.add()
   */
  generateManualScrap(): void {
    this.resourcesService.add(ResourceType.SCRAP, SCRAP_GENERATION_CONFIG.MANUAL_GENERATION);
  }

  /**
   * Set automatic generation rate (scrap per second).
   * Will be activated by upgrade UPG_SCRAP_002 in the future.
   */
  setAutomaticGenerationRate(rate: number): void {
    this.automaticGenerationRate.set(Math.max(0, rate));
  }

  getAutomaticGenerationRate(): number {
    return this.automaticGenerationRate();
  }

  /**
   * Called from GameLoopService.tick() once per second.
   * Adds automatic scrap generation if rate > 0.
   * Respects capacity automatically via ResourcesService.add()
   */
  processAutomaticGeneration(): void {
    const rate = this.automaticGenerationRate();
    if (rate > 0) {
      this.resourcesService.add(ResourceType.SCRAP, rate);
    }
  }
}
