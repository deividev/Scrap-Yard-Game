import { TestBed } from '@angular/core/testing';
import { MarketService } from './market.service';
import { ResourcesService } from './resources.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { StatisticsService } from './statistics.service';
import { ResourceType } from '../models/resource.model';

class MockResourcesService {
  private amounts: Record<string, number> = {
    [ResourceType.METAL]: 40,
    [ResourceType.COMPONENTS]: 20,
    [ResourceType.MONEY]: 100,
  };

  getAmount(resourceId: string): number {
    return this.amounts[resourceId] ?? 0;
  }

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  subtract(resourceId: string, amount: number): boolean {
    if (!this.hasEnough(resourceId, amount)) {
      return false;
    }

    this.amounts[resourceId] = this.getAmount(resourceId) - amount;
    return true;
  }

  add(resourceId: string, amount: number): void {
    this.amounts[resourceId] = this.getAmount(resourceId) + amount;
  }

  setAmount(resourceId: string, amount: number): void {
    this.amounts[resourceId] = amount;
  }
}

class MockFirstRunTutorialService {
  events: string[] = [];

  recordEvent(eventId: string): void {
    this.events.push(eventId);
  }
}

class MockStatisticsService {
  earnings: number[] = [];

  recordMoneyEarned(amount: number): void {
    this.earnings.push(amount);
  }
}

describe('MarketService', () => {
  let service: MarketService;
  let resourcesService: MockResourcesService;
  let tutorialService: MockFirstRunTutorialService;
  let statisticsService: MockStatisticsService;

  beforeEach(() => {
    resourcesService = new MockResourcesService();
    tutorialService = new MockFirstRunTutorialService();
    statisticsService = new MockStatisticsService();

    TestBed.configureTestingModule({
      providers: [
        MarketService,
        { provide: ResourcesService, useValue: resourcesService },
        { provide: FirstRunTutorialService, useValue: tutorialService },
        { provide: StatisticsService, useValue: statisticsService },
      ],
    });

    service = TestBed.inject(MarketService);
  });

  it('should expose manual sale pricing with batch bonuses', () => {
    expect(service.isManuallySellable(ResourceType.METAL)).toBe(true);
    expect(service.isManuallySellable(ResourceType.SCRAP)).toBe(false);
    expect(service.getManualSaleAmount(ResourceType.METAL)).toBe(40);
    expect(service.getManualSaleValue(ResourceType.METAL, 15)).toBe(17);
    expect(service.getManualSaleValue(ResourceType.METAL, 30)).toBe(36);
    expect(service.getBatchBonusPercent(15)).toBe(10);
    expect(service.getBatchBonusPercent(30)).toBe(20);
    expect(service.getManualSaleValue(ResourceType.METAL, 0)).toBe(0);
  });

  it('should sell metal, add money, and notify tutorial progress', () => {
    expect(service.sellMetal(15)).toBe(true);

    expect(resourcesService.getAmount(ResourceType.METAL)).toBe(25);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(117);
    expect(statisticsService.earnings).toEqual([17]);
    expect(tutorialService.events).toEqual(['metal-sold']);
  });

  it('should sell components without triggering the metal tutorial event', () => {
    expect(service.sellComponents(10)).toBe(true);

    expect(resourcesService.getAmount(ResourceType.COMPONENTS)).toBe(10);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(130);
    expect(statisticsService.earnings).toEqual([30]);
    expect(tutorialService.events).toEqual([]);
  });

  it('should reject invalid or impossible sales without side effects', () => {
    resourcesService.setAmount(ResourceType.METAL, 3);

    expect(service.sell(ResourceType.METAL, 0)).toBe(false);
    expect(service.sell(ResourceType.METAL, 10)).toBe(false);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(100);
    expect(statisticsService.earnings).toEqual([]);
    expect(tutorialService.events).toEqual([]);
  });
});