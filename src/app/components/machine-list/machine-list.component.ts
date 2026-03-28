import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { MachineCardComponent } from '../machine-card/machine-card.component';
import { MachineType } from '../../models/machine.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, MachineCardComponent],
  template: `
    <div class="machine-list">
      <h2 class="section-title">{{ translationService.t('sections.machines') }}</h2>
      <div class="machines-container">
        <app-machine-card
          *ngFor="let machine of orderedMachines(); trackBy: trackByMachineId"
          [machine]="machine"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .machine-list {
        padding: var(--space-4);
        overflow-y: auto;
        height: 100%;
      }

      .section-title {
        margin: 0 0 var(--space-4) 0;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border-left: 3px solid var(--color-accent-main);
        padding-left: 10px;
        padding-top: 2px;
        padding-bottom: 2px;
      }

      .machines-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
    `,
  ],
})
export class MachineListComponent {
  constructor(
    private machinesService: MachinesService,
    public translationService: TranslationService,
  ) {}

  // Orden de desbloqueo según nuevo árbol de progresión
  private machineOrder = [
    MachineType.CRUSHER, // Inicial
    MachineType.SEPARATOR, // Requiere Crusher Nv 4
    MachineType.ASSEMBLER, // Requiere Separator Nv 3 + Crusher Nv 6
    MachineType.PACKAGER, // Requiere Assembler Nv 3 + Crusher Nv 8
    MachineType.SMELTER, // Requiere Packager Nv 3
    MachineType.RECYCLER, // Requiere Separator Nv 4
    MachineType.ELECTRIC_ASSEMBLER, // Requiere Smelter Nv 3 + Recycler Nv 3
    MachineType.ELECTRIC_PACKAGER, // Requiere Electric Assembler Nv 3 + Packager Nv 5
  ];

  orderedMachines = computed(() => {
    const machines = this.machinesService.getAll();
    return this.machineOrder
      .map((id) => machines.find((m) => m.id === id))
      .filter((m) => m !== undefined);
  });

  trackByMachineId(index: number, machine: any): string {
    return machine.id;
  }
}
