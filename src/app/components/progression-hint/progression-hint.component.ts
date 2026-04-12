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
  host: {
    'data-tutorial-id': 'progression-hint',
  },
  template: `
    @if (hintData()) {
      <div class="progression-hint">
        <img src="assets/icons/goal_icon.png" class="hint-icon" alt="" aria-hidden="true" />
        <div class="hint-body">
          <span class="hint-title">{{ translationService.t('progression.next_unlock_label') }} <strong>{{ hintData()!.machineName }}</strong></span>
          <div class="hint-reqs">
            @for (req of hintData()!.requirements; track $index) {
              <div class="hint-req">
                <span [class.hint-req-icon--met]="req.isMet" [class.hint-req-icon--unmet]="!req.isMet">{{ req.isMet ? '✓' : '✗' }}</span>
                <span class="hint-req-label">{{ req.machineName }} {{ translationService.t('common.level_short') }} {{ req.requiredLevel }} ({{ req.currentLevel }}/{{ req.requiredLevel }})</span>
              </div>
            }
          </div>
        </div>
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
        align-items: flex-start;
        gap: var(--space-2);
        font-size: 11px;
        color: var(--color-text-secondary);
      }

      .hint-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
        flex-shrink: 0;
        margin-top: 2px;
        filter: drop-shadow(0 0 3px rgba(255, 152, 0, 0.6));
      }

      .hint-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .hint-title {
        font-size: 11px;
        color: var(--color-text-secondary);
        line-height: 1.3;
      }

      .hint-title strong {
        color: var(--color-accent-main);
        font-weight: 700;
      }

      .hint-reqs {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .hint-req {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        font-family: var(--font-mono);
      }

      .hint-req-icon--met {
        color: #22c55e;
        font-weight: 700;
        flex-shrink: 0;
      }

      .hint-req-icon--unmet {
        color: #ef4444;
        font-weight: 700;
        flex-shrink: 0;
      }

      .hint-req-label {
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class ProgressionHintComponent {
  private machinesService = inject(MachinesService);
  private machineUnlockService = inject(MachineUnlockService);
  readonly translationService = inject(TranslationService);

  private progressionOrder: MachineType[] = [
    MachineType.SEPARATOR,
    MachineType.ASSEMBLER,
    MachineType.PACKAGER,
    MachineType.SMELTER,
    MachineType.RECYCLER,
    MachineType.ELECTRIC_ASSEMBLER,
    MachineType.ELECTRIC_PACKAGER,
  ];

  hintData = computed(() => {
    for (const machineType of this.progressionOrder) {
      const unlockInfo = this.machineUnlockService.getUnlockInfo(machineType);
      if (!unlockInfo.isUnlocked && unlockInfo.requirements.length > 0) {
        return {
          machineName: this.translationService.t(`machines.${machineType}`),
          requirements: unlockInfo.requirements.map((req) => ({
            isMet: req.isMet,
            machineName: this.translationService.t(`machines.${req.machineType}`),
            requiredLevel: req.requiredLevel,
            currentLevel: req.currentLevel,
          })),
        };
      }
    }
    return null;
  });
}
