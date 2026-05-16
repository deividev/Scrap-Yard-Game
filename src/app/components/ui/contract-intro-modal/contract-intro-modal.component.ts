import { Component, computed, inject, output } from '@angular/core';
import { AppButtonComponent } from '../app-button/app-button.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { TranslationService } from '../../../services/translation.service';

@Component({
  selector: 'app-contract-intro-modal',
  standalone: true,
  imports: [AppButtonComponent, ModalShellComponent],
  template: `
    <app-modal-shell
      [showTopBar]="true"
      [showBottomBar]="true"
      [backdropDismissable]="false"
      maxWidth="520px"
      labelledBy="contract-intro-title"
    >
      <div class="cim-header">
        <h2 id="contract-intro-title" class="cim-title">
          {{ t.t('contracts.intro.title') }}
        </h2>
      </div>

      <div class="cim-body">
        <p class="cim-paragraph" [innerHTML]="t.t('contracts.intro.body_1')"></p>
        <ul class="cim-list">
          @for (line of bulletLines(); track $index) {
            <li [innerHTML]="line"></li>
          }
        </ul>
        <p class="cim-paragraph cim-paragraph--highlight" [innerHTML]="t.t('contracts.intro.body_3')"></p>
      </div>

      <div class="cim-footer">
        <app-button
          [label]="t.t('contracts.intro.dismiss')"
          variant="primary"
          size="md"
          (clicked)="dismissed.emit()"
        />
      </div>
    </app-modal-shell>
  `,
  styles: `
    .cim-header {
      padding: 28px 32px 16px;
      border-bottom: 1px solid rgba(255, 152, 0, 0.2);
    }

    .cim-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-accent-main);
      margin: 0;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 8px rgba(255, 152, 0, 0.4);
    }

    .cim-body {
      padding: 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .cim-paragraph {
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-text-primary);
      margin: 0;
    }

    .cim-paragraph--highlight {
      background: rgba(255, 152, 0, 0.06);
      border: 1px solid rgba(255, 152, 0, 0.15);
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 13px;
    }

    .cim-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cim-list li {
      font-size: 14px;
      line-height: 1.55;
      color: var(--color-text-secondary, #aaa);
      padding-left: 6px;
      border-left: 2px solid rgba(255, 152, 0, 0.3);
    }

    .cim-footer {
      padding: 16px 32px 24px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
  `,
})
export class ContractIntroModalComponent {
  readonly dismissed = output<void>();

  protected readonly t = inject(TranslationService);

  protected readonly bulletLines = computed(() =>
    this.t.t('contracts.intro.body_2').split('\n').filter(Boolean),
  );
}
