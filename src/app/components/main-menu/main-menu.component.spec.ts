import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MainMenuComponent } from './main-menu.component';
import { GameStateService } from '../../services/game-state.service';
import { SaveService } from '../../services/save.service';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal/confirmation-modal.component';

class MockGameStateService {
  started = 0;
  options = 0;

  startGame(): void {
    this.started += 1;
  }

  openOptions(): void {
    this.options += 1;
  }
}

class MockSaveService {
  private gameStartedSignal = signal(false);
  markStartedCalls = 0;
  saveCalls = 0;
  resetCalls = 0;

  isGameStarted = this.gameStartedSignal.asReadonly();

  markGameStarted(): void {
    this.markStartedCalls += 1;
    this.gameStartedSignal.set(true);
  }

  async save(): Promise<void> {
    this.saveCalls += 1;
  }

  async resetToNewGame(): Promise<void> {
    this.resetCalls += 1;
    this.gameStartedSignal.set(false);
  }

  setHasSave(value: boolean): void {
    this.gameStartedSignal.set(value);
  }
}

class MockTranslationService {
  t(key: string): string {
    return key;
  }
}

class MockAudioService {
  playUiClick(): void {}
}

describe('MainMenuComponent', () => {
  let saveService: MockSaveService;
  let gameStateService: MockGameStateService;
  let originalElectronApi: unknown;

  beforeEach(() => {
    saveService = new MockSaveService();
    gameStateService = new MockGameStateService();
    originalElectronApi = (window as any).electronApi;
    delete (window as any).electronApi;

    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameStateService },
        { provide: SaveService, useValue: saveService },
        { provide: TranslationService, useClass: MockTranslationService },
        { provide: AudioService, useClass: MockAudioService },
      ],
    });
  });

  afterEach(() => {
    (window as any).electronApi = originalElectronApi;
  });

  it('should start a new game directly when no save exists', async () => {
    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.newGame();

    expect(saveService.markStartedCalls).toBe(1);
    expect(saveService.saveCalls).toBe(1);
    expect(gameStateService.started).toBe(1);
    expect(fixture.componentInstance.showNewGameModal()).toBe(false);
  });

  it('should open and confirm the new game modal when a save exists', async () => {
    saveService.setHasSave(true);
    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.newGame();
    expect(fixture.componentInstance.showNewGameModal()).toBe(true);

    await fixture.componentInstance.confirmNewGame();

    expect(saveService.resetCalls).toBe(1);
    expect(saveService.markStartedCalls).toBe(1);
    expect(saveService.saveCalls).toBe(1);
    expect(gameStateService.started).toBe(1);
    expect(fixture.componentInstance.showNewGameModal()).toBe(false);
  });

  it('should keep the save untouched until the player confirms a new game and expose menu metadata', async () => {
    saveService.setHasSave(true);

    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;

    await component.ngOnInit();
    component.newGame();

    expect(component.hasSavedGame()).toBe(true);
    expect(component.showNewGameModal()).toBe(true);
    expect(component.appVersionLabel).toContain('v');
    expect(component.particles).toHaveLength(10);
    expect(saveService.markStartedCalls).toBe(0);
    expect(saveService.saveCalls).toBe(0);
    expect(gameStateService.started).toBe(0);
  });

  it('should continue, open options, and exit through electron when available', async () => {
    const quitCalls: number[] = [];
    (window as any).electronApi = {
      quit: () => {
        quitCalls.push(1);
      },
    };

    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.continueGame();
    fixture.componentInstance.openOptions();
    fixture.componentInstance.exitGame();

    expect(saveService.markStartedCalls).toBe(1);
    expect(saveService.saveCalls).toBe(1);
    expect(gameStateService.started).toBe(1);
    expect(gameStateService.options).toBe(1);
    expect(quitCalls).toHaveLength(1);
  });

  it('should not try to exit when Electron is unavailable', async () => {
    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.isElectron).toBe(false);

    fixture.componentInstance.exitGame();

    expect(saveService.markStartedCalls).toBe(0);
    expect(saveService.saveCalls).toBe(0);
    expect(gameStateService.started).toBe(0);
  });

  it('should wire button and modal outputs through the template', async () => {
    const quitCalls: number[] = [];
    saveService.setHasSave(true);
    (window as any).electronApi = {
      quit: () => {
        quitCalls.push(1);
      },
    };

    const fixture = TestBed.createComponent(MainMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const buttonComponents = fixture.debugElement
      .queryAll(By.directive(AppButtonComponent))
      .map((debugElement) => debugElement.componentInstance as AppButtonComponent);

    buttonComponents[0].clicked.emit();
    buttonComponents[1].clicked.emit();
    fixture.detectChanges();

    expect(gameStateService.started).toBe(1);
    expect(fixture.componentInstance.showNewGameModal()).toBe(true);

    let modal = fixture.debugElement.query(By.directive(ConfirmationModalComponent));
    (modal.componentInstance as ConfirmationModalComponent).cancelled.emit();
    fixture.detectChanges();

    expect(fixture.componentInstance.showNewGameModal()).toBe(false);

    buttonComponents[1].clicked.emit();
    fixture.detectChanges();

    modal = fixture.debugElement.query(By.directive(ConfirmationModalComponent));
    (modal.componentInstance as ConfirmationModalComponent).confirmed.emit();
    await fixture.whenStable();
    fixture.detectChanges();

    buttonComponents[2].clicked.emit();
    buttonComponents[3].clicked.emit();

    expect(saveService.resetCalls).toBe(1);
    expect(saveService.markStartedCalls).toBe(2);
    expect(saveService.saveCalls).toBe(2);
    expect(gameStateService.started).toBe(2);
    expect(gameStateService.options).toBe(1);
    expect(quitCalls).toHaveLength(1);
  });
});