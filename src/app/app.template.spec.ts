import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
import { MarketEventService } from './services/market-event.service';

class MockSaveService {
  async save(): Promise<void> {}
  load(): void {}
  isDirtyState(): boolean {
    return false;
  }
}

class SaveAwareService {
  setSaveService(_saveService: SaveService): void {}
}

class MockGameStateService {
  private viewSignal = signal<GameView>('main-menu');
  readonly view = this.viewSignal.asReadonly();

  setView(view: GameView): void {
    this.viewSignal.set(view);
  }
}

class MockAudioService {
  init(): void {}
  playGameMusicLoop(): void {}
  stopGameMusicLoop(): void {}
}

class MockGameLoopService {
  start(): void {}
  stop(): void {}
}

class MockFirstRunTutorialService extends SaveAwareService {
  readonly steps = [];
  readonly currentStep = signal(null);

  startIfNeeded(): void {}

  isActive(): boolean {
    return false;
  }

  acknowledgeCurrentStep(): void {}

  skipTutorial(): void {}
}

class MockContractService extends SaveAwareService {
  private introSignal = signal(false);
  readonly showContractIntro = this.introSignal.asReadonly();

  setShowIntro(value: boolean): void {
    this.introSignal.set(value);
  }

  dismissContractIntro(): void {
    this.introSignal.set(false);
  }
}

class MockMarketEventService {
  debugForceRandomEvent(): boolean {
    return true;
  }
}

@Component({ selector: 'app-resources-header', standalone: true, template: '<div class="resources-header-stub">resources-header</div>' })
class ResourcesHeaderStubComponent {}

@Component({ selector: 'app-machine-list', standalone: true, template: '<div class="machine-list-stub">machine-list</div>' })
class MachineListStubComponent {}

@Component({ selector: 'app-upgrades-panel', standalone: true, template: '<div class="upgrades-panel-stub">upgrades-panel</div>' })
class UpgradesPanelStubComponent {}

@Component({ selector: 'app-notification-container', standalone: true, template: '<div class="notifications-stub">notifications</div>' })
class NotificationContainerStubComponent {}

@Component({ selector: 'app-main-menu', standalone: true, template: '<div class="main-menu-stub">main-menu</div>' })
class MainMenuStubComponent {}

@Component({ selector: 'app-options-menu', standalone: true, template: '<div class="options-menu-stub">options</div>' })
class OptionsMenuStubComponent {}

@Component({ selector: 'app-statistics-panel', standalone: true, template: '<div class="statistics-panel-stub">statistics</div>' })
class StatisticsPanelStubComponent {}

@Component({ selector: 'app-background-grid', standalone: true, template: '<div class="background-grid-stub">grid</div>' })
class BackgroundGridStubComponent {
  readonly opacity = input(1);
}

@Component({ selector: 'app-first-run-tutorial-overlay', standalone: true, template: '<div class="tutorial-overlay-stub">tutorial</div>' })
class FirstRunTutorialOverlayStubComponent {}

@Component({ selector: 'app-contract-intro-modal', standalone: true, template: '<button class="contract-intro-dismiss" type="button" (click)="dismissed.emit()">dismiss</button>' })
class ContractIntroModalStubComponent {
  readonly dismissed = output<void>();
}

@Component({ selector: 'app-panel-frame', standalone: true, template: '<section class="panel-frame-stub"><ng-content /></section>' })
class PanelFrameStubComponent {}

@Component({ selector: 'app-panel-frame-h', standalone: true, template: '<section class="panel-frame-h-stub"><ng-content /></section>' })
class PanelFrameHStubComponent {}

describe('App template coverage', () => {
  let gameStateService: MockGameStateService;
  let contractService: MockContractService;

  beforeEach(() => {
    gameStateService = new MockGameStateService();
    contractService = new MockContractService();

    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: SaveService, useClass: MockSaveService },
        { provide: ResourcesService, useClass: SaveAwareService },
        { provide: MachinesService, useClass: SaveAwareService },
        { provide: UpgradesService, useClass: SaveAwareService },
        { provide: ScrapGenerationService, useClass: SaveAwareService },
        { provide: GameStateService, useValue: gameStateService },
        { provide: AudioService, useClass: MockAudioService },
        { provide: GameLoopService, useClass: MockGameLoopService },
        { provide: FirstRunTutorialService, useClass: MockFirstRunTutorialService },
        { provide: ContractService, useValue: contractService },
        { provide: MarketEventService, useClass: MockMarketEventService },
      ],
    })
      .overrideComponent(App, {
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
            ContractIntroModalComponent,
            PanelFrameComponent,
            PanelFrameHComponent,
          ],
        },
        add: {
          imports: [
            ResourcesHeaderStubComponent,
            MachineListStubComponent,
            UpgradesPanelStubComponent,
            NotificationContainerStubComponent,
            MainMenuStubComponent,
            OptionsMenuStubComponent,
            StatisticsPanelStubComponent,
            BackgroundGridStubComponent,
            FirstRunTutorialOverlayStubComponent,
            ContractIntroModalStubComponent,
            PanelFrameStubComponent,
            PanelFrameHStubComponent,
          ],
        },
      });
  });

  it('should render all app.html view branches and dismiss the contract intro', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    let element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.main-menu-stub')).not.toBeNull();

    gameStateService.setView('options');
    TestBed.flushEffects();
    fixture.detectChanges();

    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.options-menu-stub')).not.toBeNull();

    contractService.setShowIntro(true);
    gameStateService.setView('game');
    TestBed.flushEffects();
    fixture.detectChanges();

    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.app-layout')).not.toBeNull();
    expect(element.querySelector('.background-grid-stub')).not.toBeNull();
    expect(element.querySelector('.resources-header-stub')).not.toBeNull();
    expect(element.querySelector('.machine-list-stub')).not.toBeNull();
    expect(element.querySelector('.upgrades-panel-stub')).not.toBeNull();
    expect(element.querySelector('.contract-intro-dismiss')).not.toBeNull();

    (element.querySelector('.contract-intro-dismiss') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.contract-intro-dismiss')).toBeNull();
  });
});