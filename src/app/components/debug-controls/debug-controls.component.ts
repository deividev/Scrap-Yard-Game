import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { GameLoopService } from '../../services/game-loop.service';

@Component({
  selector: 'app-debug-controls',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="debug-controls">
      <span class="tick-counter">Tick: {{ tickCount() }}</span>
      <app-button label="♻️ Chatarra" variant="primary" size="sm" (clicked)="generateScrap()" />
      <app-button label="▶ Start" variant="secondary" size="sm" (clicked)="startLoop()" />
      <app-button label="⏸ Stop" variant="secondary" size="sm" (clicked)="stopLoop()" />
    </div>
  `,
  styles: [
    `
      .debug-controls {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }

      .tick-counter {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
        padding: var(--space-2);
        background: var(--color-bg-main);
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
        min-width: 80px;
      }
    `,
  ],
})
export class DebugControlsComponent {
  constructor(
    private scrapGenerationService: ScrapGenerationService,
    private gameLoopService: GameLoopService,
  ) {}

  tickCount = computed(() => this.gameLoopService.getTickCount());

  generateScrap(): void {
    this.scrapGenerationService.generateManualScrap();
  }

  startLoop(): void {
    this.gameLoopService.start();
  }

  stopLoop(): void {
    this.gameLoopService.stop();
  }
}
