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
    <div class="progression-hint" *ngIf="hintText()">
      <span class="hint-icon">🎯</span>
      <span class="hint-text">{{ hintText() }}</span>
    </div>
  `,
  styles: [
    `
      .progression-hint {
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: var(--border-radius-small);
        padding: var(--space-2) var(--space-3);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: 13px;
        color: var(--color-text-secondary);
      }

      .hint-icon {
        font-size: 16px;
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

    // Si todas las máquinas están desbloqueadas, mostrar mensaje de felicitación
    return this.translationService.t('progression.all_unlocked');
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
