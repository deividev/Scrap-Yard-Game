import { Component, input, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizable de barra de progreso
 *
 * @example
 * ```html
 * <app-progress-bar
 *   [progress]="0.75"
 *   [label]="'Mejorando: 5s'"
 *   [showLabel]="true"
 * />
 * ```
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="progress-container">
      <div class="progress-bar-wrapper" [class.completing]="isCompleting()">
        <div class="progress-bar-fill" [style.width]="widthStyle()"></div>
        <span class="progress-info">
          <ng-container *ngIf="!label() || label() === ''">
            {{ percentText() }}
          </ng-container>
          <ng-container *ngIf="label() && label() !== '' && inline()">
            {{ percentText() }} • {{ label() }}
          </ng-container>
          <ng-container *ngIf="label() && label() !== '' && !inline()">
            {{ percentText() }}
          </ng-container>
        </span>
      </div>
      <span *ngIf="showLabel() && label() && label() !== '' && !inline()" class="progress-label">
        {{ label() }}
      </span>
    </div>
  `,
  styles: [
    `
      .progress-container {
        width: 100%;
        margin: 8px 0;
      }

      .progress-bar-wrapper {
        width: 100%;
        height: 24px;
        background-color: #1e1e1e;
        border: 1px solid #444444;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .progress-bar-fill {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        background: linear-gradient(90deg, #4caf50, #66bb6a);
        transition: width 0.3s ease-out;
        width: 0%;
      }

      .progress-bar-wrapper.completing .progress-bar-fill {
        animation: pulse-complete 0.4s ease-in-out;
      }

      @keyframes pulse-complete {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.85;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
        }
        100% {
          opacity: 1;
        }
      }

      .progress-info {
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #e0e0e0;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        z-index: 1;
        white-space: nowrap;
      }

      .progress-label {
        display: block;
        text-align: center;
        font-size: 12px;
        color: #b0b0b0;
        margin-top: 4px;
      }
    `,
  ],
})
export class ProgressBarComponent {
  /**
   * Progreso actual (0-1) - Signal input para reactividad completa
   */
  progress = input<number>(0);

  /**
   * Texto a mostrar debajo de la barra - Signal input
   */
  label = input<string | undefined>(undefined);

  /**
   * Si se debe mostrar la etiqueta - Signal input
   */
  showLabel = input<boolean>(true);

  /**
   * Si el label se muestra inline (dentro de la barra) o abajo
   */
  inline = input<boolean>(false);

  /**
   * Progreso limitado entre 0 y 1 - Computed signal reactivo
   */
  clampedProgress = computed(() => {
    const prog = this.progress();
    return Math.max(0, Math.min(1, prog));
  });

  /**
   * Estilo de width como string para CSS
   */
  widthStyle = computed(() => {
    const percent = this.clampedProgress() * 100;
    return `${percent}%`;
  });

  /**
   * Texto del porcentaje para mostrar dentro de la barra
   */
  percentText = computed(() => {
    const percent = Math.round(this.clampedProgress() * 100);
    return `${percent}%`;
  });

  /**
   * Detecta si la barra está completándose (>= 98%)
   */
  isCompleting = computed(() => {
    return this.clampedProgress() >= 0.98;
  });
}
