import { Injectable, inject, isDevMode, signal } from '@angular/core';
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
import { SaveState, SAVE_VERSION } from '../models/save-state.model';
import { UpgradeId } from '../models/upgrade.model';
import { MachineType } from '../models/machine.model';
import { ResourceType } from '../models/resource.model';
import { INITIAL_RESOURCES } from '../config/resources.config';
import { INITIAL_MACHINES } from '../config/machines.config';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';

@Injectable({
  providedIn: 'root',
})
export class SaveService {
  private resourcesService = inject(ResourcesService);
  private machinesService = inject(MachinesService);
  private upgradesService = inject(UpgradesService);
  private scrapGenerationService = inject(ScrapGenerationService);
  private upgradeProgressService = inject(UpgradeProgressService);
  private machineUnlockService = inject(MachineUnlockService);
  private settingsService = inject(SettingsService);
  private translationService = inject(TranslationService);
  private statisticsService = inject(StatisticsService);
  private firstRunTutorialService = inject(FirstRunTutorialService);

  private isDirty = signal(false);
  private isSaving = false;
  private gameStarted = signal(false);
  private isElectron = typeof window !== 'undefined' && !!window.electronApi;
  private readonly isDev = isDevMode();

  constructor() {
    this.debugLog('[SaveService] Initialized');
    this.debugLog('[SaveService] Is Electron:', this.isElectron);
    if (this.isElectron) {
      this.debugLog('[SaveService] window.electronApi:', window.electronApi);
    }

    if (this.isElectron) {
      this.logSavePath();
    }
  }

  private async logSavePath(): Promise<void> {
    try {
      const result = await window.electronApi!.getSavePath();
      if (result.success) {
        this.debugLog('[SaveService] Save location:', result.path + '\\save.json');
      }
    } catch (error) {
      console.error('[SaveService] Could not get save path:', error);
    }
  }

  private debugLog(message: string, ...optionalParams: unknown[]): void {
    if (!this.isDev) {
      return;
    }

    console.log(message, ...optionalParams);
  }

  markDirty(): void {
    this.debugLog('[SaveService] State marked as dirty');
    this.isDirty.set(true);
  }

  isDirtyState(): boolean {
    return this.isDirty();
  }

  /**
   * Marca que el usuario ha iniciado el juego
   * (no solo guardado configuraciones)
   */
  markGameStarted(): void {
    this.gameStarted.set(true);
    this.markDirty();
  }

  /**
   * Signal de solo lectura para que componentes puedan reaccionar
   * al estado de gameStarted
   */
  isGameStarted = this.gameStarted.asReadonly();

  async save(): Promise<void> {
    this.debugLog('[SaveService] save() called. isDirty:', this.isDirty());

    if (!this.isDirty() || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.debugLog('[SaveService] Preparing to save...');

    const saveState: SaveState = {
      version: SAVE_VERSION,
      resources: this.resourcesService.getState(),
      machines: this.machinesService.getState(),
      upgrades: this.upgradesService.getState(),
      scrapGenerationRate: this.scrapGenerationService.getAutomaticGenerationRate(),
      upgradeProgress: this.upgradeProgressService.serialize(),
      lastSaveTimestamp: Date.now(),
      settings: this.settingsService.getState(),
      gameStarted: this.gameStarted(),
      statistics: this.statisticsService.getState(),
      firstRunTutorial: this.firstRunTutorialService.serialize(),
    };

    // Custom replacer to handle Infinity values
    const serialized = JSON.stringify(saveState, (key, value) => {
      if (value === Infinity) {
        return '__INFINITY__';
      }
      return value;
    });

    try {
      if (this.isElectron) {
        this.debugLog('[SaveService] Saving via Electron API...');
        const result = await window.electronApi!.saveGame(serialized);
        this.debugLog('[SaveService] Electron save result:', result);
        if (!result.success) {
          console.error('Failed to save game via Electron:', result.error);
          return;
        }
        this.debugLog('[SaveService] Save successful via Electron');
      } else {
        this.debugLog('[SaveService] Saving via localStorage...');
        localStorage.setItem('scrapyard_save_tmp', serialized);
        localStorage.setItem('scrapyard_save', serialized);
        localStorage.removeItem('scrapyard_save_tmp');
        this.debugLog('[SaveService] Save successful via localStorage');
      }

      this.isDirty.set(false);
    } catch (error) {
      console.error('Failed to save game state:', error);
    } finally {
      this.isSaving = false;
    }
  }

  async load(): Promise<boolean> {
    try {
      if (this.isElectron) {
        const result = await window.electronApi!.loadGame();

        if (!result.success) {
          if (result.error === 'FILE_NOT_FOUND') {
            return false;
          }
          console.error('Failed to load game via Electron:', result.error);
          return false;
        }

        if (!result.data) {
          return false;
        }

        const saveState: SaveState = this.migrateSave(
          JSON.parse(result.data, (key, value) => {
            if (value === '__INFINITY__') return Infinity;
            return value;
          }),
        );
        this.restoreState(saveState);
        return true;
      } else {
        const savedData = localStorage.getItem('scrapyard_save');
        if (!savedData) {
          return false;
        }

        const saveState: SaveState = this.migrateSave(
          JSON.parse(savedData, (key, value) => {
            if (value === '__INFINITY__') return Infinity;
            return value;
          }),
        );
        this.restoreState(saveState);
        return true;
      }
    } catch (error) {
      console.error('[SaveService] Failed to load game state:', error);
      alert(this.translationService.t('alerts.save_corrupted'));
      return false;
    }
  }

  private restoreState(saveState: SaveState): void {
    this.resourcesService.setState(saveState.resources);

    // Merge saved machines with INITIAL_MACHINES to inject any new machines
    // added after the save was created (they won't exist in the save file).
    const savedIds = new Set(saveState.machines.map((m) => m.id));
    const mergedMachines = [
      ...saveState.machines,
      ...INITIAL_MACHINES.filter((m) => !savedIds.has(m.id)).map((m) => ({ ...m })),
    ];
    this.machinesService.setState(mergedMachines);

    this.upgradesService.setState(saveState.upgrades);

    // Restaurar flag de juego iniciado (siempre establecer el valor explícitamente)
    this.gameStarted.set(saveState.gameStarted === true);

    // Restaurar configuraciones si están disponibles
    if (saveState.settings) {
      this.settingsService.setState(saveState.settings);
      // Sincronizar idioma con TranslationService
      this.translationService.setLanguage(saveState.settings.language);
    }

    // Restaurar rate de generación automática
    // Si está guardado, usar ese valor; si no, recalcular basado en el nivel
    const savedRate = saveState.scrapGenerationRate || 0;
    const autoUpgradeLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);

    if (savedRate === 0 && autoUpgradeLevel > 0) {
      // El rate guardado es 0 pero hay niveles en el upgrade, recalcular
      const correctRate = this.scrapGenerationService.getAutoRateByLevel(autoUpgradeLevel);
      this.scrapGenerationService.setAutomaticGenerationRate(correctRate);
      this.debugLog(
        `[SaveService] Rate de generación automática recalculado: ${correctRate} (nivel ${autoUpgradeLevel})`,
      );
    } else {
      this.scrapGenerationService.setAutomaticGenerationRate(savedRate);
    }

    // Restaurar progreso de upgrades
    if (saveState.upgradeProgress) {
      this.upgradeProgressService.deserialize(saveState.upgradeProgress);
    }

    // Procesar progreso offline
    if (saveState.lastSaveTimestamp) {
      const offlineTime = (Date.now() - saveState.lastSaveTimestamp) / 1000; // En segundos
      const completedUpgrades = this.upgradeProgressService.processOfflineProgress(offlineTime);

      // Aplicar efectos de upgrades completados offline
      for (const upgradeId of completedUpgrades) {
        this.upgradesService.completeUpgrade(upgradeId);

        // Si es un upgrade de almacenamiento, actualizar capacidades
        if (upgradeId.startsWith('UPG_STORE_')) {
          this.upgradesService.applyStorageUpgrades(this.resourcesService);
        }

        // Si es el upgrade de generación automática de chatarra, actualizar el rate
        if (upgradeId === UpgradeId.UPG_SCRAP_002) {
          const newLevel = this.upgradesService.getLevel(upgradeId);
          const newRate = this.scrapGenerationService.getAutoRateByLevel(newLevel);
          this.scrapGenerationService.setAutomaticGenerationRate(newRate);
        }

        // Si es un upgrade de máquina, verificar desbloqueos
        if (upgradeId.startsWith('UPG_MACH_')) {
          this.machineUnlockService.checkAndUnlockMachines();
        }
      }

      if (completedUpgrades.length > 0) {
        this.debugLog(
          `[SaveService] ${completedUpgrades.length} upgrades completados offline:`,
          completedUpgrades,
        );
      }
    }

    // Restaurar estadísticas si están disponibles
    if (saveState.statistics) {
      this.statisticsService.loadState(saveState.statistics);
    }

    this.firstRunTutorialService.hydrate(saveState.firstRunTutorial);

    // Apply all storage upgrade effects after loading
    this.upgradesService.applyStorageUpgrades(this.resourcesService);

    // Check and unlock machines based on current state
    this.machineUnlockService.checkAndUnlockMachines();

    this.isDirty.set(false);
  }

  async hasSaveData(): Promise<boolean> {
    // Primero verificar si existe el archivo/clave
    let exists = false;
    if (this.isElectron) {
      const result = await window.electronApi!.hasSave();
      exists = result.exists;
    } else {
      exists = localStorage.getItem('scrapyard_save') !== null;
    }

    // Si no existe, retornar false inmediatamente
    if (!exists) {
      return false;
    }

    // Si existe, verificar si el juego ha sido iniciado (no solo configuraciones guardadas)
    // Intentar cargar el save y verificar el flag gameStarted
    try {
      let savedData: string | null = null;
      if (this.isElectron) {
        const result = await window.electronApi!.loadGame();
        savedData = result.success ? (result.data ?? null) : null;
      } else {
        savedData = localStorage.getItem('scrapyard_save');
      }

      if (!savedData) {
        return false;
      }

      const saveState: SaveState = JSON.parse(savedData, (key, value) => {
        if (value === '__INFINITY__') return Infinity;
        return value;
      });
      // Solo consideramos que hay un juego guardado si gameStarted es true.
      // Legacy saves (v0/v1) predan el campo gameStarted pero son válidos si tienen recursos.
      return saveState.gameStarted === true || (Array.isArray(saveState.resources) && saveState.resources.length > 0);
    } catch (error) {
      console.error('[SaveService] Error checking gameStarted flag:', error);
      // En caso de error, asumir que no hay juego guardado
      return false;
    }
  }

  async clearSave(): Promise<void> {
    if (this.isElectron) {
      await window.electronApi!.clearSave();
    } else {
      localStorage.removeItem('scrapyard_save');
      localStorage.removeItem('scrapyard_save_tmp');
    }
    this.isDirty.set(false);
    this.gameStarted.set(false);
    this.firstRunTutorialService.reset();
  }

  async resetToNewGame(): Promise<void> {
    await this.clearSave();
    this.resourcesService.setState(INITIAL_RESOURCES.map((r) => ({ ...r })));
    this.machinesService.setState(INITIAL_MACHINES.map((m) => ({ ...m })));
    this.upgradesService.setState(UPGRADE_DEFINITIONS.map((d) => ({ id: d.id, level: 1 })));
    this.scrapGenerationService.setAutomaticGenerationRate(0);
    this.upgradeProgressService.reset();
    this.statisticsService.reset();
    this.firstRunTutorialService.reset();
  }

  async getSavePath(): Promise<string | null> {
    if (this.isElectron) {
      const result = await window.electronApi!.getSavePath();
      return result.success ? result.path : null;
    }
    return null;
  }

  private migrateSave(save: SaveState): SaveState {
    const from = save.version ?? 0;
    if (from === SAVE_VERSION) return save;

    this.debugLog(`[SaveService] Migrating save from v${from} to v${SAVE_VERSION}`);

    // v0 → v1: version field did not exist, no data changes needed
    if ((save.version ?? 0) < 1) {
      save = { ...save, version: 1 };
    }

    // v1 → v2: F0 rebalanceo Fundidora + pre-inicializar campos F1 y F4
    if (save.version < 2) {
      // Corregir Fundidora: 4 Metal → 2 Cobre (0.25/s) => 2 Scrap → 1 Cobre (0.33/s)
      const machines = save.machines.map((m) => {
        if (m.id === MachineType.SMELTER) {
          return {
            ...m,
            baseSpeed: 0.33,
            baseConsumption: [{ resourceId: ResourceType.SCRAP, amount: 2 }],
            baseProduction: { resourceId: ResourceType.COPPER, amount: 1 },
            progress: 0,
          };
        }
        return m;
      });
      save = {
        ...save,
        version: 2,
        machines,
        contracts: save.contracts ?? [],
        lastContractSpawnCheck: save.lastContractSpawnCheck ?? Date.now(),
        firstContractSpawned: save.firstContractSpawned ?? false,
        completedMilestones: save.completedMilestones ?? [],
      };
      this.isDirty.set(true);
    }

    // v2 → v3: F2 — inicializar 9 recursos T4-T7 y 9 máquinas T4-T7
    if (save.version < 3) {
      const t4t7ResourceIds = [
        ResourceType.CIRCUIT_BOARD,
        ResourceType.HDD,
        ResourceType.SCREEN,
        ResourceType.GPU,
        ResourceType.SMARTPHONE,
        ResourceType.LAPTOP,
        ResourceType.DESKTOP_PC,
        ResourceType.MINING_RIG,
        ResourceType.SERVER_RACK,
      ];
      const t4t7MachineIds = [
        MachineType.PCB_PRINTER,
        MachineType.HDD_ASSEMBLER,
        MachineType.SCREEN_FABRICATOR,
        MachineType.GPU_FAB,
        MachineType.SMARTPHONE_FACTORY,
        MachineType.LAPTOP_WORKSHOP,
        MachineType.PC_BUILDER,
        MachineType.MINING_RIG_ASSEMBLY,
        MachineType.DATA_CENTER_ASSEMBLY,
      ];
      const existingResourceIds = new Set(save.resources.map((r) => r.id));
      const existingMachineIds = new Set(save.machines.map((m) => m.id));
      const newResources = t4t7ResourceIds
        .filter((id) => !existingResourceIds.has(id))
        .map((id) => {
          const base = INITIAL_RESOURCES.find((r) => r.id === id);
          return base ? { ...base, amount: 0 } : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      const newMachines = t4t7MachineIds
        .filter((id) => !existingMachineIds.has(id))
        .map((id) => {
          const base = INITIAL_MACHINES.find((m) => m.id === id);
          return base ? { ...base, level: 0, isActive: false, progress: 0 } : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);
      save = {
        ...save,
        version: 3,
        resources: [...save.resources, ...newResources],
        machines: [...save.machines, ...newMachines],
      };
      this.isDirty.set(true);
    }

    return save;
  }
}
