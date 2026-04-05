import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  template: `
    <div
      class="ms-backdrop"
      [style.z-index]="zIndex()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="labelledBy() || null"
      (click)="onBackdropClick()"
    >
      <div class="ms-panel" [style.max-width]="maxWidth()" (click)="$event.stopPropagation()">
        @if (showTopBar()) {
          <div class="ms-top-bar"></div>
        }
        <ng-content></ng-content>
        @if (showBottomBar()) {
          <div class="ms-bottom-bar"></div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ms-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background:
          radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255, 152, 0, 0.06) 0%, transparent 70%),
          rgba(10, 9, 8, 0.86);
        backdrop-filter: blur(4px);
        animation: msBackdropIn 0.2s ease-out;
      }

      .ms-panel {
        width: 100%;
        background: linear-gradient(
          180deg,
          rgba(28, 28, 28, 0.99) 0%,
          rgba(14, 14, 14, 0.99) 100%
        );
        border: 1px solid rgba(255, 152, 0, 0.35);
        border-radius: var(--border-radius-large);
        box-shadow:
          0 0 0 1px rgba(255, 152, 0, 0.1),
          0 32px 80px rgba(0, 0, 0, 0.75),
          0 8px 24px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 200, 80, 0.08);
        overflow: hidden;
        animation: msPanelIn 0.3s ease-out;
      }

      .ms-top-bar {
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

      .ms-bottom-bar {
        height: 2px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 152, 0, 0.15) 40%,
          rgba(255, 152, 0, 0.15) 60%,
          transparent 100%
        );
      }

      @keyframes msBackdropIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes msPanelIn {
        from {
          opacity: 0;
          transform: translateY(-16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ModalShellComponent {
  readonly zIndex = input(20000);
  readonly maxWidth = input('500px');
  readonly showTopBar = input(false);
  readonly showBottomBar = input(false);
  readonly backdropDismissable = input(false);
  readonly labelledBy = input<string | undefined>(undefined);

  readonly dismissed = output<void>();

  protected onBackdropClick(): void {
    if (this.backdropDismissable()) {
      this.dismissed.emit();
    }
  }
}
