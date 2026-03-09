import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { BackgroundGridComponent } from '../ui/background-grid/background-grid.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal/confirmation-modal.component';
import { GameStateService } from '../../services/game-state.service';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-options-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent, BackgroundGridComponent, ConfirmationModalComponent],
  template: `
    <div class="options-menu">
      <app-background-grid [opacity]="0.35"></app-background-grid>

      <!-- Partículas flotantes -->
      <div class="particles">
        <div
          class="particle"
          *ngFor="let p of particles"
          [style.left.%]="p.left"
          [style.animation-delay.s]="p.delay"
          [style.animation-duration.s]="p.duration"
        ></div>
      </div>

      <div class="options-content">
        <h1 class="options-title">{{ translationService.t('options.title') }}</h1>

        <div class="options-panel">
          <!-- Volumen Música -->
          <div class="option-item">
            <label class="option-label">
              {{ translationService.t('options.music_volume') }}
              <span class="option-value">{{ settingsService.musicVolume() }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              class="slider"
              [value]="settingsService.musicVolume()"
              (input)="onMusicVolumeChange($event)"
            />
          </div>

          <!-- Volumen Efectos -->
          <div class="option-item">
            <label class="option-label">
              {{ translationService.t('options.sfx_volume') }}
              <span class="option-value">{{ settingsService.sfxVolume() }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              class="slider"
              [value]="settingsService.sfxVolume()"
              (input)="onSfxVolumeChange($event)"
            />
          </div>

          <!-- Idioma -->
          <div class="option-item">
            <label class="option-label">
              {{ translationService.t('options.language') }}
            </label>
            <select
              class="select-input"
              [value]="settingsService.language()"
              (change)="onLanguageChange($event)"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <!-- Pantalla Completa (solo Electron) -->
          <div class="option-item" *ngIf="isElectron">
            <label class="option-label">
              {{ translationService.t('options.fullscreen') }}
            </label>
            <div class="toggle-container">
              <button
                class="toggle-button"
                [class.active]="settingsService.fullscreen()"
                (click)="toggleFullscreen()"
              >
                <span class="toggle-slider"></span>
              </button>
              <span class="toggle-text">
                {{
                  settingsService.fullscreen()
                    ? translationService.t('options.enabled')
                    : translationService.t('options.disabled')
                }}
              </span>
            </div>
          </div>

          <!-- Resolución (solo Electron) -->
          <div class="option-item" *ngIf="isElectron">
            <label class="option-label">
              {{ translationService.t('options.resolution') }}
            </label>
            <select
              class="select-input"
              [value]="settingsService.resolution()"
              (change)="onResolutionChange($event)"
            >
              <option value="1920x1080">1920 x 1080</option>
              <option value="1600x900">1600 x 900</option>
              <option value="1366x768">1366 x 768</option>
              <option value="1280x720">1280 x 720</option>
            </select>
          </div>
        </div>

        <div class="options-buttons">
          <app-button
            [label]="translationService.t('options.reset_defaults')"
            variant="secondary"
            size="lg"
            (clicked)="resetToDefaults()"
          />
          <app-button
            [label]="translationService.t('options.back')"
            variant="primary"
            size="lg"
            (clicked)="goBack()"
          />
        </div>
      </div>

      <!-- Modal de confirmación -->
      <app-confirmation-modal
        *ngIf="showResetModal()"
        titleKey="options.reset_title"
        messageKey="options.confirm_reset"
        confirmLabelKey="options.reset_confirm"
        cancelLabelKey="options.reset_cancel"
        confirmVariant="primary"
        (confirmed)="confirmReset()"
        (cancelled)="cancelReset()"
      />
    </div>
  `,
  styles: [
    `
      .options-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: 
          linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, transparent 20%),
          linear-gradient(-135deg, rgba(255, 193, 7, 0.03) 0%, transparent 20%),
          radial-gradient(circle at 50% 50%, #222 0%, #1a1a1a 50%, #0f0f0f 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        z-index: 10000;
        padding-top: var(--space-6);
        position: relative;
        overflow: hidden;
      }

      /* Halos de luz en esquinas */
      .options-menu::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 15% 15%, rgba(255, 193, 7, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 85% 15%, rgba(255, 193, 7, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 15% 85%, rgba(255, 193, 7, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 85% 85%, rgba(255, 193, 7, 0.1) 0%, transparent 8%),
          radial-gradient(ellipse at center top, rgba(255, 193, 7, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
        pointer-events: none;
        z-index: 1;
      }

      /* Partículas flotantes */
      .particles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }

      .particle {
        position: absolute;
        bottom: -10px;
        width: 3px;
        height: 3px;
        background: rgba(255, 193, 7, 0.6);
        border-radius: 50%;
        box-shadow: 
          0 0 4px rgba(255, 193, 7, 0.8),
          0 0 8px rgba(255, 193, 7, 0.4);
        animation: float-up linear infinite;
        opacity: 0;
      }

      @keyframes float-up {
        0% {
          transform: translateY(0) translateX(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(-100vh) translateX(20px);
          opacity: 0;
        }
      }

      .options-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 700px;
        position: relative;
        z-index: 3;
        padding: 0 var(--space-4);
      }

      .options-title {
        font-size: 48px;
        font-weight: 700;
        color: var(--color-accent-main);
        text-align: center;
        margin: 0 0 48px 0;
        text-shadow: 
          0 2px 8px rgba(255, 193, 7, 0.4),
          0 4px 16px rgba(255, 193, 7, 0.2);
        letter-spacing: 2px;
      }

      .options-panel {
        width: 100%;
        background: rgba(26, 26, 26, 0.9);
        border: 2px solid rgba(255, 193, 7, 0.3);
        border-radius: 12px;
        padding: 40px;
        margin-bottom: 40px;
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.6),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      .option-item {
        margin-bottom: 32px;
      }

      .option-item:last-child {
        margin-bottom: 0;
      }

      .option-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: 16px;
        letter-spacing: 0.5px;
      }

      .option-value {
        color: var(--color-accent-main);
        font-size: 14px;
        min-width: 50px;
        text-align: right;
      }

      /* Slider personalizado */
      .slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.1);
        outline: none;
        cursor: pointer;
        position: relative;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-accent-main);
        cursor: pointer;
        box-shadow: 
          0 2px 8px rgba(255, 193, 7, 0.5),
          0 0 0 2px rgba(255, 193, 7, 0.2);
        transition: all 0.2s ease;
      }

      .slider::-webkit-slider-thumb:hover {
        background: var(--color-accent-light);
        box-shadow: 
          0 3px 12px rgba(255, 193, 7, 0.7),
          0 0 0 3px rgba(255, 193, 7, 0.3);
        transform: scale(1.1);
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-accent-main);
        cursor: pointer;
        border: none;
        box-shadow: 
          0 2px 8px rgba(255, 193, 7, 0.5),
          0 0 0 2px rgba(255, 193, 7, 0.2);
        transition: all 0.2s ease;
      }

      .slider::-moz-range-thumb:hover {
        background: var(--color-accent-light);
        box-shadow: 
          0 3px 12px rgba(255, 193, 7, 0.7),
          0 0 0 3px rgba(255, 193, 7, 0.3);
        transform: scale(1.1);
      }

      /* Select personalizado */
      .select-input {
        width: 100%;
        padding: 12px;
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(255, 193, 7, 0.2);
        border-radius: 8px;
        color: var(--color-text-primary);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }

      .select-input:hover {
        border-color: rgba(255, 193, 7, 0.4);
        background: rgba(0, 0, 0, 0.5);
      }

      .select-input:focus {
        border-color: var(--color-accent-main);
        box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.1);
      }

      /* Toggle switch */
      .toggle-container {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .toggle-button {
        position: relative;
        width: 60px;
        height: 30px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 193, 7, 0.2);
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;
        outline: none;
      }

      .toggle-button:hover {
        border-color: rgba(255, 193, 7, 0.4);
      }

      .toggle-button.active {
        background: rgba(255, 193, 7, 0.3);
        border-color: var(--color-accent-main);
      }

      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 22px;
        height: 22px;
        background: var(--color-text-secondary);
        border-radius: 50%;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .toggle-button.active .toggle-slider {
        left: 32px;
        background: var(--color-accent-main);
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.5);
      }

      .toggle-text {
        font-size: 14px;
        color: var(--color-text-secondary);
        font-weight: 500;
      }

      .toggle-button.active + .toggle-text {
        color: var(--color-accent-main);
      }

      /* Botones */
      .options-buttons {
        display: flex;
        gap: var(--space-4);
        width: 100%;
        justify-content: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .options-content {
          max-width: 500px;
        }

        .options-title {
          font-size: 36px;
        }

        .options-panel {
          padding: var(--space-4);
        }

        .options-buttons {
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .options-title {
          font-size: 28px;
        }

        .option-label {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class OptionsMenuComponent {
  translationService = inject(TranslationService);
  settingsService = inject(SettingsService);
  private gameStateService = inject(GameStateService);

  isElectron = typeof window !== 'undefined' && !!window.electronApi;
  showResetModal = signal(false);

  // Partículas flotantes (mismas que el menú principal)
  particles = [
    { left: 10, delay: 0, duration: 15 },
    { left: 20, delay: 2, duration: 18 },
    { left: 35, delay: 4, duration: 20 },
    { left: 45, delay: 1, duration: 16 },
    { left: 55, delay: 3, duration: 19 },
    { left: 65, delay: 5, duration: 17 },
    { left: 75, delay: 2.5, duration: 21 },
    { left: 85, delay: 4.5, duration: 18 },
    { left: 15, delay: 6, duration: 19 },
    { left: 90, delay: 1.5, duration: 16 },
  ];

  onMusicVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.settingsService.setMusicVolume(Number(target.value));
  }

  onSfxVolumeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.settingsService.setSfxVolume(Number(target.value));
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const lang = target.value as 'es' | 'en';
    this.settingsService.setLanguage(lang);
    this.translationService.setLanguage(lang);
  }

  toggleFullscreen(): void {
    this.settingsService.toggleFullscreen();
  }

  onResolutionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.settingsService.setResolution(target.value);
  }

  resetToDefaults(): void {
    this.showResetModal.set(true);
  }

  confirmReset(): void {
    this.settingsService.resetToDefaults();
    // Aplicar idioma por defecto al servicio de traducción
    this.translationService.setLanguage(this.settingsService.language());
    this.showResetModal.set(false);
  }

  cancelReset(): void {
    this.showResetModal.set(false);
  }

  goBack(): void {
    this.gameStateService.returnToMenu();
  }
}
