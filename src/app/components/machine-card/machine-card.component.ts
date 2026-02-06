import { Component, Input, computed, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Machine } from '../../models/machine.model';
import { ResourcesService } from '../../services/resources.service';
import { MachinesService } from '../../services/machines.service';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { INITIAL_RESOURCES } from '../../config/resources.config';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="machine-card"
      [class.selected]="isSelected()"
      [class.locked]="isLocked()"
      (click)="selectMachine()"
    >
      <div class="machine-header">
        <div class="machine-title-group">
          <h3 class="machine-name">{{ translatedMachineName() }}</h3>
          <span class="machine-level" *ngIf="!isLocked()"
            >{{ translationService.t('common.level_short') }} {{ currentLevel() }}</span
          >
        </div>
        <app-button
          *ngIf="!isLocked()"
          [label]="
            currentIsActive()
              ? translationService.t('buttons.activa')
              : translationService.t('buttons.parada')
          "
          [variant]="currentIsActive() ? 'primary' : 'secondary'"
          size="sm"
          (clicked)="toggleMachine()"
        />
        <span *ngIf="isLocked()" class="locked-badge"
          >🔒 {{ translationService.t('status.bloqueada') }}</span
        >
      </div>

      <div class="machine-recipe">
        <span class="recipe-inputs">
          <span *ngFor="let input of effectiveInputs(); let last = last">
            <span class="resource-icon">{{ getResourceIcon(input.resourceId) }}</span>
            <span class="resource-amount">{{ input.amount }}</span>
            <span *ngIf="!last" class="separator">+</span>
          </span>
        </span>
        <span class="recipe-arrow">→</span>
        <span class="recipe-output">
          <span class="resource-icon">{{
            getResourceIcon(currentBaseProduction().resourceId)
          }}</span>
          <span class="resource-amount">{{ effectiveOutput() }}</span>
        </span>
      </div>

      <div class="machine-stats" *ngIf="!isLocked()">
        <span class="stat-item" [title]="'Velocidad efectiva'">
          ⚡ {{ effectiveSpeed().toFixed(2) }} ciclos/s
        </span>
        <span
          class="stat-item"
          *ngIf="productionMultiplier() > 1"
          [title]="'Multiplicador de producción'"
        >
          ×{{ productionMultiplier() }}
        </span>
      </div>

      <div class="machine-progress-container">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
        </div>
        <span class="progress-text">{{ progressPercent() }}%</span>
      </div>

      <div class="machine-status">
        <span
          class="status-label"
          [ngClass]="{
            'status-ok': statusText() === translationService.t('status.ok'),
            'status-parada': statusText() === translationService.t('status.parada'),
            'status-bloqueada': statusText() === translationService.t('status.bloqueada'),
            'status-input': statusText() === translationService.t('status.falta_input'),
            'status-output': statusText() === translationService.t('status.output_lleno'),
          }"
        >
          {{ statusText() }}
        </span>
        <span class="cycle-time">~{{ effectiveCycleTime().toFixed(1) }}s</span>
      </div>
    </div>
  `,
  styles: [
    `
      .machine-card {
        background: var(--color-bg-panel);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-medium);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        cursor: pointer;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .machine-card:hover {
        border-color: var(--color-accent-main);
      }

      .machine-card.locked {
        opacity: 0.6;
        cursor: default;
      }

      .machine-card.locked:hover {
        border-color: var(--color-border);
      }

      .locked-badge {
        font-size: 12px;
        color: var(--color-text-secondary);
        padding: 4px 8px;
        background: var(--color-bg-main);
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .machine-card.selected {
        border-color: var(--color-accent-main);
        box-shadow: 0 0 0 2px var(--color-accent-main);
      }

      .machine-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .machine-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .machine-name {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .machine-level {
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-secondary);
        background: var(--color-bg-main);
        padding: 2px 6px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .machine-recipe {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 13px;
        color: var(--color-text-secondary);
      }

      .recipe-inputs,
      .recipe-output {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .resource-icon {
        font-size: 14px;
      }

      .resource-amount {
        font-weight: 500;
        margin-right: 2px;
      }

      .separator {
        margin: 0 3px;
        font-weight: 500;
      }

      .recipe-arrow {
        color: var(--color-accent-main);
      }

      .machine-stats {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        font-size: 11px;
      }

      .stat-item {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px 6px;
        background: var(--color-bg-main);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius-small);
        font-weight: 500;
        color: var(--color-accent-positive);
      }

      .machine-progress-container {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--color-bg-main);
        border-radius: var(--border-radius-small);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--color-accent-positive);
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 12px;
        color: var(--color-text-secondary);
        min-width: 40px;
        text-align: right;
      }

      .machine-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }

      .status-label {
        font-weight: 500;
        padding: 2px 6px;
        border-radius: var(--border-radius-small);
      }

      .status-ok {
        color: #66bb6a !important;
        background: rgba(102, 187, 106, 0.1) !important;
      }

      .status-parada {
        color: #b0b0b0 !important;
        background: rgba(158, 158, 158, 0.1) !important;
      }

      .status-bloqueada {
        color: #757575 !important;
        background: rgba(117, 117, 117, 0.1) !important;
      }

      .status-input {
        color: #ff9800 !important;
        background: rgba(255, 152, 0, 0.1) !important;
      }

      .status-output {
        color: #f44336 !important;
        background: rgba(244, 67, 54, 0.1) !important;
      }

      .cycle-time {
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class MachineCardComponent {
  @Input() machine!: Machine;

  private upgradesService = inject(UpgradesService);

  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
    private machineSelectionService: MachineSelectionService,
    public translationService: TranslationService,
  ) {}

  private currentMachine = computed(
    () => this.machinesService.getMachine(this.machine.id) || this.machine,
  );

  currentLevel = computed(() => {
    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(this.machine.id);
    return upgradeId ? this.upgradesService.getLevel(upgradeId) : this.currentMachine().level;
  });
  currentIsActive = computed(() => this.currentMachine().isActive);
  currentBaseProduction = computed(() => this.currentMachine().baseProduction);

  progressPercent = computed(() => {
    const machine = this.currentMachine();
    return Math.round(machine.progress * 100);
  });

  isSelected = computed(
    () => this.machineSelectionService.getSelectedMachineId() === this.machine.id,
  );

  isLocked = computed(() => {
    const machine = this.currentMachine();
    return machine.level === 0;
  });

  getResourceIcon(resourceId: string): string {
    const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);
    return resource?.icon || '?';
  }

  translatedMachineName = computed(() => {
    // El ID de la máquina ya es el tipo (crusher, separator, etc.)
    return this.translationService.t(`machines.${this.machine.id}`);
  });

  productionMultiplier = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateProductionMultiplier(machine.id);
  });

  effectiveSpeed = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateEffectiveSpeed(machine.baseSpeed, machine.id);
  });

  effectiveInputs = computed(() => {
    const machine = this.currentMachine();
    const multiplier = this.productionMultiplier();
    return machine.baseConsumption.map((input) => ({
      resourceId: input.resourceId,
      amount: input.amount * multiplier,
    }));
  });

  effectiveOutput = computed(() => {
    const machine = this.currentMachine();
    const multiplier = this.productionMultiplier();
    return machine.baseProduction.amount * multiplier;
  });

  effectiveCycleTime = computed(() => {
    const speed = this.effectiveSpeed();
    return speed > 0 ? 1 / speed : 0;
  });

  get recipeInputs(): string {
    return this.machine.baseConsumption.map((c) => `${c.amount} ${c.resourceId}`).join(' + ');
  }

  get recipeOutput(): string {
    const p = this.machine.baseProduction;
    return `${p.amount} ${p.resourceId}`;
  }

  get cycleTime(): number {
    return Math.round(1 / this.machine.baseSpeed);
  }

  statusOk = computed(() => {
    const machine = this.currentMachine();
    if (machine.level === 0) return false;
    if (!machine.isActive) return false;

    const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

    const hasInputs = machine.baseConsumption.every((c) =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * productionMultiplier),
    );

    const outputAmount = machine.baseProduction.amount * productionMultiplier;
    const outputResourceId = machine.baseProduction.resourceId;
    const availableSpace = this.resourcesService.getAvailableSpace(outputResourceId);

    // Para recursos con capacidad infinita (Infinity), siempre hay espacio
    // Para recursos finitos, verificar que haya suficiente espacio
    const hasSpace = !isFinite(availableSpace) || availableSpace >= outputAmount;

    return hasInputs && hasSpace;
  });

  statusText = computed(() => {
    const machine = this.currentMachine();

    if (machine.level === 0) return this.translationService.t('status.bloqueada');

    if (!machine.isActive) return this.translationService.t('status.parada');

    const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

    const hasInputs = machine.baseConsumption.every((c) =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * productionMultiplier),
    );

    const outputAmount = machine.baseProduction.amount * productionMultiplier;
    const outputResourceId = machine.baseProduction.resourceId;
    const availableSpace = this.resourcesService.getAvailableSpace(outputResourceId);

    // Para recursos con capacidad infinita (Infinity), siempre hay espacio
    // Para recursos finitos, verificar que haya suficiente espacio
    const hasSpace = !isFinite(availableSpace) || availableSpace >= outputAmount;

    if (!hasInputs) return this.translationService.t('status.falta_input');
    if (!hasSpace) return this.translationService.t('status.output_lleno');
    return this.translationService.t('status.ok');
  });

  selectMachine(): void {
    if (!this.isLocked()) {
      this.machineSelectionService.selectMachine(this.machine.id);
    }
  }

  toggleMachine(): void {
    this.machinesService.setActive(this.machine.id, !this.machine.isActive);
  }
}
