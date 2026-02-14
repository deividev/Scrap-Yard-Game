import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { TranslationService } from '../../services/translation.service';
import { MachineType } from '../../models/machine.model';

@Component({
  selector: 'app-progression-hint',
  standalone: true,
  imports: [CommonModule],
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
    MachineType.SMELTER,
    MachineType.PACKAGER,
    MachineType.SEPARATOR,
    MachineType.ASSEMBLER,
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
        
        // Encontrar el primer requisito que no está cumplido
        const unmetReq = unlockInfo.requirements.find(r => !r.isMet);
        if (unmetReq) {
          const reqMachineName = this.translationService.t(`machines.${unmetReq.machineType}`);
          return this.translationService.tp('progression.next_unlock', {
            machine: machineName,
            requirement: reqMachineName,
            level: unmetReq.requiredLevel.toString()
          });
        }
      }
    }

    // Si todas las máquinas están desbloqueadas, mostrar mensaje de felicitación
    return this.translationService.t('progression.all_unlocked');
  });
}
