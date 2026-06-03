import { Component, Pipe, PipeTransform, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ResourcesHeaderComponent } from './resources-header.component';
import { Resource, ResourceType } from '../../models/resource.model';
import { ScrapButtonComponent } from '../scrap-button/scrap-button.component';
import { SellResourceButtonComponent } from '../sell-resource-button/sell-resource-button.component';
import { ProgressionHintComponent } from '../progression-hint/progression-hint.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { GameStateService } from '../../services/game-state.service';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { SaveService } from '../../services/save.service';
import { AudioService } from '../../services/audio.service';
import { MachinesService } from '../../services/machines.service';
import { MachineType } from '../../models/machine.model';
import { INITIAL_RESOURCES } from '../../config/resources.config';

@Component({
  selector: 'app-scrap-button',
  template: '<button type="button">Scrap</button>',
})
class StubScrapButtonComponent {}

@Component({
  selector: 'app-sell-resource-button',
  template:
    '<button type="button" class="sell-stub" [attr.data-resource-id]="resourceId()" [attr.data-tutorial-id]="tutorialId()">Sell</button>',
})
class StubSellResourceButtonComponent {
  resourceId = input<ResourceType>();
  tutorialId = input<string | null>(null);
}

@Component({
  selector: 'app-progression-hint',
  template: '<div>hint</div>',
})
class StubProgressionHintComponent {}

@Component({
  selector: 'app-button',
  template: '<button class="app-button-stub" type="button" (click)="clicked.emit()">{{ label() }}</button>',
})
class StubAppButtonComponent {
  label = input<string>('');
  clicked = output<void>();
}

@Pipe({
  name: 'formatNumber',
})
class StubFormatNumberPipe implements PipeTransform {
  transform(value: unknown): string {
    return String(value);
  }
}

class MockResourcesService {
  private resourcesSignal = signal<Resource[]>([
    { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
    { id: ResourceType.SCRAP, name: 'Scrap', amount: 8, capacity: 10, icon: 'scrap.png' },
    { id: ResourceType.METAL, name: 'Metal', amount: 1, capacity: 10, icon: 'metal.png' },
  ]);

  getAll(): Resource[] {
    return this.resourcesSignal();
  }

  setResources(resources: Resource[]): void {
    this.resourcesSignal.set(resources);
  }
}

class MockTranslationService {
  current: 'es' | 'en' = 'es';
  setCalls: Array<'es' | 'en'> = [];

  t(key: string): string {
    return key;
  }

  getLanguage(): 'es' | 'en' {
    return this.current;
  }

  setLanguage(language: 'es' | 'en'): void {
    this.current = language;
    this.setCalls.push(language);
  }
}

class MockGameStateService {
  returnToMenuCalls = 0;

  returnToMenu(): void {
    this.returnToMenuCalls += 1;
  }
}

class MockSaveService {
  saveCalls = 0;

  save(): void {
    this.saveCalls += 1;
  }
}

class MockAudioService {
  storageFullCalls = 0;

  playStorageFull(): void {
    this.storageFullCalls += 1;
  }
}

class MockMachinesService {
  unlocked = new Set<MachineType>([MachineType.CRUSHER]);

  isUnlocked(machineType: MachineType): boolean {
    return this.unlocked.has(machineType);
  }

  unlockAll(): void {
    this.unlocked = new Set(Object.values(MachineType));
  }
}

class MockScrapGenerationService {
  private eventSignal = signal({ id: -1, amount: 0 });

  autoGenEvent(): { id: number; amount: number } {
    return this.eventSignal();
  }

  setAutoEvent(id: number, amount: number): void {
    this.eventSignal.set({ id, amount });
  }
}

function getRowByAlt(fixture: { nativeElement: HTMLElement }, alt: string): HTMLDivElement | null {
  return fixture.nativeElement.querySelector(`img[alt="${alt}"]`)?.closest('.resource-row') as HTMLDivElement | null;
}

function buildUnlockedResources(stateById: Partial<Record<ResourceType, 'normal' | 'near' | 'full'>> = {}): Resource[] {
  return INITIAL_RESOURCES.map((resource, index) => {
    if (!Number.isFinite(resource.capacity) || resource.capacity <= 0) {
      return { ...resource, amount: index + 50 };
    }

    const state = stateById[resource.id as ResourceType] ?? 'normal';
    const capacity = resource.capacity;
    const normalAmount = Math.max(1, Math.min(capacity - 2, Math.floor(capacity * 0.45)));
    const nearAmount = Math.max(1, Math.min(capacity - 1, Math.ceil(capacity * 0.85)));

    return {
      ...resource,
      amount: state === 'full' ? capacity : state === 'near' ? nearAmount : normalAmount,
    };
  });
}

describe('ResourcesHeaderComponent', () => {
  let resourcesService: MockResourcesService;
  let translationService: MockTranslationService;
  let gameStateService: MockGameStateService;
  let saveService: MockSaveService;
  let audioService: MockAudioService;
  let scrapGenerationService: MockScrapGenerationService;
  let machinesService: MockMachinesService;

  beforeEach(() => {
    vi.useFakeTimers();
    resourcesService = new MockResourcesService();
    translationService = new MockTranslationService();
    gameStateService = new MockGameStateService();
    saveService = new MockSaveService();
    audioService = new MockAudioService();
    scrapGenerationService = new MockScrapGenerationService();
    machinesService = new MockMachinesService();

    TestBed.configureTestingModule({
      providers: [
        { provide: ResourcesService, useValue: resourcesService },
        { provide: TranslationService, useValue: translationService },
        { provide: GameStateService, useValue: gameStateService },
        { provide: ScrapGenerationService, useValue: scrapGenerationService },
        { provide: SaveService, useValue: saveService },
        { provide: AudioService, useValue: audioService },
        { provide: MachinesService, useValue: machinesService },
      ],
    })
      .overrideComponent(ResourcesHeaderComponent, {
        remove: {
          imports: [
            ScrapButtonComponent,
            SellResourceButtonComponent,
            ProgressionHintComponent,
            FormatNumberPipe,
            AppButtonComponent,
          ],
        },
        add: {
          imports: [
            StubScrapButtonComponent,
            StubSellResourceButtonComponent,
            StubProgressionHintComponent,
            StubFormatNumberPipe,
            StubAppButtonComponent,
          ],
        },
      });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render unlocked rows and route the header buttons to language and menu actions', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const scrapRow = fixture.nativeElement.querySelector('.resource-row--scrap') as HTMLDivElement;
    const headerButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.app-button-stub'),
    ) as HTMLButtonElement[];

    expect(fixture.nativeElement.querySelector('[data-tutorial-id="resource-metal"]')).not.toBeNull();
    expect(scrapRow.classList.contains('near-capacity')).toBe(true);

    headerButtons[0].click();
    headerButtons[1].click();

    expect(translationService.setCalls).toEqual(['en']);
    expect(saveService.saveCalls).toBe(1);
    expect(gameStateService.returnToMenuCalls).toBe(1);
  });

  it('should show feedback and storage-full transitions when resources change', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 140, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 1, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();
    fixture.detectChanges();

    const moneyDisplay = fixture.nativeElement.querySelector('.money-display') as HTMLDivElement;
    const scrapRow = fixture.nativeElement.querySelector('.resource-row--scrap') as HTMLDivElement;

    expect(moneyDisplay.classList.contains('feedback-up')).toBe(true);
    expect(scrapRow.classList.contains('feedback-up')).toBe(true);
    expect(scrapRow.classList.contains('capacity-pop')).toBe(true);
    expect(scrapRow.classList.contains('storage-full')).toBe(true);
    expect(audioService.storageFullCalls).toBe(1);

    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(moneyDisplay.classList.contains('feedback-up')).toBe(false);
    expect(scrapRow.classList.contains('feedback-up')).toBe(false);

    vi.advanceTimersByTime(250);
    fixture.detectChanges();
    expect(scrapRow.classList.contains('capacity-pop')).toBe(false);
    expect(scrapRow.classList.contains('storage-full')).toBe(true);
  });

  it('should render and clear auto-scrap floating feedback from auto generation events', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    scrapGenerationService.setAutoEvent(1, 2.5);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('+2.5');
    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(1);

    vi.advanceTimersByTime(701);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(0);
  });

  it('should keep stacked auto-scrap floating feedback timers independent', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    scrapGenerationService.setAutoEvent(1, 2.5);
    TestBed.flushEffects();
    fixture.detectChanges();

    vi.advanceTimersByTime(300);

    scrapGenerationService.setAutoEvent(2, 1);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('+2.5');
    expect(fixture.nativeElement.textContent).toContain('+1');
    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(2);

    vi.advanceTimersByTime(401);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('+2.5');
    expect(fixture.nativeElement.textContent).toContain('+1');
    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(1);

    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(0);
  });

  it('should render all basic and advanced resource sections when machines are unlocked', () => {
    machinesService.unlockAll();
    resourcesService.setResources(
      INITIAL_RESOURCES.map((resource, index) => ({
        ...resource,
        amount: Number.isFinite(resource.capacity)
          ? Math.min(Math.max(1, resource.capacity - 1), index + 2)
          : index + 2,
      })),
    );

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('resources.section_advanced');
    expect(fixture.nativeElement.querySelector('.sidebar-divider--advanced')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-sell-resource-button').length).toBeGreaterThan(10);
  });

  it('should expose fallback resource models and current language when entries are missing', () => {
    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 10, capacity: Infinity, icon: 'money.png' },
    ]);

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const metalIcon = INITIAL_RESOURCES.find((resource) => resource.id === ResourceType.METAL)?.icon;
    const serverRackIcon = INITIAL_RESOURCES.find(
      (resource) => resource.id === ResourceType.SERVER_RACK,
    )?.icon;

    expect(fixture.componentInstance.currentLang()).toBe('ES');
    expect(fixture.componentInstance.metalResource().amount).toBe(0);
    expect(fixture.componentInstance.metalResource().icon).toBe(metalIcon);
    expect(fixture.componentInstance.serverRackResource().icon).toBe(serverRackIcon);

  });

  it('should expose fallback models for every missing resource and format helper values consistently', () => {
    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 25, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 4, capacity: 10, icon: 'scrap.png' },
    ]);
    translationService.current = 'en';

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(component.currentLang()).toBe('EN');
    expect(component.moneyResource().amount).toBe(25);
    expect(component.scrapResource().amount).toBe(4);
    expect(component.metalResource().amount).toBe(0);
    expect(component.componentsResource().amount).toBe(0);
    expect(component.plasticResource().amount).toBe(0);
    expect(component.copperResource().amount).toBe(0);
    expect(component.recycledPlasticResource().amount).toBe(0);
    expect(component.electricComponentsResource().amount).toBe(0);
    expect(component.circuitBoardResource().amount).toBe(0);
    expect(component.hddResource().amount).toBe(0);
    expect(component.screenResource().amount).toBe(0);
    expect(component.gpuResource().amount).toBe(0);
    expect(component.smartphoneResource().amount).toBe(0);
    expect(component.laptopResource().amount).toBe(0);
    expect(component.desktopPcResource().amount).toBe(0);
    expect(component.miningRigResource().amount).toBe(0);
    expect(component.serverRackResource().amount).toBe(0);

    expect(component.getResourceIcon(ResourceType.GPU)).toBe(
      INITIAL_RESOURCES.find((resource) => resource.id === ResourceType.GPU)?.icon,
    );
    expect(component.getResourceIcon('missing-resource')).toBe('?');
    expect(component.formatAutoAmount(3)).toBe('3');
    expect(component.formatAutoAmount(2.5)).toBe('2.5');
    expect(component.formatAutoAmount(2.25)).toBe('2.25');

    component.toggleLanguage();
    component.toggleLanguage();

    expect(translationService.setCalls).toEqual(['es', 'en']);
  });

  it('should show downward feedback, keep near-capacity without full storage, and clear timers on destroy', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 90, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 8, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 9, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();
    fixture.detectChanges();

    const moneyDisplay = fixture.nativeElement.querySelector('.money-display') as HTMLDivElement;
    const metalRow = fixture.nativeElement.querySelector('[data-tutorial-id="resource-metal"]') as HTMLDivElement;

    expect(moneyDisplay.classList.contains('feedback-down')).toBe(true);
    expect(metalRow.classList.contains('near-capacity')).toBe(true);
    expect(metalRow.classList.contains('storage-full')).toBe(false);
    expect(fixture.componentInstance.isFeedback(ResourceType.MONEY, 'down')).toBe(true);
    expect(fixture.componentInstance.isNearCapacity(ResourceType.METAL)).toBe(true);
    expect(fixture.componentInstance.isStorageFull(ResourceType.METAL)).toBe(false);
    expect(audioService.storageFullCalls).toBe(0);

    fixture.destroy();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should keep locked resource rows hidden until their machine gates are unlocked', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('resources.section_basic');
    expect(fixture.nativeElement.querySelector('[data-tutorial-id="resource-metal"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="plastic"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="components"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="circuit_board"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.sidebar-divider--advanced')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('resources.section_advanced');
  });

  it('should render unlocked advanced rows with full and near-capacity states across many resources', () => {
    machinesService.unlockAll();
    resourcesService.setResources(
      buildUnlockedResources({
        [ResourceType.SCRAP]: 'full',
        [ResourceType.METAL]: 'full',
        [ResourceType.PLASTIC]: 'near',
        [ResourceType.COPPER]: 'near',
        [ResourceType.RECYCLED_PLASTIC]: 'full',
        [ResourceType.ELECTRIC_COMPONENTS]: 'full',
        [ResourceType.CIRCUIT_BOARD]: 'full',
        [ResourceType.HDD]: 'near',
        [ResourceType.SCREEN]: 'near',
        [ResourceType.GPU]: 'full',
        [ResourceType.SMARTPHONE]: 'near',
        [ResourceType.LAPTOP]: 'near',
        [ResourceType.DESKTOP_PC]: 'full',
        [ResourceType.MINING_RIG]: 'near',
        [ResourceType.SERVER_RACK]: 'full',
      }),
    );

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const plasticRow = getRowByAlt(fixture, 'resources.plastic');
    const electricComponentsRow = getRowByAlt(fixture, 'resources.electric_components');
    const circuitBoardRow = getRowByAlt(fixture, 'resources.circuit_board');
    const screenRow = getRowByAlt(fixture, 'resources.screen');
    const laptopRow = getRowByAlt(fixture, 'resources.laptop');
    const serverRackRow = getRowByAlt(fixture, 'resources.server_rack');
    const miningRigRow = getRowByAlt(fixture, 'resources.mining_rig');

    expect(fixture.nativeElement.querySelector('.sidebar-divider--advanced')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('resources.section_advanced');
    expect(fixture.nativeElement.querySelector('[data-resource-id="plastic"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="electric_components"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="circuit_board"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="screen"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="laptop"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="server_rack"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.sell-stub')).toHaveLength(15);
    expect(fixture.nativeElement.querySelectorAll('.res-amount.full').length).toBeGreaterThanOrEqual(6);
    expect(plasticRow?.classList.contains('near-capacity')).toBe(true);
    expect(plasticRow?.classList.contains('storage-full')).toBe(false);
    expect(electricComponentsRow?.classList.contains('storage-full')).toBe(true);
    expect(circuitBoardRow?.classList.contains('storage-full')).toBe(true);
    expect(screenRow?.classList.contains('near-capacity')).toBe(true);
    expect(laptopRow).not.toBeNull();
    expect(serverRackRow?.classList.contains('storage-full')).toBe(true);
    expect(miningRigRow).not.toBeNull();
  });

  it('should render only selectively unlocked advanced rows and keep later rows hidden', () => {
    machinesService.unlocked = new Set([
      MachineType.CRUSHER,
      MachineType.PCB_PRINTER,
      MachineType.HDD_ASSEMBLER,
      MachineType.GPU_FAB,
      MachineType.DATA_CENTER_ASSEMBLY,
    ]);
    resourcesService.setResources(
      buildUnlockedResources({
        [ResourceType.CIRCUIT_BOARD]: 'normal',
        [ResourceType.HDD]: 'near',
        [ResourceType.GPU]: 'full',
        [ResourceType.SERVER_RACK]: 'full',
      }),
    );

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const hddRow = getRowByAlt(fixture, 'resources.hdd');
    const gpuRow = getRowByAlt(fixture, 'resources.gpu');
    const serverRackRow = getRowByAlt(fixture, 'resources.server_rack');

    expect(fixture.nativeElement.querySelector('.sidebar-divider--advanced')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="circuit_board"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="hdd"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="gpu"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="server_rack"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="screen"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="smartphone"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="laptop"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="desktop_pc"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="mining_rig"]')).toBeNull();
    expect(hddRow?.classList.contains('near-capacity')).toBe(true);
    expect(gpuRow?.querySelector('.res-amount')?.classList.contains('full')).toBe(true);
    expect(serverRackRow?.querySelector('.res-amount')?.classList.contains('full')).toBe(true);
  });

  it('should keep late-game feedback and capacity timers independent across different resources', () => {
    machinesService.unlockAll();
    resourcesService.setResources(buildUnlockedResources());

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    resourcesService.setResources(
      buildUnlockedResources({
        [ResourceType.HDD]: 'full',
        [ResourceType.SCREEN]: 'near',
        [ResourceType.SERVER_RACK]: 'full',
      }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();

    const hddRow = getRowByAlt(fixture, 'resources.hdd');
    const screenRow = getRowByAlt(fixture, 'resources.screen');
    const serverRackRow = getRowByAlt(fixture, 'resources.server_rack');

    expect(hddRow?.classList.contains('feedback-up')).toBe(true);
    expect(hddRow?.classList.contains('capacity-pop')).toBe(true);
    expect(hddRow?.classList.contains('storage-full')).toBe(true);
    expect(screenRow?.classList.contains('feedback-up')).toBe(true);
    expect(screenRow?.classList.contains('near-capacity')).toBe(true);
    expect(screenRow?.classList.contains('storage-full')).toBe(false);
    expect(serverRackRow?.classList.contains('feedback-up')).toBe(true);
    expect(serverRackRow?.classList.contains('capacity-pop')).toBe(true);
    expect(serverRackRow?.classList.contains('storage-full')).toBe(true);
    expect(audioService.storageFullCalls).toBe(2);

    vi.advanceTimersByTime(500);
    fixture.detectChanges();

    expect(hddRow?.classList.contains('feedback-up')).toBe(false);
  expect(screenRow?.classList.contains('feedback-up')).toBe(false);
    expect(serverRackRow?.classList.contains('feedback-up')).toBe(false);
    expect(hddRow?.classList.contains('capacity-pop')).toBe(true);
    expect(serverRackRow?.classList.contains('capacity-pop')).toBe(true);

    vi.advanceTimersByTime(220);
    fixture.detectChanges();

    expect(hddRow?.classList.contains('capacity-pop')).toBe(false);
    expect(serverRackRow?.classList.contains('capacity-pop')).toBe(false);
  });

  it('should not trigger feedback or audio on the initial render when resources start full', () => {
    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 500, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 10, capacity: 10, icon: 'metal.png' },
    ]);

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const moneyDisplay = fixture.nativeElement.querySelector('.money-display') as HTMLDivElement;
    const scrapRow = fixture.nativeElement.querySelector('.resource-row--scrap') as HTMLDivElement;
    const metalRow = fixture.nativeElement.querySelector('[data-tutorial-id="resource-metal"]') as HTMLDivElement;

    expect(moneyDisplay.classList.contains('feedback-up')).toBe(false);
    expect(moneyDisplay.classList.contains('feedback-down')).toBe(false);
    expect(scrapRow.classList.contains('capacity-pop')).toBe(false);
    expect(scrapRow.classList.contains('storage-full')).toBe(true);
    expect(metalRow.classList.contains('capacity-pop')).toBe(false);
    expect(metalRow.classList.contains('storage-full')).toBe(true);
    expect(audioService.storageFullCalls).toBe(0);
  });

  it('should not retrigger capacity feedback for infinite-capacity money or resources that were already full', () => {
    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 5, capacity: 10, icon: 'metal.png' },
    ]);

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 160, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 6, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();
    fixture.detectChanges();

    const moneyDisplay = fixture.nativeElement.querySelector('.money-display') as HTMLDivElement;
    const scrapRow = fixture.nativeElement.querySelector('.resource-row--scrap') as HTMLDivElement;

    expect(moneyDisplay.classList.contains('feedback-up')).toBe(true);
    expect(scrapRow.classList.contains('capacity-pop')).toBe(false);
    expect(scrapRow.classList.contains('storage-full')).toBe(true);
    expect(audioService.storageFullCalls).toBe(0);
  });

  it('should replace existing feedback and capacity timers when the same resource retriggers them', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 1, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 9, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 1, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();

    resourcesService.setResources([
      { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
      { id: ResourceType.SCRAP, name: 'Scrap', amount: 10, capacity: 10, icon: 'scrap.png' },
      { id: ResourceType.METAL, name: 'Metal', amount: 1, capacity: 10, icon: 'metal.png' },
    ]);
    TestBed.flushEffects();
    fixture.detectChanges();

    const scrapRow = fixture.nativeElement.querySelector('.resource-row--scrap') as HTMLDivElement;

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(scrapRow.classList.contains('feedback-up')).toBe(true);
    expect(scrapRow.classList.contains('capacity-pop')).toBe(true);
    expect(audioService.storageFullCalls).toBe(2);

    vi.advanceTimersByTime(721);
    fixture.detectChanges();

    expect(scrapRow.classList.contains('capacity-pop')).toBe(false);
    clearTimeoutSpy.mockRestore();
  });

  it('should light feedback-up states across multiple unlocked mid-tier resources at once', () => {
    machinesService.unlockAll();
    const baseline = buildUnlockedResources();
    resourcesService.setResources(baseline);

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const boostedResourceIds = new Set<ResourceType>([
      ResourceType.PLASTIC,
      ResourceType.COMPONENTS,
      ResourceType.COPPER,
      ResourceType.RECYCLED_PLASTIC,
      ResourceType.ELECTRIC_COMPONENTS,
    ]);

    resourcesService.setResources(
      baseline.map((resource) =>
        boostedResourceIds.has(resource.id as ResourceType) && Number.isFinite(resource.capacity)
          ? { ...resource, amount: Math.min(resource.capacity - 1, resource.amount + 2) }
          : resource,
      ),
    );
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(getRowByAlt(fixture, 'resources.plastic')?.classList.contains('feedback-up')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.components')?.classList.contains('feedback-up')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.copper')?.classList.contains('feedback-up')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.recycled_plastic')?.classList.contains('feedback-up')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.electric_components')?.classList.contains('feedback-up')).toBe(true);
    expect(audioService.storageFullCalls).toBe(0);
  });

  it('should light feedback-down states across multiple late-game resources independently', () => {
    machinesService.unlockAll();
    const baseline = buildUnlockedResources({
      [ResourceType.CIRCUIT_BOARD]: 'near',
      [ResourceType.GPU]: 'near',
      [ResourceType.SMARTPHONE]: 'near',
      [ResourceType.LAPTOP]: 'near',
    });
    resourcesService.setResources(baseline);

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const reducedResourceIds = new Set<ResourceType>([
      ResourceType.CIRCUIT_BOARD,
      ResourceType.GPU,
      ResourceType.SMARTPHONE,
      ResourceType.LAPTOP,
    ]);

    resourcesService.setResources(
      baseline.map((resource) =>
        reducedResourceIds.has(resource.id as ResourceType)
          ? { ...resource, amount: Math.max(0, resource.amount - 1) }
          : resource,
      ),
    );
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(getRowByAlt(fixture, 'resources.circuit_board')?.classList.contains('feedback-down')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.gpu')?.classList.contains('feedback-down')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.smartphone')?.classList.contains('feedback-down')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.laptop')?.classList.contains('feedback-down')).toBe(true);
    expect(audioService.storageFullCalls).toBe(0);
  });

  it('should render the exact late-game sell rows when every machine tier is unlocked', () => {
    machinesService.unlockAll();
    resourcesService.setResources(buildUnlockedResources({
      [ResourceType.SMARTPHONE]: 'full',
      [ResourceType.DESKTOP_PC]: 'near',
      [ResourceType.MINING_RIG]: 'full',
      [ResourceType.SERVER_RACK]: 'near',
    }));

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const renderedSellIds = Array.from(
      fixture.nativeElement.querySelectorAll('.sell-stub'),
    ).map((button) => (button as HTMLButtonElement).getAttribute('data-resource-id'));

    expect(renderedSellIds).toEqual([
      'metal',
      'plastic',
      'components',
      'copper',
      'recycled_plastic',
      'electric_components',
      'circuit_board',
      'hdd',
      'screen',
      'gpu',
      'smartphone',
      'laptop',
      'desktop_pc',
      'mining_rig',
      'server_rack',
    ]);
    expect(getRowByAlt(fixture, 'resources.smartphone')?.querySelector('.res-amount')?.classList.contains('full')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.desktop_pc')).not.toBeNull();
    expect(getRowByAlt(fixture, 'resources.mining_rig')?.classList.contains('storage-full')).toBe(true);
    expect(getRowByAlt(fixture, 'resources.server_rack')).not.toBeNull();
  });

  it('should ignore invalid auto-generation ids and keep helper lookups false for unknown resources', () => {
    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    scrapGenerationService.setAutoEvent(-2, 99);
    TestBed.flushEffects();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    expect(fixture.nativeElement.querySelectorAll('.auto-scrap-float')).toHaveLength(0);
    expect(component.isFeedback('missing-resource', 'up')).toBe(false);
    expect(component.isCapacityPop('missing-resource')).toBe(false);
    expect(component.isNearCapacity('missing-resource')).toBe(false);
    expect(component.isStorageFull('missing-resource')).toBe(false);
  });

  it('should render the complementary selective late-game unlock subset and hide unrelated advanced rows', () => {
    machinesService.unlocked = new Set([
      MachineType.CRUSHER,
      MachineType.PCB_PRINTER,
      MachineType.SCREEN_FABRICATOR,
      MachineType.SMARTPHONE_FACTORY,
      MachineType.LAPTOP_WORKSHOP,
      MachineType.PC_BUILDER,
      MachineType.MINING_RIG_ASSEMBLY,
    ]);
    resourcesService.setResources(
      buildUnlockedResources({
        [ResourceType.CIRCUIT_BOARD]: 'near',
        [ResourceType.SCREEN]: 'full',
        [ResourceType.SMARTPHONE]: 'full',
        [ResourceType.LAPTOP]: 'near',
        [ResourceType.DESKTOP_PC]: 'near',
        [ResourceType.MINING_RIG]: 'full',
      }),
    );

    const fixture = TestBed.createComponent(ResourcesHeaderComponent);
    fixture.detectChanges();

    const screenRow = getRowByAlt(fixture, 'resources.screen');
    const smartphoneRow = getRowByAlt(fixture, 'resources.smartphone');
    const laptopRow = getRowByAlt(fixture, 'resources.laptop');
    const desktopPcRow = getRowByAlt(fixture, 'resources.desktop_pc');
    const miningRigRow = getRowByAlt(fixture, 'resources.mining_rig');

    expect(fixture.nativeElement.querySelector('.sidebar-divider--advanced')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="circuit_board"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="screen"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="smartphone"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="laptop"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="desktop_pc"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="mining_rig"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="hdd"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="gpu"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-resource-id="server_rack"]')).toBeNull();
    expect(screenRow?.querySelector('.res-amount')?.classList.contains('full')).toBe(true);
    expect(smartphoneRow?.classList.contains('storage-full')).toBe(true);
    expect(laptopRow).not.toBeNull();
    expect(desktopPcRow).not.toBeNull();
    expect(miningRigRow?.classList.contains('storage-full')).toBe(true);
  });
});