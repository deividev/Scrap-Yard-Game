import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { BackgroundGridComponent } from '../ui/background-grid/background-grid.component';
import { GameStateService } from '../../services/game-state.service';
import { SaveService } from '../../services/save.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, BackgroundGridComponent],
  template: `
    <div class="main-menu">
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

      <div class="menu-content">
        <div class="game-logo">
          <img src="assets/image/logo_Scrap_Yardl.png" alt="Scrap Yard Idle" class="logo-image" />
          <p class="game-subtitle">{{ translationService.t('main_menu.subtitle') }}</p>
        </div>

        <div class="menu-buttons">
          <app-button
            *ngIf="hasSavedGame()"
            [label]="translationService.t('main_menu.continue')"
            variant="primary"
            size="lg"
            (clicked)="continueGame()"
          />
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
            [disabled]="true"
            (clicked)="openOptions()"
          />
          <app-button
            *ngIf="isElectron"
            [label]="translationService.t('main_menu.exit')"
            variant="ghost"
            size="lg"
            (clicked)="exitGame()"
          />
        </div>

        <div class="version-info">
          <span>v0.2.0 - Phase 2</span>
        </div>
      </div>
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
      .main-menu::after {
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

      .menu-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        position: relative;
        z-index: 3;
      }

      /* Engranaje superior izquierdo */
      .menu-content::before {
        content: '';
        position: absolute;
        top: 10%;
        left: 8%;
        width: 100px;
        height: 100px;
        background:
          radial-gradient(
            circle at center,
            rgba(255, 193, 7, 0.25) 0%,
            rgba(255, 193, 7, 0.15) 30%,
            transparent 30%,
            transparent 35%,
            rgba(255, 193, 7, 0.08) 35%,
            rgba(255, 193, 7, 0.08) 100%
          ),
          conic-gradient(
            from 0deg,
            rgba(255, 193, 7, 0.3) 0deg 15deg,
            transparent 15deg 30deg,
            rgba(255, 193, 7, 0.3) 30deg 45deg,
            transparent 45deg 60deg,
            rgba(255, 193, 7, 0.3) 60deg 75deg,
            transparent 75deg 90deg,
            rgba(255, 193, 7, 0.3) 90deg 105deg,
            transparent 105deg 120deg,
            rgba(255, 193, 7, 0.3) 120deg 135deg,
            transparent 135deg 150deg,
            rgba(255, 193, 7, 0.3) 150deg 165deg,
            transparent 165deg 180deg,
            rgba(255, 193, 7, 0.3) 180deg 195deg,
            transparent 195deg 210deg,
            rgba(255, 193, 7, 0.3) 210deg 225deg,
            transparent 225deg 240deg,
            rgba(255, 193, 7, 0.3) 240deg 255deg,
            transparent 255deg 270deg,
            rgba(255, 193, 7, 0.3) 270deg 285deg,
            transparent 285deg 300deg,
            rgba(255, 193, 7, 0.3) 300deg 315deg,
            transparent 315deg 330deg,
            rgba(255, 193, 7, 0.3) 330deg 345deg,
            transparent 345deg 360deg
          );
        border-radius: 50%;
        border: 3px solid rgba(255, 193, 7, 0.4);
        box-shadow:
          inset 0 0 25px rgba(255, 193, 7, 0.2),
          inset 0 0 10px rgba(0, 0, 0, 0.5),
          0 0 40px rgba(255, 193, 7, 0.3),
          0 0 20px rgba(255, 193, 7, 0.2);
        pointer-events: none;
        opacity: 0.8;
        animation: rotate-gear-slow 30s linear infinite;
      }

      /* Engranaje inferior derecho */
      .menu-content::after {
        content: '';
        position: absolute;
        bottom: 15%;
        right: 10%;
        width: 75px;
        height: 75px;
        background:
          radial-gradient(
            circle at center,
            rgba(255, 193, 7, 0.25) 0%,
            rgba(255, 193, 7, 0.15) 25%,
            transparent 25%,
            transparent 30%,
            rgba(255, 193, 7, 0.08) 30%,
            rgba(255, 193, 7, 0.08) 100%
          ),
          conic-gradient(
            from 22.5deg,
            rgba(255, 193, 7, 0.3) 0deg 18deg,
            transparent 18deg 45deg,
            rgba(255, 193, 7, 0.3) 45deg 63deg,
            transparent 63deg 90deg,
            rgba(255, 193, 7, 0.3) 90deg 108deg,
            transparent 108deg 135deg,
            rgba(255, 193, 7, 0.3) 135deg 153deg,
            transparent 153deg 180deg,
            rgba(255, 193, 7, 0.3) 180deg 198deg,
            transparent 198deg 225deg,
            rgba(255, 193, 7, 0.3) 225deg 243deg,
            transparent 243deg 270deg,
            rgba(255, 193, 7, 0.3) 270deg 288deg,
            transparent 288deg 315deg,
            rgba(255, 193, 7, 0.3) 315deg 333deg,
            transparent 333deg 360deg
          );
        border-radius: 50%;
        border: 3px solid rgba(255, 193, 7, 0.4);
        box-shadow:
          inset 0 0 20px rgba(255, 193, 7, 0.2),
          inset 0 0 8px rgba(0, 0, 0, 0.5),
          0 0 35px rgba(255, 193, 7, 0.3),
          0 0 15px rgba(255, 193, 7, 0.2);
        pointer-events: none;
        opacity: 0.8;
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
        margin-bottom: 48px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
        width: 100%;
      }

      .logo-image {
        max-width: 600px;
        width: 90%;
        height: auto;
        filter: drop-shadow(0 6px 16px rgba(255, 193, 7, 0.4));
        animation: logo-glow 3s ease-in-out infinite;
      }

      @keyframes logo-glow {
        0%,
        100% {
          filter: drop-shadow(0 6px 16px rgba(255, 193, 7, 0.4));
        }
        50% {
          filter: drop-shadow(0 8px 24px rgba(255, 193, 7, 0.6));
        }
      }

      .game-subtitle {
        margin: 0;
        font-size: 16px;
        color: var(--color-text-secondary);
        font-weight: 500;
        letter-spacing: 1px;
      }

      .menu-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
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

        .menu-content::before {
          width: 60px;
          height: 60px;
          top: 5%;
          left: 5%;
        }

        .menu-content::after {
          width: 45px;
          height: 45px;
          bottom: 10%;
          right: 5%;
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

        .menu-content::before,
        .menu-content::after {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class MainMenuComponent implements OnInit {
  translationService = inject(TranslationService);
  private gameStateService = inject(GameStateService);
  private saveService = inject(SaveService);

  hasSavedGame = signal(false);
  isElectron = typeof window !== 'undefined' && !!window.electronApi;

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
    // Verificar si hay un juego guardado
    const hasSave = await this.saveService.hasSaveData();
    this.hasSavedGame.set(hasSave);
  }

  continueGame(): void {
    // El juego ya está cargado en app.ts
    // Solo necesitamos cambiar la vista
    this.gameStateService.startGame();
  }

  newGame(): void {
    if (this.hasSavedGame()) {
      // Confirmar antes de borrar la partida
      const confirmed = confirm(this.translationService.t('main_menu.confirm_new_game'));
      if (!confirmed) return;

      // Limpiar el save y recargar la página para empezar desde cero
      this.saveService.clearSave().then(() => {
        window.location.reload();
      });
    } else {
      // No hay partida guardada, solo iniciar el juego
      this.gameStateService.startGame();
    }
  }

  openOptions(): void {
    // Placeholder para el paso 11
    console.log('Opciones - Se implementará en el paso 11');
  }

  exitGame(): void {
    if (this.isElectron && window.electronApi?.quit) {
      window.electronApi.quit();
    }
  }
}
