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
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-primary);
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

  // Orden de desbloqueo según árbol de progresión
  private machineOrder = [
    MachineType.CRUSHER, // Inicial
    MachineType.SMELTER, // Requiere Crusher Nv 2
    MachineType.PACKAGER, // Requiere Smelter Nv 3
    MachineType.SEPARATOR, // Requiere Packager Nv 2
    MachineType.ASSEMBLER, // Requiere Separator Nv 2 + Smelter Nv 4
    MachineType.RECYCLER, // Requiere Separator Nv 3
    MachineType.ELECTRIC_ASSEMBLER, // Requiere Recycler Nv 2 + Smelter Nv 5 + Assembler
    MachineType.ELECTRIC_PACKAGER, // Requiere Electric Assembler Nv 2 + Packager Nv 3
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
