import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ScrapGenerationService } from '../../services/scrap-generation.service';
import { GameLoopService } from '../../services/game-loop.service';
import { TranslationService } from '../../services/translation.service';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MachinesService } from '../../services/machines.service';
import { MachineType } from '../../models/machine.model';
import { SCRAP_GENERATION_CONFIG } from '../../config/game-balance.config';

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
        [disabled]="!canGenerateScrap()"
      />
      @if (isSmelterUnlocked()) {
        <app-button
          variant="primary"
          size="sm"
          (clicked)="sellComponents()"
          [disabled]="!canSellComponents()"
        >
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <img src="assets/icons/gold_resource.png" style="width: 20px; height: 20px; vertical-align: middle;" alt="Money" />
            <span>{{ translationService.t('buttons.venderComponentes') }}</span>
          </span>
        </app-button>
      }
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
  private resourcesService = inject(ResourcesService);

  constructor(
    private scrapGenerationService: ScrapGenerationService,
    private gameLoopService: GameLoopService,
    public translationService: TranslationService,
    private machinesService: MachinesService,
  ) {}

  tickCount = computed(() => this.gameLoopService.getTickCount());
  currentLang = computed(() => this.translationService.getLanguage().toUpperCase());

  isSmelterUnlocked = computed(() => {
    const smelter = this.machinesService.getMachine(MachineType.SMELTER);
    return smelter ? smelter.level > 0 : false;
  });

  canGenerateScrap(): boolean {
    // Verificar dinero
    if (!this.resourcesService.hasEnough(ResourceType.MONEY, SCRAP_GENERATION_CONFIG.MANUAL_COST)) {
      return false;
    }
    
    // Verificar espacio disponible para chatarra
    const totalGeneration = SCRAP_GENERATION_CONFIG.MANUAL_GENERATION;
    const availableSpace = this.resourcesService.getAvailableSpace(ResourceType.SCRAP);
    return availableSpace >= totalGeneration;
  }

  generateScrap(): void {
    this.scrapGenerationService.generateManualScrap();
  }

  sellComponents(): void {
    const componentsAmount = this.resourcesService.getAmount(ResourceType.COMPONENTS);
    if (componentsAmount > 0) {
      this.resourcesService.subtract(ResourceType.COMPONENTS, 1);
      this.resourcesService.add(ResourceType.MONEY, 3);
    }
  }

  canSellComponents(): boolean {
    return this.resourcesService.getAmount(ResourceType.COMPONENTS) > 0;
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
