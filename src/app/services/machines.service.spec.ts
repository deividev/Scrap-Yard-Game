import { TestBed } from '@angular/core/testing';
import { MachinesService } from './machines.service';
import { ResourcesService } from './resources.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { MachineType } from '../models/machine.model';

class MockResourcesService {}

class MockFirstRunTutorialService {
  events: string[] = [];

  recordEvent(eventId: string): void {
    this.events.push(eventId);
  }
}

describe('MachinesService', () => {
  let service: MachinesService;
  let tutorialService: MockFirstRunTutorialService;
  let dirtyCalls: number;

  beforeEach(() => {
    tutorialService = new MockFirstRunTutorialService();
    dirtyCalls = 0;

    TestBed.configureTestingModule({
      providers: [
        MachinesService,
        { provide: ResourcesService, useClass: MockResourcesService },
        { provide: FirstRunTutorialService, useValue: tutorialService },
      ],
    });

    service = TestBed.inject(MachinesService);
    service.setSaveService({
      markDirty: () => {
        dirtyCalls += 1;
      },
    });
  });

  it('should activate unlocked crusher and record the tutorial event', () => {
    service.setActive(MachineType.CRUSHER, true);

    expect(service.isActive(MachineType.CRUSHER)).toBe(true);
    expect(tutorialService.events).toEqual(['crusher-activated']);
    expect(dirtyCalls).toBe(1);
  });

  it('should cap and floor machine progress updates', () => {
    service.updateProgress(MachineType.CRUSHER, 0.75);
    service.updateProgress(MachineType.CRUSHER, 0.75);
    service.consumeProgress(MachineType.CRUSHER, 0.25);
    service.consumeProgress(MachineType.CRUSHER, 2);

    expect(service.getMachine(MachineType.CRUSHER)?.progress).toBe(0);
    expect(dirtyCalls).toBe(4);
  });

  it('should upgrade locked machines and expose them as unlocked afterwards', () => {
    expect(service.isUnlocked(MachineType.ASSEMBLER)).toBe(false);

    service.upgradeLevel(MachineType.ASSEMBLER);

    expect(service.getLevel(MachineType.ASSEMBLER)).toBe(1);
    expect(service.isUnlocked(MachineType.ASSEMBLER)).toBe(true);
  });

  it('should merge loaded machine state with configured machine values', () => {
    service.setState([
      {
        id: MachineType.CRUSHER,
        name: 'Nombre viejo',
        icon: 'old-icon.png',
        level: 3,
        baseSpeed: 99,
        baseConsumption: [],
        baseProduction: { resourceId: 'x', amount: 999 },
        isActive: true,
        progress: 0.5,
      },
    ]);

    const crusher = service.getMachine(MachineType.CRUSHER);

    expect(crusher?.name).toBe('Trituradora');
    expect(crusher?.icon).toContain('crusher_card_new_slot.png');
    expect(crusher?.baseSpeed).toBe(0.5);
    expect(crusher?.baseConsumption[0].resourceId).toBe('scrap');
    expect(crusher?.baseProduction.resourceId).toBe('metal');
    expect(crusher?.level).toBe(3);
    expect(crusher?.progress).toBe(0.5);
    expect(crusher?.isActive).toBe(true);
  });

  it('should expose safe defaults for missing machines and clone unknown machine snapshots', () => {
    service.setState([
      {
        id: 'prototype_machine',
        name: 'Prototype Machine',
        icon: 'prototype-icon.png',
        level: 2,
        baseSpeed: 3,
        baseConsumption: [],
        baseProduction: { resourceId: 'money', amount: 1 },
        isActive: false,
        progress: 0.25,
      },
    ] as any);

    const snapshot = service.getState();
    snapshot[0].level = 99;

    expect(service.getAll()).toHaveLength(1);
    expect(service.getMachine('missing_machine')).toBeUndefined();
    expect(service.getLevel('missing_machine')).toBe(0);
    expect(service.getSpeed('missing_machine')).toBe(0);
    expect(service.isActive('missing_machine')).toBe(false);
    expect(service.isUnlocked('missing_machine')).toBe(false);
    expect(service.getMachine('prototype_machine')?.level).toBe(2);
    expect(service.getMachine('prototype_machine')?.name).toBe('Prototype Machine');
    expect(service.getMachine('prototype_machine')?.icon).toBe('prototype-icon.png');
  });
});