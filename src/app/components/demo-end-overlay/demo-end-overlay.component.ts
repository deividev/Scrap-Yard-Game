import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoEndService } from '../../services/demo-end.service';
import { DEMO_CONFIG } from '../../config/game-balance.config';

@Component({
  selector: 'app-demo-end-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (demoEndService.isVisible()) {
      <div class="demo-end-backdrop" role="dialog" aria-modal="true" aria-labelledby="demo-end-title">
        <div class="demo-end-panel">

          <div class="demo-end-panel__top-bar"></div>

          <div class="demo-end-panel__inner">
            <div class="demo-end-panel__badge">
              <span class="demo-end-panel__badge-label">DEMO COMPLETADA</span>
            </div>

            <h2 id="demo-end-title" class="demo-end-panel__title">
              ¡Has dominado<br>el depósito!
            </h2>

            <div class="demo-end-panel__divider">
              <span class="demo-end-panel__divider-icon">⚙</span>
            </div>

            <p class="demo-end-panel__body">
              Has desbloqueado la <strong>Empaquetadora</strong> y completado la
              demo de Scrap Yard Idle. La versión completa desbloquea nuevas
              máquinas, recursos avanzados y la cadena de producción eléctrica.
            </p>

            <div class="demo-end-panel__stats">
              <div class="demo-end-panel__stat">
                <span class="demo-end-panel__stat-icon">🏭</span>
                <span class="demo-end-panel__stat-label">4 máquinas en la demo</span>
              </div>
              <div class="demo-end-panel__stat-sep"></div>
              <div class="demo-end-panel__stat">
                <span class="demo-end-panel__stat-icon">⚡</span>
                <span class="demo-end-panel__stat-label">+4 en versión completa</span>
              </div>
            </div>

            <div class="demo-end-panel__actions">
              <button class="demo-end-btn demo-end-btn--primary" (click)="openWishlist()">
                <span class="demo-end-btn__icon">♥</span>
                <span class="demo-end-btn__label">Añadir a la lista de deseados</span>
              </button>
              <button class="demo-end-btn demo-end-btn--ghost" (click)="dismiss()">
                Seguir jugando la demo
              </button>
            </div>

            <p class="demo-end-panel__footnote">
              Upgrades y producción siguen disponibles en la demo
            </p>
          </div>

          <div class="demo-end-panel__bottom-bar"></div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .demo-end-backdrop {
        position: fixed;
        inset: 0;
        z-index: 26000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background:
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255, 152, 0, 0.06) 0%, transparent 70%),
          rgba(10, 9, 8, 0.86);
        backdrop-filter: blur(3px);
      }

      .demo-end-panel {
        width: min(520px, 100%);
        background: linear-gradient(180deg, rgba(28, 28, 28, 0.99) 0%, rgba(14, 14, 14, 0.99) 100%);
        border: 1px solid rgba(255, 152, 0, 0.35);
        border-radius: var(--border-radius-large);
        box-shadow:
          0 0 0 1px rgba(255, 152, 0, 0.10),
          0 32px 80px rgba(0, 0, 0, 0.75),
          0 8px 24px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 200, 80, 0.08);
        overflow: hidden;
      }

      .demo-end-panel__top-bar {
        height: 3px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 152, 0, 0.4) 20%,
          rgba(255, 180, 60, 0.95) 50%,
          rgba(255, 152, 0, 0.4) 80%,
          transparent 100%
        );
      }

      .demo-end-panel__inner {
        padding: 28px 32px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }

      .demo-end-panel__badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 14px;
        background: rgba(255, 152, 0, 0.1);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: 999px;
      }

      .demo-end-panel__badge-label {
        font-family: var(--font-ui);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--color-accent-main);
        text-transform: uppercase;
      }

      .demo-end-panel__title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 34px;
        line-height: 1.1;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #ffe08a;
        text-shadow:
          0 0 40px rgba(255, 152, 0, 0.35),
          0 2px 4px rgba(0, 0, 0, 0.6);
      }

      .demo-end-panel__divider {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }

      .demo-end-panel__divider::before,
      .demo-end-panel__divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 152, 0, 0.25) 50%,
          transparent
        );
      }

      .demo-end-panel__divider-icon {
        font-size: 16px;
        color: rgba(255, 152, 0, 0.5);
        line-height: 1;
      }

      .demo-end-panel__body {
        margin: 0;
        font-family: var(--font-ui);
        font-size: 14px;
        line-height: 1.7;
        color: rgba(224, 218, 200, 0.85);
        text-align: center;
        max-width: 380px;
      }

      .demo-end-panel__body strong {
        color: var(--color-accent-light);
        font-weight: 600;
      }

      .demo-end-panel__stats {
        display: flex;
        align-items: center;
        width: 100%;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 152, 0, 0.12);
        border-radius: var(--border-radius-medium);
        overflow: hidden;
      }

      .demo-end-panel__stat {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
      }

      .demo-end-panel__stat-icon {
        font-size: 16px;
        line-height: 1;
      }

      .demo-end-panel__stat-label {
        font-family: var(--font-ui);
        font-size: 12px;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .demo-end-panel__stat-sep {
        width: 1px;
        align-self: stretch;
        background: rgba(255, 152, 0, 0.12);
      }

      .demo-end-panel__actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }

      .demo-end-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 13px 24px;
        border-radius: var(--border-radius-medium);
        font-family: var(--font-ui);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        border: none;
        transition: filter 0.15s ease, transform 0.1s ease;
      }

      .demo-end-btn:active {
        transform: scale(0.98);
      }

      .demo-end-btn--primary {
        background: linear-gradient(
          135deg,
          rgba(200, 120, 0, 0.95) 0%,
          rgba(255, 152, 0, 1) 45%,
          rgba(210, 130, 8, 0.95) 100%
        );
        color: #1a1200;
        box-shadow:
          0 4px 16px rgba(255, 152, 0, 0.3),
          inset 0 1px 0 rgba(255, 222, 120, 0.35);
      }

      .demo-end-btn--primary:hover {
        filter: brightness(1.1);
      }

      .demo-end-btn__icon {
        font-size: 16px;
      }

      .demo-end-btn--ghost {
        background: rgba(255, 255, 255, 0.04);
        color: var(--color-text-secondary);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .demo-end-btn--ghost:hover {
        background: rgba(255, 255, 255, 0.07);
        color: var(--color-text-primary);
      }

      .demo-end-panel__footnote {
        margin: 0;
        font-family: var(--font-ui);
        font-size: 11px;
        color: var(--color-text-muted, var(--color-text-secondary));
        text-align: center;
        letter-spacing: 0.04em;
      }

      .demo-end-panel__bottom-bar {
        height: 2px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 152, 0, 0.15) 40%,
          rgba(255, 152, 0, 0.15) 60%,
          transparent 100%
        );
      }
    `,
  ],
})
export class DemoEndOverlayComponent {
  protected readonly demoEndService = inject(DemoEndService);
  private readonly wishlistUrl = DEMO_CONFIG.STEAM_WISHLIST_URL;

  protected openWishlist(): void {
    window.open(this.wishlistUrl, '_blank', 'noopener,noreferrer');
  }

  protected dismiss(): void {
    this.demoEndService.dismiss();
  }
}
