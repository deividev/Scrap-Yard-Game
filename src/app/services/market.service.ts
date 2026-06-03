import { Injectable, inject, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { MARKET_CONFIG } from '../config/game-balance.config';
import { StatisticsService } from './statistics.service';

@Injectable({
  providedIn: 'root',
})
export class MarketService {
  private resourcesService = inject(ResourcesService);
  private firstRunTutorialService = inject(FirstRunTutorialService);
  private statisticsService = inject(StatisticsService);

  private readonly _activeEventMultipliers = signal<Partial<Record<ResourceType, number>>>({});
  readonly activeEventMultipliers = this._activeEventMultipliers.asReadonly();

  setActiveEventMultipliers(multipliers: Partial<Record<ResourceType, number>>): void {
    this._activeEventMultipliers.set(multipliers);
  }

  isManuallySellable(resourceId: string): boolean {
    return this.getPrice(resourceId) > 0;
  }

  getPrice(resourceId: string): number {
    const base = MARKET_CONFIG.BASE_PRICES[resourceId as ResourceType] ?? 0;
    const multiplier = this._activeEventMultipliers()[resourceId as ResourceType] ?? 1;
    return base * multiplier;
  }

  getManualSaleAmount(resourceId: string): number {
    return Math.floor(this.resourcesService.getAmount(resourceId));
  }

  getManualSaleValue(resourceId: string, amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    const baseValue = this.getPrice(resourceId) * amount;
    return Number((baseValue * this.getBatchBonusMultiplier(amount)).toFixed(2));
  }

  getBatchBonusPercent(amount: number): number {
    return Math.round((this.getBatchBonusMultiplier(amount) - 1) * 100);
  }

  sell(resourceId: string, amount: number): boolean {
    const success = this.sellResource(resourceId, amount);
    if (success && resourceId === ResourceType.METAL) {
      this.firstRunTutorialService.recordEvent('metal-sold');
    }

    return success;
  }

  sellComponents(amount: number): boolean {
    return this.sell(ResourceType.COMPONENTS, amount);
  }

  sellMetal(amount: number): boolean {
    return this.sell(ResourceType.METAL, amount);
  }

  private sellResource(resourceId: string, amount: number): boolean {
    if (amount <= 0 || !this.resourcesService.hasEnough(resourceId, amount)) {
      return false;
    }

    const success = this.resourcesService.subtract(resourceId, amount);
    if (!success) {
      return false;
    }

    const moneyEarned = this.getManualSaleValue(resourceId, amount);
    this.resourcesService.add(ResourceType.MONEY, moneyEarned);
    this.statisticsService.recordMoneyEarned(moneyEarned);
    return true;
  }

  private getBatchBonusMultiplier(amount: number): number {
    if (amount >= MARKET_CONFIG.BATCH_BONUSES.LARGE.threshold) {
      return MARKET_CONFIG.BATCH_BONUSES.LARGE.multiplier;
    }

    if (amount >= MARKET_CONFIG.BATCH_BONUSES.MEDIUM.threshold) {
      return MARKET_CONFIG.BATCH_BONUSES.MEDIUM.multiplier;
    }

    return 1;
  }
}
