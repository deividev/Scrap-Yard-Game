import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { OptionsMenuComponent } from './options-menu.component';
import { GameStateService } from '../../services/game-state.service';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { AudioService } from '../../services/audio.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { AppSelectComponent } from '../ui/app-select/app-select.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal/confirmation-modal.component';

class MockGameStateService {
  returned = 0;

  returnToMenu(): void {
    this.returned += 1;
  }
}

class MockSettingsService {
  private music = signal(50);
  private sfx = signal(70);
  private mode = signal<'windowed' | 'maximized' | 'fullscreen'>('windowed');
  private resolutionValue = signal('1920x1080');
  private languageValue = signal<'es' | 'en'>('es');

  readonly musicVolume = this.music.asReadonly();
  readonly sfxVolume = this.sfx.asReadonly();
  readonly windowMode = this.mode.asReadonly();
  readonly resolution = this.resolutionValue.asReadonly();
  readonly language = this.languageValue.asReadonly();

  setMusicVolume(value: number): void {
    this.music.set(value);
  }

  setSfxVolume(value: number): void {
    this.sfx.set(value);
  }

  setLanguage(value: 'es' | 'en'): void {
    this.languageValue.set(value);
  }

  setWindowMode(value: 'windowed' | 'maximized' | 'fullscreen'): void {
    this.mode.set(value);
  }

  setResolution(value: string): void {
    this.resolutionValue.set(value);
  }

  resetToDefaults(): void {
    this.music.set(50);
    this.sfx.set(70);
    this.mode.set('windowed');
    this.resolutionValue.set('1920x1080');
    this.languageValue.set('es');
  }
}

class MockTranslationService {
  changedTo: string[] = [];
  requestedKeys: string[] = [];

  t(key: string): string {
    this.requestedKeys.push(key);
    return key;
  }

  setLanguage(language: 'es' | 'en'): void {
    this.changedTo.push(language);
  }
}

class MockAudioService {
  playUiClick(): void {}
}

describe('OptionsMenuComponent', () => {
  let settingsService: MockSettingsService;
  let gameStateService: MockGameStateService;
  let translationService: MockTranslationService;
  let originalElectronApi: unknown;

  beforeEach(() => {
    settingsService = new MockSettingsService();
    gameStateService = new MockGameStateService();
    translationService = new MockTranslationService();
    originalElectronApi = (window as any).electronApi;
    delete (window as any).electronApi;

    TestBed.configureTestingModule({
      providers: [
        { provide: GameStateService, useValue: gameStateService },
        { provide: SettingsService, useValue: settingsService },
        { provide: TranslationService, useValue: translationService },
        { provide: AudioService, useClass: MockAudioService },
      ],
    });
  });

  afterEach(() => {
    (window as any).electronApi = originalElectronApi;
  });

  it('should change settings through handlers and setters', async () => {
    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.onMusicVolumeChange({ target: { value: '35' } } as unknown as Event);
    fixture.componentInstance.onSfxVolumeChange({ target: { value: '15' } } as unknown as Event);
    fixture.componentInstance.setLanguage('en');
    fixture.componentInstance.setWindowMode('fullscreen');
    fixture.componentInstance.setResolution('1366x768');

    expect(settingsService.musicVolume()).toBe(35);
    expect(settingsService.sfxVolume()).toBe(15);
    expect(settingsService.language()).toBe('en');
    expect(settingsService.windowMode()).toBe('fullscreen');
    expect(settingsService.resolution()).toBe('1366x768');
    expect(translationService.changedTo).toEqual(['en']);
  });

  it('should open and confirm the reset modal, then sync translation language', async () => {
    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.setLanguage('en');
    fixture.componentInstance.resetToDefaults();
    expect(fixture.componentInstance.showResetModal()).toBe(true);

    fixture.componentInstance.confirmReset();

    expect(fixture.componentInstance.showResetModal()).toBe(false);
    expect(settingsService.language()).toBe('es');
    expect(translationService.changedTo.at(-1)).toBe('es');
  });

  it('should cancel reset and go back to the main menu', async () => {
    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.resetToDefaults();
    fixture.componentInstance.cancelReset();
    fixture.componentInstance.goBack();

    expect(fixture.componentInstance.showResetModal()).toBe(false);
    expect(gameStateService.returned).toBe(1);
  });

  it('should expose translated window mode options and render Electron-only selects when available', async () => {
    (window as any).electronApi = {};

    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.isElectron).toBe(true);
    expect(component.particles).toHaveLength(10);
    expect(component.windowModeOptions.map((option) => option.value)).toEqual([
      'windowed',
      'maximized',
      'fullscreen',
    ]);
    expect(component.resolutionOptions).toHaveLength(4);
    expect(translationService.requestedKeys).toContain('options.window_mode_windowed');
    expect(translationService.requestedKeys).toContain('options.window_mode_maximized');
    expect(translationService.requestedKeys).toContain('options.window_mode_fullscreen');
    expect(element.textContent).toContain('options.window_mode');
    expect(element.textContent).toContain('options.resolution');
  });

  it('should hide the resolution selector when Electron is enabled but the mode is not windowed', async () => {
    (window as any).electronApi = {};
    settingsService.setWindowMode('fullscreen');

    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.isElectron).toBe(true);
    expect(element.textContent).toContain('options.window_mode');
    expect(element.textContent).not.toContain('options.resolution');
  });

  it('should wire select, button, and modal outputs through the template', async () => {
    (window as any).electronApi = {};

    const fixture = TestBed.createComponent(OptionsMenuComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const selectComponents = fixture.debugElement
      .queryAll(By.directive(AppSelectComponent))
      .map((debugElement) => debugElement.componentInstance as AppSelectComponent);

    selectComponents[0].changed.emit('en');
    selectComponents[1].changed.emit('fullscreen');
    fixture.detectChanges();

    expect(settingsService.language()).toBe('en');
    expect(settingsService.windowMode()).toBe('fullscreen');
    expect(translationService.changedTo.at(-1)).toBe('en');

    settingsService.setWindowMode('windowed');
    fixture.detectChanges();

    const refreshedSelectComponents = fixture.debugElement
      .queryAll(By.directive(AppSelectComponent))
      .map((debugElement) => debugElement.componentInstance as AppSelectComponent);
    refreshedSelectComponents[2].changed.emit('1280x720');

    expect(settingsService.resolution()).toBe('1280x720');

    const buttonComponents = fixture.debugElement
      .queryAll(By.directive(AppButtonComponent))
      .map((debugElement) => debugElement.componentInstance as AppButtonComponent);
    buttonComponents[0].clicked.emit();
    fixture.detectChanges();

    let modal = fixture.debugElement.query(By.directive(ConfirmationModalComponent));
    (modal.componentInstance as ConfirmationModalComponent).cancelled.emit();
    fixture.detectChanges();

    buttonComponents[0].clicked.emit();
    fixture.detectChanges();

    modal = fixture.debugElement.query(By.directive(ConfirmationModalComponent));
    (modal.componentInstance as ConfirmationModalComponent).confirmed.emit();
    fixture.detectChanges();

    buttonComponents[1].clicked.emit();

    expect(settingsService.resolution()).toBe('1920x1080');
    expect(settingsService.language()).toBe('es');
    expect(fixture.componentInstance.showResetModal()).toBe(false);
    expect(gameStateService.returned).toBe(1);
  });
});