import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GameLoopService } from './game-loop.service';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { SaveService } from './save.service';
import { UpgradesService } from './upgrades.service';
import { UpgradeProgressService } from './upgrade-progress.service';
import { MachineUnlockService } from './machine-unlock.service';
import { AudioService } from './audio.service';
import { StatisticsService } from './statistics.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { ContractService } from './contract.service';
import { MarketEventService } from './market-event.service';
import { MachineType } from '../models/machine.model';
import { ResourceType } from '../models/resource.model';
import { UpgradeId } from '../models/upgrade.model';

class MockResourcesService {
  private amounts: Record<string, number> = {
    [ResourceType.SCRAP]: 10,
    [ResourceType.METAL]: 0,
    [ResourceType.MONEY]: 0,
  };
  added: Array<{ resourceId: string; amount: number }> = [];
  subtracted: Array<{ resourceId: string; amount: number }> = [];

  getAmount(resourceId: string): number {
    return this.amounts[resourceId] ?? 0;
  }

  setAmount(resourceId: string, amount: number): void {
    this.amounts[resourceId] = amount;
  }

  add(resourceId: string, amount: number): void {
    this.amounts[resourceId] = this.getAmount(resourceId) + amount;
    this.added.push({ resourceId, amount });
  }

  subtract(resourceId: string, amount: number): boolean {
    if (!this.hasEnough(resourceId, amount)) {
      return false;
    }
    this.amounts[resourceId] = this.getAmount(resourceId) - amount;
    this.subtracted.push({ resourceId, amount });
    return true;
  }

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  getAvailableSpace(resourceId: string): number {
    if (resourceId === ResourceType.MONEY) {
      return Infinity;
    }

    return 999;
  }
}

class MockMachinesService {
  machines = [
    {
      id: MachineType.CRUSHER,
      baseSpeed: 1,
      baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 1 }],
      baseProduction: { resourceId: ResourceType.METAL, amount: 2 },
      level: 1,
      isActive: true,
      progress: 0,
    },
    {
      id: MachineType.PACKAGER,
      baseSpeed: 1,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 1 }],
      baseProduction: { resourceId: ResourceType.MONEY, amount: 3 },
      level: 1,
      isActive: false,
      progress: 0,
    },
  ];
  consumedProgress: Array<{ machineId: string; amount: number }> = [];

  getAll(): typeof this.machines {
    return this.machines;
  }

  getMachine(machineId: string): (typeof this.machines)[number] | undefined {
    return this.machines.find((machine) => machine.id === machineId);
  }

  updateProgress(machineId: string, delta: number): void {
    const machine = this.getMachine(machineId);
    if (machine) {
      machine.progress = Math.min(1, machine.progress + delta);
    }
  }

  consumeProgress(machineId: string, amount: number): void {
    const machine = this.getMachine(machineId);
    if (machine) {
      machine.progress = Math.max(0, machine.progress - amount);
      this.consumedProgress.push({ machineId, amount });
    }
  }
}

class MockScrapGenerationService {
  automaticRate = 0;
  processCalls = 0;
  setRateCalls: number[] = [];

  processAutomaticGeneration(): void {
    this.processCalls += 1;
  }

  getAutoRateByLevel(level: number): number {
    return level * 2;
  }

  setAutomaticGenerationRate(rate: number): void {
    this.automaticRate = rate;
    this.setRateCalls.push(rate);
  }
}

class MockSaveService {
  saveCalls = 0;

  async save(): Promise<void> {
    this.saveCalls += 1;
  }
}

class MockUpgradesService {
  completed: UpgradeId[] = [];
  appliedStorage = 0;

  calculateConsumptionMultiplier(): number {
    return 1;
  }

  calculateProductionMultiplier(): number {
    return 1;
  }

  calculateEffectiveSpeed(): number {
    return 1;
  }

  completeUpgrade(upgradeId: UpgradeId): void {
    this.completed.push(upgradeId);
  }

  applyStorageUpgrades(): void {
    this.appliedStorage += 1;
  }

  getLevel(upgradeId: UpgradeId): number {
    if (upgradeId === UpgradeId.UPG_SCRAP_002) {
      return 3;
    }

    return 1;
  }
}

class MockUpgradeProgressService {
  completed: UpgradeId[] = [];

  updateProgress(): UpgradeId[] {
    return this.completed;
  }
}

class MockMachineUnlockService {
  checks = 0;

  checkAndUnlockMachines(): void {
    this.checks += 1;
  }
}

class MockAudioService {
  machineComplete = 0;
  resourceSold = 0;

  playMachineComplete(): void {
    this.machineComplete += 1;
  }

  playResourceSold(): void {
    this.resourceSold += 1;
  }
}

class MockStatisticsService {
  ticks: number[] = [];

  tick(scrapGeneratedThisTick: number): void {
    this.ticks.push(scrapGeneratedThisTick);
  }
}

class MockFirstRunTutorialService {
  events: string[] = [];

  recordEvent(eventId: string): void {
    this.events.push(eventId);
  }
}

class MockContractService {
  ticks = 0;

  tick(): void {
    this.ticks += 1;
  }
}

class MockMarketEventService {
  ticks = 0;

  tick(): void {
    this.ticks += 1;
  }
}

describe('GameLoopService', () => {
  let service: GameLoopService;
  let resourcesService: MockResourcesService;
  let machinesService: MockMachinesService;
  let scrapGenerationService: MockScrapGenerationService;
  let saveService: MockSaveService;
  let upgradesService: MockUpgradesService;
  let upgradeProgressService: MockUpgradeProgressService;
  let machineUnlockService: MockMachineUnlockService;
  let audioService: MockAudioService;
  let statisticsService: MockStatisticsService;
  let tutorialService: MockFirstRunTutorialService;
  let contractService: MockContractService;
  let marketEventService: MockMarketEventService;

  beforeEach(() => {
    vi.useFakeTimers();

    resourcesService = new MockResourcesService();
    machinesService = new MockMachinesService();
    scrapGenerationService = new MockScrapGenerationService();
    saveService = new MockSaveService();
    upgradesService = new MockUpgradesService();
    upgradeProgressService = new MockUpgradeProgressService();
    machineUnlockService = new MockMachineUnlockService();
    audioService = new MockAudioService();
    statisticsService = new MockStatisticsService();
    tutorialService = new MockFirstRunTutorialService();
    contractService = new MockContractService();
    marketEventService = new MockMarketEventService();

    TestBed.configureTestingModule({
      providers: [
        GameLoopService,
        { provide: ResourcesService, useValue: resourcesService },
        { provide: MachinesService, useValue: machinesService },
        { provide: ScrapGenerationService, useValue: scrapGenerationService },
        { provide: SaveService, useValue: saveService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: UpgradeProgressService, useValue: upgradeProgressService },
        { provide: MachineUnlockService, useValue: machineUnlockService },
        { provide: AudioService, useValue: audioService },
        { provide: StatisticsService, useValue: statisticsService },
        { provide: FirstRunTutorialService, useValue: tutorialService },
        { provide: ContractService, useValue: contractService },
        { provide: MarketEventService, useValue: marketEventService },
      ],
    });

    service = TestBed.inject(GameLoopService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should start idempotently, tick every second, and autosave on the fifteenth tick', async () => {
    service.start();
    service.start();

    vi.advanceTimersByTime(15000);
    await Promise.resolve();

    expect(service.getTickCount()).toBe(15);
    expect(scrapGenerationService.processCalls).toBe(15);
    expect(saveService.saveCalls).toBe(1);
    expect(contractService.ticks).toBe(15);
    expect(marketEventService.ticks).toBe(15);
  });

  it('should process an active machine cycle, consume inputs, produce output, and reset progress later', () => {
    (service as any).processProduction();

    expect(resourcesService.subtracted).toContainEqual({ resourceId: ResourceType.SCRAP, amount: 1 });
    expect(resourcesService.added).toContainEqual({ resourceId: ResourceType.METAL, amount: 2 });
    expect(tutorialService.events).toContain('crusher-cycle-completed');
    expect(audioService.machineComplete).toBe(1);
    expect(audioService.resourceSold).toBe(0);

    vi.advanceTimersByTime(500);
    expect(machinesService.consumedProgress).toContainEqual({ machineId: MachineType.CRUSHER, amount: 1 });
  });

  it('should not start a new machine cycle when resources are missing', () => {
    resourcesService.setAmount(ResourceType.SCRAP, 0);

    (service as any).processProduction();

    expect(resourcesService.subtracted).toEqual([]);
    expect(resourcesService.added).toEqual([]);
    expect(audioService.machineComplete).toBe(0);
  });

  it('should apply completed upgrade effects during the tick', () => {
    upgradeProgressService.completed = [
      UpgradeId.UPG_STORE_001,
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
    ];

    (service as any).tick();

    expect(upgradesService.completed).toEqual([
      UpgradeId.UPG_STORE_001,
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
    ]);
    expect(upgradesService.appliedStorage).toBe(1);
    expect(scrapGenerationService.setRateCalls).toEqual([6]);
    expect(machineUnlockService.checks).toBe(1);
  });

  it('should log autosave failures without stopping the loop on the fifteenth tick', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    saveService.save = vi.fn().mockRejectedValue(new Error('autosave failed'));

    service.start();

    vi.advanceTimersByTime(15000);
    await Promise.resolve();
    await Promise.resolve();

    expect(service.getTickCount()).toBe(15);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[GameLoop] Auto-save failed:', expect.any(Error));
  });

  it('should continue mid-cycle without re-consuming inputs before completing production', () => {
    const crusher = machinesService.getMachine(MachineType.CRUSHER)!;
    crusher.progress = 0.5;

    (service as any).processProduction();

    expect(resourcesService.subtracted).toEqual([]);
    expect(resourcesService.added).toContainEqual({ resourceId: ResourceType.METAL, amount: 2 });
    expect(audioService.machineComplete).toBe(1);
  });

  it('should play the sold-resource sound when a money-producing machine completes its cycle', () => {
    const crusher = machinesService.getMachine(MachineType.CRUSHER)!;
    crusher.isActive = false;

    const packager = machinesService.getMachine(MachineType.PACKAGER)!;
    packager.isActive = true;
    packager.progress = 0.5;
    resourcesService.setAmount(ResourceType.METAL, 10);

    (service as any).processProduction();

    expect(resourcesService.added).toContainEqual({ resourceId: ResourceType.MONEY, amount: 3 });
    expect(audioService.resourceSold).toBe(1);
    expect(audioService.machineComplete).toBe(0);
  });
});