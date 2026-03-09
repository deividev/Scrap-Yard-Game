import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../app-button/app-button.component';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">{{ translationService.t(titleKey()) }}</h2>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ translationService.t(messageKey()) }}</p>
        </div>

        <div class="modal-footer">
          <app-button
            [label]="translationService.t(cancelLabelKey())"
            variant="ghost"
            size="md"
            (clicked)="onCancel()"
          />
          <app-button
            [label]="translationService.t(confirmLabelKey())"
            [variant]="confirmVariant()"
            size="md"
            (clicked)="onConfirm()"
          />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideIn {
        from {
          transform: translateY(-20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
      }

      .modal-content {
        position: relative;
        background: #1a1a1a;
        border: 2px solid rgba(255, 193, 7, 0.6);
        border-radius: 12px;
        max-width: 500px;
        width: 100%;
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.8),
          0 0 60px rgba(255, 193, 7, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: slideIn 0.3s ease-out;
        overflow: visible;
        z-index: 20001;
      }

      .modal-header {
        padding: 24px 32px 16px;
        border-bottom: 1px solid rgba(255, 193, 7, 0.2);
        position: relative;
        z-index: 20002;
      }

      .modal-title {
        font-size: 24px;
        font-weight: 700;
        color: #ffc107;
        margin: 0;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
      }

      .modal-body {
        padding: 24px 32px;
        position: relative;
        z-index: 20002;
      }

      .modal-message {
        font-size: 16px;
        line-height: 1.6;
        color: #e0e0e0;
        margin: 0;
      }

      .modal-footer {
        padding: 16px 32px 24px;
        display: flex;
        gap: 16px;
        justify-content: flex-end;
        border-top: 1px solid rgba(255, 193, 7, 0.1);
        position: relative;
        z-index: 20002;
      }

      /* Responsive */
      @media (max-width: 600px) {
        .modal-content {
          max-width: 90%;
        }

        .modal-header,
        .modal-body,
        .modal-footer {
          padding-left: 20px;
          padding-right: 20px;
        }

        .modal-title {
          font-size: 20px;
        }

        .modal-message {
          font-size: 14px;
        }

        .modal-footer {
          flex-direction: column-reverse;
          gap: 12px;
        }
      }
    `,
  ],
})
export class ConfirmationModalComponent {
  translationService = inject(TranslationService);

  // Inputs - ahora reciben claves de traducción
  titleKey = input<string>('options.reset_title');
  messageKey = input<string>('options.confirm_reset');
  confirmLabelKey = input<string>('options.reset_confirm');
  cancelLabelKey = input<string>('options.reset_cancel');
  confirmVariant = input<'primary' | 'secondary' | 'ghost'>('primary');

  // Outputs
  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    // Solo cerrar si se hace clic directamente en el overlay, no en el contenido
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
