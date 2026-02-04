import { Injectable, inject, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { SaveState } from '../models/save-state.model';

@Injectable({
  providedIn: 'root',
})
export class SaveService {
  private resourcesService = inject(ResourcesService);
  private machinesService = inject(MachinesService);
  private upgradesService = inject(UpgradesService);
  private scrapGenerationService = inject(ScrapGenerationService);

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
    };

    const serialized = JSON.stringify(saveState);

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

        const saveState: SaveState = JSON.parse(result.data);
        this.restoreState(saveState);
        return true;
      } else {
        const savedData = localStorage.getItem('scrapyard_save');
        if (!savedData) {
          return false;
        }

        const saveState: SaveState = JSON.parse(savedData);
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
    this.scrapGenerationService.setAutomaticGenerationRate(saveState.scrapGenerationRate);
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
