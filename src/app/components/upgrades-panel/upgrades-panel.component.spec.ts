import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { UpgradesPanelComponent } from './upgrades-panel.component';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { MachinesService } from '../../services/machines.service';
import { UpgradesService } from '../../services/upgrades.service';
import { UpgradeProgressService } from '../../services/upgrade-progress.service';
import { ResourcesService } from '../../services/resources.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { TranslationService } from '../../services/translation.service';
import { FirstRunTutorialService } from '../../services/first-run-tutorial.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { ContractService } from '../../services/contract.service';
import { AudioService } from '../../services/audio.service';
import { MarketEventService } from '../../services/market-event.service';
import { Contract } from '../../models/contract.model';
import { ResourceType } from '../../models/resource.model';
import { UpgradeId } from '../../models/upgrade.model';
import { Machine, MachineType } from '../../models/machine.model';
import { SCRAP_GENERATION_CONFIG, STORAGE_UPGRADE_CONFIG } from '../../config/game-balance.config';

class MockMachineSelectionService {
  private selectedMachineId = signal<string | null>(null);
  clearCalls = 0;
  selectCalls: string[] = [];

  getSelectedMachineId(): string | null {
    return this.selectedMachineId();
  }

  clearSelection(): void {
    this.clearCalls += 1;
    this.selectedMachineId.set(null);
  }

  selectMachine(machineId: string): void {
    this.selectCalls.push(machineId);
    this.selectedMachineId.set(machineId);
  }
}

class MockMachinesService {
  private machines: Machine[] = [];

  setMachines(machines: Machine[]): void {
    this.machines = machines;
  }

  getAll(): Machine[] {
    return this.machines;
  }

  getMachine(machineId: string): Machine | undefined {
    return this.machines.find((machine) => machine.id === machineId);
  }

  isUnlocked(machineId: string): boolean {
    return (this.getMachine(machineId)?.level ?? 0) > 0;
  }
}

class MockUpgradesService {
  levels = new Map<UpgradeId, number>();
  costs = new Map<UpgradeId, { money: number; components: number } | null>();
  purchaseCalls: UpgradeId[] = [];
  effectiveSpeeds = new Map<string, number>();
  productionMultipliers = new Map<string, number>();
  consumptionMultipliers = new Map<string, number>();

  getMachineUpgradeIdByMachineType(machineType: string): UpgradeId | null {
    const mapping: Partial<Record<MachineType, UpgradeId>> = {
      [MachineType.CRUSHER]: UpgradeId.UPG_MACH_001,
      [MachineType.SMELTER]: UpgradeId.UPG_MACH_002,
      [MachineType.SEPARATOR]: UpgradeId.UPG_MACH_003,
      [MachineType.ASSEMBLER]: UpgradeId.UPG_MACH_004,
      [MachineType.PACKAGER]: UpgradeId.UPG_MACH_005,
      [MachineType.RECYCLER]: UpgradeId.UPG_MACH_006,
      [MachineType.ELECTRIC_ASSEMBLER]: UpgradeId.UPG_MACH_007,
      [MachineType.ELECTRIC_PACKAGER]: UpgradeId.UPG_MACH_008,
      [MachineType.PCB_PRINTER]: UpgradeId.UPG_MACH_009,
    };

    return mapping[machineType as MachineType] ?? null;
  }

  getLevel(upgradeId: UpgradeId): number {
    return this.levels.get(upgradeId) ?? 1;
  }

  getCostForNextLevel(upgradeId: UpgradeId): { money: number; components: number } | null {
    return this.costs.has(upgradeId) ? this.costs.get(upgradeId) ?? null : { money: 10, components: 0 };
  }

  calculateEffectiveSpeed(baseSpeed: number, machineType: string): number {
    return this.effectiveSpeeds.get(machineType) ?? baseSpeed;
  }

  calculateProductionMultiplier(machineType: string): number {
    return this.productionMultipliers.get(machineType) ?? 1;
  }

  calculateConsumptionMultiplier(machineType: string): number {
    return this.consumptionMultipliers.get(machineType) ?? 1;
  }

  calculateStorageCapacity(_upgradeId: UpgradeId, level: number, baseCapacity: number): number {
    return baseCapacity + level * 25;
  }

  purchaseUpgrade(upgradeId: UpgradeId): void {
    this.purchaseCalls.push(upgradeId);
  }
}

class MockUpgradeProgressService {
  activeUpgrades$ = signal<
    Array<{ upgradeId: UpgradeId; elapsedTime: number; totalTime: number }>
  >([]);
  inProgress = new Set<UpgradeId>();

  isUpgradeInProgress(upgradeId: UpgradeId): boolean {
    return this.inProgress.has(upgradeId);
  }
}

class MockResourcesService {
  private amounts: Record<string, number> = {
    [ResourceType.COMPONENTS]: 12,
    [ResourceType.METAL]: 18,
    [ResourceType.MONEY]: 100,
  };
  private baseCapacities: Record<string, number> = {
    [ResourceType.SCRAP]: 100,
    [ResourceType.CIRCUIT_BOARD]: 50,
  };
  private capacities: Record<string, number> = {
    [ResourceType.SCRAP]: 150,
    [ResourceType.CIRCUIT_BOARD]: 75,
  };
  subtractCalls: Array<{ resourceId: string; amount: number }> = [];

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  getAmount(resourceId: string): number {
    return this.amounts[resourceId] ?? 0;
  }

  setAmount(resourceId: string, amount: number): void {
    this.amounts[resourceId] = amount;
  }

  getBaseCapacity(resourceId: string): number {
    return this.baseCapacities[resourceId] ?? 100;
  }

  setBaseCapacity(resourceId: string, capacity: number): void {
    this.baseCapacities[resourceId] = capacity;
  }

  getCapacity(resourceId: string): number {
    return this.capacities[resourceId] ?? this.getBaseCapacity(resourceId);
  }

  setCapacity(resourceId: string, capacity: number): void {
    this.capacities[resourceId] = capacity;
  }

  subtract(resourceId: string, amount: number): void {
    this.subtractCalls.push({ resourceId, amount });
    this.amounts[resourceId] = (this.amounts[resourceId] ?? 0) - amount;
  }
}

class MockScrapGenerationService {
  getAutoRateByLevel(level: number): number {
    return level * 2;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }

  tp(key: string, params: Record<string, unknown>): string {
    return `${key}:${JSON.stringify(params)}`;
  }
}

class MockFirstRunTutorialService {
  currentStepId = signal('');
}

class MockMachineUnlockService {
  private infos = new Map<string, { requirements: Array<Record<string, unknown>> }>();

  setUnlockInfo(machineId: string, info: { requirements: Array<Record<string, unknown>> }): void {
    this.infos.set(machineId, info);
  }

  getUnlockInfo(machineId: string): { requirements: Array<Record<string, unknown>> } {
    return this.infos.get(machineId) ?? { requirements: [] };
  }
}

class MockAudioService {
  playUiClick(): void {}
}

class MockMarketEventService {
  activeEvent = signal(null);
}

class MockContractService {
  available = signal<Contract[]>([]);
  active = signal<Contract[]>([]);
  acceptedIds: string[] = [];
  rejectedIds: string[] = [];
  deliveredIds: string[] = [];
  stockByResource: Partial<Record<ResourceType, number>> = {
    [ResourceType.COMPONENTS]: 12,
    [ResourceType.METAL]: 18,
  };

  formatTimer(seconds: number): string {
    return `timer:${seconds}`;
  }

  getAvailableSeconds(contract: Contract): number {
    return Math.ceil((contract.availableUntil - Date.now()) / 1000);
  }

  getRemainingSeconds(contract: Contract): number {
    if (!contract.isAccepted || contract.acceptedAt === 0) {
      return contract.durationSeconds;
    }

    return Math.ceil(contract.durationSeconds - (Date.now() - contract.acceptedAt) / 1000);
  }

  canDeliver(contract: Contract): boolean {
    return (this.stockByResource[contract.resourceId] ?? 0) >= contract.amount;
  }

  setStock(resourceId: ResourceType, amount: number): void {
    this.stockByResource[resourceId] = amount;
  }

  accept(contractId: string): void {
    this.acceptedIds.push(contractId);
  }

  reject(contractId: string): void {
    this.rejectedIds.push(contractId);
  }

  deliver(contractId: string): void {
    this.deliveredIds.push(contractId);
  }
}

function makeMachine(machineId: MachineType, overrides: Partial<Machine> = {}): Machine {
  return {
    id: machineId,
    name: machineId,
    level: 1,
    baseSpeed: 1,
    baseConsumption: [],
    baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
    isActive: false,
    progress: 0,
    icon: `assets/icons/${machineId}.png`,
    ...overrides,
  };
}

describe('UpgradesPanelComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradesPanelComponent],
      providers: [
        { provide: MachineSelectionService, useClass: MockMachineSelectionService },
        { provide: MachinesService, useClass: MockMachinesService },
        { provide: UpgradesService, useClass: MockUpgradesService },
        { provide: UpgradeProgressService, useClass: MockUpgradeProgressService },
        { provide: ResourcesService, useClass: MockResourcesService },
        { provide: ScrapGenerationService, useClass: MockScrapGenerationService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: FirstRunTutorialService, useClass: MockFirstRunTutorialService },
        { provide: MachineUnlockService, useClass: MockMachineUnlockService },
        { provide: ContractService, useClass: MockContractService },
        { provide: AudioService, useClass: MockAudioService },
        { provide: MarketEventService, useClass: MockMarketEventService },
      ],
    }).compileComponents();
  });

  it('should render available and active contract sections in the contracts tab', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const now = Date.now();

    contractService.available.set([
      {
        id: 'available-1',
        type: 'local',
        urgency: 'urgent',
        resourceId: ResourceType.METAL,
        amount: 20,
        reward: 35,
        penaltyAmount: 10,
        durationSeconds: 90,
        spawnedAt: now,
        availableUntil: now + 120000,
        acceptedAt: 0,
        isAccepted: false,
      },
    ]);

    contractService.active.set([
      {
        id: 'active-1',
        type: 'corporate',
        urgency: 'urgent',
        resourceId: ResourceType.COMPONENTS,
        amount: 10,
        reward: 120,
        penaltyAmount: 12,
        durationSeconds: 180,
        spawnedAt: now - 60000,
        availableUntil: now - 1000,
        acceptedAt: now - 30000,
        isAccepted: true,
      },
    ]);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.contracts-view')).not.toBeNull();
    expect(element.textContent).toContain('contracts.available_title');
    expect(element.textContent).toContain('contracts.active_title');
    expect(element.textContent).toContain('contracts.penalty');
    expect(element.textContent).toContain('contracts.urgency.urgent');
    expect(element.textContent).toContain('-12');
    expect(element.textContent).toContain('common.stock_label 12 / 10');
    expect(element.querySelectorAll('app-progress-bar')).toHaveLength(2);
  });

  it('should render the empty state when there are no contracts', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;

    contractService.available.set([]);
    contractService.active.set([]);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.contracts-empty')).not.toBeNull();
    expect(element.textContent).toContain('contracts.empty');
  });

  it('should call reject and accept actions from available contract buttons', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const now = Date.now();

    contractService.available.set([
      {
        id: 'available-actions',
        type: 'local',
        urgency: 'normal',
        resourceId: ResourceType.METAL,
        amount: 10,
        reward: 20,
        penaltyAmount: 0,
        durationSeconds: 90,
        spawnedAt: now,
        availableUntil: now + 120000,
        acceptedAt: 0,
        isAccepted: false,
      },
    ]);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const rejectButton = buttons.find((button) => button.textContent?.includes('contracts.reject'));
    const acceptButton = buttons.find((button) => button.textContent?.includes('contracts.accept'));

    rejectButton?.click();
    acceptButton?.click();

    expect(contractService.rejectedIds).toEqual(['available-actions']);
    expect(contractService.acceptedIds).toEqual(['available-actions']);
  });

  it('should call deliver action from active contract button', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const now = Date.now();

    contractService.active.set([
      {
        id: 'active-deliver',
        type: 'corporate',
        urgency: 'normal',
        resourceId: ResourceType.COMPONENTS,
        amount: 6,
        reward: 80,
        penaltyAmount: 0,
        durationSeconds: 180,
        spawnedAt: now - 30000,
        availableUntil: now - 1000,
        acceptedAt: now - 15000,
        isAccepted: true,
      },
    ]);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const deliverButton = buttons.find((button) => button.textContent?.includes('contracts.deliver'));

    expect(deliverButton?.disabled).toBe(false);
    deliverButton?.click();

    expect(contractService.deliveredIds).toEqual(['active-deliver']);
  });

  it('should disable deliver when stock is below the contract amount', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;
    const now = Date.now();

    resourcesService.setAmount(ResourceType.COMPONENTS, 4);
    contractService.setStock(ResourceType.COMPONENTS, 4);
    contractService.active.set([
      {
        id: 'active-disabled',
        type: 'corporate',
        urgency: 'normal',
        resourceId: ResourceType.COMPONENTS,
        amount: 6,
        reward: 80,
        penaltyAmount: 0,
        durationSeconds: 180,
        spawnedAt: now - 30000,
        availableUntil: now - 1000,
        acceptedAt: now - 15000,
        isAccepted: true,
      },
    ]);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const deliverButton = buttons.find((button) => button.textContent?.includes('contracts.deliver'));

    expect(deliverButton?.disabled).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('common.stock_label 4 / 6');
  });

  it('should compute machine and storage upgrade models with ordering, locks, affordability, and progress', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const unlockService = TestBed.inject(MachineUnlockService) as unknown as MockMachineUnlockService;

    machinesService.setMachines([
      makeMachine(MachineType.PACKAGER, { level: 0, baseSpeed: 1.2 }),
      makeMachine(MachineType.PCB_PRINTER, { level: 0 }),
      makeMachine(MachineType.CRUSHER, { level: 1, baseSpeed: 2 }),
    ]);

    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 12);
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, { money: 50, components: 4 });
    upgradesService.effectiveSpeeds.set(MachineType.CRUSHER, 3.4);
    upgradesService.productionMultipliers.set(MachineType.CRUSHER, 2);
    progressService.inProgress.add(UpgradeId.UPG_MACH_001);

    upgradesService.levels.set(UpgradeId.UPG_STORE_001, 2);
    upgradesService.costs.set(UpgradeId.UPG_STORE_001, { money: 30, components: 0 });
    upgradesService.levels.set(UpgradeId.UPG_STORE_008, 1);
    upgradesService.costs.set(UpgradeId.UPG_STORE_008, { money: 40, components: 2 });

    resourcesService.setAmount(ResourceType.MONEY, 120);
    resourcesService.setAmount(ResourceType.COMPONENTS, 10);
    resourcesService.setBaseCapacity(ResourceType.SCRAP, 100);
    resourcesService.setCapacity(ResourceType.SCRAP, 150);

    unlockService.setUnlockInfo(MachineType.PACKAGER, {
      requirements: [
        {
          machineType: MachineType.ASSEMBLER,
          requiredLevel: 3,
          currentLevel: 1,
          isMet: false,
        },
      ],
    });

    const machineUpgrades = component.allMachineUpgrades();
    const storageUpgrades = component.storageUpgrades();

    expect(machineUpgrades[0].machineId).toBe(MachineType.CRUSHER);
    expect(machineUpgrades[0].effectiveSpeed).toBe(3.4);
    expect(machineUpgrades[0].productionMultiplier).toBe(2);
    expect(machineUpgrades[0].nextProductionMultiplier).toBe(3);
    expect(machineUpgrades[0].nextBonusAt).toBe(9);
    expect(machineUpgrades[0].isInProgress).toBe(true);
    expect(machineUpgrades[0].canAfford).toBe(true);
    expect(machineUpgrades[1].machineId).toBe(MachineType.PACKAGER);
    expect(machineUpgrades[1].isLocked).toBe(true);
    expect(machineUpgrades[1].unlockRequirements).toHaveLength(1);

    const scrapStorage = storageUpgrades.find((upgrade) => upgrade.upgradeId === UpgradeId.UPG_STORE_001);
    const boardStorage = storageUpgrades.find((upgrade) => upgrade.upgradeId === UpgradeId.UPG_STORE_008);

    expect(scrapStorage).toMatchObject({
      currentCapacity: 150,
      nextCapacity: 175,
      canAfford: true,
      isLocked: false,
    });
    expect(boardStorage?.isLocked).toBe(true);
  });

  it('should expose unmapped machines in allMachineUpgrades with null upgrade metadata', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, {
        level: 0,
        icon: 'assets/icons/crusher.png',
      }),
    ]);
    vi.spyOn(upgradesService, 'getMachineUpgradeIdByMachineType').mockReturnValue(null);

    expect(component.allMachineUpgrades()).toEqual([
      {
        machineId: MachineType.CRUSHER,
        machineName: 'machines.crusher',
        icon: 'assets/icons/crusher.png',
        upgradeId: null,
        level: 0,
        isLocked: true,
        upgrades: [],
      },
    ]);
  });

  it('should compute scrap upgrades and execute eligible purchases through the shared services', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1, baseSpeed: 2 }),
      makeMachine(MachineType.PACKAGER, { level: 1 }),
    ]);

    upgradesService.levels.set(UpgradeId.UPG_SCRAP_001, 3);
    upgradesService.levels.set(UpgradeId.UPG_SCRAP_002, 2);
    upgradesService.levels.set(UpgradeId.UPG_STORE_001, 2);
    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 5);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_001, { money: 15, components: 1 });
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_002, { money: 20, components: 2 });
    upgradesService.costs.set(UpgradeId.UPG_STORE_001, { money: 30, components: 3 });
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, { money: 40, components: 4 });

    resourcesService.setAmount(ResourceType.MONEY, 200);
    resourcesService.setAmount(ResourceType.COMPONENTS, 20);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    const scrapManual = component.scrapManualUpgrade();
    const scrapAuto = component.scrapAutoUpgrade();

    expect(scrapManual.isLocked).toBe(false);
    expect(scrapManual.nextGeneration).toBe(scrapManual.currentGeneration + 1);
    expect(scrapAuto.currentRate).toBe(4);
    expect(scrapAuto.nextRate).toBe(6);

    component.purchaseStorageUpgrade(UpgradeId.UPG_STORE_001);
    component.purchaseScrapUpgrade();
    component.purchaseMachineUpgradeById(MachineType.CRUSHER);
    component.purchaseScrapManualUpgrade();

    expect(machineSelectionService.selectCalls).toContain(MachineType.CRUSHER);
    expect(upgradesService.purchaseCalls).toEqual([
      UpgradeId.UPG_STORE_001,
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
      UpgradeId.UPG_SCRAP_001,
    ]);
    expect(resourcesService.subtractCalls).toEqual([
      { resourceId: ResourceType.MONEY, amount: 30 },
      { resourceId: ResourceType.COMPONENTS, amount: 3 },
      { resourceId: ResourceType.MONEY, amount: 20 },
      { resourceId: ResourceType.COMPONENTS, amount: 2 },
      { resourceId: ResourceType.MONEY, amount: 40 },
      { resourceId: ResourceType.COMPONENTS, amount: 4 },
      { resourceId: ResourceType.MONEY, amount: 15 },
      { resourceId: ResourceType.COMPONENTS, amount: 1 },
    ]);
  });

  it('should expose fallback machine helper state when the selected machine has no upgrade mapping', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;

    machinesService.setMachines([
      makeMachine('mystery-machine' as MachineType, {
        id: 'mystery-machine' as MachineType,
        baseSpeed: 3,
        icon: 'assets/icons/mystery-machine.png',
      }),
    ]);

    expect(component.selectedMachine()).toBeNull();
    expect(component.translatedMachineName()).toBe('');
    expect(component.currentMachineUpgradeId()).toBeNull();

    machineSelectionService.selectMachine('mystery-machine');

    expect(component.selectedMachine()?.id).toBe('mystery-machine');
    expect(component.translatedMachineName()).toBe('machines.mystery-machine');
    expect(component.currentMachineUpgradeId()).toBeNull();
    expect(component.machineUpgrade()).toMatchObject({
      level: 0,
      maxLevel: 0,
      baseSpeed: 3,
      effectiveSpeed: 3,
      canAfford: false,
      isMaxLevel: true,
    });
  });

  it('should expose the zeroed machineUpgrade fallback when no machine is selected', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;

    expect(component.selectedMachine()).toBeNull();
    expect(component.machineUpgrade()).toMatchObject({
      level: 0,
      maxLevel: 0,
      baseSpeed: 0,
      effectiveSpeed: 0,
      speedBonus: 0,
      consumptionMultiplier: 1,
      productionMultiplier: 1,
      nextBonusAt: 0,
      cost: { money: 0, components: 0 },
      canAfford: false,
      isMaxLevel: true,
    });
  });

  it('should expose mapped machine helper state with max multiplier and fallback cost data', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, {
        level: 1,
        baseSpeed: 2.5,
      }),
    ]);

    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 50);
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, null);
    upgradesService.effectiveSpeeds.set(MachineType.CRUSHER, 4.2);
    upgradesService.consumptionMultipliers.set(MachineType.CRUSHER, 0.4);
    upgradesService.productionMultipliers.set(MachineType.CRUSHER, 5);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    expect(component.machineUpgrade()).toMatchObject({
      level: 50,
      maxLevel: 50,
      baseSpeed: 2.5,
      effectiveSpeed: 4.2,
      speedBonus: 4.9,
      consumptionMultiplier: 0.4,
      productionMultiplier: 5,
      nextProductionMultiplier: 5,
      nextBonusAt: 0,
      cost: { money: 0, components: 0 },
      canAfford: false,
      isMaxLevel: true,
    });
  });

  it('should render scrap and storage tabs with locked hints, max-level messaging, and progress bars', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine(MachineType.PACKAGER, { level: 0 }),
      makeMachine(MachineType.PCB_PRINTER, { level: 0 }),
    ]);

    upgradesService.levels.set(UpgradeId.UPG_SCRAP_002, SCRAP_GENERATION_CONFIG.MAX_LEVEL);
    upgradesService.levels.set(UpgradeId.UPG_STORE_001, 2);
    upgradesService.levels.set(UpgradeId.UPG_STORE_002, STORAGE_UPGRADE_CONFIG.MAX_LEVEL);
    upgradesService.costs.set(UpgradeId.UPG_STORE_001, { money: 30, components: 2 });
    progressService.activeUpgrades$.set([
      { upgradeId: UpgradeId.UPG_STORE_001, elapsedTime: 20, totalTime: 80 },
    ]);

    component.setActiveTab('scrap');
    fixture.detectChanges();

    let element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('upgrades.scrap_manual.locked_hint');
    expect(element.textContent).toContain('upgrades.max_level');

    component.setActiveTab('storage');
    fixture.detectChanges();

    element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('status.bloqueada');
    expect(element.textContent).toContain('upgrades.max_level');
    expect(element.querySelectorAll('app-progress-bar').length).toBeGreaterThan(0);
  });

  it('should render the auto scrap upgrade button with component cost details when not maxed', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine(MachineType.PACKAGER, { level: 1 }),
    ]);
    upgradesService.levels.set(UpgradeId.UPG_SCRAP_002, 2);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_002, { money: 20, components: 3 });
    progressService.activeUpgrades$.set([
      { upgradeId: UpgradeId.UPG_SCRAP_002, elapsedTime: 15, totalTime: 60 },
    ]);
    progressService.inProgress.add(UpgradeId.UPG_SCRAP_002);
    resourcesService.setAmount(ResourceType.MONEY, 500);
    resourcesService.setAmount(ResourceType.COMPONENTS, 50);

    component.setActiveTab('scrap');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('buttons.mejorar');
    expect(element.textContent).toContain('20');
    expect(element.textContent).toContain('3');
    expect(element.textContent).toContain('upgrades.upgrading: 45s');
    expect(element.textContent).not.toContain('upgrades.max_level');
    expect(element.querySelectorAll('app-progress-bar').length).toBeGreaterThan(0);
  });

  it('should render the unlocked manual scrap card with next-level stats, component costs, and in-progress state', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine(MachineType.PACKAGER, { level: 1 }),
    ]);
    upgradesService.levels.set(UpgradeId.UPG_SCRAP_001, 2);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_001, { money: 15, components: 2 });
    progressService.activeUpgrades$.set([
      { upgradeId: UpgradeId.UPG_SCRAP_001, elapsedTime: 10, totalTime: 30 },
    ]);
    progressService.inProgress.add(UpgradeId.UPG_SCRAP_001);
    resourcesService.setAmount(ResourceType.MONEY, 100);
    resourcesService.setAmount(ResourceType.COMPONENTS, 10);

    component.setActiveTab('scrap');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const manualUpgrade = component.scrapManualUpgrade();
    const buttons = Array.from(element.querySelectorAll('button')) as HTMLButtonElement[];
    const manualButton = buttons.find((button) => button.textContent?.includes('buttons.mejorar'));

    expect(manualUpgrade.isLocked).toBe(false);
    expect(element.textContent).toContain('upgrades.scrap_details.manual_label');
    expect(element.textContent).toContain(String(manualUpgrade.currentGeneration));
    expect(element.textContent).toContain('upgrades.scrap_details.next_level_label');
    expect(element.textContent).toContain(String(manualUpgrade.nextGeneration));
    expect(element.textContent).toContain('15');
    expect(element.textContent).toContain('2');
    expect(element.textContent).toContain('upgrades.upgrading: 20s');
    expect(element.textContent).not.toContain('upgrades.scrap_manual.locked_hint');
    expect(manualButton?.disabled).toBe(true);
    expect(element.querySelectorAll('app-progress-bar').length).toBeGreaterThan(0);
  });

  it('should render machine cards with highlight, locked requirements, progress, max-level state, and button-driven purchases', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const unlockService = TestBed.inject(MachineUnlockService) as unknown as MockMachineUnlockService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine(MachineType.SEPARATOR, { level: 50 }),
      makeMachine(MachineType.SMELTER, { level: 1 }),
      makeMachine(MachineType.PACKAGER, { level: 0 }),
    ]);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 3);
    upgradesService.levels.set(UpgradeId.UPG_MACH_002, 4);
    upgradesService.levels.set(UpgradeId.UPG_MACH_003, 50);
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, { money: 40, components: 4 });
    upgradesService.costs.set(UpgradeId.UPG_MACH_002, { money: 60, components: 6 });
    upgradesService.costs.set(UpgradeId.UPG_MACH_003, { money: 0, components: 0 });
    upgradesService.effectiveSpeeds.set(MachineType.CRUSHER, 2.6);
    upgradesService.productionMultipliers.set(MachineType.CRUSHER, 2);
    upgradesService.productionMultipliers.set(MachineType.SEPARATOR, 5);

    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    progressService.inProgress.add(UpgradeId.UPG_MACH_002);

    unlockService.setUnlockInfo(MachineType.PACKAGER, {
      requirements: [
        {
          machineType: MachineType.ASSEMBLER,
          requiredLevel: 3,
          currentLevel: 1,
          isMet: false,
        },
      ],
    });

    component.setActiveTab('machine');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const crusherCard = element.querySelector(`[data-machine-id="${MachineType.CRUSHER}"]`);
    const crusherUpgradeButton = crusherCard?.querySelector('button');

    expect(crusherCard?.classList.contains('highlighted')).toBe(true);
    expect(element.textContent).toContain('status.bloqueada');
    expect(element.textContent).toContain('upgrades.max_level');
    expect(element.textContent).toContain('machines.assembler common.level_short 3 (1/3)');
    expect(element.querySelectorAll('app-progress-bar').length).toBeGreaterThan(0);

    crusherUpgradeButton?.click();

    expect(upgradesService.purchaseCalls).toContain(UpgradeId.UPG_MACH_001);
  });

  it('should guard purchase flows when upgrades are in progress, unaffordable, or capped', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine(MachineType.PACKAGER, { level: 0 }),
    ]);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    upgradesService.levels.set(UpgradeId.UPG_STORE_001, 50);
    upgradesService.levels.set(UpgradeId.UPG_SCRAP_002, 50);
    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 50);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_001, { money: 15, components: 1 });
    resourcesService.setAmount(ResourceType.MONEY, 0);
    resourcesService.setAmount(ResourceType.COMPONENTS, 0);
    progressService.inProgress.add(UpgradeId.UPG_SCRAP_001);

    component.purchaseStorageUpgrade(UpgradeId.UPG_STORE_001);
    component.purchaseScrapUpgrade();
    component.purchaseMachineUpgrade();
    component.purchaseScrapManualUpgrade();
    component.purchaseMachineUpgradeById('missing-machine');

    expect(upgradesService.purchaseCalls).toEqual([]);
    expect(resourcesService.subtractCalls).toEqual([]);
  });

  it('should warn and stop auto scrap and selected machine purchases that are already in progress', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    machinesService.setMachines([makeMachine(MachineType.CRUSHER, { level: 1 })]);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    resourcesService.setAmount(ResourceType.MONEY, 500);
    resourcesService.setAmount(ResourceType.COMPONENTS, 500);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_002, { money: 20, components: 2 });
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, { money: 40, components: 4 });
    progressService.inProgress.add(UpgradeId.UPG_SCRAP_002);
    progressService.inProgress.add(UpgradeId.UPG_MACH_001);

    component.purchaseScrapUpgrade();
    component.purchaseMachineUpgrade();

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(upgradesService.purchaseCalls).toEqual([]);
    expect(resourcesService.subtractCalls).toEqual([]);
  });

  it('should skip affordable maxed storage upgrades and support money-only scrap and machine purchases', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;

    machinesService.setMachines([makeMachine(MachineType.CRUSHER, { level: 1 })]);
    machineSelectionService.selectMachine(MachineType.CRUSHER);

    upgradesService.levels.set(UpgradeId.UPG_STORE_001, STORAGE_UPGRADE_CONFIG.MAX_LEVEL);
    upgradesService.levels.set(UpgradeId.UPG_SCRAP_002, 3);
    upgradesService.levels.set(UpgradeId.UPG_MACH_001, 4);
    upgradesService.costs.set(UpgradeId.UPG_STORE_001, { money: 30, components: 0 });
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_002, { money: 20, components: 0 });
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, { money: 40, components: 0 });

    resourcesService.setAmount(ResourceType.MONEY, 200);
    resourcesService.setAmount(ResourceType.COMPONENTS, 0);

    component.purchaseStorageUpgrade(UpgradeId.UPG_STORE_001);
    component.purchaseScrapUpgrade();
    component.purchaseMachineUpgrade();

    expect(upgradesService.purchaseCalls).toEqual([
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
    ]);
    expect(resourcesService.subtractCalls).toEqual([
      { resourceId: ResourceType.MONEY, amount: 20 },
      { resourceId: ResourceType.MONEY, amount: 40 },
    ]);
  });

  it('should expose progress maps, timer helpers, contract helpers, and selection utilities', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;

    progressService.activeUpgrades$.set([
      { upgradeId: UpgradeId.UPG_STORE_001, elapsedTime: 30, totalTime: 120 },
    ]);
    progressService.inProgress.add(UpgradeId.UPG_STORE_001);

    const availableContract: Contract = {
      id: 'available-progress',
      type: 'local',
      urgency: 'normal',
      resourceId: ResourceType.METAL,
      amount: 10,
      reward: 25,
      penaltyAmount: 0,
      durationSeconds: 90,
      spawnedAt: 1000,
      availableUntil: 61000,
      acceptedAt: 0,
      isAccepted: false,
    };

    const activeContract: Contract = {
      ...availableContract,
      id: 'active-progress',
      durationSeconds: 120,
      acceptedAt: 2000,
      availableUntil: 1000,
      isAccepted: true,
    };

    contractService.getAvailableSeconds = () => 20;
    contractService.getRemainingSeconds = () => 30;
    resourcesService.setAmount(ResourceType.METAL, 14);

    expect(component.getUpgradeProgress(UpgradeId.UPG_STORE_001)).toBe(0.25);
    expect(component.getRemainingTime(UpgradeId.UPG_STORE_001)).toBe(90);
    expect(component.isUpgradeInProgress(UpgradeId.UPG_STORE_001)).toBe(true);
    expect(component.formatTime(45)).toBe('45s');
    expect(component.formatTime(125)).toBe('2m 5s');
    expect(component.formatTime(3700)).toBe('1h 1m');
    expect(component.getContractStock(availableContract)).toBe(14);
    expect(component.hasContractStock(availableContract)).toBe(true);
    expect(component.getAvailableContractProgress(availableContract)).toBeCloseTo(2 / 3);
    expect(component.getActiveContractProgress(activeContract)).toBeCloseTo(0.75);

    component.clearMachineSelection();

    expect(machineSelectionService.clearCalls).toBe(1);
    expect(component.tutorialMachineUpgradeId(MachineType.CRUSHER)).toBe('machine-upgrade-crusher');
    expect(component.tutorialMachineUpgradeId(MachineType.PACKAGER)).toBeNull();
    expect(component.tutorialMachineUpgradeButtonId(MachineType.CRUSHER)).toBe('machine-upgrade-button-crusher');
    expect(component.tutorialMachineUpgradeButtonId(MachineType.PACKAGER)).toBeNull();
  });

  it('should clamp overdue upgrade and contract progress helpers and render the low-deadline state', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const now = Date.now();

    const availableContract: Contract = {
      id: 'available-clamped',
      type: 'local',
      urgency: 'normal',
      resourceId: ResourceType.METAL,
      amount: 5,
      reward: 15,
      penaltyAmount: 0,
      durationSeconds: 90,
      spawnedAt: now - 90000,
      availableUntil: now - 1000,
      acceptedAt: 0,
      isAccepted: false,
    };

    const activeContract: Contract = {
      ...availableContract,
      id: 'active-clamped',
      durationSeconds: 120,
      acceptedAt: now - 180000,
      isAccepted: true,
    };

    progressService.activeUpgrades$.set([
      { upgradeId: UpgradeId.UPG_STORE_001, elapsedTime: 150, totalTime: 120 },
    ]);
    contractService.available.set([availableContract]);
    contractService.active.set([activeContract]);
    contractService.getAvailableSeconds = () => -20;
    contractService.getRemainingSeconds = () => -5;

    component.setActiveTab('contracts');
    fixture.detectChanges();

    expect(component.getUpgradeProgress(UpgradeId.UPG_STORE_001)).toBe(1);
    expect(component.getRemainingTime(UpgradeId.UPG_STORE_001)).toBe(0);
    expect(component.getAvailableContractProgress(availableContract)).toBe(1);
    expect(component.getActiveContractProgress(activeContract)).toBe(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('.contract-deadline--low')).not.toBeNull();
  });

  it('should disable accepting new contracts at the active cap and reflect ready stock states', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;
    const now = Date.now();

    contractService.available.set([
      {
        id: 'available-ready',
        type: 'local',
        urgency: 'normal',
        resourceId: ResourceType.METAL,
        amount: 10,
        reward: 25,
        penaltyAmount: 0,
        durationSeconds: 90,
        spawnedAt: now,
        availableUntil: now + 120000,
        acceptedAt: 0,
        isAccepted: false,
      },
      {
        id: 'available-short',
        type: 'corporate',
        urgency: 'normal',
        resourceId: ResourceType.COMPONENTS,
        amount: 20,
        reward: 60,
        penaltyAmount: 5,
        durationSeconds: 120,
        spawnedAt: now,
        availableUntil: now + 120000,
        acceptedAt: 0,
        isAccepted: false,
      },
    ]);
    contractService.active.set([
      {
        id: 'active-a',
        type: 'local',
        urgency: 'normal',
        resourceId: ResourceType.METAL,
        amount: 5,
        reward: 15,
        penaltyAmount: 0,
        durationSeconds: 90,
        spawnedAt: now - 5000,
        availableUntil: now - 1000,
        acceptedAt: now - 4000,
        isAccepted: true,
      },
      {
        id: 'active-b',
        type: 'corporate',
        urgency: 'normal',
        resourceId: ResourceType.COMPONENTS,
        amount: 5,
        reward: 15,
        penaltyAmount: 0,
        durationSeconds: 90,
        spawnedAt: now - 5000,
        availableUntil: now - 1000,
        acceptedAt: now - 4000,
        isAccepted: true,
      },
    ]);
    contractService.setStock(ResourceType.METAL, 18);
    contractService.setStock(ResourceType.COMPONENTS, 12);

    component.setActiveTab('contracts');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const acceptButtons = Array.from(element.querySelectorAll('button')).filter((button) =>
      button.textContent?.includes('contracts.accept'),
    ) as HTMLButtonElement[];
    const contractCards = Array.from(element.querySelectorAll('.contract-card')) as HTMLDivElement[];

    expect(acceptButtons).toHaveLength(2);
    expect(acceptButtons.every((button) => button.disabled)).toBe(true);
    expect(contractCards[0].querySelector('.contract-stock--ready')).not.toBeNull();
    expect(contractCards[1].querySelector('.contract-stock--ready')).toBeNull();
    expect(element.textContent).toContain('common.stock_label 18 / 10');
    expect(element.textContent).toContain('common.stock_label 12 / 20');
  });

  it('should expose idle upgrade helpers and clamp zero-length contract windows safely', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const contractService = TestBed.inject(ContractService) as unknown as MockContractService;

    const zeroWindowAvailable: Contract = {
      id: 'available-zero-window',
      type: 'local',
      urgency: 'normal',
      resourceId: ResourceType.METAL,
      amount: 3,
      reward: 10,
      penaltyAmount: 0,
      durationSeconds: 30,
      spawnedAt: 1000,
      availableUntil: 1000,
      acceptedAt: 0,
      isAccepted: false,
    };

    const zeroWindowActive: Contract = {
      ...zeroWindowAvailable,
      id: 'active-zero-window',
      durationSeconds: 0,
      acceptedAt: 1000,
      isAccepted: true,
    };

    contractService.getAvailableSeconds = () => 0;
    contractService.getRemainingSeconds = () => 0;

    expect(component.getUpgradeProgress(UpgradeId.UPG_STORE_016)).toBe(0);
    expect(component.getRemainingTime(UpgradeId.UPG_STORE_016)).toBe(0);
    expect(component.isUpgradeInProgress(UpgradeId.UPG_STORE_016)).toBe(false);
    expect(component.getAvailableContractProgress(zeroWindowAvailable)).toBe(1);
    expect(component.getActiveContractProgress(zeroWindowActive)).toBe(1);
  });

  it('should guard storage, scrap, and machine purchases when progress, mapping, or costs are missing', () => {
    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machinesService = TestBed.inject(MachinesService) as unknown as MockMachinesService;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const upgradesService = TestBed.inject(UpgradesService) as unknown as MockUpgradesService;
    const resourcesService = TestBed.inject(ResourcesService) as unknown as MockResourcesService;
    const progressService = TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService;

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 1 }),
      makeMachine('mystery-machine' as MachineType, {
        id: 'mystery-machine' as MachineType,
        level: 1,
      }),
    ]);

    resourcesService.setAmount(ResourceType.MONEY, 500);
    resourcesService.setAmount(ResourceType.COMPONENTS, 500);
    progressService.inProgress.add(UpgradeId.UPG_STORE_001);
    upgradesService.costs.set(UpgradeId.UPG_STORE_001, { money: 30, components: 3 });
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_001, null);
    upgradesService.costs.set(UpgradeId.UPG_SCRAP_002, null);
    upgradesService.costs.set(UpgradeId.UPG_MACH_001, null);

    component.purchaseStorageUpgrade(UpgradeId.UPG_STORE_001);
    component.purchaseScrapManualUpgrade();
    component.purchaseScrapUpgrade();

    machineSelectionService.clearSelection();
    component.purchaseMachineUpgrade();

    machineSelectionService.selectMachine('mystery-machine');
    component.purchaseMachineUpgrade();

    machineSelectionService.selectMachine(MachineType.CRUSHER);
    component.purchaseMachineUpgrade();

    expect(upgradesService.purchaseCalls).toEqual([]);
    expect(resourcesService.subtractCalls).toEqual([]);
  });

  it('should scroll cards inside the panel and react to tutorial and selection effects', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const fixture = TestBed.createComponent(UpgradesPanelComponent);
    const component = fixture.componentInstance;
    const machineSelectionService = TestBed.inject(MachineSelectionService) as unknown as MockMachineSelectionService;
    const tutorialService = TestBed.inject(FirstRunTutorialService) as unknown as MockFirstRunTutorialService;
    fixture.detectChanges();

    const tabContent = fixture.nativeElement.querySelector('.tab-content') as HTMLElement;
    Object.defineProperty(tabContent, 'clientHeight', { value: 200, configurable: true });
    tabContent.scrollTop = 0;

    const directTarget = document.createElement('div');
    Object.defineProperty(directTarget, 'offsetTop', { value: 240, configurable: true });
    Object.defineProperty(directTarget, 'offsetHeight', { value: 40, configurable: true });
    (component as any).scrollCardIntoPanel(directTarget);
    expect(tabContent.scrollTop).toBe(160);

    const tutorialTarget = document.createElement('div');
    tutorialTarget.setAttribute('data-tutorial-id', 'machine-upgrade-button-crusher');
    fixture.nativeElement.appendChild(tutorialTarget);

    const selectedTarget = document.createElement('div');
    selectedTarget.setAttribute('data-machine-id', MachineType.CRUSHER);
    fixture.nativeElement.appendChild(selectedTarget);

    const scrollSpy = vi
      .spyOn(component as unknown as { scrollCardIntoPanel: (element: HTMLElement) => void }, 'scrollCardIntoPanel')
      .mockImplementation(() => {});
    component.setActiveTab('contracts');
    tutorialService.currentStepId.set('buy-first-upgrade');
    fixture.detectChanges();
    vi.advanceTimersByTime(100);

    expect(component.activeTab()).toBe('machine');
    expect(scrollSpy).toHaveBeenCalledWith(tutorialTarget);

    component.setActiveTab('scrap');
    machineSelectionService.selectMachine(MachineType.CRUSHER);
    fixture.detectChanges();
    vi.advanceTimersByTime(100);

    expect(component.activeTab()).toBe('machine');
    expect(scrollSpy).toHaveBeenCalledWith(selectedTarget);
  });
});