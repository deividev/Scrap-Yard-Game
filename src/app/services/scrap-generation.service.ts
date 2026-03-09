import { Injectable, signal, inject } from '@angular/core';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { SCRAP_GENERATION_CONFIG } from '../config/game-balance.config';
import { UpgradesService } from './upgrades.service';
import { UpgradeId } from '../models/upgrade.model';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root',
})
export class ScrapGenerationService {
  private automaticGenerationRate = signal(0);
  private saveService?: any;
  private upgradesService = inject(UpgradesService);
  private audioService = inject(AudioService);

  constructor(private resourcesService: ResourcesService) {}

  /**
   * Manual scrap generation: base +1 scrap per click, plus bonus from UPG_SCRAP_001.
   * Respects capacity automatically via ResourcesService.add()
   * Requires money cost to generate
   * @returns true if scrap was generated, false if not enough money or space
   */
  generateManualScrap(): boolean {
    // Verificar si tiene suficiente dinero
    if (!this.resourcesService.hasEnough(ResourceType.MONEY, SCRAP_GENERATION_CONFIG.MANUAL_COST)) {
      this.audioService.playError();
      return false;
    }

    // Calcular cuánta chatarra se va a generar
    const manualBoostLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_001);
    // Use (level - 1) because level 1 is the initial state with no upgrades
    const manualBoost = manualBoostLevel - 1;
    const totalGeneration = SCRAP_GENERATION_CONFIG.MANUAL_GENERATION + manualBoost;

    // Verificar si hay espacio suficiente para la chatarra
    const availableSpace = this.resourcesService.getAvailableSpace(ResourceType.SCRAP);
    if (availableSpace < totalGeneration) {
      this.audioService.playError();
      return false; // No hay espacio suficiente, no gastar dinero
    }

    // Restar el coste
    this.resourcesService.subtract(ResourceType.MONEY, SCRAP_GENERATION_CONFIG.MANUAL_COST);

    // Generar chatarra
    this.resourcesService.add(ResourceType.SCRAP, totalGeneration);
    this.audioService.playScrapGenerated();

    return true;
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
    // Use (level - 1) because level 1 is the initial state with no upgrades
    const upgrades = level - 1;
    return SCRAP_GENERATION_CONFIG.AUTO_GENERATION_RATES[upgrades] || 0;
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
