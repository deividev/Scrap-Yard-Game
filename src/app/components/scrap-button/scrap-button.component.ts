import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrapGenerationService } from '../../services/scrap-generation.service';

@Component({
  selector: 'app-scrap-button',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div class="scrap-generation-container">
      <button class="scrap-button" (click)="generateScrap()" type="button">
        <span class="scrap-icon">♻️</span>
        <span class="scrap-text">Descargar Chatarra</span>
        <span class="scrap-amount">+1</span>
      </button>

      <div class="auto-rate-section">
        <p class="auto-rate-label">
          Generación automática: <strong>{{ autoRate() }} / segundo</strong>
        </p>
        <div class="auto-rate-buttons">
          <button (click)="setAutoRate(0)" [class.active]="autoRate() === 0">Desactivar</button>
          <button (click)="setAutoRate(0.2)" [class.active]="autoRate() === 0.2">
            +0.2/s (Fase 2)
          </button>
          <button (click)="setAutoRate(0.5)" [class.active]="autoRate() === 0.5">
            +0.5/s (Fase 3)
          </button>
          <button (click)="setAutoRate(1.0)" [class.active]="autoRate() === 1.0">
            +1.0/s (Fase 3+)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .scrap-generation-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
      }

      .scrap-button {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background-color: var(--color-surface);
        border: 2px solid var(--color-accent);
        border-radius: 4px;
        color: var(--color-text-primary);
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 200px;
      }

      .scrap-button:hover {
        background-color: var(--color-accent);
        transform: translateY(-2px);
      }

      .scrap-button:active {
        transform: translateY(0);
      }

      .scrap-icon {
        font-size: 24px;
      }

      .scrap-text {
        flex: 1;
      }

      .scrap-amount {
        color: var(--color-positive);
        font-weight: bold;
      }

      .auto-rate-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3);
        background-color: var(--color-background);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        width: 100%;
        max-width: 600px;
      }

      .auto-rate-label {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 14px;
        text-align: center;
      }

      .auto-rate-label strong {
        color: var(--color-text-primary);
      }

      .auto-rate-buttons {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        justify-content: center;
      }

      .auto-rate-buttons button {
        padding: var(--space-2) var(--space-3);
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 4px;
        color: var(--color-text-primary);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .auto-rate-buttons button:hover {
        background-color: var(--color-border);
      }

      .auto-rate-buttons button.active {
        background-color: var(--color-accent);
        border-color: var(--color-accent);
        font-weight: bold;
      }
    `,
  ],
})
export class ScrapButtonComponent {
  autoRate = computed(() => this.scrapGenerationService.getAutomaticGenerationRate());

  constructor(private scrapGenerationService: ScrapGenerationService) {}

  generateScrap(): void {
    this.scrapGenerationService.generateManualScrap();
  }

  setAutoRate(rate: number): void {
    this.scrapGenerationService.setAutomaticGenerationRate(rate);
  }
}
