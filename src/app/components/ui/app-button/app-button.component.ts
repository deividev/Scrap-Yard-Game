import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button [class]="buttonClasses" [disabled]="disabled" (click)="handleClick($event)">
      <ng-content></ng-content>
      @if (label) {
        {{ label }}
      }
    </button>
  `,
  styles: [
    `
      button {
        font-family: var(--font-family-base);
        font-size: 14px;
        font-weight: 500;
        border: none;
        border-radius: var(--border-radius-small);
        cursor: pointer;
        transition:
          opacity 0.15s ease,
          transform 0.1s ease;
        outline: none;
      }

      button:hover:not(:disabled) {
        opacity: 0.85;
      }

      button:active:not(:disabled) {
        opacity: 0.7;
        transform: scale(0.97);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .btn-primary {
        background: var(--color-accent-main);
        color: #000;
        padding: var(--space-2) var(--space-4);
      }

      .btn-secondary {
        background: var(--color-bg-panel);
        color: var(--color-text-primary);
        border: 1px solid var(--color-border);
        padding: var(--space-2) var(--space-4);
      }

      .btn-ghost {
        background: transparent;
        color: var(--color-text-secondary);
        padding: var(--space-2) var(--space-3);
      }

      .btn-ghost:hover:not(:disabled) {
        color: var(--color-text-primary);
        opacity: 1;
      }

      .btn-sm {
        font-size: 12px;
        padding: var(--space-1) var(--space-2);
      }

      .btn-md {
        font-size: 14px;
      }

      /* Large buttons - Menu principal */
      .btn-lg {
        font-size: 15px;
        font-weight: 600;
        padding: 14px 32px;
        min-width: 200px;
        letter-spacing: 0.5px;
        border-radius: 6px;
        text-align: center;
        transition:
          all 0.25s ease,
          transform 0.15s ease;
      }

      .btn-lg.btn-primary {
        box-shadow:
          0 4px 12px rgba(255, 193, 7, 0.35),
          0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .btn-lg.btn-primary:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow:
          0 6px 20px rgba(255, 193, 7, 0.45),
          0 3px 6px rgba(0, 0, 0, 0.3);
        filter: brightness(1.1);
      }

      .btn-lg.btn-secondary {
        border: 2px solid var(--color-border);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
      }

      .btn-lg.btn-secondary:hover:not(:disabled) {
        transform: translateY(-3px);
        border-color: var(--color-accent-main);
        box-shadow:
          0 5px 16px rgba(0, 0, 0, 0.35),
          0 0 0 1px rgba(255, 193, 7, 0.3);
        background: rgba(42, 42, 42, 0.95);
      }

      .btn-lg.btn-ghost {
        border: 1px solid transparent;
        padding: 13px 31px;
      }

      .btn-lg.btn-ghost:hover:not(:disabled) {
        transform: translateY(-2px);
        border-color: var(--color-border);
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-text-primary);
      }

      .btn-lg:active:not(:disabled) {
        transform: translateY(-1px) scale(0.98);
      }

      .btn-lg:focus:not(:disabled) {
        outline: 2px solid rgba(255, 193, 7, 0.5);
        outline-offset: 2px;
      }
    `,
  ],
})
export class AppButtonComponent {
  @Input() label: string = '';
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled: boolean = false;
  @Output() clicked = new EventEmitter<void>();

  get buttonClasses(): string {
    return `btn-${this.variant} btn-${this.size}`;
  }

  handleClick(event: Event): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
