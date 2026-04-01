import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { MachineCardV2Component } from '../machine-card-v2/machine-card-v2.component';
import { MachineType } from '../../models/machine.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, MachineCardV2Component],
  template: `
    <div class="machine-list">
      <h2 class="section-title">{{ translationService.t('sections.machines') }}</h2>
      <div class="machines-container">
        @for (machine of orderedMachines(); track machine.id) {
          <div class="card-clip" [class.card-clip--tall]="isTallMachine(machine.id)">
            <app-machine-card-v2 [machine]="machine" />
          </div>
        }
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
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px 60px;
        align-items: start;
      }

      /* Uniform-height clip — padding-bottom trick: height:0 + padding-bottom
         creates an immovable hard height that children CANNOT expand.
         530/420 × 100% = 126.19% → all cards render at 420×530 equivalent. */
      .card-clip {
        width: 100%;
        height: 0;
        padding-bottom: 126.2%;
        overflow: hidden;
        position: relative;
      }

      .card-clip app-machine-card-v2 {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: block;
      }

      .card-clip ::ng-deep .mc-v2 {
        height: 100% !important;
      }

      .card-clip ::ng-deep .mc-v2__img {
        width: 100% !important;
        height: 100% !important;
        aspect-ratio: unset !important;
        object-fit: cover !important;
        object-position: top center !important;
      }

      /* Empaquetadora / Empaquetadora Eléctrica — crop centrado */
      .card-clip--tall ::ng-deep .mc-v2__img {
        object-position: center center !important;
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

  readonly tallMachines = new Set([MachineType.PACKAGER, MachineType.ELECTRIC_PACKAGER]);

  isTallMachine(id: string): boolean {
    return this.tallMachines.has(id as MachineType);
  }

  orderedMachines = computed(() => {
    const machines = this.machinesService.getAll();
    return this.machineOrder
      .map((id) => machines.find((m) => m.id === id))
      .filter((m) => m !== undefined);
  });
}
