import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { BackgroundGridComponent } from '../ui/background-grid/background-grid.component';
import { ConfirmationModalComponent } from '../ui/confirmation-modal/confirmation-modal.component';
import { GameStateService } from '../../services/game-state.service';
import { SaveService } from '../../services/save.service';
import { TranslationService } from '../../services/translation.service';
import { version, releaseLabel } from '../../../../package.json';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, BackgroundGridComponent, ConfirmationModalComponent],
  template: `
    <div class="main-menu">
      <!-- Fondo atmosférico -->
      <img src="assets/image/menu_bg.png" class="menu-bg" aria-hidden="true" />
      <div class="menu-bg-overlay"></div>

      <app-background-grid [opacity]="0.35"></app-background-grid>

      <!-- Partículas flotantes -->
      <div class="particles">
        @for (p of particles; track $index) {
          <div
            class="particle"
            [style.left.%]="p.left"
            [style.animation-delay.s]="p.delay"
            [style.animation-duration.s]="p.duration"
          ></div>
        }
      </div>

      <!-- Engranajes decorativos -->
      <img src="assets/image/engram_menu.png" class="gear gear--left" aria-hidden="true" />
      <img src="assets/image/engram_menu.png" class="gear gear--right" aria-hidden="true" />

      <div class="menu-content">
        <div class="game-logo">
          <img
            src="assets/image/logo_scrap_yard.png"
            [attr.alt]="translationService.t('main_menu.title')"
            class="logo-image"
          />
          <p class="game-subtitle">{{ translationService.t('main_menu.subtitle') }}</p>
        </div>

        <div class="menu-buttons">
          @if (hasSavedGame()) {
            <app-button
              [label]="translationService.t('main_menu.continue')"
              variant="primary"
              size="lg"
              (clicked)="continueGame()"
            />
          }
          <app-button
            [label]="
              hasSavedGame()
                ? translationService.t('main_menu.new_game')
                : translationService.t('main_menu.play')
            "
            [variant]="hasSavedGame() ? 'secondary' : 'primary'"
            size="lg"
            (clicked)="newGame()"
          />
          <app-button
            [label]="translationService.t('main_menu.options')"
            variant="ghost"
            size="lg"
            (clicked)="openOptions()"
          />
          @if (isElectron) {
            <app-button
              [label]="translationService.t('main_menu.exit')"
              variant="ghost"
              size="lg"
              (clicked)="exitGame()"
            />
          }
        </div>

        <div class="version-info">
          <span>{{ appVersionLabel }}</span>
        </div>
      </div>

      @if (showNewGameModal()) {
        <!-- Modal Nueva Partida -->
        <app-confirmation-modal
          titleKey="main_menu.new_game"
          messageKey="main_menu.confirm_new_game"
          confirmLabelKey="main_menu.new_game_confirm"
          cancelLabelKey="options.reset_cancel"
          confirmVariant="primary"
          (confirmed)="confirmNewGame()"
          (cancelled)="showNewGameModal.set(false)"
        />
      }
    </div>
  `,
  styles: [
    `
      .main-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #0f0f0f;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: clamp(8px, 2vh, 32px) 16px;
        overflow: hidden;
      }

      /* Fondo imagen */
      .menu-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        z-index: 0;
        pointer-events: none;
      }

      /* Overlay central para legibilidad */
      .menu-bg-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          /* oscurecer lado derecho donde está la máquina brillante */
          linear-gradient(
            to left,
            rgba(0, 0, 0, 0.72) 0%,
            rgba(0, 0, 0, 0.35) 45%,
            transparent 65%
          ),
          /* oscurecer zona central donde van logo y botones */
          radial-gradient(ellipse 55% 70% at 42% 52%, rgba(0, 0, 0, 0.55) 0%, transparent 100%);
        z-index: 0;
        pointer-events: none;
      }

      /* Halos de luz en esquinas */
      .main-menu::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(circle at 15% 15%, rgba(255, 152, 0, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 85% 15%, rgba(255, 152, 0, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 15% 85%, rgba(255, 152, 0, 0.1) 0%, transparent 8%),
          radial-gradient(circle at 85% 85%, rgba(255, 152, 0, 0.1) 0%, transparent 8%),
          radial-gradient(ellipse at center top, rgba(255, 152, 0, 0.08) 0%, transparent 40%),
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
        background: rgba(255, 152, 0, 0.6);
        border-radius: 50%;
        box-shadow:
          0 0 4px rgba(255, 152, 0, 0.8),
          0 0 8px rgba(255, 152, 0, 0.4);
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

      .menu-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        position: relative;
        z-index: 3;
      }

      /* Engranajes decorativos reales */
      .gear {
        position: fixed;
        pointer-events: none;
        z-index: 2;
        opacity: 0.75;
        filter: drop-shadow(0 0 12px rgba(255, 152, 0, 0.35));
      }

      .gear--left {
        width: 160px;
        height: 160px;
        top: 8%;
        left: 6%;
        animation: rotate-gear-slow 30s linear infinite;
      }

      .gear--right {
        width: 110px;
        height: 110px;
        bottom: 12%;
        right: 8%;
        animation: rotate-gear-slow-reverse 25s linear infinite;
      }

      @keyframes rotate-gear-slow {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes rotate-gear-slow-reverse {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(-360deg);
        }
      }

      .game-logo {
        text-align: center;
        margin-bottom: clamp(16px, 3vh, 48px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        width: 100%;
      }

      .logo-image {
        max-width: 600px;
        width: 90%;
        max-height: 30vh;
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 6px 16px rgba(255, 152, 0, 0.4));
        animation: logo-glow 3s ease-in-out infinite;
      }

      @keyframes logo-glow {
        0%,
        100% {
          filter: drop-shadow(0 6px 16px rgba(255, 152, 0, 0.4));
        }
        50% {
          filter: drop-shadow(0 8px 24px rgba(255, 152, 0, 0.6));
        }
      }

      .game-subtitle {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(11px, 1.4vh, 15px);
        color: var(--color-text-secondary);
        font-weight: 400;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .menu-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: clamp(8px, 1.5vh, 16px);
        background: rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: clamp(12px, 2vh, 24px) clamp(20px, 4vw, 48px);
        border-radius: var(--border-radius-medium);
      }

      .version-info {
        position: fixed;
        bottom: 16px;
        right: 16px;
        color: var(--color-text-secondary);
        font-size: 12px;
        opacity: 0.7;
        z-index: 10;
      }

      @media (max-width: 768px) {
        .logo-image {
          max-width: 450px;
          width: 85%;
        }

        .game-subtitle {
          font-size: 14px;
        }

        .menu-buttons {
          width: 90%;
          max-width: 350px;
        }

        .version-info {
          bottom: 12px;
          right: 12px;
          font-size: 11px;
        }

        .gear--left {
          width: 100px;
          height: 100px;
          top: 5%;
          left: 3%;
        }

        .gear--right {
          width: 70px;
          height: 70px;
          bottom: 8%;
          right: 3%;
        }
      }

      @media (max-width: 480px) {
        .logo-image {
          max-width: 350px;
        }

        .version-info {
          bottom: 8px;
          right: 8px;
          font-size: 10px;
        }

        .gear {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class MainMenuComponent implements OnInit {
  readonly appVersionLabel = (releaseLabel ? releaseLabel + ' ' : '') + 'v' + version;
  translationService = inject(TranslationService);
  private gameStateService = inject(GameStateService);
  private saveService = inject(SaveService);

  // Computed reactivo que lee directamente del SaveService
  hasSavedGame = computed(() => this.saveService.isGameStarted());
  isElectron = typeof window !== 'undefined' && !!window.electronApi;
  showNewGameModal = signal(false);

  // Partículas flotantes
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

  async ngOnInit() {
    // Ya no es necesario establecer hasSavedGame aquí
    // porque ahora es un computed() que reacciona automáticamente
  }

  continueGame(): void {
    // El juego ya está cargado en app.ts
    // Marcar que el juego ha sido iniciado y cambiar la vista
    this.saveService.markGameStarted();
    // Guardar inmediatamente para persistir el estado
    this.saveService.save();
    this.gameStateService.startGame();
  }

  newGame(): void {
    if (this.hasSavedGame()) {
      this.showNewGameModal.set(true);
    } else {
      this.saveService.markGameStarted();
      this.saveService.save();
      this.gameStateService.startGame();
    }
  }

  async confirmNewGame(): Promise<void> {
    this.showNewGameModal.set(false);
    await this.saveService.resetToNewGame();
    this.saveService.markGameStarted();
    this.saveService.save();
    this.gameStateService.startGame();
  }

  openOptions(): void {
    this.gameStateService.openOptions();
  }

  exitGame(): void {
    if (this.isElectron && window.electronApi?.quit) {
      window.electronApi.quit();
    }
  }
}
