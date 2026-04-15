import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoEndService } from '../../services/demo-end.service';
import { DEMO_CONFIG } from '../../config/game-balance.config';
import { TranslationService } from '../../services/translation.service';
import { ModalShellComponent } from '../ui/modal-shell/modal-shell.component';

@Component({
  selector: 'app-demo-end-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent],
  template: `
    @if (demoEndService.isVisible()) {
      <app-modal-shell [showTopBar]="true" [showBottomBar]="true" [zIndex]="26000" maxWidth="520px" labelledBy="demo-end-title">

          <div class="demo-end-panel__inner">
            <div class="demo-end-panel__badge">
              <span class="demo-end-panel__badge-label">{{ translationService.t('demo_end.badge_label') }}</span>
            </div>

            <h2 id="demo-end-title" class="demo-end-panel__title"
              [innerHTML]="translationService.t('demo_end.title')"
            ></h2>

            <div class="demo-end-panel__divider">
              <span class="demo-end-panel__divider-icon">⚙</span>
            </div>

            <p class="demo-end-panel__body" [innerHTML]="translationService.t('demo_end.body')"></p>

            <div class="demo-end-panel__actions">
              <button class="demo-end-btn demo-end-btn--primary" (click)="openWishlist()">
                <span class="demo-end-btn__label">{{ translationService.t('demo_end.cta_wishlist') }}</span>
              </button>
              <button class="demo-end-btn demo-end-btn--ghost" (click)="dismiss()">
                {{ translationService.t('demo_end.cta_continue') }}
              </button>
            </div>

          </div>
      </app-modal-shell>
    }
  `,
  styles: [
    `
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
        font-size: 28px;
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
        color: rgba(255, 255, 255, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .demo-end-btn--ghost:hover {
        background: rgba(255, 255, 255, 0.07);
        color: var(--color-text-primary);
      }

    `,
  ],
})
export class DemoEndOverlayComponent {
  protected readonly demoEndService = inject(DemoEndService);
  protected readonly translationService = inject(TranslationService);
  private readonly wishlistUrl = DEMO_CONFIG.STEAM_WISHLIST_URL;

  private isElectron = typeof window !== 'undefined' && !!window.electronApi;

  protected openWishlist(): void {
    if (this.isElectron && window.electronApi?.openExternal) {
      window.electronApi.openExternal(this.wishlistUrl);
    } else {
      window.open(this.wishlistUrl, '_blank', 'noopener,noreferrer');
    }
  }

  protected dismiss(): void {
    this.demoEndService.dismiss();
  }
}
