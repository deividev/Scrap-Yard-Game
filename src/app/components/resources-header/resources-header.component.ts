import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { MachinesService } from '../../services/machines.service';
import { MachineType } from '../../models/machine.model';
import { DebugControlsComponent } from '../debug-controls/debug-controls.component';
import { ScrapButtonComponent } from '../scrap-button/scrap-button.component';
import { SellComponentsButtonComponent } from '../sell-components-button/sell-components-button.component';
import { SellMetalButtonComponent } from '../sell-metal-button/sell-metal-button.component';
import { ProgressionHintComponent } from '../progression-hint/progression-hint.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-resources-header',
  standalone: true,
  imports: [
    CommonModule,
    DebugControlsComponent,
    ScrapButtonComponent,
    SellComponentsButtonComponent,
    SellMetalButtonComponent,
    ProgressionHintComponent,
    FormatNumberPipe,
    TooltipComponent,
  ],
  template: `
    <header class="resources-header">
      <div class="resource-item money">
        <app-tooltip
          [text]="translationService.t('resources.money')"
          [inline]="true"
          [position]="'bottom'"
        >
          <img [src]="moneyResource().icon" class="resource-icon" alt="Money" />
        </app-tooltip>
        <span class="resource-amount">{{ moneyResource().amount }}</span>
      </div>

      <div class="resources-container">
        <!-- Chatarra -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.scrap')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img [src]="scrapResource().icon" class="resource-icon" alt="Chatarra" />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="scrapResource().amount >= scrapResource().capacity"
              >{{ scrapResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity">/ {{ scrapResource().capacity | formatNumber }}</span>
          </div>
          <app-scrap-button></app-scrap-button>
        </div>

        <!-- Metal -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.metal')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img [src]="metalResource().icon" class="resource-icon" alt="Metal" />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="metalResource().amount >= metalResource().capacity"
              >{{ metalResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity">/ {{ metalResource().capacity | formatNumber }}</span>
          </div>
          <app-sell-metal-button></app-sell-metal-button>
        </div>

        <!-- Componentes -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.components')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img [src]="componentsResource().icon" class="resource-icon" alt="Componentes" />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="componentsResource().amount >= componentsResource().capacity"
              >{{ componentsResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity"
              >/ {{ componentsResource().capacity | formatNumber }}</span
            >
          </div>
          @if (isSmelterUnlocked()) {
            <app-sell-components-button></app-sell-components-button>
          }
        </div>

        <!-- Plástico -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.plastic')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img [src]="plasticResource().icon" class="resource-icon" alt="Plástico" />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="plasticResource().amount >= plasticResource().capacity"
              >{{ plasticResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity">/ {{ plasticResource().capacity | formatNumber }}</span>
          </div>
        </div>

        <!-- Plástico Reciclado -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.recycled_plastic')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img
                [src]="recycledPlasticResource().icon"
                class="resource-icon"
                alt="Plástico reciclado"
              />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="recycledPlasticResource().amount >= recycledPlasticResource().capacity"
              >{{ recycledPlasticResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity"
              >/ {{ recycledPlasticResource().capacity | formatNumber }}</span
            >
          </div>
        </div>

        <!-- Componentes Eléctricos -->
        <div class="resource-column">
          <div class="resource-item">
            <app-tooltip
              [text]="translationService.t('resources.electric_components')"
              [inline]="true"
              [position]="'bottom'"
            >
              <img
                [src]="electricComponentsResource().icon"
                class="resource-icon"
                alt="Componentes eléctricos"
              />
            </app-tooltip>
            <span
              class="resource-amount"
              [class.full]="
                electricComponentsResource().amount >= electricComponentsResource().capacity
              "
              >{{ electricComponentsResource().amount | formatNumber }}</span
            >
            <span class="resource-capacity"
              >/ {{ electricComponentsResource().capacity | formatNumber }}</span
            >
          </div>
        </div>
      </div>

      <app-progression-hint></app-progression-hint>

      <div class="header-actions">
        <app-debug-controls></app-debug-controls>
      </div>
    </header>
  `,
  styles: [
    `
      .resources-header {
        background: var(--color-bg-panel);
        border-bottom: 2px solid var(--color-border);
        padding: var(--space-4);
        display: flex;
        gap: var(--space-4);
        align-items: start;
      }

      .resource-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        min-height: 28px;
      }

      .resource-item.money {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-accent-main);
        padding-right: var(--space-4);
        border-right: 1px solid var(--color-border);
      }

      .resources-container {
        display: flex;
        gap: var(--space-2);
        flex: 1;
      }

      .resource-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        align-items: flex-start;
        min-width: fit-content;
      }

      .header-actions {
        margin-left: auto;
      }

      .resource-icon {
        width: 56px;
        height: 56px;
        object-fit: contain;
      }

      .resource-amount {
        font-weight: 600;
        color: var(--color-text-primary);
        transition: color 0.2s ease;
      }

      .resource-amount.full {
        color: #f59e0b;
        animation: pulse-warning 1.5s ease-in-out infinite;
      }

      @keyframes pulse-warning {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .resource-capacity {
        color: var(--color-text-secondary);
        font-size: 13px;
      }
    `,
  ],
})
export class ResourcesHeaderComponent {
  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
    public translationService: TranslationService,
  ) {}

  getResourceIcon(resourceId: string): string {
    const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);
    return resource?.icon || '?';
  }

  moneyResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.MONEY);
    return (
      resource || {
        id: ResourceType.MONEY,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.MONEY),
      }
    );
  });

  scrapResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.SCRAP);
    return (
      resource || {
        id: ResourceType.SCRAP,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.SCRAP),
      }
    );
  });

  metalResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.METAL);
    return (
      resource || {
        id: ResourceType.METAL,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.METAL),
      }
    );
  });

  componentsResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.COMPONENTS);
    return (
      resource || {
        id: ResourceType.COMPONENTS,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.COMPONENTS),
      }
    );
  });

  plasticResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.PLASTIC);
    return (
      resource || {
        id: ResourceType.PLASTIC,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.PLASTIC),
      }
    );
  });

  recycledPlasticResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.RECYCLED_PLASTIC);
    return (
      resource || {
        id: ResourceType.RECYCLED_PLASTIC,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.RECYCLED_PLASTIC),
      }
    );
  });

  electricComponentsResource = computed(() => {
    const all = this.resourcesService.getAll();
    const resource = all.find((r) => r.id === ResourceType.ELECTRIC_COMPONENTS);
    return (
      resource || {
        id: ResourceType.ELECTRIC_COMPONENTS,
        name: '',
        amount: 0,
        capacity: 0,
        icon: this.getResourceIcon(ResourceType.ELECTRIC_COMPONENTS),
      }
    );
  });

  isSmelterUnlocked = computed(() => {
    const smelter = this.machinesService.getMachine(MachineType.SMELTER);
    return smelter ? smelter.level > 0 : false;
  });
}
