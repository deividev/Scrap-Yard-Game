import { signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { MachineCardV2Component } from './machine-card-v2.component';
import { Machine, MachineType } from '../../models/machine.model';
import { MachinesService } from '../../services/machines.service';
import { UpgradesService } from '../../services/upgrades.service';
import { MachineSelectionService } from '../../services/machine-selection.service';
import {
  MachineUnlockService,
  MachineUnlockInfo,
} from '../../services/machine-unlock.service';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { ResourceType } from '../../models/resource.model';
import { DEFAULT_CARD_SLOTS, MachineCardSlots } from '../../config/machine-card-slots.config';

class MockResizeObserver {
  observe(): void {}
  disconnect(): void {}
}

class MockMachinesService {
  private machinesSignal = signal<Machine[]>([]);
  setActiveCalls: Array<{ machineId: string; active: boolean }> = [];

  setMachines(machines: Machine[]): void {
    this.machinesSignal.set(machines);
  }

  getMachine(machineId: string): Machine | undefined {
    return this.machinesSignal().find((machine) => machine.id === machineId);
  }

  setActive(machineId: string, active: boolean): void {
    this.setActiveCalls.push({ machineId, active });
    this.machinesSignal.update((machines) =>
      machines.map((machine) => (machine.id === machineId ? { ...machine, isActive: active } : machine)),
    );
  }
}

class MockUpgradesService {
  level = 3;

  getMachineUpgradeIdByMachineType(machineType: string): string {
    return `${machineType}-upgrade`;
  }

  getLevel(): number {
    return this.level;
  }

  calculateProductionMultiplier(): number {
    return 2;
  }

  calculateConsumptionMultiplier(): number {
    return 1;
  }

  calculateEffectiveSpeed(baseSpeed: number): number {
    return baseSpeed * 1.5;
  }
}

class MockMachineSelectionService {
  private selectedMachineId = signal<string | null>(null);
  selectCalls: string[] = [];

  selectMachine(machineId: string): void {
    this.selectCalls.push(machineId);
    this.selectedMachineId.set(machineId);
  }

  getSelectedMachineId(): string | null {
    return this.selectedMachineId();
  }
}

class MockMachineUnlockService {
  info = new Map<string, MachineUnlockInfo>();

  getUnlockInfo(machineType: MachineType): MachineUnlockInfo {
    return this.info.get(machineType) ?? { isUnlocked: true, requirements: [] };
  }
}

class MockResourcesService {
  enough = new Map<string, boolean>();
  availableSpace = new Map<string, number>();

  hasEnough(resourceId: string): boolean {
    return this.enough.get(resourceId) ?? true;
  }

  getAvailableSpace(resourceId: string): number {
    return this.availableSpace.get(resourceId) ?? Infinity;
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

function makeMachine(overrides: Partial<Machine> = {}): Machine {
  return {
    id: MachineType.CRUSHER,
    name: 'Crusher',
    level: 1,
    baseSpeed: 2,
    baseConsumption: [],
    baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
    isActive: true,
    progress: 0,
    ...overrides,
  };
}

function createMockCanvasContext() {
  const createGradient = () => ({ addColorStop: vi.fn() });

  return {
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fill: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(createGradient),
    createLinearGradient: vi.fn(createGradient),
    rect: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
  };
}

function createMockCanvas(context: ReturnType<typeof createMockCanvasContext>) {
  return {
    width: 200,
    height: 300,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement;
}

describe('MachineCardV2Component', () => {
  let machinesService: MockMachinesService;
  let upgradesService: MockUpgradesService;
  let machineSelectionService: MockMachineSelectionService;
  let machineUnlockService: MockMachineUnlockService;
  let resourcesService: MockResourcesService;

  function render(machine: Machine): ComponentFixture<MachineCardV2Component> {
    machinesService.setMachines([machine]);
    const fixture = TestBed.createComponent(MachineCardV2Component);
    fixture.componentRef.setInput('machine', machine);
    fixture.detectChanges();
    return fixture;
  }

  function renderWithForceState(
    machine: Machine,
    forceState: 'producing' | 'stopped' | 'input' | 'output' | 'locked',
  ): ComponentFixture<MachineCardV2Component> {
    machinesService.setMachines([machine]);
    const fixture = TestBed.createComponent(MachineCardV2Component);
    fixture.componentRef.setInput('machine', machine);
    fixture.componentRef.setInput('forceState', forceState);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    machinesService = new MockMachinesService();
    upgradesService = new MockUpgradesService();
    machineSelectionService = new MockMachineSelectionService();
    machineUnlockService = new MockMachineUnlockService();
    resourcesService = new MockResourcesService();

    TestBed.configureTestingModule({
      providers: [
        { provide: MachinesService, useValue: machinesService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: MachineSelectionService, useValue: machineSelectionService },
        { provide: MachineUnlockService, useValue: machineUnlockService },
        { provide: ResourcesService, useValue: resourcesService },
        { provide: TranslationService, useClass: MockTranslationService },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the locked overlay and requirement lines for locked machines', () => {
    const machine = makeMachine({ id: MachineType.ASSEMBLER, level: 0, isActive: false });
    machineUnlockService.info.set(MachineType.ASSEMBLER, {
      isUnlocked: false,
      requirements: [
        {
          machineType: MachineType.CRUSHER,
          requiredLevel: 4,
          currentLevel: 2,
          isMet: false,
        },
        {
          machineType: MachineType.SEPARATOR,
          requiredLevel: 3,
          currentLevel: 3,
          isMet: true,
        },
      ],
    });

    const fixture = render(machine);
    const root = fixture.nativeElement.querySelector('.mc-v2') as HTMLDivElement;
    root.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cardState()).toBe('locked');
    expect(root.getAttribute('data-state')).toBe('locked');
    expect(fixture.nativeElement.querySelector('.mc-v2__locked')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.mc-v2__led-btn')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('machines.crusher common.level_short 4 (2/4)');
    expect(fixture.nativeElement.textContent).toContain('machines.separator common.level_short 3 (3/3)');
    expect(machineSelectionService.selectCalls).toEqual([]);
  });

  it('should render a producing machine and handle toggle and selection actions', () => {
    const machine = makeMachine({ id: MachineType.CRUSHER, level: 3, isActive: true, progress: 0.4 });
    const fixture = render(machine);
    const component = fixture.componentInstance;
    const root = fixture.nativeElement.querySelector('.mc-v2') as HTMLDivElement;

    expect(component.cardState()).toBe('producing');
    expect(component.effectiveOutput()).toBe(2);
    expect(component.effectiveSpeed()).toBe(3);
    expect(root.classList.contains('mc-v2--producing')).toBe(true);

    component.toggleMachine();
    root.click();
    fixture.detectChanges();

    expect(machinesService.setActiveCalls).toEqual([{ machineId: MachineType.CRUSHER, active: false }]);
    expect(machineSelectionService.selectCalls).toEqual([MachineType.CRUSHER]);
    expect(component.isSelected()).toBe(true);
  });

  it('should drive recipe hover handlers through DOM mouseenter and mouseleave events', () => {
    const machine = makeMachine({
      id: MachineType.SMELTER,
      baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 1 }],
      baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 3 },
      progress: 0.5,
    });
    const fixture = render(machine);
    const component = fixture.componentInstance;
    const card = fixture.nativeElement.querySelector('.mc-v2') as HTMLDivElement;
    const recipeItems = Array.from(fixture.nativeElement.querySelectorAll('.mc-v2__ri')) as HTMLDivElement[];
    const inputItem = recipeItems[0];
    const outputItem = fixture.nativeElement.querySelector('.mc-v2__ri--out') as HTMLDivElement;

    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 50,
      width: 200,
      height: 300,
      bottom: 400,
      right: 250,
      x: 50,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
    vi.spyOn(outputItem, 'getBoundingClientRect').mockReturnValue({
      top: 130,
      left: 170,
      width: 40,
      height: 24,
      bottom: 154,
      right: 210,
      x: 170,
      y: 130,
      toJSON: () => ({}),
    } as DOMRect);

    inputItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(component.hoveredRecipeItem()).toBe('resources.scrap ×1');
    expect(fixture.nativeElement.querySelector('.mc-v2__recipe-tip')?.textContent).toContain(
      'resources.scrap ×1',
    );

    inputItem.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();

    expect(component.hoveredRecipeItem()).toBeNull();

    outputItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(component.hoveredRecipeItem()).toBe('resources.components ×6');
    expect(component.recipeTipPos()).toEqual({ top: 2, left: 70 });

    outputItem.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();

    expect(component.hoveredRecipeItem()).toBeNull();
  });

  it('should render recipe separators for machines with multiple inputs', () => {
    const machine = makeMachine({
      id: MachineType.ASSEMBLER,
      baseConsumption: [
        { resourceId: ResourceType.METAL, amount: 2 },
        { resourceId: ResourceType.PLASTIC, amount: 1 },
      ],
      baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 2 },
      progress: 0.1,
    });

    const fixture = render(machine);
    const separators = Array.from(fixture.nativeElement.querySelectorAll('.mc-v2__rsep')) as HTMLElement[];

    expect(separators).toHaveLength(1);
    expect(separators[0].textContent).toContain('+');
  });

  it('should render input-blocked machines and dim the recipe inputs', () => {
    const machine = makeMachine({
      id: MachineType.PACKAGER,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 2 }],
      progress: 0,
    });
    resourcesService.enough.set(ResourceType.METAL, false);

    const fixture = render(machine);
    const component = fixture.componentInstance;
    const recipeItem = fixture.nativeElement.querySelector('.mc-v2__ri') as HTMLDivElement;

    expect(component.cardState()).toBe('input');
    expect(component.isInputBlocked()).toBe(true);
    expect(component.imgFilter()).toBe('brightness(0.7) sepia(0.2)');
    expect(recipeItem.style.opacity).toBe('0.3');
    expect(fixture.nativeElement.querySelector('.mc-v2__output-full')).toBeNull();
  });

  it('should render output-blocked machines and position the recipe tooltip within the card bounds', () => {
    const machine = makeMachine({
      id: MachineType.SMELTER,
      baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 1 }],
      baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 3 },
      progress: 0,
    });
    resourcesService.enough.set(ResourceType.SCRAP, true);
    resourcesService.availableSpace.set(ResourceType.COMPONENTS, 0);

    const fixture = render(machine);
    const component = fixture.componentInstance;
    const card = fixture.nativeElement.querySelector('.mc-v2') as HTMLDivElement;
    const outputItem = fixture.nativeElement.querySelector('.mc-v2__ri--out') as HTMLDivElement;

    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 50,
      width: 200,
      height: 300,
      bottom: 400,
      right: 250,
      x: 50,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect);
    vi.spyOn(outputItem, 'getBoundingClientRect').mockReturnValue({
      top: 130,
      left: 170,
      width: 40,
      height: 24,
      bottom: 154,
      right: 210,
      x: 170,
      y: 130,
      toJSON: () => ({}),
    } as DOMRect);

    component.showRecipeTip({ currentTarget: outputItem } as unknown as MouseEvent, 'tooltip label');
    fixture.detectChanges();

    expect(component.cardState()).toBe('output');
    expect(component.isOutputBlocked()).toBe(true);
    expect(component.effectiveOutput()).toBe(6);
    expect(component.hoveredRecipeItem()).toBe('tooltip label');
    expect(component.recipeTipPos()).toEqual({ top: 2, left: 70 });
    expect(fixture.nativeElement.textContent).toContain('status.output_lleno');
  });

  it('should update image and calibration helpers across forced states', () => {
    const machine = makeMachine({ id: MachineType.RECYCLER });
    const fixture = render(machine);
    const component = fixture.componentInstance;
    const stoppedFixture = renderWithForceState(machine, 'stopped');
    const outputFixture = renderWithForceState(machine, 'output');
    const lockedFixture = renderWithForceState(machine, 'locked');
    const initialLevelTop = component.cardSlots().overlay.level.top;
    const override: MachineCardSlots = {
      ...DEFAULT_CARD_SLOTS,
      overlay: {
        ...DEFAULT_CARD_SLOTS.overlay,
        level: {
          ...DEFAULT_CARD_SLOTS.overlay.level,
          top: '30%',
        },
      },
    };

    expect(stoppedFixture.componentInstance.imgFilter()).toBe('brightness(0.6) saturate(0.4)');
    expect(outputFixture.componentInstance.imgFilter()).toBe(
      'brightness(0.7) sepia(0.3) hue-rotate(-15deg)',
    );
    expect(lockedFixture.componentInstance.imgFilter()).toBe('brightness(0.3) grayscale(0.9)');

    machineSelectionService.selectMachine(machine.id);
    expect(component.imgFilter()).toBe('brightness(1.12) saturate(1.08)');

    component.onImgError();
    expect(component.imgSrc()).toBe('');

    component.toggleCalibration();
    component.onCalibChange(override);
    expect(component.calibrationMode()).toBe(true);
    expect(component.cardSlots().overlay.level.top).toBe('30%');

    component.toggleCalibration();
    expect(component.calibrationMode()).toBe(false);
    expect(component.cardSlots().overlay.level.top).toBe(initialLevelTop);
  });

  it('should render the dev calibration toggle and attach the live calibrator when enabled', () => {
    const machine = makeMachine({ id: MachineType.CRUSHER, isActive: false });
    machinesService.setMachines([machine]);
    const fixture = TestBed.createComponent(MachineCardV2Component);
    const component = fixture.componentInstance;

    Object.defineProperty(component, 'devCalibEnabled', {
      configurable: true,
      value: true,
    });

    fixture.componentRef.setInput('machine', machine);
    fixture.detectChanges();

    const ledButton = fixture.nativeElement.querySelector('.mc-v2__led-btn') as HTMLButtonElement;
    const toggle = fixture.nativeElement.querySelector('.mc-v2__calib-toggle') as HTMLButtonElement;

    expect(ledButton.getAttribute('title')).toBe('buttons.activa');
    expect(ledButton.getAttribute('aria-label')).toBe('buttons.activa');
    expect(toggle).not.toBeNull();

    toggle.click();
    fixture.detectChanges();

    expect(component.calibrationMode()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-machine-card-calibrator')).not.toBeNull();
    expect(toggle.classList.contains('mc-v2__calib-toggle--on')).toBe(true);
  });

  it('should draw the producing canvas bar and spawn steam particles', () => {
    const machine = makeMachine({ id: MachineType.RECYCLER, progress: 0.5 });
    const fixture = render(machine);
    const component = fixture.componentInstance;
    const context = createMockCanvasContext();
    const canvas = createMockCanvas(context);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    component.onCalibChange({
      ...DEFAULT_CARD_SLOTS,
      effects: {
        ...DEFAULT_CARD_SLOTS.effects,
        particles: {
          ...DEFAULT_CARD_SLOTS.effects.particles,
          type: 'steam',
          spawnRate: 1,
          maxCount: 2,
        },
      },
    });

    (component as any).drawCanvas(canvas);

    expect(context.clearRect).toHaveBeenCalled();
    expect(context.createRadialGradient).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
    expect((component as any).particles.length).toBeGreaterThan(0);

    randomSpy.mockRestore();
  });

  it('should draw electricity, sparks, fire, and plasma particle variants', () => {
    const machine = makeMachine({ id: MachineType.PCB_PRINTER, progress: 0.5 });
    const fixture = render(machine);
    const component = fixture.componentInstance;
    const canvas = createMockCanvas(createMockCanvasContext());
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

    for (const type of ['electricity', 'sparks', 'fire', 'plasma'] as const) {
      const context = createMockCanvasContext();
      (canvas as any).getContext = vi.fn(() => context as unknown as CanvasRenderingContext2D);
      component.onCalibChange({
        ...DEFAULT_CARD_SLOTS,
        effects: {
          ...DEFAULT_CARD_SLOTS.effects,
          particles: {
            ...DEFAULT_CARD_SLOTS.effects.particles,
            type,
            spawnRate: 0,
            maxCount: 3,
          },
        },
      });
      (component as any).particles = [
        { x: 50, y: 60, vx: 1, vy: -1, life: 1, r: 5, op: 0.7 },
      ];

      (component as any).drawCanvas(canvas);

      expect(context.clearRect).toHaveBeenCalled();
      expect(context.arc).toHaveBeenCalled();
      if (type === 'electricity' || type === 'plasma') {
        expect(context.stroke).toHaveBeenCalled();
      }
      if (type === 'fire' || type === 'plasma') {
        expect(context.createRadialGradient).toHaveBeenCalled();
      }
    }

    randomSpy.mockRestore();
  });

  it('should clean up the active animation frame and resize observer on destroy', () => {
    const fixture = render(makeMachine());
    const component = fixture.componentInstance;
    const disconnect = vi.fn();

    (component as any).rafId = 7;
    (component as any).resizeObserver = { disconnect };

    component.ngOnDestroy();

    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(disconnect).toHaveBeenCalled();
  });

  it('should size the canvas and start the draw loop when the image is already cached', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      }),
    );

    const fixture = render(makeMachine({ id: MachineType.ELECTRIC_ASSEMBLER }));
    const component = fixture.componentInstance;
    const img = (component as any).imgRef.nativeElement as HTMLImageElement;
    const canvas = (component as any).canvasRef.nativeElement as HTMLCanvasElement;
    const drawSpy = vi.spyOn(component as any, 'drawCanvas').mockImplementation(() => {});
    const initialCallbackCount = frameCallbacks.length;

    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'offsetWidth', { value: 120, configurable: true });
    Object.defineProperty(img, 'offsetHeight', { value: 180, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 120, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 180, configurable: true });

    component.ngAfterViewInit();
    frameCallbacks[1](1000);

    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(180);
    expect(frameCallbacks.length).toBeGreaterThanOrEqual(initialCallbackCount + 2);
    expect(drawSpy).toHaveBeenCalledWith(canvas);
    expect((component as any).animT).toBe(1);
  });

  it('should use custom particle colors when drawing electricity effects', () => {
    const fixture = render(makeMachine({ id: MachineType.PCB_PRINTER, progress: 0.5 }));
    const component = fixture.componentInstance;
    const context = createMockCanvasContext();
    const canvas = createMockCanvas(context);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.2);

    component.onCalibChange({
      ...DEFAULT_CARD_SLOTS,
      effects: {
        ...DEFAULT_CARD_SLOTS.effects,
        particles: {
          ...DEFAULT_CARD_SLOTS.effects.particles,
          type: 'electricity',
          color: '#112233',
          spawnRate: 0,
        },
      },
    });
    (component as any).particles = [{ x: 40, y: 50, vx: 1, vy: -1, life: 1, r: 4, op: 0.6 }];

    (component as any).drawCanvas(canvas);

    expect(String((context as any).shadowColor)).toContain('17,34,51');
    expect(context.stroke).toHaveBeenCalled();

    randomSpy.mockRestore();
  });

  it('should support keyboard selection and ignore selection or toggles for locked and forced cards', () => {
    const machine = makeMachine({ id: MachineType.CRUSHER, level: 2, isActive: true });
    const fixture = render(machine);
    const root = fixture.nativeElement.querySelector('.mc-v2') as HTMLDivElement;

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    root.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();

    expect(machineSelectionService.selectCalls).toEqual([MachineType.CRUSHER, MachineType.CRUSHER]);

    const lockedFixture = render(makeMachine({ id: MachineType.ASSEMBLER, level: 0, isActive: false }));
    lockedFixture.componentInstance.selectMachine();
    lockedFixture.componentInstance.toggleMachine();

    expect(machineSelectionService.selectCalls).toEqual([MachineType.CRUSHER, MachineType.CRUSHER]);
    expect(machinesService.setActiveCalls).toEqual([]);

    const forcedFixture = renderWithForceState(machine, 'stopped');
    const toggleButton = forcedFixture.nativeElement.querySelector('.mc-v2__led-btn') as HTMLButtonElement;

    expect(toggleButton.disabled).toBe(true);

    forcedFixture.componentInstance.toggleMachine();

    expect(machinesService.setActiveCalls).toEqual([]);
  });

  it('should ignore recipe tips when the card root is missing', () => {
    const fixture = render(makeMachine({ id: MachineType.SMELTER }));
    const component = fixture.componentInstance;

    vi.spyOn((component as any).el.nativeElement, 'querySelector').mockReturnValue(null);

    component.showRecipeTip({ currentTarget: document.createElement('div') } as unknown as MouseEvent, 'ignored');

    expect(component.hoveredRecipeItem()).toBeNull();
    expect(component.recipeTipPos()).toEqual({ top: 50, left: 50 });
  });

  it('should attach load and error listeners when the card image is not cached yet', () => {
    const fixture = render(makeMachine({ id: MachineType.ELECTRIC_ASSEMBLER }));
    const component = fixture.componentInstance;
    const img = (component as any).imgRef.nativeElement as HTMLImageElement;
    const canvas = (component as any).canvasRef.nativeElement as HTMLCanvasElement;
    const addEventListenerSpy = vi.spyOn(img, 'addEventListener');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    Object.defineProperty(img, 'offsetWidth', { value: 0, configurable: true });
    Object.defineProperty(img, 'offsetHeight', { value: 0, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 96, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 144, configurable: true });

    component.ngAfterViewInit();

    const loadHandler = addEventListenerSpy.mock.calls.find(([eventName]) => eventName === 'load')?.[1] as EventListener;
    const errorHandler = addEventListenerSpy.mock.calls.find(([eventName]) => eventName === 'error')?.[1] as EventListener;

    expect(loadHandler).toBeTypeOf('function');
    expect(errorHandler).toBeTypeOf('function');

    loadHandler(new Event('load'));
    expect(canvas.width).toBe(96);
    expect(canvas.height).toBe(144);

    Object.defineProperty(img, 'naturalWidth', { value: 72, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 108, configurable: true });

    errorHandler(new Event('error'));
    expect(canvas.width).toBe(72);
    expect(canvas.height).toBe(108);
  });
});