import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';
import { ResourcesHeaderComponent } from './components/resources-header/resources-header.component';
import { MachineListComponent } from './components/machine-list/machine-list.component';
import { UpgradesPanelComponent } from './components/upgrades-panel/upgrades-panel.component';
import { NotificationContainerComponent } from './components/ui/notification-container/notification-container.component';
import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { OptionsMenuComponent } from './components/options-menu/options-menu.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { BackgroundGridComponent } from './components/ui/background-grid/background-grid.component';
import { FirstRunTutorialOverlayComponent } from './components/first-run-tutorial-overlay/first-run-tutorial-overlay.component';
import { ContractIntroModalComponent } from './components/ui/contract-intro-modal/contract-intro-modal.component';
import { PanelFrameComponent } from './components/ui/panel-frame/panel-frame.component';
import { PanelFrameHComponent } from './components/ui/panel-frame-h/panel-frame-h.component';
import { SaveService } from './services/save.service';
import { ResourcesService } from './services/resources.service';
import { MachinesService } from './services/machines.service';
import { UpgradesService } from './services/upgrades.service';
import { ScrapGenerationService } from './services/scrap-generation.service';
import { GameStateService, GameView } from './services/game-state.service';
import { AudioService } from './services/audio.service';
import { GameLoopService } from './services/game-loop.service';
import { FirstRunTutorialService } from './services/first-run-tutorial.service';
import { ContractService } from './services/contract.service';

@Component({
  selector: 'app-resources-header',
  standalone: true,
  template: '<div>resources-header</div>',
})
class StubResourcesHeaderComponent {}

@Component({
  selector: 'app-machine-list',
  standalone: true,
  template: '<div>machine-list</div>',
})
class StubMachineListComponent {}

@Component({
  selector: 'app-upgrades-panel',
  standalone: true,
  template: '<div>upgrades-panel</div>',
})
class StubUpgradesPanelComponent {}

@Component({
  selector: 'app-notification-container',
  standalone: true,
  template: '<div>notifications</div>',
})
class StubNotificationContainerComponent {}

@Component({
  selector: 'app-main-menu',
  standalone: true,
  template: '<div class="main-menu-stub">main-menu</div>',
})
class StubMainMenuComponent {}

@Component({
  selector: 'app-options-menu',
  standalone: true,
  template: '<div class="options-menu-stub">options</div>',
})
class StubOptionsMenuComponent {}

@Component({
  selector: 'app-statistics-panel',
  standalone: true,
  template: '<div>statistics</div>',
})
class StubStatisticsPanelComponent {}

@Component({
  selector: 'app-background-grid',
  standalone: true,
  template: '<div class="background-grid-stub">grid {{ opacity() }}</div>',
})
class StubBackgroundGridComponent {
  opacity = input(0);
}

@Component({
  selector: 'app-first-run-tutorial-overlay',
  standalone: true,
  template: '<div>tutorial-overlay</div>',
})
class StubFirstRunTutorialOverlayComponent {}

@Component({
  selector: 'app-contract-intro-modal',
  standalone: true,
  template: '<button class="contract-intro-dismiss" type="button" (click)="dismissed.emit()">dismiss</button>',
})
class StubContractIntroModalComponent {
  dismissed = output<void>();
}

@Component({
  selector: 'app-panel-frame',
  standalone: true,
  template: '<section class="panel-frame-stub"><ng-content /></section>',
})
class StubPanelFrameComponent {}

@Component({
  selector: 'app-panel-frame-h',
  standalone: true,
  template: '<section class="panel-frame-h-stub"><ng-content /></section>',
})
class StubPanelFrameHComponent {}

class MockSaveService {
  dirty = false;
  saveCalls = 0;
  loadCalls = 0;
  saveError: Error | null = null;

  async save(): Promise<void> {
    this.saveCalls += 1;
    if (this.saveError) {
      throw this.saveError;
    }
  }

  load(): void {
    this.loadCalls += 1;
  }

  isDirtyState(): boolean {
    return this.dirty;
  }
}

class SaveAwareService {
  saveService?: SaveService;

  setSaveService(saveService: SaveService): void {
    this.saveService = saveService;
  }
}

class MockGameStateService {
  private viewSignal = signal<GameView>('main-menu');
  readonly view = this.viewSignal.asReadonly();

  setView(view: GameView): void {
    this.viewSignal.set(view);
  }
}

class MockAudioService {
  initCalls = 0;
  playCalls = 0;
  stopCalls = 0;

  init(): void {
    this.initCalls += 1;
  }

  playGameMusicLoop(): void {
    this.playCalls += 1;
  }

  stopGameMusicLoop(): void {
    this.stopCalls += 1;
  }
}

class MockGameLoopService {
  startCalls = 0;
  stopCalls = 0;

  start(): void {
    this.startCalls += 1;
  }

  stop(): void {
    this.stopCalls += 1;
  }
}

class MockFirstRunTutorialService extends SaveAwareService {
  startCalls = 0;

  startIfNeeded(): void {
    this.startCalls += 1;
  }
}

class MockContractService extends SaveAwareService {
  private introSignal = signal(false);
  readonly showContractIntro = this.introSignal.asReadonly();
  dismissCalls = 0;

  setShowIntro(value: boolean): void {
    this.introSignal.set(value);
  }

  dismissContractIntro(): void {
    this.dismissCalls += 1;
    this.introSignal.set(false);
  }
}

describe('App', () => {
  let saveService: MockSaveService;
  let resourcesService: SaveAwareService;
  let machinesService: SaveAwareService;
  let upgradesService: SaveAwareService;
  let scrapGenerationService: SaveAwareService;
  let gameStateService: MockGameStateService;
  let audioService: MockAudioService;
  let gameLoopService: MockGameLoopService;
  let firstRunTutorialService: MockFirstRunTutorialService;
  let contractService: MockContractService;

  beforeEach(() => {
    vi.useFakeTimers();
    saveService = new MockSaveService();
    resourcesService = new SaveAwareService();
    machinesService = new SaveAwareService();
    upgradesService = new SaveAwareService();
    scrapGenerationService = new SaveAwareService();
    gameStateService = new MockGameStateService();
    audioService = new MockAudioService();
    gameLoopService = new MockGameLoopService();
    firstRunTutorialService = new MockFirstRunTutorialService();
    contractService = new MockContractService();

    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: SaveService, useValue: saveService },
        { provide: ResourcesService, useValue: resourcesService },
        { provide: MachinesService, useValue: machinesService },
        { provide: UpgradesService, useValue: upgradesService },
        { provide: ScrapGenerationService, useValue: scrapGenerationService },
        { provide: GameStateService, useValue: gameStateService },
        { provide: AudioService, useValue: audioService },
        { provide: GameLoopService, useValue: gameLoopService },
        { provide: FirstRunTutorialService, useValue: firstRunTutorialService },
        { provide: ContractService, useValue: contractService },
      ],
    }).overrideComponent(App, {
      remove: {
        imports: [
          ResourcesHeaderComponent,
          MachineListComponent,
          UpgradesPanelComponent,
          NotificationContainerComponent,
          MainMenuComponent,
          OptionsMenuComponent,
          StatisticsPanelComponent,
          BackgroundGridComponent,
          FirstRunTutorialOverlayComponent,
          PanelFrameComponent,
          PanelFrameHComponent,
          ContractIntroModalComponent,
        ],
      },
      add: {
        imports: [
          StubResourcesHeaderComponent,
          StubMachineListComponent,
          StubUpgradesPanelComponent,
          StubNotificationContainerComponent,
          StubMainMenuComponent,
          StubOptionsMenuComponent,
          StubStatisticsPanelComponent,
          StubBackgroundGridComponent,
          StubFirstRunTutorialOverlayComponent,
          StubPanelFrameComponent,
          StubPanelFrameHComponent,
          StubContractIntroModalComponent,
        ],
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the app and render the main menu by default', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-main-menu')).not.toBeNull();
    expect(audioService.stopCalls).toBe(1);
    expect(gameLoopService.stopCalls).toBe(1);
  });

  it('should wire save services, load state, initialize audio, and auto-save when dirty', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(resourcesService.saveService).toBe(saveService as unknown as SaveService);
    expect(machinesService.saveService).toBe(saveService as unknown as SaveService);
    expect(upgradesService.saveService).toBe(saveService as unknown as SaveService);
    expect(scrapGenerationService.saveService).toBe(saveService as unknown as SaveService);
    expect(firstRunTutorialService.saveService).toBe(saveService as unknown as SaveService);
    expect(contractService.saveService).toBe(saveService as unknown as SaveService);
    expect(saveService.loadCalls).toBe(1);
    expect(audioService.initCalls).toBe(1);

    saveService.dirty = false;
    vi.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(saveService.saveCalls).toBe(0);

    saveService.dirty = true;
    vi.advanceTimersByTime(10000);
    await Promise.resolve();
    expect(saveService.saveCalls).toBe(1);

    window.dispatchEvent(new Event('beforeunload'));
    await Promise.resolve();
    expect(saveService.saveCalls).toBe(2);
  });

  it('should react to game view changes by starting tutorial, music, loop, and rendering game layout', () => {
    gameStateService.setView('game');
    contractService.setShowIntro(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(firstRunTutorialService.startCalls).toBe(1);
    expect(audioService.playCalls).toBe(1);
    expect(gameLoopService.startCalls).toBe(1);
    expect(fixture.nativeElement.querySelector('.app-layout')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-contract-intro-modal')).not.toBeNull();

    (fixture.nativeElement.querySelector('.contract-intro-dismiss') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(contractService.dismissCalls).toBe(1);
    expect(fixture.nativeElement.querySelector('app-contract-intro-modal')).toBeNull();
  });

  it('should stop loop/music on non-game views, reflect panel minimization, and save on destroy', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    gameStateService.setView('options');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(audioService.stopCalls).toBeGreaterThan(0);
    expect(gameLoopService.stopCalls).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('app-options-menu')).not.toBeNull();

    fixture.componentInstance.onPanelMinimizedChange(true);
    gameStateService.setView('game');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.column-right.hidden')).not.toBeNull();

    fixture.destroy();
    await Promise.resolve();
    expect(saveService.saveCalls).toBe(1);
  });

  it('should report save failures from auto-save, beforeunload, and destroy handlers', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    saveService.dirty = true;
    saveService.saveError = new Error('save failed');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    vi.advanceTimersByTime(10000);
    await Promise.resolve();

    window.dispatchEvent(new Event('beforeunload'));
    await Promise.resolve();

    fixture.destroy();
    await Promise.resolve();

    expect(saveService.saveCalls).toBe(3);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[App] Auto-save failed:', saveService.saveError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[App] beforeUnload save failed:', saveService.saveError);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[App] ngOnDestroy save failed:', saveService.saveError);

    consoleErrorSpy.mockRestore();
  });

  it('should destroy safely before initialization without clearing an interval', async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const fixture = TestBed.createComponent(App);

    fixture.destroy();
    await Promise.resolve();

    expect(clearIntervalSpy).not.toHaveBeenCalled();
    expect(saveService.saveCalls).toBe(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    clearIntervalSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
