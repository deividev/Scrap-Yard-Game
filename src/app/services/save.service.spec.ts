import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SaveService } from './save.service';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { UpgradeProgressService } from './upgrade-progress.service';
import { MachineUnlockService } from './machine-unlock.service';
import { SettingsService } from './settings.service';
import { TranslationService } from './translation.service';
import { StatisticsService } from './statistics.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { ContractService } from './contract.service';
import { ResourceType } from '../models/resource.model';
import { MachineType } from '../models/machine.model';
import { UpgradeId } from '../models/upgrade.model';
import { SAVE_VERSION, SaveState } from '../models/save-state.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';
import { createDefaultFirstRunTutorialState } from '../models/tutorial-step.model';

class MockResourcesService {
  state = [
    { id: ResourceType.MONEY, name: 'Money', amount: 100, capacity: Infinity, icon: 'money.png' },
    { id: ResourceType.SCRAP, name: 'Scrap', amount: 20, capacity: 75, icon: 'scrap.png' },
  ];
  setStateCalls: Array<Array<Record<string, unknown>>> = [];

  getState() {
    return this.state.map((resource) => ({ ...resource }));
  }

  setState(state: Array<Record<string, unknown>>): void {
    this.setStateCalls.push(state.map((resource) => ({ ...resource })));
    this.state = state.map((resource) => ({ ...resource })) as typeof this.state;
  }
}

class MockMachinesService {
  state = [
    {
      id: MachineType.SMELTER,
      name: 'Smelter',
      level: 1,
      baseSpeed: 1,
      baseConsumption: [{ resourceId: ResourceType.METAL, amount: 4 }],
      baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 1 },
      isActive: false,
      progress: 0,
      icon: 'smelter.png',
    },
  ];
  setStateCalls: Array<Array<Record<string, unknown>>> = [];

  getState() {
    return this.state.map((machine) => ({ ...machine }));
  }

  setState(state: Array<Record<string, unknown>>): void {
    this.setStateCalls.push(state.map((machine) => ({ ...machine })));
    this.state = state.map((machine) => ({ ...machine })) as typeof this.state;
  }
}

class MockUpgradesService {
  state = [{ id: UpgradeId.UPG_SCRAP_002, level: 1 }];
  setStateCalls: Array<Array<{ id: UpgradeId; level: number }>> = [];
  completeCalls: UpgradeId[] = [];
  applyStorageCalls = 0;

  getState() {
    return this.state.map((upgrade) => ({ ...upgrade }));
  }

  setState(state: Array<{ id: UpgradeId; level: number }>): void {
    this.setStateCalls.push(state.map((upgrade) => ({ ...upgrade })));
    this.state = state.map((upgrade) => ({ ...upgrade }));
  }

  getLevel(upgradeId: UpgradeId): number {
    return this.state.find((upgrade) => upgrade.id === upgradeId)?.level ?? 0;
  }

  completeUpgrade(upgradeId: UpgradeId): void {
    this.completeCalls.push(upgradeId);
    this.state = this.state.map((upgrade) =>
      upgrade.id === upgradeId ? { ...upgrade, level: upgrade.level + 1 } : upgrade,
    );
  }

  applyStorageUpgrades(): void {
    this.applyStorageCalls += 1;
  }
}

class MockScrapGenerationService {
  automaticRate = 0;
  setCalls: number[] = [];

  getAutomaticGenerationRate(): number {
    return this.automaticRate;
  }

  setAutomaticGenerationRate(rate: number): void {
    this.automaticRate = rate;
    this.setCalls.push(rate);
  }

  getAutoRateByLevel(level: number): number {
    return level * 3;
  }
}

class MockUpgradeProgressService {
  serialized = [
    {
      upgradeId: UpgradeId.UPG_STORE_001,
      targetLevel: 2,
      totalTime: 10,
      elapsedTime: 3,
      startTimestamp: 1000,
    },
  ];
  deserializeArg: unknown;
  offlineCompleted: UpgradeId[] = [];
  offlineCalls: number[] = [];
  resetCalls = 0;

  serialize() {
    return this.serialized.map((progress) => ({ ...progress }));
  }

  deserialize(value: unknown): void {
    this.deserializeArg = value;
  }

  processOfflineProgress(seconds: number): UpgradeId[] {
    this.offlineCalls.push(seconds);
    return [...this.offlineCompleted];
  }

  reset(): void {
    this.resetCalls += 1;
  }
}

class MockMachineUnlockService {
  checkCalls = 0;

  checkAndUnlockMachines(): void {
    this.checkCalls += 1;
  }
}

class MockSettingsService {
  state = {
    musicVolume: 50,
    sfxVolume: 70,
    windowMode: 'windowed' as const,
    resolution: '1920x1080',
    language: 'es' as const,
  };
  setStateCalls: Array<Record<string, unknown>> = [];

  getState() {
    return { ...this.state };
  }

  setState(state: typeof this.state): void {
    this.setStateCalls.push({ ...state });
    this.state = { ...state };
  }
}

class MockTranslationService {
  languageCalls: Array<'es' | 'en'> = [];

  t(key: string): string {
    return key;
  }

  setLanguage(language: 'es' | 'en'): void {
    this.languageCalls.push(language);
  }
}

class MockStatisticsService {
  state = { totalScrapGenerated: 10, playTimeSeconds: 5 };
  loadStateArg: unknown;
  resetCalls = 0;

  getState() {
    return { ...this.state };
  }

  loadState(state: unknown): void {
    this.loadStateArg = state;
  }

  reset(): void {
    this.resetCalls += 1;
  }
}

class MockFirstRunTutorialService {
  serialized = createDefaultFirstRunTutorialState();
  hydrateArg: unknown;
  resetCalls = 0;

  serialize() {
    return { ...this.serialized, flags: { ...this.serialized.flags } };
  }

  hydrate(state: unknown): void {
    this.hydrateArg = state;
  }

  reset(): void {
    this.resetCalls += 1;
  }
}

class MockContractService {
  serialized: unknown[] = [];
  spawnedFirst = false;
  seenIntro = false;
  hydrateCalls: Array<{ saved: unknown; options: unknown }> = [];
  resetCalls = 0;

  serialize() {
    return [...this.serialized];
  }

  hasSpawnedFirstContract(): boolean {
    return this.spawnedFirst;
  }

  hasSeenContractIntro(): boolean {
    return this.seenIntro;
  }

  hydrate(saved: unknown, options: unknown): void {
    this.hydrateCalls.push({ saved, options });
  }

  reset(): void {
    this.resetCalls += 1;
  }
}

type SaveTestContext = {
  service: SaveService;
  resourcesService: MockResourcesService;
  machinesService: MockMachinesService;
  upgradesService: MockUpgradesService;
  scrapGenerationService: MockScrapGenerationService;
  upgradeProgressService: MockUpgradeProgressService;
  machineUnlockService: MockMachineUnlockService;
  settingsService: MockSettingsService;
  translationService: MockTranslationService;
  statisticsService: MockStatisticsService;
  firstRunTutorialService: MockFirstRunTutorialService;
  contractService: MockContractService;
};

function setupSaveService(): SaveTestContext {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      SaveService,
      { provide: ResourcesService, useClass: MockResourcesService },
      { provide: MachinesService, useClass: MockMachinesService },
      { provide: UpgradesService, useClass: MockUpgradesService },
      { provide: ScrapGenerationService, useClass: MockScrapGenerationService },
      { provide: UpgradeProgressService, useClass: MockUpgradeProgressService },
      { provide: MachineUnlockService, useClass: MockMachineUnlockService },
      { provide: SettingsService, useClass: MockSettingsService },
      { provide: TranslationService, useClass: MockTranslationService },
      { provide: StatisticsService, useClass: MockStatisticsService },
      { provide: FirstRunTutorialService, useClass: MockFirstRunTutorialService },
      { provide: ContractService, useClass: MockContractService },
    ],
  });

  return {
    service: TestBed.inject(SaveService),
    resourcesService: TestBed.inject(ResourcesService) as unknown as MockResourcesService,
    machinesService: TestBed.inject(MachinesService) as unknown as MockMachinesService,
    upgradesService: TestBed.inject(UpgradesService) as unknown as MockUpgradesService,
    scrapGenerationService: TestBed.inject(ScrapGenerationService) as unknown as MockScrapGenerationService,
    upgradeProgressService: TestBed.inject(UpgradeProgressService) as unknown as MockUpgradeProgressService,
    machineUnlockService: TestBed.inject(MachineUnlockService) as unknown as MockMachineUnlockService,
    settingsService: TestBed.inject(SettingsService) as unknown as MockSettingsService,
    translationService: TestBed.inject(TranslationService) as unknown as MockTranslationService,
    statisticsService: TestBed.inject(StatisticsService) as unknown as MockStatisticsService,
    firstRunTutorialService: TestBed.inject(FirstRunTutorialService) as unknown as MockFirstRunTutorialService,
    contractService: TestBed.inject(ContractService) as unknown as MockContractService,
  };
}

describe('SaveService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-16T12:00:00.000Z'));
    localStorage.clear();
    delete (window as typeof window & { electronApi?: unknown }).electronApi;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    delete (window as typeof window & { electronApi?: unknown }).electronApi;
  });

  it('should migrate and restore a legacy local save with missing T4-T7 content and offline upgrade effects', async () => {
    const {
      service,
      resourcesService,
      machinesService,
      upgradesService,
      scrapGenerationService,
      upgradeProgressService,
      machineUnlockService,
      settingsService,
      translationService,
      statisticsService,
      firstRunTutorialService,
      contractService,
    } = setupSaveService();

    upgradeProgressService.offlineCompleted = [
      UpgradeId.UPG_STORE_001,
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
    ];

    const legacySave = {
      resources: [
        { id: ResourceType.MONEY, name: 'Money', amount: 250, capacity: '__INFINITY__', icon: 'money-old.png' },
        { id: ResourceType.SCRAP, name: 'Scrap', amount: 40, capacity: 75, icon: 'scrap-old.png' },
      ],
      machines: [
        {
          id: MachineType.SMELTER,
          name: 'Old Smelter',
          level: 2,
          baseSpeed: 99,
          baseConsumption: [{ resourceId: ResourceType.METAL, amount: 4 }],
          baseProduction: { resourceId: ResourceType.COMPONENTS, amount: 1 },
          isActive: true,
          progress: 0.5,
          icon: 'old-smelter.png',
        },
      ],
      upgrades: [{ id: UpgradeId.UPG_SCRAP_002, level: 1 }],
      scrapGenerationRate: 0,
      upgradeProgress: upgradeProgressService.serialize(),
      lastSaveTimestamp: Date.now() - 60000,
      settings: {
        musicVolume: 30,
        sfxVolume: 40,
        windowMode: 'windowed',
        resolution: '1280x720',
        language: 'en',
      },
      statistics: { totalScrapGenerated: 250, playTimeSeconds: 120 },
      firstRunTutorial: createDefaultFirstRunTutorialState(),
      contracts: [],
      firstContractSpawned: true,
    } as unknown as SaveState;

    localStorage.setItem('scrapyard_save', JSON.stringify(legacySave));

    await expect(service.load()).resolves.toBe(true);

    const loadedResources = resourcesService.setStateCalls.at(-1) ?? [];
    const loadedMachines = machinesService.setStateCalls.at(-1) ?? [];

    expect(loadedResources.some((resource) => resource['id'] === ResourceType.SERVER_RACK)).toBe(true);
    expect(loadedMachines.some((machine) => machine['id'] === MachineType.DATA_CENTER_ASSEMBLY)).toBe(true);
    expect(
      loadedMachines.find((machine) => machine['id'] === MachineType.SMELTER),
    ).toMatchObject({
      baseSpeed: 0.33,
      baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 2 }],
      baseProduction: { resourceId: ResourceType.COPPER, amount: 1 },
      progress: 0,
    });
    expect(contractService.hydrateCalls.at(-1)?.options).toEqual({
      hasSeenIntro: true,
      hasSpawnedFirstContract: true,
    });
    expect(settingsService.setStateCalls.at(-1)).toMatchObject({ language: 'en' });
    expect(translationService.languageCalls).toEqual(['en']);
    expect(statisticsService.loadStateArg).toEqual({ totalScrapGenerated: 250, playTimeSeconds: 120 });
    expect(firstRunTutorialService.hydrateArg).toEqual(createDefaultFirstRunTutorialState());
    expect(upgradeProgressService.deserializeArg).toEqual(upgradeProgressService.serialize());
    expect(upgradeProgressService.offlineCalls[0]).toBeGreaterThan(0);
    expect(upgradesService.completeCalls).toEqual([
      UpgradeId.UPG_STORE_001,
      UpgradeId.UPG_SCRAP_002,
      UpgradeId.UPG_MACH_001,
    ]);
    expect(scrapGenerationService.setCalls.at(-1)).toBeGreaterThan(0);
    expect(upgradesService.applyStorageCalls).toBeGreaterThan(0);
    expect(machineUnlockService.checkCalls).toBeGreaterThan(0);
    expect(service.isDirtyState()).toBe(false);
  });

  it('should return false for corrupted local saves in hasSaveData and load', async () => {
    const { service } = setupSaveService();
    const alertSpy = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal('alert', alertSpy);
    localStorage.setItem('scrapyard_save', '{bad-json');

    await expect(service.hasSaveData()).resolves.toBe(false);
    await expect(service.load()).resolves.toBe(false);

    expect(alertSpy).toHaveBeenCalledWith('alerts.save_corrupted');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log constructor save-path failures in electron mode', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (window as typeof window & { electronApi?: unknown }).electronApi = {
      ping: vi.fn().mockReturnValue('pong'),
      getSavePath: vi.fn().mockRejectedValue(new Error('path lookup failed')),
      saveGame: vi.fn().mockResolvedValue({ success: true }),
      loadGame: vi.fn().mockResolvedValue({ success: false, error: 'FILE_NOT_FOUND' }),
      hasSave: vi.fn().mockResolvedValue({ exists: false }),
      clearSave: vi.fn().mockResolvedValue({ success: true }),
    };

    setupSaveService();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[SaveService] Could not get save path:',
      expect.any(Error),
    );
  });

  it('should save through localStorage only when dirty and clear the save in web mode', async () => {
    const { service, firstRunTutorialService } = setupSaveService();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    await service.save();

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('scrapyard_save')).toBeNull();

    service.markGameStarted();
    await service.save();

    expect(localStorage.getItem('scrapyard_save')).not.toBeNull();
    expect(localStorage.getItem('scrapyard_save')).toContain('__INFINITY__');
    expect(localStorage.getItem('scrapyard_save_tmp')).toBeNull();
    expect(service.isDirtyState()).toBe(false);

    const writeCountAfterFirstSave = setItemSpy.mock.calls.length;

    await service.save();

    expect(setItemSpy.mock.calls).toHaveLength(writeCountAfterFirstSave);

    await service.clearSave();

    expect(localStorage.getItem('scrapyard_save')).toBeNull();
    expect(localStorage.getItem('scrapyard_save_tmp')).toBeNull();
    expect(service.isGameStarted()).toBe(false);
    expect(firstRunTutorialService.resetCalls).toBe(1);
  });

  it('should skip saving while another save is already in progress', async () => {
    const { service } = setupSaveService();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    service.markGameStarted();
    (service as unknown as { isSaving: boolean }).isSaving = true;

    await service.save();

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(service.isDirtyState()).toBe(true);
  });

  it('should load a minimal current-version save without optional sections and keep direct saved rates', async () => {
    const {
      service,
      resourcesService,
      machinesService,
      scrapGenerationService,
      upgradeProgressService,
      machineUnlockService,
      settingsService,
      translationService,
      statisticsService,
      firstRunTutorialService,
      contractService,
    } = setupSaveService();

    localStorage.setItem(
      'scrapyard_save',
      JSON.stringify({
        version: SAVE_VERSION,
        resources: [
          { id: ResourceType.MONEY, name: 'Money', amount: 80, capacity: 999999, icon: 'money.png' },
          { id: ResourceType.SCRAP, name: 'Scrap', amount: 12, capacity: 75, icon: 'scrap.png' },
        ],
        machines: [
          {
            id: MachineType.CRUSHER,
            name: 'Crusher',
            level: 1,
            baseSpeed: 1,
            baseConsumption: [],
            baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
            isActive: true,
            progress: 0.25,
            icon: 'crusher.png',
          },
        ],
        upgrades: [{ id: UpgradeId.UPG_SCRAP_002, level: 1 }],
        scrapGenerationRate: 5,
        gameStarted: true,
      } satisfies Partial<SaveState>),
    );

    await expect(service.load()).resolves.toBe(true);

    expect(resourcesService.setStateCalls.at(-1)).toHaveLength(2);
    expect(machinesService.setStateCalls.at(-1)?.some((machine) => machine['id'] === MachineType.CRUSHER)).toBe(true);
    expect(scrapGenerationService.automaticRate).toBe(5);
    expect(scrapGenerationService.setCalls.at(-1)).toBe(5);
    expect(upgradeProgressService.deserializeArg).toBeUndefined();
    expect(upgradeProgressService.offlineCalls).toEqual([]);
    expect(settingsService.setStateCalls).toEqual([]);
    expect(translationService.languageCalls).toEqual([]);
    expect(statisticsService.loadStateArg).toBeUndefined();
    expect(firstRunTutorialService.hydrateArg).toBeUndefined();
    expect(contractService.hydrateCalls.at(-1)).toEqual({
      saved: undefined,
      options: {
        hasSeenIntro: false,
        hasSpawnedFirstContract: false,
      },
    });
    expect(machineUnlockService.checkCalls).toBe(1);
    expect(service.isDirtyState()).toBe(false);
  });

  it('should use legacy resources as save-data fallback and return null for web save paths', async () => {
    const { service } = setupSaveService();

    await expect(service.hasSaveData()).resolves.toBe(false);

    localStorage.setItem(
      'scrapyard_save',
      JSON.stringify({
        version: 0,
        resources: [{ id: ResourceType.SCRAP, amount: 4 }],
        machines: [],
      }),
    );

    await expect(service.hasSaveData()).resolves.toBe(true);
    await expect(service.getSavePath()).resolves.toBeNull();
  });

  it('should return false for electron load failures and missing payloads', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (window as typeof window & { electronApi?: unknown }).electronApi = {
      ping: vi.fn().mockReturnValue('pong'),
      getSavePath: vi.fn().mockResolvedValue({ success: false }),
      saveGame: vi.fn().mockResolvedValue({ success: true }),
      loadGame: vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'FILE_NOT_FOUND' })
        .mockResolvedValueOnce({ success: false, error: 'DISK_ERROR' })
        .mockResolvedValueOnce({ success: true, data: null }),
      hasSave: vi.fn().mockResolvedValue({ exists: false }),
      clearSave: vi.fn().mockResolvedValue({ success: true }),
    };

    const { service } = setupSaveService();

    await expect(service.load()).resolves.toBe(false);
    await expect(service.load()).resolves.toBe(false);
    await expect(service.load()).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load game via Electron:', 'DISK_ERROR');
  });

  it('should return false from electron hasSaveData when the stored payload cannot be used', async () => {
    (window as typeof window & { electronApi?: unknown }).electronApi = {
      ping: vi.fn().mockReturnValue('pong'),
      getSavePath: vi.fn().mockResolvedValue({ success: false }),
      saveGame: vi.fn().mockResolvedValue({ success: true }),
      loadGame: vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'UNREADABLE' })
        .mockResolvedValueOnce({ success: true, data: null }),
      hasSave: vi.fn().mockResolvedValue({ exists: true }),
      clearSave: vi.fn().mockResolvedValue({ success: true }),
    };

    const { service } = setupSaveService();

    await expect(service.hasSaveData()).resolves.toBe(false);
    await expect(service.hasSaveData()).resolves.toBe(false);
    await expect(service.getSavePath()).resolves.toBeNull();
  });

  it('should use the electron persistence branches for save, load, hasSaveData, clearSave, and getSavePath', async () => {
    const electronApi = {
      ping: vi.fn().mockReturnValue('pong'),
      getSavePath: vi.fn().mockResolvedValue({ success: true, path: 'C:/ElectronSaves' }),
      saveGame: vi.fn().mockResolvedValue({ success: true }),
      loadGame: vi.fn().mockResolvedValue({
        success: true,
        data: JSON.stringify({
          version: SAVE_VERSION,
          resources: [{ id: ResourceType.MONEY, name: 'Money', amount: 20, capacity: '__INFINITY__', icon: 'money.png' }],
          machines: [],
          upgrades: [{ id: UpgradeId.UPG_SCRAP_002, level: 1 }],
          scrapGenerationRate: 3,
          settings: {
            musicVolume: 20,
            sfxVolume: 20,
            windowMode: 'windowed',
            resolution: '1280x720',
            language: 'es',
          },
          gameStarted: true,
          statistics: { totalScrapGenerated: 5, playTimeSeconds: 6 },
          firstRunTutorial: createDefaultFirstRunTutorialState(),
          contracts: [],
          firstContractSpawned: false,
          hasSeenContractIntro: false,
        }),
      }),
      hasSave: vi.fn().mockResolvedValue({ exists: true }),
      clearSave: vi.fn().mockResolvedValue({ success: true }),
    };

    (window as typeof window & { electronApi?: unknown }).electronApi = electronApi;

    const { service, firstRunTutorialService } = setupSaveService();

    service.markGameStarted();
    await service.save();

    expect(electronApi.saveGame).toHaveBeenCalledTimes(1);
    expect(electronApi.saveGame.mock.calls[0][0]).toContain('__INFINITY__');
    await expect(service.hasSaveData()).resolves.toBe(true);
    await expect(service.load()).resolves.toBe(true);
    await expect(service.getSavePath()).resolves.toBe('C:/ElectronSaves');

    await service.clearSave();

    expect(electronApi.clearSave).toHaveBeenCalledTimes(1);
    expect(firstRunTutorialService.resetCalls).toBe(1);
    expect(service.isGameStarted()).toBe(false);
  });

  it('should keep the save dirty when electron persistence reports a failed save result', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const electronApi = {
      ping: vi.fn().mockReturnValue('pong'),
      getSavePath: vi.fn().mockResolvedValue({ success: true, path: 'C:/ElectronSaves' }),
      saveGame: vi.fn().mockResolvedValue({ success: false, error: 'WRITE_DENIED' }),
      loadGame: vi.fn().mockResolvedValue({ success: false, error: 'FILE_NOT_FOUND' }),
      hasSave: vi.fn().mockResolvedValue({ exists: false }),
      clearSave: vi.fn().mockResolvedValue({ success: true }),
    };

    (window as typeof window & { electronApi?: unknown }).electronApi = electronApi;

    const { service } = setupSaveService();
    service.markGameStarted();

    await service.save();

    expect(electronApi.saveGame).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save game via Electron:', 'WRITE_DENIED');
    expect(service.isDirtyState()).toBe(true);
  });

  it('should log thrown save errors and allow a later retry to succeed', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { service } = setupSaveService();

    service.markGameStarted();

    setItemSpy.mockImplementationOnce(() => {
      throw new Error('disk full');
    });

    await service.save();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save game state:', expect.any(Error));
    expect(service.isDirtyState()).toBe(true);

    await service.save();

    expect(localStorage.getItem('scrapyard_save')).not.toBeNull();
    expect(service.isDirtyState()).toBe(false);
  });

  it('should reset the game state back to a new-game baseline', async () => {
    const {
      service,
      resourcesService,
      machinesService,
      upgradesService,
      scrapGenerationService,
      upgradeProgressService,
      statisticsService,
      firstRunTutorialService,
      contractService,
    } = setupSaveService();

    localStorage.setItem('scrapyard_save', 'existing-save');
    service.markGameStarted();

    await service.resetToNewGame();

    expect(localStorage.getItem('scrapyard_save')).toBeNull();
    expect(resourcesService.setStateCalls.at(-1)?.length).toBeGreaterThan(1);
    expect(machinesService.setStateCalls.at(-1)?.length).toBeGreaterThan(1);
    expect(upgradesService.setStateCalls.at(-1)).toHaveLength(UPGRADE_DEFINITIONS.length);
    expect(scrapGenerationService.automaticRate).toBe(0);
    expect(upgradeProgressService.resetCalls).toBe(1);
    expect(statisticsService.resetCalls).toBe(1);
    expect(firstRunTutorialService.resetCalls).toBe(2);
    expect(contractService.resetCalls).toBe(1);
    expect(service.isGameStarted()).toBe(false);
  });

  it('should preserve non-smelter machines and default contract intro flags across intermediate migrations', () => {
    const { service } = setupSaveService();

    const migratedFromV1 = (
      service as unknown as { migrateSave: (save: SaveState) => SaveState }
    ).migrateSave({
      version: 1,
      resources: [
        { id: ResourceType.SCRAP, name: 'Scrap', amount: 5, capacity: 50, icon: 'scrap.png' },
      ],
      machines: [
        {
          id: MachineType.CRUSHER,
          name: 'Crusher',
          level: 1,
          baseSpeed: 1.5,
          baseConsumption: [],
          baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
          isActive: true,
          progress: 0.25,
          icon: 'crusher.png',
        },
      ],
      upgrades: [],
      scrapGenerationRate: 0,
      lastSaveTimestamp: Date.now(),
    } as SaveState);

    expect(migratedFromV1.version).toBe(SAVE_VERSION);
    expect(migratedFromV1.machines.find((machine) => machine.id === MachineType.CRUSHER)).toMatchObject({
      baseSpeed: 1.5,
      baseProduction: { resourceId: ResourceType.METAL, amount: 1 },
      progress: 0.25,
    });
    expect(migratedFromV1.contracts).toEqual([]);
    expect(migratedFromV1.firstContractSpawned).toBe(false);
    expect(migratedFromV1.hasSeenContractIntro).toBe(false);

    const migratedFromV3 = (
      service as unknown as { migrateSave: (save: SaveState) => SaveState }
    ).migrateSave({
      version: 3,
      resources: [
        { id: ResourceType.SCRAP, name: 'Scrap', amount: 5, capacity: 50, icon: 'scrap.png' },
      ],
      machines: [],
      upgrades: [],
      scrapGenerationRate: 0,
      lastSaveTimestamp: Date.now(),
      contracts: [],
    } as SaveState);

    expect(migratedFromV3.version).toBe(SAVE_VERSION);
    expect(migratedFromV3.firstContractSpawned).toBe(false);
    expect(migratedFromV3.hasSeenContractIntro).toBe(false);
  });
});