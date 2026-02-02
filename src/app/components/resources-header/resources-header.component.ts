import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesService } from '../../services/resources.service';
import { ResourceType } from '../../models/resource.model';
import { DebugControlsComponent } from '../debug-controls/debug-controls.component';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-resources-header',
  standalone: true,
  imports: [CommonModule, DebugControlsComponent, FormatNumberPipe],
  template: `
    <header class="resources-header">
      <div class="resource-item money">
        <span class="resource-icon">💰</span>
        <span class="resource-amount">{{ money() | formatNumber }}</span>
      </div>
      <div class="resources-grid">
        <div class="resource-item">
          <span class="resource-icon">♻️</span>
          <span class="resource-amount">{{ scrap() | formatNumber }}</span>
          <span class="resource-capacity">/ {{ scrapCap() | formatNumber }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">⚙️</span>
          <span class="resource-amount">{{ metal() | formatNumber }}</span>
          <span class="resource-capacity">/ {{ metalCap() | formatNumber }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🧪</span>
          <span class="resource-amount">{{ plastic() | formatNumber }}</span>
          <span class="resource-capacity">/ {{ plasticCap() | formatNumber }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🔧</span>
          <span class="resource-amount">{{ components() | formatNumber }}</span>
          <span class="resource-capacity">/ {{ componentsCap() | formatNumber }}</span>
        </div>
      </div>
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
        gap: var(--space-5);
        align-items: center;
      }

      .resource-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .resource-item.money {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-accent-main);
        margin-right: var(--space-4);
        padding-right: var(--space-4);
        border-right: 1px solid var(--color-border);
      }

      .resources-grid {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
        flex: 1;
      }

      .header-actions {
        margin-left: auto;
      }

      .resource-icon {
        font-size: 18px;
      }

      .resource-amount {
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .resource-capacity {
        color: var(--color-text-secondary);
        font-size: 13px;
      }
    `,
  ],
})
export class ResourcesHeaderComponent {
  constructor(private resourcesService: ResourcesService) {}

  money = computed(() => this.resourcesService.getAmount(ResourceType.MONEY));
  scrap = computed(() => this.resourcesService.getAmount(ResourceType.SCRAP));
  metal = computed(() => this.resourcesService.getAmount(ResourceType.METAL));
  plastic = computed(() => this.resourcesService.getAmount(ResourceType.PLASTIC));
  components = computed(() => this.resourcesService.getAmount(ResourceType.COMPONENTS));

  scrapCap = computed(() => this.resourcesService.getCapacity(ResourceType.SCRAP));
  metalCap = computed(() => this.resourcesService.getCapacity(ResourceType.METAL));
  plasticCap = computed(() => this.resourcesService.getCapacity(ResourceType.PLASTIC));
  componentsCap = computed(() => this.resourcesService.getCapacity(ResourceType.COMPONENTS));
}
