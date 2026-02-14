import { Injectable, inject, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { UpgradeProgressService } from './upgrade-progress.service';
import { MachineUnlockService } from './machine-unlock.service';
import { SaveState } from '../models/save-state.model';
import { UpgradeId } from '../models/upgrade.model';

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

  private isDirty = signal(false);
  private isElectron = typeof window !== 'undefined' && !!window.electronApi;

  constructor() {
    console.log('[SaveService] Initialized');
    console.log('[SaveService] Is Electron:', this.isElectron);
    console.log('[SaveService] window.electronApi:', window.electronApi);

    if (this.isElectron) {
      this.logSavePath();
    }
  }

  private async logSavePath(): Promise<void> {
    try {
      const result = await window.electronApi!.getSavePath();
      if (result.success) {
        console.log('[SaveService] Save location:', result.path + '\\save.json');
      }
    } catch (error) {
      console.error('[SaveService] Could not get save path:', error);
    }
  }

  markDirty(): void {
    console.log('[SaveService] State marked as dirty');
    this.isDirty.set(true);
  }

  isDirtyState(): boolean {
    return this.isDirty();
  }

  async save(): Promise<void> {
    console.log('[SaveService] save() called. isDirty:', this.isDirty());

    if (!this.isDirty()) {
      return;
    }

    console.log('[SaveService] Preparing to save...');

    const saveState: SaveState = {
      resources: this.resourcesService.getState(),
      machines: this.machinesService.getState(),
      upgrades: this.upgradesService.getState(),
      scrapGenerationRate: this.scrapGenerationService.getAutomaticGenerationRate(),
      upgradeProgress: this.upgradeProgressService.serialize(),
      lastSaveTimestamp: Date.now(),
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
        console.log('[SaveService] Saving via Electron API...');
        const result = await window.electronApi!.saveGame(serialized);
        console.log('[SaveService] Electron save result:', result);
        if (!result.success) {
          console.error('Failed to save game via Electron:', result.error);
          return;
        }
        console.log('[SaveService] Save successful via Electron');
      } else {
        console.log('[SaveService] Saving via localStorage...');
        localStorage.setItem('scrapyard_save_tmp', serialized);
        localStorage.setItem('scrapyard_save', serialized);
        localStorage.removeItem('scrapyard_save_tmp');
        console.log('[SaveService] Save successful via localStorage');
      }

      this.isDirty.set(false);
    } catch (error) {
      console.error('Failed to save game state:', error);
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

        // Custom reviver to restore Infinity values
        const saveState: SaveState = JSON.parse(result.data, (key, value) => {
          if (value === '__INFINITY__') {
            return Infinity;
          }
          return value;
        });
        this.restoreState(saveState);
        return true;
      } else {
        const savedData = localStorage.getItem('scrapyard_save');
        if (!savedData) {
          return false;
        }

        // Custom reviver to restore Infinity values
        const saveState: SaveState = JSON.parse(savedData, (key, value) => {
          if (value === '__INFINITY__') {
            return Infinity;
          }
          return value;
        });
        this.restoreState(saveState);
        return true;
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  private restoreState(saveState: SaveState): void {
    this.resourcesService.setState(saveState.resources);
    this.machinesService.setState(saveState.machines);
    this.upgradesService.setState(saveState.upgrades);
    
    // Restaurar rate de generación automática
    // Si está guardado, usar ese valor; si no, recalcular basado en el nivel
    const savedRate = saveState.scrapGenerationRate || 0;
    const autoUpgradeLevel = this.upgradesService.getLevel(UpgradeId.UPG_SCRAP_002);
    
    if (savedRate === 0 && autoUpgradeLevel > 0) {
      // El rate guardado es 0 pero hay niveles en el upgrade, recalcular
      const correctRate = this.scrapGenerationService.getAutoRateByLevel(autoUpgradeLevel);
      this.scrapGenerationService.setAutomaticGenerationRate(correctRate);
      console.log(`[SaveService] Rate de generación automática recalculado: ${correctRate} (nivel ${autoUpgradeLevel})`);
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
        console.log(`[SaveService] ${completedUpgrades.length} upgrades completados offline:`, completedUpgrades);
      }
    }

    // Apply all storage upgrade effects after loading
    this.upgradesService.applyStorageUpgrades(this.resourcesService);

    // Check and unlock machines based on current state
    this.machineUnlockService.checkAndUnlockMachines();

    this.isDirty.set(false);
  }

  async hasSaveData(): Promise<boolean> {
    if (this.isElectron) {
      const result = await window.electronApi!.hasSave();
      return result.exists;
    } else {
      return localStorage.getItem('scrapyard_save') !== null;
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
  }

  async getSavePath(): Promise<string | null> {
    if (this.isElectron) {
      const result = await window.electronApi!.getSavePath();
      return result.success ? result.path : null;
    }
    return null;
  }
}
