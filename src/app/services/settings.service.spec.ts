import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { SaveService } from './save.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let saveService: {
    isGameStarted: () => boolean;
    markDirty: () => void;
    save: () => Promise<void>;
  };
  let dirtyCalls: number;
  let saveCalls: number;
  let setWindowModeCalls: Array<{ mode: string; resolution: string }>;
  let originalElectronApi: unknown;
  let gameStarted: boolean;
  let saveError: Error | null;

  beforeEach(() => {
    dirtyCalls = 0;
    saveCalls = 0;
    setWindowModeCalls = [];
    gameStarted = true;
    saveError = null;
    originalElectronApi = (window as any).electronApi;

    (window as any).electronApi = {
      setWindowMode: async (payload: { mode: string; resolution: string }) => {
        setWindowModeCalls.push(payload);
      },
    };

    saveService = {
      isGameStarted: () => gameStarted,
      markDirty: () => {
        dirtyCalls += 1;
      },
      save: async () => {
        saveCalls += 1;
        if (saveError) {
          throw saveError;
        }
      },
    };

    TestBed.configureTestingModule({
      providers: [SettingsService, { provide: SaveService, useValue: saveService }],
    });

    service = TestBed.inject(SettingsService);
    (service as any)._saveService = saveService;
  });

  afterEach(() => {
    (window as any).electronApi = originalElectronApi;
  });

  it('should clamp volumes and save immediately when the game already started', async () => {
    service.setMusicVolume(150);
    service.setSfxVolume(-5);
    service.setLanguage('en');

    await Promise.resolve();

    expect(service.musicVolume()).toBe(100);
    expect(service.sfxVolume()).toBe(0);
    expect(service.language()).toBe('en');
    expect(dirtyCalls).toBe(3);
    expect(saveCalls).toBe(3);
  });

  it('should apply electron window mode changes and migrate fullscreen saves', async () => {
    service.setWindowMode('fullscreen');
    service.setResolution('1280x720');
    service.setWindowMode('windowed');
    service.setResolution('1366x768');

    service.setState({
      musicVolume: 10,
      sfxVolume: 20,
      windowMode: undefined as never,
      resolution: '1600x900',
      language: 'es',
      fullscreen: true,
    } as {
      musicVolume: number;
      sfxVolume: number;
      windowMode: never;
      resolution: string;
      language: 'es' | 'en';
      fullscreen: boolean;
    });

    await Promise.resolve();

    expect(service.windowMode()).toBe('fullscreen');
    expect(service.resolution()).toBe('1600x900');
    expect(setWindowModeCalls).toContainEqual({ mode: 'fullscreen', resolution: '1920x1080' });
    expect(setWindowModeCalls).toContainEqual({ mode: 'windowed', resolution: '1366x768' });
    expect(setWindowModeCalls.at(-1)).toEqual({ mode: 'fullscreen', resolution: '1600x900' });
  });

  it('should reset to defaults and expose state snapshots', async () => {
    service.setMusicVolume(25);
    service.setSfxVolume(35);
    service.setWindowMode('maximized');
    service.setResolution('1280x720');
    service.setLanguage('en');

    service.resetToDefaults();
    await Promise.resolve();

    expect(service.getState()).toEqual({
      musicVolume: 50,
      sfxVolume: 70,
      windowMode: 'windowed',
      resolution: '1920x1080',
      language: 'es',
    });
  });

  it('should keep settings in memory without saving when the game has not started and Electron is unavailable', async () => {
    (window as any).electronApi = undefined;
    gameStarted = false;

    service.setMusicVolume(30);
    service.setSfxVolume(40);
    service.setWindowMode('maximized');
    service.setResolution('1366x768');
    service.setLanguage('en');

    await Promise.resolve();

    expect(service.musicVolume()).toBe(30);
    expect(service.sfxVolume()).toBe(40);
    expect(service.windowMode()).toBe('maximized');
    expect(service.resolution()).toBe('1366x768');
    expect(service.language()).toBe('en');
    expect(dirtyCalls).toBe(0);
    expect(saveCalls).toBe(0);
    expect(setWindowModeCalls).toEqual([]);
  });

  it('should lazy-load SaveService when needed and save immediately', async () => {
    (service as any)._saveService = undefined;

    service.setMusicVolume(65);
    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect((service as any)._saveService).toBe(saveService);
    expect(service.musicVolume()).toBe(65);
    expect(dirtyCalls).toBe(1);
    expect(saveCalls).toBe(1);
  });

  it('should report save failures without breaking state updates', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    saveError = new Error('save failed');

    service.setLanguage('en');
    await Promise.resolve();

    expect(service.language()).toBe('en');
    expect(dirtyCalls).toBe(1);
    expect(saveCalls).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[SettingsService] Immediate save failed:', saveError);

    consoleErrorSpy.mockRestore();
  });

  it('should warn when lazy SaveService resolution fails', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const injectorError = new Error('missing save service');
    (service as any)._saveService = undefined;
    (service as any).injector = {
      get: () => {
        throw injectorError;
      },
    };

    service.setLanguage('en');
    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[SettingsService] Could not load SaveService:',
      injectorError,
    );

    consoleWarnSpy.mockRestore();
  });

  it('should lazy-load SaveService but keep settings only in memory when the game has not started', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (service as any)._saveService = undefined;
    gameStarted = false;

    service.setLanguage('en');
    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect((service as any)._saveService).toBe(saveService);
    expect(service.language()).toBe('en');
    expect(dirtyCalls).toBe(0);
    expect(saveCalls).toBe(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[SettingsService] Game not started yet, settings only in memory',
    );

    consoleLogSpy.mockRestore();
  });

  it('should report lazy-loaded save failures without losing the updated setting', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (service as any)._saveService = undefined;
    saveError = new Error('lazy save failed');

    service.setLanguage('en');
    await vi.dynamicImportSettled();
    await Promise.resolve();

    expect((service as any)._saveService).toBe(saveService);
    expect(service.language()).toBe('en');
    expect(dirtyCalls).toBe(1);
    expect(saveCalls).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[SettingsService] Immediate save failed:',
      saveError,
    );

    consoleErrorSpy.mockRestore();
  });

  it('should migrate legacy fullscreen false saves to windowed mode', () => {
    service.setState({
      musicVolume: 15,
      sfxVolume: 25,
      windowMode: undefined as never,
      resolution: '1280x720',
      language: 'en',
      fullscreen: false,
    } as {
      musicVolume: number;
      sfxVolume: number;
      windowMode: never;
      resolution: string;
      language: 'es' | 'en';
      fullscreen: boolean;
    });

    expect(service.windowMode()).toBe('windowed');
    expect(service.resolution()).toBe('1280x720');
    expect(setWindowModeCalls.at(-1)).toEqual({ mode: 'windowed', resolution: '1280x720' });
  });
});