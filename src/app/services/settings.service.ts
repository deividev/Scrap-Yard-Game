import { Injectable, signal, inject, Injector } from '@angular/core';
import type { SaveService } from './save.service';

export interface GameSettings {
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  fullscreen: boolean;
  resolution: string; // '1920x1080', '1280x720', etc.
  language: 'es' | 'en';
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 50,
  sfxVolume: 70,
  fullscreen: false,
  resolution: '1920x1080',
  language: 'es',
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settings = signal<GameSettings>(DEFAULT_SETTINGS);
  private injector = inject(Injector);
  private _saveService?: SaveService;

  // Señales públicas para cada configuración
  musicVolume = signal(DEFAULT_SETTINGS.musicVolume);
  sfxVolume = signal(DEFAULT_SETTINGS.sfxVolume);
  fullscreen = signal(DEFAULT_SETTINGS.fullscreen);
  resolution = signal(DEFAULT_SETTINGS.resolution);
  language = signal<'es' | 'en'>(DEFAULT_SETTINGS.language);

  /**
   * Marca el estado como modificado y guarda inmediatamente
   * (las opciones se guardan al instante, sin esperar al auto-save)
   * SOLO si el juego ya ha sido iniciado. Si no, las opciones quedan en memoria.
   */
  private markDirtyAndSave(): void {
    // Lazy injection para evitar dependencia circular
    if (!this._saveService) {
      try {
        // Import dinámico para evitar dependencia circular en tiempo de compilación
        import('./save.service').then(({ SaveService }) => {
          this._saveService = this.injector.get(SaveService);
          if (this._saveService) {
            console.log('[SettingsService] SaveService loaded successfully');
            
            // IMPORTANTE: Solo guardar si el juego ya ha sido iniciado
            if (this._saveService.isGameStarted()) {
              console.log('[SettingsService] Game started, saving settings immediately');
              this._saveService.markDirty();
              this._saveService.save().catch((e) => {
                console.error('[SettingsService] Immediate save failed:', e);
              });
            } else {
              console.log('[SettingsService] Game not started yet, settings only in memory');
            }
          }
        }).catch((e) => {
          console.warn('[SettingsService] Could not load SaveService:', e);
        });
      } catch (e) {
        console.warn('[SettingsService] SaveService injection failed:', e);
      }
    } else {
      // IMPORTANTE: Solo guardar si el juego ya ha sido iniciado
      if (this._saveService.isGameStarted()) {
        console.log('[SettingsService] Game started, saving settings immediately');
        this._saveService.markDirty();
        this._saveService.save().catch((e) => {
          console.error('[SettingsService] Immediate save failed:', e);
        });
      } else {
        console.log('[SettingsService] Game not started yet, settings only in memory');
      }
    }
  }

  /**
   * Actualiza las señales individuales desde el objeto de settings
   */
  private updateSignals(): void {
    const current = this.settings();
    this.musicVolume.set(current.musicVolume);
    this.sfxVolume.set(current.sfxVolume);
    this.fullscreen.set(current.fullscreen);
    this.resolution.set(current.resolution);
    this.language.set(current.language);
  }

  /**
   * Establece el volumen de la música (0-100)
   */
  setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, volume));
    this.settings.update((s) => ({ ...s, musicVolume: clamped }));
    this.musicVolume.set(clamped);
    this.markDirtyAndSave();
  }

  /**
   * Establece el volumen de efectos de sonido (0-100)
   */
  setSfxVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, volume));
    this.settings.update((s) => ({ ...s, sfxVolume: clamped }));
    this.sfxVolume.set(clamped);
    this.markDirtyAndSave();
  }

  /**
   * Alterna pantalla completa (solo Electron)
   */
  toggleFullscreen(): void {
    const newValue = !this.fullscreen();
    this.settings.update((s) => ({ ...s, fullscreen: newValue }));
    this.fullscreen.set(newValue);
    this.markDirtyAndSave();

    // Aplicar cambio en Electron
    if (typeof window !== 'undefined' && window.electronApi?.toggleFullscreen) {
      window.electronApi.toggleFullscreen();
    }
  }

  /**
   * Establece la resolución (solo Electron)
   */
  setResolution(resolution: string): void {
    this.settings.update((s) => ({ ...s, resolution }));
    this.resolution.set(resolution);
    this.markDirtyAndSave();

    // Aplicar cambio en Electron
    if (typeof window !== 'undefined' && window.electronApi?.setResolution) {
      window.electronApi.setResolution(resolution);
    }
  }

  /**
   * Cambia el idioma del juego
   */
  setLanguage(language: 'es' | 'en'): void {
    this.settings.update((s) => ({ ...s, language }));
    this.language.set(language);
    this.markDirtyAndSave();
  }

  /**
   * Resetea todas las configuraciones a sus valores por defecto
   */
  resetToDefaults(): void {
    this.settings.set({ ...DEFAULT_SETTINGS });
    this.updateSignals();
    this.markDirtyAndSave();
  }

  /**
   * Obtiene el estado actual de las configuraciones (usado por SaveService)
   */
  getState(): GameSettings {
    return { ...this.settings() };
  }

  /**
   * Establece el estado completo de las configuraciones (usado por SaveService)
   */
  setState(newSettings: GameSettings): void {
    this.settings.set({ ...newSettings });
    this.updateSignals();
  }
}
