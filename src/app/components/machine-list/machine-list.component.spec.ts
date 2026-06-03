import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MachineListComponent } from './machine-list.component';
import { Machine, MachineType } from '../../models/machine.model';
import { MachinesService } from '../../services/machines.service';
import { ResourcesService } from '../../services/resources.service';
import { UpgradesService } from '../../services/upgrades.service';
import { TranslationService } from '../../services/translation.service';
import { MachineCardV2Component } from '../machine-card-v2/machine-card-v2.component';
import { ResourceType } from '../../models/resource.model';

@Component({
  selector: 'app-machine-card-v2',
  standalone: true,
  template: '<div class="machine-card-stub">{{ machine()?.id }}</div>',
})
class StubMachineCardV2Component {
  machine = input<Machine>();
}

class MockMachinesService {
  private machinesSignal = signal<Machine[]>([]);

  getAll(): Machine[] {
    return this.machinesSignal();
  }

  setMachines(machines: Machine[]): void {
    this.machinesSignal.set(machines);
  }
}

class MockResourcesService {
  enough = new Map<string, boolean>();
  availableSpace = new Map<string, number>();
  hasEnoughCalls: Array<{ resourceId: string; amount?: number }> = [];
  availableSpaceCalls: string[] = [];

  hasEnough(resourceId: string, amount?: number): boolean {
    this.hasEnoughCalls.push({ resourceId, amount });
    return this.enough.get(resourceId) ?? true;
  }

  getAvailableSpace(resourceId: string): number {
    this.availableSpaceCalls.push(resourceId);
    return this.availableSpace.get(resourceId) ?? Infinity;
  }

  resetCalls(): void {
    this.hasEnoughCalls = [];
    this.availableSpaceCalls = [];
  }
}

class MockUpgradesService {
  consumptionMultipliers = new Map<string, number>();
  productionMultipliers = new Map<string, number>();

  calculateConsumptionMultiplier(machineId: string): number {
    return this.consumptionMultipliers.get(machineId) ?? 1;
  }

  calculateProductionMultiplier(machineId: string): number {
    return this.productionMultipliers.get(machineId) ?? 1;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

function makeMachine(
  id: MachineType,
  overrides: Partial<Machine> = {},
): Machine {
  return {
    id,
    name: id,
    level: 1,
    baseSpeed: 1,
    baseConsumption: [],
    baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
    isActive: false,
    progress: 0,
    ...overrides,
  };
}

describe('MachineListComponent', () => {
  let machinesService: MockMachinesService;
  let resourcesService: MockResourcesService;
  let upgradesService: MockUpgradesService;

  beforeEach(() => {
    machinesService = new MockMachinesService();
    resourcesService = new MockResourcesService();
    upgradesService = new MockUpgradesService();

    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { level: 0 }),
      makeMachine(MachineType.SEPARATOR, { isActive: false }),
      makeMachine(MachineType.ASSEMBLER, { isActive: true, progress: 0.25 }),
      makeMachine(MachineType.PACKAGER, {
        isActive: true,
        baseConsumption: [{ resourceId: ResourceType.METAL, amount: 2 }],
      }),
      makeMachine(MachineType.SMELTER, {
        isActive: true,
        baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 1 }],
        baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 3 },
      }),
      makeMachine(MachineType.PCB_PRINTER, { isActive: true }),
      makeMachine(MachineType.SMARTPHONE_FACTORY, { isActive: true }),
    ]);

    resourcesService.enough.set(ResourceType.METAL, false);
    resourcesService.enough.set(ResourceType.SCRAP, true);
    resourcesService.availableSpace.set(ResourceType.COMPONENTS, 0);

    TestBed.configureTestingModule({
      providers: [
        { provide: MachinesService, useValue: machinesService },
        { provide: ResourcesService, useValue: resourcesService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    }).overrideComponent(MachineListComponent, {
      remove: { imports: [MachineCardV2Component] },
      add: { imports: [StubMachineCardV2Component] },
    });
  });

  it('should derive machine states for locked, stopped, producing, input-blocked, and output-blocked cards', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    const component = fixture.componentInstance;
    const machines = machinesService.getAll();

    expect(component.getMachineState(machines[0])).toBe('locked');
    expect(component.getMachineState(machines[1])).toBe('stopped');
    expect(component.getMachineState(machines[2])).toBe('producing');
    expect(component.getMachineState(machines[3])).toBe('input');
    expect(component.getMachineState(machines[4])).toBe('output');
  });

  it('should group machines by tier, show active counts, and render the selected zone cards', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];
    const pips = Array.from(fixture.nativeElement.querySelectorAll('.pip')) as HTMLSpanElement[];

    expect(zoneButtons).toHaveLength(3);
    expect(zoneButtons[0].textContent).toContain('3/5');
    expect(zoneButtons[1].textContent).toContain('1/1');
    expect(zoneButtons[2].textContent).toContain('1/1');
    expect(zoneButtons[0].classList.contains('zone-btn--active')).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('.machine-card-stub')).toHaveLength(5);
    expect(pips.map((pip) => pip.getAttribute('data-pip'))).toEqual([
      'locked',
      'stopped',
      'producing',
      'input',
      'output',
      'producing',
      'producing',
    ]);
  });

  it('should switch zones and mark tall machine cards in the digital manufacturing tier', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];
    zoneButtons[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedZone()).toBe(2);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="2"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.machine-card-stub')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.card-clip--tall')).not.toBeNull();
    expect(fixture.componentInstance.isTallMachine(MachineType.SMARTPHONE_FACTORY)).toBe(true);
    expect(fixture.componentInstance.isTallMachine(MachineType.CRUSHER)).toBe(false);
  });

  it('should switch to the electronics tier and render the PCB printer card', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];
    zoneButtons[1].click();
    fixture.detectChanges();

    const zoneOneButton = zoneButtons[1];
    const renderedCards = Array.from(fixture.nativeElement.querySelectorAll('.machine-card-stub')) as HTMLElement[];

    expect(fixture.componentInstance.selectedZone()).toBe(1);
    expect(zoneOneButton.classList.contains('zone-btn--active')).toBe(true);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="1"]')).not.toBeNull();
    expect(renderedCards).toHaveLength(1);
    expect(renderedCards[0].textContent).toContain(MachineType.PCB_PRINTER);
    expect(fixture.nativeElement.querySelector('.card-clip--tall')).toBeNull();
  });

  it('should keep empty tiers selectable and render no cards when a zone has no machines', () => {
    machinesService.setMachines([
      makeMachine(MachineType.CRUSHER, { isActive: true, progress: 0.1 }),
      makeMachine(MachineType.PACKAGER, { isActive: false }),
    ]);

    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];
    expect(zoneButtons[0].textContent).toContain('1/2');
    expect(zoneButtons[1].textContent).toContain('0/0');
    expect(zoneButtons[2].textContent).toContain('0/0');
    expect(zoneButtons[1].querySelector('.zone-led--on')).toBeNull();

    zoneButtons[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedZone()).toBe(1);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="1"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.machine-card-stub')).toHaveLength(0);
  });

  it('should apply upgrade multipliers to idle state checks and allow infinite output space', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    const component = fixture.componentInstance;

    upgradesService.consumptionMultipliers.set(MachineType.CRUSHER, 2);
    upgradesService.productionMultipliers.set(MachineType.CRUSHER, 3);

    const upgradedMachine = makeMachine(MachineType.CRUSHER, {
      level: 1,
      isActive: true,
      progress: 0,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 2 }],
      baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 4 },
    });

    resourcesService.enough.set(ResourceType.METAL, true);
    resourcesService.availableSpace.set(ResourceType.COMPONENTS, 12);
    resourcesService.resetCalls();

    expect(component.getMachineState(upgradedMachine)).toBe('producing');
    expect(resourcesService.hasEnoughCalls).toContainEqual({
      resourceId: ResourceType.METAL,
      amount: 4,
    });
    expect(resourcesService.availableSpaceCalls).toContain(ResourceType.COMPONENTS);

    resourcesService.availableSpace.set(ResourceType.COMPONENTS, Infinity);
    resourcesService.resetCalls();

    expect(component.getMachineState(upgradedMachine)).toBe('producing');
    expect(resourcesService.availableSpaceCalls).toContain(ResourceType.COMPONENTS);
  });

  it('should recompute tier counts and active leds when the machine roster changes after render', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    machinesService.setMachines([
      makeMachine(MachineType.HDD_ASSEMBLER, { isActive: false }),
      makeMachine(MachineType.DATA_CENTER_ASSEMBLY, { isActive: true }),
    ]);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];

    expect(zoneButtons[0].textContent).toContain('0/0');
    expect(zoneButtons[0].querySelector('.zone-led--on')).toBeNull();
    expect(zoneButtons[1].textContent).toContain('0/1');
    expect(zoneButtons[1].querySelector('.zone-led--on')).toBeNull();
    expect(zoneButtons[2].textContent).toContain('1/1');
    expect(zoneButtons[2].querySelector('.zone-led--on')).not.toBeNull();

    zoneButtons[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedZone()).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.machine-card-stub')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.card-clip--tall')).not.toBeNull();
  });

  it('should move the active zone class as the user clicks across every tier', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const zoneButtons = Array.from(fixture.nativeElement.querySelectorAll('.zone-btn')) as HTMLButtonElement[];

    expect(zoneButtons[0].classList.contains('zone-btn--active')).toBe(true);

    zoneButtons[1].click();
    fixture.detectChanges();
    expect(zoneButtons[0].classList.contains('zone-btn--active')).toBe(false);
    expect(zoneButtons[1].classList.contains('zone-btn--active')).toBe(true);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="1"]')).not.toBeNull();

    zoneButtons[2].click();
    fixture.detectChanges();
    expect(zoneButtons[1].classList.contains('zone-btn--active')).toBe(false);
    expect(zoneButtons[2].classList.contains('zone-btn--active')).toBe(true);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="2"]')).not.toBeNull();

    zoneButtons[0].click();
    fixture.detectChanges();
    expect(zoneButtons[0].classList.contains('zone-btn--active')).toBe(true);
    expect(zoneButtons[2].classList.contains('zone-btn--active')).toBe(false);
    expect(fixture.nativeElement.querySelector('.zone-panel[data-zone="0"]')).not.toBeNull();
  });

  it('should short-circuit locked, stopped, and already-progressing machines before consulting resource guards', () => {
    const fixture = TestBed.createComponent(MachineListComponent);
    const component = fixture.componentInstance;

    const lockedMachine = makeMachine(MachineType.CRUSHER, {
      level: 0,
      isActive: true,
      progress: 0,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 2 }],
    });
    const stoppedMachine = makeMachine(MachineType.SEPARATOR, {
      level: 1,
      isActive: false,
      progress: 0,
      baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 1 }],
    });
    const progressingMachine = makeMachine(MachineType.ASSEMBLER, {
      level: 1,
      isActive: true,
      progress: 0.4,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 3 }],
    });

    resourcesService.resetCalls();
    expect(component.getMachineState(lockedMachine)).toBe('locked');
    expect(resourcesService.hasEnoughCalls).toHaveLength(0);
    expect(resourcesService.availableSpaceCalls).toHaveLength(0);

    resourcesService.resetCalls();
    expect(component.getMachineState(stoppedMachine)).toBe('stopped');
    expect(resourcesService.hasEnoughCalls).toHaveLength(0);
    expect(resourcesService.availableSpaceCalls).toHaveLength(0);

    resourcesService.resetCalls();
    expect(component.getMachineState(progressingMachine)).toBe('producing');
    expect(resourcesService.hasEnoughCalls).toHaveLength(0);
    expect(resourcesService.availableSpaceCalls).toHaveLength(0);
  });

  it('should expose tiered machine groups without undefined gaps and mark every tall machine variant', () => {
    machinesService.setMachines([
      makeMachine(MachineType.SEPARATOR, { isActive: true }),
      makeMachine(MachineType.ELECTRIC_PACKAGER, { isActive: true }),
      makeMachine(MachineType.GPU_FAB, { isActive: false }),
      makeMachine(MachineType.LAPTOP_WORKSHOP, { isActive: true }),
      makeMachine(MachineType.DATA_CENTER_ASSEMBLY, { isActive: false }),
    ]);

    const fixture = TestBed.createComponent(MachineListComponent);
    fixture.detectChanges();

    const tiers = fixture.componentInstance.tieredMachines();

    expect(tiers.map((tier) => tier.machines.map((machine) => machine.id))).toEqual([
      [MachineType.SEPARATOR, MachineType.ELECTRIC_PACKAGER],
      [MachineType.GPU_FAB],
      [MachineType.LAPTOP_WORKSHOP, MachineType.DATA_CENTER_ASSEMBLY],
    ]);
    expect(tiers.map((tier) => tier.activeCount)).toEqual([2, 0, 1]);
    expect(fixture.componentInstance.isTallMachine(MachineType.ELECTRIC_PACKAGER)).toBe(true);
    expect(fixture.componentInstance.isTallMachine(MachineType.DATA_CENTER_ASSEMBLY)).toBe(true);
    expect(fixture.componentInstance.isTallMachine(MachineType.LAPTOP_WORKSHOP)).toBe(false);
  });
});