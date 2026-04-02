import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { MachineUnlockService, UnlockRequirement } from '../../services/machine-unlock.service';
import { TranslationService } from '../../services/translation.service';
import { MachineType } from '../../models/machine.model';

@Component({
  selector: 'app-progression-hint',
  standalone: true,
  imports: [CommonModule],
  host: {
    'data-tutorial-id': 'progression-hint',
  },
  template: `
    @if (hintText()) {
      <div class="progression-hint">
        <img src="assets/icons/goal_icon.png" class="hint-icon" alt="" aria-hidden="true" />
        <span class="hint-text">{{ hintText() }}</span>
      </div>
    }
  `,
  styles: [
    `
      .progression-hint {
        background: rgba(255, 152, 0, 0.08);
        border: 1px solid rgba(255, 152, 0, 0.3);
        border-radius: var(--border-radius-small);
        padding: var(--space-2) var(--space-3);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 13px;
        color: var(--color-text-secondary);
      }

      .hint-icon {
        width: 54px;
        height: 54px;
        object-fit: contain;
        flex-shrink: 0;
        filter: drop-shadow(0 0 4px rgba(255, 152, 0, 0.6));
      }

      .hint-text {
        font-weight: 500;
      }
    `,
  ],
})
export class ProgressionHintComponent {
  private machinesService = inject(MachinesService);
  private machineUnlockService = inject(MachineUnlockService);
  private translationService = inject(TranslationService);

  /**
   * Lista ordenada de máquinas según el árbol de progresión
   */
  private progressionOrder: MachineType[] = [
    MachineType.SEPARATOR,
    MachineType.ASSEMBLER,
    MachineType.PACKAGER,
    MachineType.SMELTER,
    MachineType.RECYCLER,
    MachineType.ELECTRIC_ASSEMBLER,
    MachineType.ELECTRIC_PACKAGER,
  ];

  /**
   * Encuentra el próximo objetivo de progresión
   */
  hintText = computed(() => {
    // Buscar la primera máquina bloqueada en el orden de progresión
    for (const machineType of this.progressionOrder) {
      const unlockInfo = this.machineUnlockService.getUnlockInfo(machineType);

      if (!unlockInfo.isUnlocked && unlockInfo.requirements.length > 0) {
        const machineName = this.translationService.t(`machines.${machineType}`);

        return this.translationService.tp('progression.next_unlock', {
          machine: machineName,
          requirements: this.formatRequirements(unlockInfo.requirements),
        });
      }
    }

    // Si todas las máquinas están desbloqueadas, ocultar el banner
    return null;
  });

  private formatRequirements(requirements: UnlockRequirement[]): string {
    const levelText = this.translationService.t('common.level_short');
    const showStatusMarker = requirements.length > 1;

    return requirements
      .map((requirement) => {
        const machineName = this.translationService.t(`machines.${requirement.machineType}`);
        const status = requirement.isMet ? '✓ ' : '○ ';
        return `${showStatusMarker ? status : ''}${machineName} ${levelText} ${requirement.requiredLevel} (${requirement.currentLevel}/${requirement.requiredLevel})`;
      })
      .join(' • ');
  }
}
