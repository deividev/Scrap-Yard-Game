import { Component, input, output, inject } from '@angular/core';
import { AppButtonComponent } from '../app-button/app-button.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [AppButtonComponent, ModalShellComponent],
  template: `
    <app-modal-shell
      [backdropDismissable]="true"
      labelledBy="confirmation-modal-title"
      (dismissed)="onCancel()"
    >
      <div class="modal-header">
        <h2 id="confirmation-modal-title" class="modal-title">{{
          translationService.t(titleKey())
        }}</h2>
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
    </app-modal-shell>
  `,
  styles: [
    `
      .modal-header {
        padding: 24px 32px 16px;
        border-bottom: 1px solid rgba(255, 152, 0, 0.2);
      }

      .modal-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--color-accent-main);
        margin: 0;
        letter-spacing: 1px;
        text-shadow: 0 2px 8px rgba(255, 152, 0, 0.4);
      }

      .modal-body {
        padding: 24px 32px;
      }

      .modal-message {
        font-size: 16px;
        line-height: 1.6;
        color: var(--color-text-primary);
        margin: 0;
      }

      .modal-footer {
        padding: 16px 32px 24px;
        display: flex;
        gap: 16px;
        justify-content: flex-end;
        border-top: 1px solid rgba(255, 152, 0, 0.1);
      }

      @media (max-width: 600px) {
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

  titleKey = input<string>('options.reset_title');
  messageKey = input<string>('options.confirm_reset');
  confirmLabelKey = input<string>('options.reset_confirm');
  cancelLabelKey = input<string>('options.reset_cancel');
  confirmVariant = input<'primary' | 'secondary' | 'ghost'>('primary');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
