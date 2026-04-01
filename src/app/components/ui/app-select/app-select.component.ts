import {
  Component,
  input,
  output,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  template: `
    <div class="custom-select" [class.open]="isOpen()">
      <button
        class="select-trigger"
        type="button"
        (click)="toggleOpen()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
      >
        <span class="select-value">{{ selectedLabel() }}</span>
        <span class="select-arrow" [class.rotated]="isOpen()"></span>
      </button>

      @if (isOpen()) {
        <div class="select-dropdown" role="listbox">
          @for (opt of options(); track opt.value) {
            <button
              class="select-option"
              type="button"
              role="option"
              [attr.aria-selected]="opt.value === value()"
              [class.selected]="opt.value === value()"
              (click)="selectOption(opt.value)"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .custom-select {
        position: relative;
        width: 100%;
      }

      .select-trigger {
        width: 100%;
        padding: 12px 44px 12px 14px;
        background: rgba(0, 0, 0, 0.4);
        border: 2px solid rgba(255, 152, 0, 0.2);
        border-radius: 8px;
        color: var(--color-text-primary, #e0e0e0);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        text-align: left;
        transition:
          border-color 0.2s ease,
          background 0.2s ease,
          box-shadow 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: inherit;
      }

      .select-trigger:hover {
        border-color: rgba(255, 152, 0, 0.45);
        background: rgba(0, 0, 0, 0.5);
      }

      .custom-select.open .select-trigger {
        border-color: var(--color-accent-main, #ff9800);
        box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.12);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .select-trigger:focus-visible {
        outline: 2px solid rgba(255, 152, 0, 0.6);
        outline-offset: 2px;
      }

      .select-arrow {
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid var(--color-accent-main, #ff9800);
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }

      .select-arrow.rotated {
        transform: rotate(180deg);
      }

      .select-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #1a1a1a;
        border: 2px solid var(--color-accent-main, #ff9800);
        border-top: none;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
        z-index: 9999;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
        overflow: hidden;
      }

      .select-option {
        width: 100%;
        padding: 10px 14px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        color: var(--color-text-primary, #e0e0e0);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition:
          background 0.15s ease,
          color 0.15s ease;
        font-family: inherit;
        display: block;
      }

      .select-option:last-child {
        border-bottom: none;
      }

      .select-option:hover {
        background: rgba(255, 152, 0, 0.12);
        color: var(--color-accent-main, #ff9800);
      }

      .select-option.selected {
        background: rgba(255, 152, 0, 0.18);
        color: var(--color-accent-main, #ff9800);
        font-weight: 600;
      }
    `,
  ],
})
export class AppSelectComponent {
  options = input.required<SelectOption[]>();
  value = input.required<string>();
  changed = output<string>();

  isOpen = signal(false);
  private elRef = inject(ElementRef);

  selectedLabel = computed(() => {
    const opt = this.options().find((o) => o.value === this.value());
    return opt?.label ?? '';
  });

  toggleOpen(): void {
    this.isOpen.update((v) => !v);
  }

  selectOption(val: string): void {
    this.changed.emit(val);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
