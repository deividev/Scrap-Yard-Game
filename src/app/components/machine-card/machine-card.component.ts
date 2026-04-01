import {
  Component,
  Input,
  computed,
  ViewEncapsulation,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Machine, MachineType } from '../../models/machine.model';
import { ResourcesService } from '../../services/resources.service';
import { MachinesService } from '../../services/machines.service';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { TranslationService } from '../../services/translation.service';
import { UpgradesService } from '../../services/upgrades.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { AppButtonComponent } from '../ui/app-button/app-button.component';
import { ProgressBarComponent } from '../ui/progress-bar/progress-bar.component';
import { TooltipComponent } from '../ui/tooltip/tooltip.component';
import { INITIAL_RESOURCES } from '../../config/resources.config';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, AppButtonComponent, ProgressBarComponent, TooltipComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-tooltip
      [text]="unlockRequirementsText()"
      [disabled]="!isLocked()"
      [position]="'top'"
      [wide]="true"
    >
      <div
        class="machine-card"
        [attr.data-tutorial-id]="machineTutorialId()"
        [class.selected]="isSelected()"
        [class.locked]="isLocked()"
        [class.producing]="isProducing()"
        [class.input-blocked]="isInputBlocked()"
        [class.output-blocked]="isOutputBlocked()"
        [class.unlock-ready]="isUnlockReady()"
        [class.just-unlocked]="justUnlocked()"
        (click)="selectMachine()"
      >
        <div class="machine-header">
          <div class="machine-title-group">
            @if (machineIcon()) {
              <div class="machine-icon-badge" [class.locked]="isLocked()">
                <img [src]="machineIcon()!" class="machine-icon" alt="" />
              </div>
            }
            <h3 class="machine-name">{{ translatedMachineName() }}</h3>
            @if (!isLocked()) {
              <span class="machine-level"
                >{{ translationService.t('common.level_short') }} {{ currentLevel() }}</span
              >
            }
          </div>
          <div class="machine-controls">
            @if (!isLocked()) {
              <app-button
                [attr.data-tutorial-id]="machineToggleTutorialId()"
                [label]="
                  currentIsActive()
                    ? translationService.t('buttons.activa')
                    : translationService.t('buttons.parada')
                "
                [variant]="currentIsActive() ? 'primary' : 'secondary'"
                size="sm"
                (clicked)="toggleMachine()"
              />
            }
          </div>
          @if (isLocked()) {
            <div class="locked-info">
              <span class="locked-badge">🔒 {{ translationService.t('status.bloqueada') }}</span>
              @if (unlockRequirementsText()) {
                <span class="unlock-requirements">
                  {{ unlockRequirementsText() }}
                </span>
              }
            </div>
          }
        </div>

        <div class="machine-recipe">
          <span class="recipe-inputs">
            @for (input of effectiveInputs(); track $index; let last = $last) {
              <span>
                <app-tooltip [text]="getResourceName(input.resourceId)" [inline]="true">
                  <img
                    [src]="getResourceIcon(input.resourceId)"
                    class="resource-icon"
                    alt="Resource"
                  />
                </app-tooltip>
                <span class="resource-amount">{{ input.amount }}</span>
                @if (!last) {
                  <span class="separator">+</span>
                }
              </span>
            }
          </span>
          <span class="recipe-arrow">→</span>
          <span class="recipe-output">
            <app-tooltip
              [text]="getResourceName(currentBaseProduction().resourceId)"
              [inline]="true"
            >
              <img
                [src]="getResourceIcon(currentBaseProduction().resourceId)"
                class="resource-icon"
                alt="Resource"
              />
            </app-tooltip>
            <span class="resource-amount">{{ effectiveOutput() }}</span>
          </span>
        </div>

        @if (!isLocked()) {
          <div class="machine-stats">
            <app-tooltip [text]="speedTooltip()" [inline]="true" [position]="'top-right'">
              <span class="stat-item">
                ⚡ {{ effectiveSpeed().toFixed(2) }}
                {{ translationService.t('upgrades.machine_tab.cycles_per_second') }}
              </span>
            </app-tooltip>
            @if (productionMultiplier() > 1) {
              <app-tooltip [text]="multiplierTooltip()" [inline]="true" [position]="'top-right'">
                <span class="stat-item"> ×{{ productionMultiplier() }} </span>
              </app-tooltip>
            }
          </div>
        }

        <div [attr.data-tutorial-id]="machineProgressTutorialId()">
          <app-progress-bar
            [progress]="progressPercent() / 100"
            [label]="progressLabel()"
            [inline]="true"
          />
        </div>

        <div class="machine-status">
          <span
            class="status-label"
            [class.status-produciendo]="isProducing()"
            [class.status-parada]="isStopped()"
            [class.status-bloqueada]="isLocked()"
            [class.status-input]="isInputBlocked()"
            [class.status-output]="isOutputBlocked()"
          >
            {{ statusText() }}
          </span>
        </div>
      </div>
    </app-tooltip>
  `,
  styles: [
    `
      .machine-card {
        background: var(--color-bg-panel);
        border: 1px solid rgba(255, 152, 0, 0.18);
        border-radius: var(--border-radius-medium);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        cursor: pointer;
        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease,
          transform 0.18s ease;
      }

      .machine-card:hover {
        border-color: var(--color-accent-main);
        transform: translateY(-3px);
        box-shadow:
          0 6px 18px rgba(0, 0, 0, 0.35),
          0 0 0 1px var(--color-accent-main);
      }

      .machine-card.just-unlocked {
        animation: card-appear 1.6s ease-out forwards;
      }

      @keyframes card-appear {
        0% {
          transform: scale(0.93) translateY(6px);
          opacity: 0.4;
          box-shadow: 0 0 0px rgba(34, 197, 94, 0);
          border-color: rgba(34, 197, 94, 0.3);
        }
        18% {
          transform: scale(1.03) translateY(-2px);
          opacity: 1;
          box-shadow:
            0 0 28px rgba(34, 197, 94, 0.55),
            0 0 0 2px rgba(34, 197, 94, 0.6);
          border-color: rgba(34, 197, 94, 0.8);
        }
        45% {
          transform: scale(1.01) translateY(-1px);
          box-shadow:
            0 0 18px rgba(34, 197, 94, 0.4),
            0 0 0 1px rgba(34, 197, 94, 0.45);
          border-color: rgba(34, 197, 94, 0.6);
        }
        100% {
          transform: scale(1) translateY(0);
          box-shadow: none;
          border-color: var(--color-border);
        }
      }

      .machine-card.locked {
        opacity: 0.6;
        cursor: help;
      }

      .machine-card.locked:hover {
        border-color: rgba(245, 158, 11, 0.45);
        box-shadow:
          0 0 0 1px rgba(245, 158, 11, 0.2),
          0 2px 8px rgba(245, 158, 11, 0.12);
        transform: translateY(-1px);
        opacity: 0.75;
        transition:
          border-color 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.18s ease,
          opacity 0.18s ease;
      }

      .machine-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .machine-adge {
        font-size: 12px;
        color: var(--color-text-secondary);
        padding: 4px 8px;
        background: var(--color-bg-main);
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .machine-card.selected {
        border-color: var(--color-accent-main);
        box-shadow: 0 0 0 3px rgba(220, 174, 92, 0.22);
        background: rgba(220, 174, 92, 0.06);
        animation: none;
      }

      .machine-card.producing {
        border-color: rgba(34, 197, 94, 0.55);
        box-shadow:
          inset 0 0 0 1px rgba(34, 197, 94, 0.2),
          0 0 14px rgba(34, 197, 94, 0.12);
        animation: producing-pulse 2.4s ease-in-out infinite;
      }

      @keyframes producing-pulse {
        0%,
        100% {
          box-shadow:
            inset 0 0 0 1px rgba(34, 197, 94, 0.2),
            0 0 10px rgba(34, 197, 94, 0.1);
        }
        50% {
          box-shadow:
            inset 0 0 0 1px rgba(34, 197, 94, 0.35),
            0 0 22px rgba(34, 197, 94, 0.22);
        }
      }

      .machine-card.producing .progress-bar-fill {
        background: linear-gradient(90deg, #3ea85a 0%, #63be7f 45%, #7ad695 100%);
        background-size: 180% 100%;
        animation: machine-flow 1.1s linear infinite;
      }

      .machine-card.producing .progress-bar-wrapper::after {
        content: '';
        position: absolute;
        top: 0;
        left: -55%;
        width: 45%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.2) 50%,
          transparent 100%
        );
        animation: progress-shine 2.4s ease-in-out infinite;
        pointer-events: none;
        z-index: 2;
      }

      @keyframes progress-shine {
        0% {
          left: -55%;
        }
        100% {
          left: 110%;
        }
      }

      .machine-card.input-blocked {
        border-style: dashed;
        border-color: rgba(245, 158, 11, 0.5);
        box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.15);
      }

      .machine-card.output-blocked {
        border-style: dashed;
        border-color: rgba(239, 68, 68, 0.5);
        box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.15);
      }

      .machine-card.unlock-ready {
        border-color: rgba(245, 158, 11, 0.45);
        box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.2);
      }

      .machine-card.locked {
        opacity: 0.7;
      }

      .machine-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .machine-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .machine-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
      }

      .machine-level {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 500;
        color: var(--color-text-secondary);
        background: var(--color-bg-main);
        padding: 2px 6px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
      }

      .locked-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .locked-badge {
        font-size: 11px;
        font-weight: 500;
        color: #9e9e9e;
        background: rgba(158, 158, 158, 0.1);
        padding: 4px 8px;
        border-radius: var(--border-radius-small);
        border: 1px solid rgba(158, 158, 158, 0.3);
      }

      .unlock-requirements {
        font-size: 10px;
        color: var(--color-text-secondary);
        background: var(--color-bg-main);
        padding: 4px 8px;
        border-radius: var(--border-radius-small);
        border: 1px solid var(--color-border);
        line-height: 1.4;
        text-align: right;
        max-width: min(300px, 100%);
      }

      .machine-recipe {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: var(--space-2);
        font-size: 12px;
        color: var(--color-text-secondary);
        opacity: 0.9;
      }

      .recipe-inputs,
      .recipe-output {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .machine-icon-badge {
        width: 70px;
        height: 70px;
        flex-shrink: 0;
        background: radial-gradient(
          circle at 40% 35%,
          rgba(220, 174, 92, 0.18) 0%,
          rgba(30, 30, 30, 0.7) 70%
        );
        border: 1.5px solid rgba(220, 174, 92, 0.35);
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(220, 174, 92, 0.12);
        transition: opacity 0.3s ease;
      }

      .machine-card.producing .machine-icon-badge {
        animation: icon-idle-bounce 2.8s ease-in-out infinite;
        border-color: rgba(34, 197, 94, 0.5);
        box-shadow:
          0 2px 10px rgba(0, 0, 0, 0.45),
          0 0 8px rgba(34, 197, 94, 0.18),
          inset 0 1px 0 rgba(34, 197, 94, 0.1);
      }

      @keyframes icon-idle-bounce {
        0%,
        100% {
          transform: translateY(0px) scale(1);
        }
        30% {
          transform: translateY(-3px) scale(1.03);
        }
        60% {
          transform: translateY(1px) scale(0.99);
        }
        80% {
          transform: translateY(-1px) scale(1.01);
        }
      }

      .machine-icon-badge.locked {
        opacity: 0.6;
        filter: grayscale(0.35);
        border-color: rgba(158, 158, 158, 0.25);
        background: radial-gradient(
          circle at 40% 35%,
          rgba(100, 100, 100, 0.15) 0%,
          rgba(20, 20, 20, 0.7) 70%
        );
      }

      .machine-icon {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .resource-icon {
        width: 40px;
        height: 40px;
        object-fit: contain;
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
        justify-content: flex-start;
        align-items: center;
        gap: var(--space-2);
        padding-top: var(--space-2);
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

      .machine-status {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        font-size: 13px;
      }

      .status-label {
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--border-radius-small);
        border: 1px solid;
      }

      .status-produciendo {
        color: #22c55e !important;
        background: rgba(34, 197, 94, 0.15) !important;
        border-color: rgba(34, 197, 94, 0.3) !important;
        animation: status-pulse 1.2s ease-in-out infinite;
      }

      .status-parada {
        color: #94a3b8 !important;
        background: rgba(148, 163, 184, 0.1) !important;
        border-color: rgba(148, 163, 184, 0.2) !important;
      }

      .status-bloqueada {
        color: #64748b !important;
        background: rgba(100, 116, 139, 0.1) !important;
        border-color: rgba(100, 116, 139, 0.2) !important;
      }

      .status-input {
        color: #f59e0b !important;
        background: rgba(245, 158, 11, 0.15) !important;
        border-color: rgba(245, 158, 11, 0.3) !important;
      }

      .status-output {
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.15) !important;
        border-color: rgba(239, 68, 68, 0.3) !important;
      }

      @keyframes machine-flow {
        0% {
          background-position: 0% 50%;
        }
        100% {
          background-position: 100% 50%;
        }
      }

      @keyframes status-pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }
    `,
  ],
})
export class MachineCardComponent {
  @Input() machine!: Machine;

  private upgradesService = inject(UpgradesService);
  private machineUnlockService = inject(MachineUnlockService);

  justUnlocked = signal(false);
  private wasLocked: boolean | null = null;

  private resourcesService = inject(ResourcesService);
  private machinesService = inject(MachinesService);
  private machineSelectionService = inject(MachineSelectionService);
  translationService = inject(TranslationService);

  private _unlockEffect = effect(() => {
    const locked = this.isLocked();
    if (this.wasLocked === null) {
      this.wasLocked = locked;
      return;
    }
    if (this.wasLocked && !locked) {
      this.justUnlocked.set(true);
      setTimeout(() => this.justUnlocked.set(false), 1600);
    }
    this.wasLocked = locked;
  });

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

  unlockInfo = computed(() => {
    return this.machineUnlockService.getUnlockInfo(this.machine.id as MachineType);
  });

  unlockRequirementsText = computed(() => {
    const info = this.unlockInfo();
    if (info.isUnlocked || info.requirements.length === 0) {
      return '';
    }

    const reqs = info.requirements.map((req) => {
      const machineName = this.translationService.t(`machines.${req.machineType}`);
      const levelText = this.translationService.t('common.level_short');
      const status = req.isMet ? '✓' : '✗';
      return `${status} ${machineName} ${levelText} ${req.requiredLevel} (${req.currentLevel}/${req.requiredLevel})`;
    });

    return reqs.join('\n');
  });

  getResourceIcon(resourceId: string): string {
    const resource = INITIAL_RESOURCES.find((r) => r.id === resourceId);
    return resource?.icon || '?';
  }

  getResourceName(resourceId: string): string {
    return this.translationService.t(`resources.${resourceId}`);
  }

  translatedMachineName = computed(() => {
    // El ID de la máquina ya es el tipo (crusher, separator, etc.)
    return this.translationService.t(`machines.${this.machine.id}`);
  });

  machineIcon(): string | null {
    return this.machine.icon ?? null;
  }

  productionMultiplier = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateProductionMultiplier(machine.id);
  });

  consumptionMultiplier = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateConsumptionMultiplier(machine.id);
  });

  effectiveSpeed = computed(() => {
    const machine = this.currentMachine();
    return this.upgradesService.calculateEffectiveSpeed(machine.baseSpeed, machine.id);
  });

  effectiveInputs = computed(() => {
    const machine = this.currentMachine();
    const multiplier = this.consumptionMultiplier();
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

  private machineAvailability = computed(() => {
    const machine = this.currentMachine();
    const consumptionMultiplier = this.upgradesService.calculateConsumptionMultiplier(machine.id);
    const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

    const hasInputs = machine.baseConsumption.every((c) =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * consumptionMultiplier),
    );

    const outputAmount = machine.baseProduction.amount * productionMultiplier;
    const outputResourceId = machine.baseProduction.resourceId;
    const availableSpace = this.resourcesService.getAvailableSpace(outputResourceId);
    const hasSpace = !isFinite(availableSpace) || availableSpace >= outputAmount;

    return {
      hasInputs,
      hasSpace,
    };
  });

  isProducing = computed(() => {
    const machine = this.currentMachine();
    if (machine.level === 0 || !machine.isActive) {
      return false;
    }

    if (machine.progress > 0) {
      return true;
    }

    const availability = this.machineAvailability();
    return availability.hasInputs && availability.hasSpace;
  });

  isStopped = computed(() => {
    const machine = this.currentMachine();
    return machine.level > 0 && !machine.isActive;
  });

  isInputBlocked = computed(() => {
    const machine = this.currentMachine();
    if (machine.level === 0 || !machine.isActive || machine.progress > 0) {
      return false;
    }

    return !this.machineAvailability().hasInputs;
  });

  isOutputBlocked = computed(() => {
    const machine = this.currentMachine();
    if (machine.level === 0 || !machine.isActive || machine.progress > 0) {
      return false;
    }

    const availability = this.machineAvailability();
    return availability.hasInputs && !availability.hasSpace;
  });

  isUnlockReady = computed(() => {
    const info = this.unlockInfo();
    return this.isLocked() && info.requirements.some((req) => req.isMet);
  });

  remainingCycleTime = computed(() => {
    const machine = this.currentMachine();
    const cycleTime = this.effectiveCycleTime();
    const remainingProgress = 1 - machine.progress;
    return cycleTime * remainingProgress;
  });

  progressLabel = computed(() => {
    const machine = this.currentMachine();
    if (!machine.isActive || machine.progress === 0) {
      return '';
    }
    const remaining = this.remainingCycleTime();
    return `${remaining.toFixed(1)}s`;
  });

  speedTooltip = computed(() => {
    const cycleTime = this.effectiveCycleTime();
    return this.translationService.tp('tooltips.machine_speed', {
      time: cycleTime.toFixed(1),
    });
  });

  multiplierTooltip = computed(() => {
    const mult = this.productionMultiplier();
    const consumeMult = this.consumptionMultiplier();
    return this.translationService.tp('tooltips.machine_multiplier', {
      production: mult,
      consumption: consumeMult,
    });
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

  statusText = computed(() => {
    const machine = this.currentMachine();

    if (machine.level === 0) return this.translationService.t('status.bloqueada');

    if (!machine.isActive) return this.translationService.t('status.parada');

    // Si está en proceso de producción (progreso > 0), mostrar "Produciendo"
    // No verificar inputs porque ya fueron consumidos al inicio del ciclo
    if (machine.progress > 0) {
      return this.translationService.t('status.produciendo');
    }

    // Si está en progress = 0, verificar si puede empezar un nuevo ciclo
    const availability = this.machineAvailability();

    if (!availability.hasInputs) return this.translationService.t('status.falta_input');
    if (!availability.hasSpace) return this.translationService.t('status.output_lleno');

    // Máquina lista esperando para producir
    return this.translationService.t('status.produciendo');
  });

  selectMachine(): void {
    if (!this.isLocked()) {
      this.machineSelectionService.selectMachine(this.machine.id);
    }
  }

  machineTutorialId(): string | null {
    return this.machine?.id === MachineType.CRUSHER ? 'machine-card-crusher' : null;
  }

  machineProgressTutorialId(): string | null {
    return this.machine?.id === MachineType.CRUSHER ? 'machine-progress-crusher' : null;
  }

  machineToggleTutorialId(): string | null {
    return this.machine?.id === MachineType.CRUSHER ? 'machine-toggle-crusher' : null;
  }

  toggleMachine(): void {
    this.machinesService.setActive(this.machine.id, !this.machine.isActive);
  }
}
