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
        transition: opacity 0.15s ease, transform 0.1s ease;
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
    `,
  ],
})
export class AppButtonComponent {
  @Input() label: string = '';
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' = 'md';
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
