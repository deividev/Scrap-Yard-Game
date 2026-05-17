import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ContractService } from './contract.service';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';
import { Machine, MachineType } from '../models/machine.model';
import { ResourceType } from '../models/resource.model';
import { SavedContract } from '../models/save-state.model';
import { CONTRACT_TEMPLATES, CONTRACTS_CONFIG } from '../config/contracts.config';

class MockResourcesService {
  private amounts = signal<Record<string, number>>({
    [ResourceType.MONEY]: 0,
    [ResourceType.METAL]: 0,
    [ResourceType.PLASTIC]: 0,
    [ResourceType.COPPER]: 0,
    [ResourceType.COMPONENTS]: 0,
  });

  hasEnough(resourceId: string, amount: number): boolean {
    return this.getAmount(resourceId) >= amount;
  }

  getAmount(resourceId: string): number {
    return this.amounts()[resourceId] ?? 0;
  }

  add(resourceId: string, amount: number): void {
    this.amounts.update((amounts) => ({
      ...amounts,
      [resourceId]: (amounts[resourceId] ?? 0) + amount,
    }));
  }

  subtract(resourceId: string, amount: number): void {
    if (!this.hasEnough(resourceId, amount)) {
      return;
    }

    this.amounts.update((amounts) => ({
      ...amounts,
      [resourceId]: (amounts[resourceId] ?? 0) - amount,
    }));
  }

  setAmount(resourceId: string, amount: number): void {
    this.amounts.update((amounts) => ({ ...amounts, [resourceId]: amount }));
  }
}

class MockMachinesService {
  private machines = signal<Machine[]>([]);

  getAll(): Machine[] {
    return this.machines();
  }

  getMachine(machineId: string): Machine | undefined {
    return this.machines().find((machine) => machine.id === machineId);
  }

  setMachines(machines: Machine[]): void {
    this.machines.set(machines);
  }

  setLevel(machineId: MachineType, level: number): void {
    this.machines.update((machines) =>
      machines.map((machine) => (machine.id === machineId ? { ...machine, level } : machine)),
    );
  }
}

class MockNotificationService {
  messages: Array<{ message: string; type: string }> = [];

  show(message: string, type: string): void {
    this.messages.push({ message, type });
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

class MockAudioService {
  contractWarnings = 0;
  newContractSounds = 0;

  playContractWarning(): void {
    this.contractWarnings += 1;
  }

  playContractNew(): void {
    this.newContractSounds += 1;
  }
}

const createMachine = (id: MachineType, output: ResourceType, level = 0): Machine => ({
  id,
  name: id,
  level,
  baseSpeed: 1,
  baseConsumption: [],
  baseProduction: { resourceId: output, amount: 1 },
  isActive: false,
  progress: 0,
  icon: '',
});

describe('ContractService', () => {
  let service: ContractService;
  let resourcesService: MockResourcesService;
  let machinesService: MockMachinesService;
  let notificationService: MockNotificationService;
  let audioService: MockAudioService;
  let markDirtyCalls: number;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));

    resourcesService = new MockResourcesService();
    machinesService = new MockMachinesService();
    notificationService = new MockNotificationService();
    audioService = new MockAudioService();
    markDirtyCalls = 0;

    machinesService.setMachines([
      createMachine(MachineType.CRUSHER, ResourceType.METAL, 1),
      createMachine(MachineType.SEPARATOR, ResourceType.PLASTIC, 1),
      createMachine(MachineType.SMELTER, ResourceType.COPPER, 1),
      createMachine(MachineType.ASSEMBLER, ResourceType.COMPONENTS, 0),
      createMachine(MachineType.PACKAGER, ResourceType.MONEY, 0),
    ]);

    TestBed.configureTestingModule({
      providers: [
        ContractService,
        { provide: ResourcesService, useValue: resourcesService },
        { provide: MachinesService, useValue: machinesService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useValue: audioService },
      ],
    });

    service = TestBed.inject(ContractService);
    service.setSaveService({ markDirty: () => { markDirtyCalls += 1; } });
    TestBed.flushEffects();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should force the first contract when assembler unlocks', () => {
    expect(service.available().length).toBe(0);

    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    TestBed.flushEffects();

    expect(service.available().length).toBe(1);
    expect(service.hasSpawnedFirstContract()).toBe(true);
    expect(service.showContractIntro()).toBe(true);
    expect(markDirtyCalls).toBeGreaterThan(0);
  });

  it('should cap visible contracts using active plus available slots', () => {
    service.hydrate([], { hasSeenIntro: true, hasSpawnedFirstContract: true });
    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    TestBed.flushEffects();

    const randomValues = [0.01, 0.6, 0.11, 0.21, 0.6, 0.31, 0.41, 0.6, 0.51, 0.61, 0.6, 0.71];
    let randomIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => randomValues[randomIndex++] ?? 0.81);

    for (let index = 0; index < 90; index++) {
      service.tick();
    }

    expect(service.serialize()).toHaveLength(3);

    const firstAvailable = service.available()[0];
    service.accept(firstAvailable.id);

    for (let index = 0; index < 30; index++) {
      service.tick();
    }

    expect(service.serialize()).toHaveLength(3);
    expect(service.active()).toHaveLength(1);
    expect(service.available()).toHaveLength(2);
  });

  it('should deliver accepted contracts and pay the reward', () => {
    const now = Date.now();
    const contract: SavedContract = {
      id: 'deliver-1',
      type: 'local',
      urgency: 'normal',
      resourceId: ResourceType.METAL,
      amount: 20,
      reward: 35,
      penaltyAmount: 0,
      durationSeconds: 120,
      spawnedAt: now,
      availableUntil: now + 120000,
      acceptedAt: now,
      isAccepted: true,
    };

    resourcesService.setAmount(ResourceType.METAL, 25);
    resourcesService.setAmount(ResourceType.MONEY, 5);

    service.hydrate([contract], { hasSeenIntro: true, hasSpawnedFirstContract: true });
    service.deliver(contract.id);

    expect(resourcesService.getAmount(ResourceType.METAL)).toBe(5);
    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(40);
    expect(service.serialize()).toHaveLength(0);
    expect(notificationService.messages.length).toBe(1);
  });

  it('should apply urgent penalties exactly once on expiry', () => {
    const now = Date.now();
    const contract: SavedContract = {
      id: 'urgent-1',
      type: 'corporate',
      urgency: 'urgent',
      resourceId: ResourceType.COMPONENTS,
      amount: 5,
      reward: 80,
      penaltyAmount: 25,
      durationSeconds: 60,
      spawnedAt: now - 30000,
      availableUntil: now + 30000,
      acceptedAt: now - 59000,
      isAccepted: true,
    };

    resourcesService.setAmount(ResourceType.MONEY, 100);

    service.hydrate([contract], { hasSeenIntro: true, hasSpawnedFirstContract: true });
    vi.advanceTimersByTime(2000);
    service.tick();

    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(75);
    expect(service.serialize()).toHaveLength(0);
    expect(notificationService.messages.length).toBe(1);
  });

  it('should not apply retroactive penalty for overdue contracts loaded from save', () => {
    const now = Date.now();
    const contract: SavedContract = {
      id: 'loaded-overdue-1',
      type: 'corporate',
      urgency: 'urgent',
      resourceId: ResourceType.COMPONENTS,
      amount: 5,
      reward: 80,
      penaltyAmount: 25,
      durationSeconds: 60,
      spawnedAt: now - 60000,
      availableUntil: now - 30000,
      acceptedAt: now - 61000,
      isAccepted: true,
    };

    resourcesService.setAmount(ResourceType.MONEY, 100);

    service.hydrate([contract], { hasSeenIntro: true, hasSpawnedFirstContract: true });
    service.tick();

    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(100);
    expect(service.serialize()).toHaveLength(0);
  });

  it('should dismiss the contract intro and fully reset service state', () => {
    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    TestBed.flushEffects();

    expect(service.showContractIntro()).toBe(true);
    expect(service.hasSpawnedFirstContract()).toBe(true);

    service.dismissContractIntro();

    expect(service.showContractIntro()).toBe(false);
    expect(service.hasSeenContractIntro()).toBe(true);

    service.reset();

    expect(service.serialize()).toEqual([]);
    expect(service.available()).toEqual([]);
    expect(service.active()).toEqual([]);
    expect(service.hasSeenContractIntro()).toBe(false);
    expect(service.hasSpawnedFirstContract()).toBe(false);
    expect(service.showContractIntro()).toBe(false);
  });

  it('should sort active contracts newest first and reject available contracts', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'available-1',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.METAL,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 120,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: 0,
          isAccepted: false,
        },
        {
          id: 'accepted-old',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.PLASTIC,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 120,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: now - 10000,
          isAccepted: true,
        },
        {
          id: 'accepted-new',
          type: 'corporate',
          urgency: 'urgent',
          resourceId: ResourceType.COPPER,
          amount: 10,
          reward: 40,
          penaltyAmount: 5,
          durationSeconds: 120,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: now - 1000,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    expect(service.active().map((contract) => contract.id)).toEqual(['accepted-new', 'accepted-old']);

    service.reject('available-1');

    expect(service.serialize().map((contract) => contract.id)).toEqual(['accepted-old', 'accepted-new']);
  });

  it('should warn once when an accepted contract nears its deadline', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'warning-1',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.METAL,
          amount: 15,
          reward: 25,
          penaltyAmount: 0,
          durationSeconds: 60,
          spawnedAt: now,
          availableUntil: now + 60000,
          acceptedAt: now - 25000,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    vi.advanceTimersByTime(6000);
    service.tick();
    service.tick();

    expect(audioService.contractWarnings).toBe(1);
    expect(
      notificationService.messages.filter((entry) =>
        entry.message.startsWith('contracts.notifications.deadline_warning'),
      ),
    ).toHaveLength(1);
  });

  it('should keep invalid accept or deliver attempts from mutating contracts and format timers safely', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'expired-available',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.METAL,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 60,
          spawnedAt: now - 60000,
          availableUntil: now - 1000,
          acceptedAt: 0,
          isAccepted: false,
        },
        {
          id: 'deliver-no-stock',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.PLASTIC,
          amount: 50,
          reward: 75,
          penaltyAmount: 5,
          durationSeconds: 90,
          spawnedAt: now,
          availableUntil: now + 90000,
          acceptedAt: now,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    const deliverContract = service.active()[0];

    service.accept('expired-available');
    service.deliver('deliver-no-stock');

    expect(service.serialize().map((contract) => contract.id)).toEqual(['deliver-no-stock']);
    expect(service.canDeliver(deliverContract)).toBe(false);
    expect(service.getAvailableSeconds({ ...deliverContract, isAccepted: false, availableUntil: now + 31000 })).toBe(31);
    expect(service.formatTimer(-5)).toBe('0:00');
    expect(service.formatTimer(125)).toBe('2:05');
  });

  it('should refuse accepts at the active cap and skip spawns when slots are full or producible resources are exhausted', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'available-metal',
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
        {
          id: 'active-plastic',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.PLASTIC,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 90,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: now - 1000,
          isAccepted: true,
        },
        {
          id: 'active-components',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.COMPONENTS,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 90,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: now - 1000,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    const dirtyBeforeAccept = markDirtyCalls;

    service.accept('available-metal');

    expect(service.serialize().find((contract) => contract.id === 'available-metal')?.isAccepted).toBe(false);
    expect(markDirtyCalls).toBe(dirtyBeforeAccept);

    for (let index = 0; index < 30; index++) {
      service.tick();
    }

    expect(service.serialize().map((contract) => contract.id)).toEqual([
      'available-metal',
      'active-plastic',
      'active-components',
    ]);

    service.reject('available-metal');
    machinesService.setLevel(MachineType.CRUSHER, 0);

    for (let index = 0; index < 30; index++) {
      service.tick();
    }

    expect(service.serialize().map((contract) => contract.id)).toEqual([
      'active-plastic',
      'active-components',
    ]);
  });

  it('should spawn urgent contracts with scaled duration, reward, and penalty values', () => {
    service.hydrate([], { hasSeenIntro: true, hasSpawnedFirstContract: true });
    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    TestBed.flushEffects();

    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0.01);

    for (let index = 0; index < 30; index++) {
      service.tick();
    }

    const spawned = service.available()[0];
    const template = CONTRACT_TEMPLATES.find((entry) => entry.resourceId === spawned.resourceId);

    expect(spawned.urgency).toBe('urgent');
    expect(spawned.durationSeconds).toBe(
      Math.round(template!.durationSeconds * CONTRACTS_CONFIG.URGENT_DURATION_MULT),
    );
    expect(spawned.reward).toBe(
      Math.round(template!.reward * CONTRACTS_CONFIG.URGENT_REWARD_MULT),
    );
    expect(spawned.penaltyAmount).toBe(
      Math.round(template!.penaltyAmount * CONTRACTS_CONFIG.URGENT_PENALTY_MULT),
    );
    expect(audioService.newContractSounds).toBe(1);

    randomSpy.mockRestore();
  });

  it('should remove overdue zero-penalty contracts without taking money', () => {
    const now = Date.now();
    resourcesService.setAmount(ResourceType.MONEY, 40);
    service.hydrate(
      [
        {
          id: 'zero-penalty-overdue',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.METAL,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 60,
          spawnedAt: now - 20000,
          availableUntil: now + 60000,
          acceptedAt: now - 59000,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    vi.advanceTimersByTime(2000);

    service.tick();

    expect(resourcesService.getAmount(ResourceType.MONEY)).toBe(40);
    expect(service.serialize()).toEqual([]);
    expect(notificationService.messages.at(-1)).toEqual({
      message: 'contracts.notifications.failed:{"penalty":0}',
      type: 'warning',
    });
  });

  it('should leave contracts unchanged for reject and deliver guard-path no-ops', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'available-guard',
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
        {
          id: 'accepted-guard',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.PLASTIC,
          amount: 50,
          reward: 75,
          penaltyAmount: 5,
          durationSeconds: 90,
          spawnedAt: now,
          availableUntil: now + 90000,
          acceptedAt: now,
          isAccepted: true,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    const serializedBefore = service.serialize();
    const dirtyBefore = markDirtyCalls;

    service.reject('missing-contract');
    service.reject('accepted-guard');
    service.deliver('missing-contract');
    service.deliver('available-guard');
    service.deliver('accepted-guard');

    expect(service.serialize()).toEqual(serializedBefore);
    expect(markDirtyCalls).toBe(dirtyBefore);
  });

  it('should hydrate missing contract metadata defaults and skip spawns when no eligible templates remain', () => {
    const now = Date.now();
    service.hydrate(
      [
        {
          id: 'missing-times',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.METAL,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 90,
          isAccepted: false,
          acceptedAt: 0,
        } as SavedContract,
      ],
    );

    const hydrated = service.serialize()[0];

    expect(service.hasSeenContractIntro()).toBe(false);
    expect(service.hasSpawnedFirstContract()).toBe(false);
    expect(service.showContractIntro()).toBe(true);
    expect(hydrated.spawnedAt).toBe(now);
    expect(hydrated.availableUntil).toBe(now + 90000);

    machinesService.setMachines([
      createMachine(MachineType.ASSEMBLER, ResourceType.GPU, 1),
      createMachine(MachineType.GPU_FAB, ResourceType.GPU, 1),
    ]);
    TestBed.flushEffects();

    expect(service.available().map((contract) => contract.id)).toEqual(['missing-times']);
    expect(service.hasSpawnedFirstContract()).toBe(false);

    machinesService.setMachines([
      createMachine(MachineType.ASSEMBLER, ResourceType.COMPONENTS, 1),
      createMachine(MachineType.CRUSHER, ResourceType.METAL, 1),
    ]);
    service.hydrate(
      [
        {
          id: 'existing-metal',
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
        {
          id: 'existing-components',
          type: 'local',
          urgency: 'normal',
          resourceId: ResourceType.COMPONENTS,
          amount: 10,
          reward: 20,
          penaltyAmount: 0,
          durationSeconds: 90,
          spawnedAt: now,
          availableUntil: now + 120000,
          acceptedAt: 0,
          isAccepted: false,
        },
      ],
      { hasSeenIntro: true, hasSpawnedFirstContract: true },
    );

    for (let index = 0; index < 30; index++) {
      service.tick();
    }

    expect(service.serialize().map((contract) => contract.id)).toEqual([
      'existing-metal',
      'existing-components',
    ]);
  });
});