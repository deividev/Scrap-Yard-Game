import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MarketEventService } from './market-event.service';
import { MarketService } from './market.service';
import { MachinesService } from './machines.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { ResourceType } from '../models/resource.model';
import { MachineType } from '../models/machine.model';
import { INITIAL_MACHINES } from '../config/machines.config';
import { AudioService } from './audio.service';

class MockMarketService {
  readonly setMultipliersCalls: Array<Partial<Record<ResourceType, number>>> = [];

  setActiveEventMultipliers(multipliers: Partial<Record<ResourceType, number>>): void {
    this.setMultipliersCalls.push(multipliers);
  }
}

class MockMachinesService {
  private levels: Partial<Record<string, number>> = {};

  setLevel(machineId: string, level: number): void {
    this.levels[machineId] = level;
  }

  getMachine(machineId: string): { level: number } | undefined {
    const machine = this.getAll().find((entry) => entry.id === machineId);
    return machine ? { level: machine.level } : undefined;
  }

  getAll(): Array<{ id: string; level: number; baseProduction: { resourceId: ResourceType } }> {
    return INITIAL_MACHINES.map((machine) => ({
      id: machine.id,
      level: this.levels[machine.id] ?? machine.level,
      baseProduction: { resourceId: machine.baseProduction.resourceId as ResourceType },
    }));
  }
}

class MockNotificationService {
  readonly shown: Array<{ message: string; type: string }> = [];

  show(message: string, type: string): void {
    this.shown.push({ message, type });
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

class MockAudioService {
  readonly marketEventStartCalls: boolean[] = [];

  playMarketEventStart(isNegative?: boolean): void {
    this.marketEventStartCalls.push(isNegative ?? false);
  }
}

describe('MarketEventService', () => {
  let service: MarketEventService;
  let marketService: MockMarketService;
  let machinesService: MockMachinesService;
  let notificationService: MockNotificationService;
  let audioService: MockAudioService;

  beforeEach(() => {
    marketService = new MockMarketService();
    machinesService = new MockMachinesService();
    notificationService = new MockNotificationService();
    audioService = new MockAudioService();

    TestBed.configureTestingModule({
      providers: [
        MarketEventService,
        { provide: MarketService, useValue: marketService },
        { provide: MachinesService, useValue: machinesService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TranslationService, useValue: new MockTranslationService() },
        { provide: AudioService, useValue: audioService },
      ],
    });

    service = TestBed.inject(MarketEventService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with no active event', () => {
    expect(service.activeEvent()).toBeNull();
  });

  it('should not spawn an event before 60 ticks from initial state', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 59; i++) {
      service.tick();
    }

    expect(service.activeEvent()).toBeNull();
  });

  it('should spawn an event exactly at tick 60 from initial state', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    const event = service.activeEvent();
    expect(event).not.toBeNull();
    expect(event?.type).toBe('market_crash');
  });

  it('should set multipliers on MarketService when an event starts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(marketService.setMultipliersCalls).toHaveLength(1);
    const multipliers = marketService.setMultipliersCalls[0];
    expect(multipliers[ResourceType.METAL]).toBe(0.8);
    expect(multipliers[ResourceType.COMPONENTS]).toBe(0.8);
    expect(multipliers[ResourceType.SERVER_RACK]).toBe(0.8);
  });

  it('should decrement timeRemaining each tick while event is active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()?.timeRemaining).toBe(60);

    service.tick();
    expect(service.activeEvent()?.timeRemaining).toBe(59);

    service.tick();
    expect(service.activeEvent()?.timeRemaining).toBe(58);
  });

  it('should clear the event and reset multipliers when timeRemaining reaches 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()).not.toBeNull();

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()).toBeNull();
    const lastCall = marketService.setMultipliersCalls[marketService.setMultipliersCalls.length - 1];
    expect(lastCall).toEqual({});
  });

  it('should send a notification when an event starts and ends', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(notificationService.shown).toHaveLength(1);
    expect(notificationService.shown[0].message).toBe('events.type.market_crash');

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(notificationService.shown).toHaveLength(2);
    expect(notificationService.shown[1].message).toBe('events.ended.market_crash');
  });

  it('should not spawn boom_pcs before any affected PC resource is unlocked', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()?.type).toBe('market_crash');
  });

  it('should allow boom_components once components are producible', () => {
    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()?.type).toBe('boom_components');
  });

  it('should allow boom_pcs once any affected PC resource is producible', () => {
    machinesService.setLevel(MachineType.SMARTPHONE_FACTORY, 1);
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()?.type).toBe('boom_pcs');
  });

  it('should spawn Corporate Deal when a T7 machine is unlocked', () => {
    machinesService.setLevel(MachineType.DATA_CENTER_ASSEMBLY, 1);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()?.type).toBe('corporate_deal');
  });

  it('should play a crash cue when market_crash starts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(audioService.marketEventStartCalls).toEqual([true]);
  });

  it('should play the negative cue for any price-lowering event', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75);

    const triggered = service.debugForceRandomEvent();

    expect(triggered).toBe(true);
    expect(service.activeEvent()?.type).toBe('materials_shortage');
    expect(audioService.marketEventStartCalls).toEqual([true]);
  });

  it('should play a positive cue when a boost event starts', () => {
    machinesService.setLevel(MachineType.ASSEMBLER, 1);
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(audioService.marketEventStartCalls).toEqual([false]);
  });

  it('should force a random debug event without waiting for cooldown or unlock gating', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    const triggered = service.debugForceRandomEvent();

    expect(triggered).toBe(true);
    expect(service.activeEvent()?.type).toBe('boom_pcs');
    expect(audioService.marketEventStartCalls).toEqual([false]);
  });

  it('should not spawn a new event while one is already active', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);

    // Spawn first event at tick 60
    for (let i = 0; i < 60; i++) {
      service.tick();
    }

    expect(service.activeEvent()).not.toBeNull();

    // Event lasts 60s, then 240 more ticks of cooldown (total 300 from spawn)
    for (let i = 0; i < 300; i++) {
      service.tick();
    }

    // market_crash has 60s duration; after 60 ticks it ends and cooldown starts from 0
    // After 240 more ticks, secondsSinceLastEvent = 240 < 300 → no new event
    expect(service.activeEvent()).toBeNull();
    // Only 2 calls: one to set multipliers (start) + one to clear (end)
    expect(marketService.setMultipliersCalls).toHaveLength(2);
  });
});
