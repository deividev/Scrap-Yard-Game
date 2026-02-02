import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { GameLoopService } from '../../services/game-loop.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-debug-controls',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    <div class="debug-controls">
      <span class="tick-counter">{{ translationService.t('debug.tick') }}: {{ tickCount() }}</span>
      <app-button
        [label]="'🌐 ' + currentLang()"
        variant="secondary"
        size="sm"
        (clicked)="toggleLanguage()"
      />
      <app-button
        [label]="'♻️ ' + translationService.t('buttons.chatarra')"
        variant="primary"
        size="sm"
        (clicked)="generateScrap()"
      />
      <app-button
        [label]="'▶ ' + translationService.t('buttons.start')"
        variant="secondary"
        size="sm"
        (clicked)="startLoop()"
      />
      <app-button
        [label]="'⏸ ' + translationService.t('buttons.stop')"
        variant="secondary"
        size="sm"
        (clicked)="stopLoop()"
      />
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
    public translationService: TranslationService,
  ) {}

  tickCount = computed(() => this.gameLoopService.getTickCount());
  currentLang = computed(() => this.translationService.getLanguage().toUpperCase());

  generateScrap(): void {
    this.scrapGenerationService.generateManualScrap();
  }

  startLoop(): void {
    this.gameLoopService.start();
  }

  stopLoop(): void {
    this.gameLoopService.stop();
  }

  toggleLanguage(): void {
    const current = this.translationService.getLanguage();
    this.translationService.setLanguage(current === 'es' ? 'en' : 'es');
  }
}
