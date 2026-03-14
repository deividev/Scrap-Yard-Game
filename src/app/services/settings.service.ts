import { Injectable, signal, inject, Injector } from '@angular/core';
import type { SaveService } from './save.service';

export type WindowMode = 'windowed' | 'maximized' | 'fullscreen';

export interface GameSettings {
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  windowMode: WindowMode;
  resolution: string; // '1920x1080', '1280x720', etc.
  language: 'es' | 'en';
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 50,
  sfxVolume: 70,
  windowMode: 'windowed',
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
  windowMode = signal<WindowMode>(DEFAULT_SETTINGS.windowMode);
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
        import('./save.service')
          .then(({ SaveService }) => {
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
          })
          .catch((e) => {
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
    this.windowMode.set(current.windowMode ?? 'windowed');
    this.resolution.set(current.resolution);
    this.language.set(current.language);
  }

  private applyWindowMode(mode: WindowMode, resolution: string): void {
    if (typeof window !== 'undefined' && window.electronApi?.setWindowMode) {
      window.electronApi.setWindowMode({ mode, resolution }).catch(() => {});
    }
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
   * Establece el modo de ventana: windowed | maximized | fullscreen (solo Electron)
   */
  setWindowMode(mode: WindowMode): void {
    this.settings.update((s) => ({ ...s, windowMode: mode }));
    this.windowMode.set(mode);
    this.markDirtyAndSave();
    this.applyWindowMode(mode, this.resolution());
  }

  /**
   * Establece la resolución (solo Electron, solo activo en modo ventana)
   */
  setResolution(resolution: string): void {
    this.settings.update((s) => ({ ...s, resolution }));
    this.resolution.set(resolution);
    this.markDirtyAndSave();
    if (this.windowMode() === 'windowed') {
      this.applyWindowMode('windowed', resolution);
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
    // Migración: saves anteriores usan fullscreen: boolean en lugar de windowMode
    const migrated: GameSettings = { ...newSettings };
    if (!migrated.windowMode) {
      migrated.windowMode = (newSettings as any).fullscreen ? 'fullscreen' : 'windowed';
    }
    this.settings.set(migrated);
    this.updateSignals();
    this.applyWindowMode(this.windowMode(), this.resolution());
  }
}
