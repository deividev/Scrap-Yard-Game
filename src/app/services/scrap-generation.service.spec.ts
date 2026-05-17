import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ScrapGenerationService } from './scrap-generation.service';
import { ResourcesService } from './resources.service';
import { UpgradesService } from './upgrades.service';
import { AudioService } from './audio.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { StatisticsService } from './statistics.service';
import { ResourceType } from '../models/resource.model';
import { UpgradeId } from '../models/upgrade.model';

class MockResourcesService {
  private amounts: Record<string, number> = {
    [ResourceType.SCRAP]: 30,
    [ResourceType.MONEY]: 100,
  };

  private capacities: Record<string, number> = {
    [ResourceType.SCRAP]: 75,
    [ResourceType.MONEY]: Infinity,
  };

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  getAmount(resourceId: string): number {
    return this.amounts[resourceId] ?? 0;
  }

  getAvailableSpace(resourceId: string): number {
    const capacity = this.capacities[resourceId] ?? 0;
    if (!isFinite(capacity)) {
      return Infinity;
    }

    return Math.max(0, capacity - this.getAmount(resourceId));
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

  setCapacity(resourceId: string, capacity: number): void {
    this.capacities[resourceId] = capacity;
  }
}

class MockUpgradesService {
  manualLevel = 1;

  getLevel(upgradeId: UpgradeId): number {
    if (upgradeId === UpgradeId.UPG_SCRAP_001) {
      return this.manualLevel;
    }

    return 1;
  }
}

class MockAudioService {
  errors = 0;
  scrapSounds = 0;

  playError(): void {
    this.errors += 1;
  }

  playScrapGenerated(): void {
    this.scrapSounds += 1;
  }
}

class MockFirstRunTutorialService {
  events: string[] = [];

  recordEvent(eventId: string): void {
    this.events.push(eventId);
  }
}

class MockStatisticsService {
  generated: number[] = [];

  recordScrapGenerated(amount: number): void {
    this.generated.push(amount);
  }
}

describe('ScrapGenerationService', () => {
  let service: ScrapGenerationService;
  let resourcesService: MockResourcesService;
  let upgradesService: MockUpgradesService;
  let audioService: MockAudioService;
  let tutorialService: MockFirstRunTutorialService;
  let statisticsService: MockStatisticsService;
  let dirtyCalls: number;

  beforeEach(() => {
    resourcesService = new MockResourcesService();
    upgradesService = new MockUpgradesService();
    audioService = new MockAudioService();
    tutorialService = new MockFirstRunTutorialService();
    statisticsService = new MockStatisticsService();
    dirtyCalls = 0;

    TestBed.configureTestingModule({
      providers: [
        ScrapGenerationService,
        { provide: ResourcesService, useValue: resourcesService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: AudioService, useValue: audioService },
        { provide: FirstRunTutorialService, useValue: tutorialService },
        { provide: StatisticsService, useValue: statisticsService },
      ],
    });

    service = TestBed.inject(ScrapGenerationService);
    service.setSaveService({
      markDirty: () => {
        dirtyCalls += 1;
      },
    });
  });

  it('should reject manual scrap when there is not enough money', () => {
    resourcesService.setAmount(ResourceType.MONEY, 0);

    expect(service.generateManualScrap()).toBe(false);
    expect(audioService.errors).toBe(1);
    expect(audioService.scrapSounds).toBe(0);
    expect(statisticsService.generated).toEqual([]);
    expect(tutorialService.events).toEqual([]);
  });

  it('should reject manual scrap when there is not enough scrap storage space', () => {
    resourcesService.setAmount(ResourceType.MONEY, 10);
    resourcesService.setAmount(ResourceType.SCRAP, 72);
    resourcesService.setCapacity(ResourceType.SCRAP, 75);

    expect(service.generateManualScrap()).toBe(false);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(10);
    expect(resourcesService.getAmount(ResourceType.SCRAP)).toBe(72);
    expect(audioService.errors).toBe(1);
  });

  it('should generate boosted manual scrap and record side effects', () => {
    upgradesService.manualLevel = 3;
    resourcesService.setAmount(ResourceType.MONEY, 10);
    resourcesService.setAmount(ResourceType.SCRAP, 30);
    resourcesService.setCapacity(ResourceType.SCRAP, 80);

    expect(service.generateManualScrap()).toBe(true);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(9);
    expect(resourcesService.getAmount(ResourceType.SCRAP)).toBe(38);
    expect(statisticsService.generated).toEqual([8]);
    expect(audioService.scrapSounds).toBe(1);
    expect(tutorialService.events).toEqual(['manual-scrap-generated']);
  });

  it('should expose auto generation rates and emit auto generation events', () => {
    expect(service.getAutoRateByLevel(0)).toBe(0);
    expect(service.getAutoRateByLevel(2)).toBe(0.12);
    expect(service.getAutoRateByLevel(99)).toBe(0);

    service.setAutomaticGenerationRate(-3);
    expect(service.getAutomaticGenerationRate()).toBe(0);

    service.setAutomaticGenerationRate(4);
    service.processAutomaticGeneration();

    expect(resourcesService.getAmount(ResourceType.SCRAP)).toBe(34);
    expect(service.autoGenEvent()).toEqual({ id: 1, amount: 4 });
    expect(dirtyCalls).toBe(2);
  });
});