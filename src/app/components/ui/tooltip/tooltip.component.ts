import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-wrapper" [class.inline]="inline" [attr.data-tooltip]="text">
      <ng-content></ng-content>
      <div
        class="tooltip-content"
        [class.tooltip-bottom]="position === 'bottom'"
        [class.tooltip-top-right]="position === 'top-right'"
        [class.tooltip-top-left]="position === 'top-left'"
        *ngIf="text"
      >
        {{ text }}
      </div>
    </div>
  `,
  styles: [
    `
      .tooltip-wrapper {
        position: relative;
        display: inline-block;
        width: 100%;
      }

      .tooltip-wrapper.inline {
        width: auto;
        display: inline-flex;
      }

      .tooltip-content {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 20, 1);
        color: var(--color-text-primary);
        padding: 8px 12px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-accent-main);
        font-size: 11px;
        font-weight: 500;
        line-height: 1.5;
        max-width: 170px;
        width: max-content;
        white-space: normal;
        text-align: center;
        opacity: 0;
        pointer-events: none;
        transition:
          opacity 0.2s ease,
          transform 0.2s ease;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      .tooltip-content::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: var(--color-accent-main);
      }

      .tooltip-content::before {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #2a2a2a;
        z-index: 1;
      }

      .tooltip-wrapper:hover .tooltip-content {
        opacity: 1;
        transform: translateX(-50%) translateY(-2px);
      }

      /* Bottom position variant */
      .tooltip-content.tooltip-bottom {
        bottom: auto;
        top: calc(100% + 8px);
      }

      .tooltip-content.tooltip-bottom::after {
        top: auto;
        bottom: 100%;
        border-top-color: transparent;
        border-bottom-color: var(--color-accent-main);
      }

      .tooltip-content.tooltip-bottom::before {
        top: auto;
        bottom: 100%;
        border-top-color: transparent;
        border-bottom-color: #2a2a2a;
      }

      .tooltip-wrapper:hover .tooltip-content.tooltip-bottom {
        transform: translateX(-50%) translateY(2px);
      }

      /* Top-right position variant */
      .tooltip-content.tooltip-top-right {
        left: 0;
        right: auto;
        transform: none;
      }

      .tooltip-content.tooltip-top-right::after {
        left: 12px;
        right: auto;
        transform: none;
      }

      .tooltip-content.tooltip-top-right::before {
        left: 13px;
        right: auto;
        transform: none;
      }

      .tooltip-wrapper:hover .tooltip-content.tooltip-top-right {
        transform: translateY(-2px);
      }

      /* Top-left position variant */
      .tooltip-content.tooltip-top-left {
        left: auto;
        right: 0;
        transform: none;
      }

      .tooltip-content.tooltip-top-left::after {
        left: auto;
        right: 12px;
        transform: none;
      }

      .tooltip-content.tooltip-top-left::before {
        left: auto;
        right: 13px;
        transform: none;
      }

      .tooltip-wrapper:hover .tooltip-content.tooltip-top-left {
        transform: translateY(-2px);
      }
    `,
  ],
})
export class TooltipComponent {
  @Input() text: string = '';
  @Input() inline: boolean = false;
  @Input() position: 'top' | 'bottom' | 'top-right' | 'top-left' = 'top';
}
