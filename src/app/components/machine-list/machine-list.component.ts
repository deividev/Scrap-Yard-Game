import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { MachineCardV2Component } from '../machine-card-v2/machine-card-v2.component';
import { MachineType } from '../../models/machine.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, MachineCardV2Component],
  styleUrls: ['./machine-list.component.css'],
  template: `
    <div class="machine-list">
      @for (tier of tieredMachines(); track tier.label) {
        <div class="tier-section">
          <div class="tier-header">
            <span class="tier-label">{{ tier.label }}</span>
            <div class="tier-line"></div>
          </div>
          <div class="machines-container">
            @for (machine of tier.machines; track machine.id) {
              <div class="card-clip" [class.card-clip--tall]="isTallMachine(machine.id)">
                <app-machine-card-v2 [machine]="machine" />
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,

  styles: [
    `
      .machine-list {
        padding: var(--space-4);
        overflow-y: auto;
        height: 100%;

      }

      .tier-section {
        margin-bottom: 16px;
        padding-bottom: 8px;
      }

      .tier-section:not(:last-child)::after {
        content: '';
        display: block;
        width: 100%;
        height: 50px;
        background-size: 100% auto;
        background-position: center;
        background-repeat: no-repeat;
        margin-top: 24px;
        margin-bottom: 8px;
        opacity: 0.9;        }

      .tier-header {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        height: 56px;
        margin-bottom: var(--space-4);
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
      }

      .tier-label {
        font-size: 13px;
        font-weight: 700;
        font-family: var(--font-mono);
        color: rgba(255, 220, 150, 0.95);
        text-transform: uppercase;
        letter-spacing: 0.25em;
        white-space: nowrap;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
      }

      .tier-line {
        display: none;
      }

      .machines-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px 48px;
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
  private machinesService = inject(MachinesService);
  readonly translationService = inject(TranslationService);

  readonly tallMachines = new Set([MachineType.PACKAGER, MachineType.ELECTRIC_PACKAGER, MachineType.SMARTPHONE_FACTORY, MachineType.DATA_CENTER_ASSEMBLY]);

  isTallMachine(id: string): boolean {
    return this.tallMachines.has(id as MachineType);
  }

  private machineTiers = [
    { label: 'LÍNEA BASE', types: [
      MachineType.CRUSHER, MachineType.SEPARATOR, MachineType.ASSEMBLER,
      MachineType.PACKAGER, MachineType.SMELTER, MachineType.RECYCLER,
      MachineType.ELECTRIC_ASSEMBLER, MachineType.ELECTRIC_PACKAGER,
    ]},
    { label: 'ELECTRÓNICA', types: [
      MachineType.PCB_PRINTER, MachineType.HDD_ASSEMBLER,
      MachineType.SCREEN_FABRICATOR, MachineType.GPU_FAB,
    ]},
    { label: 'MANUFACTURA DIGITAL', types: [
      MachineType.SMARTPHONE_FACTORY, MachineType.LAPTOP_WORKSHOP,
      MachineType.PC_BUILDER, MachineType.MINING_RIG_ASSEMBLY, MachineType.DATA_CENTER_ASSEMBLY,
    ]},
  ];

  tieredMachines = computed(() => {
    const all = this.machinesService.getAll();
    return this.machineTiers.map(tier => ({
      label: tier.label,
      machines: tier.types
        .map(type => all.find(m => m.id === type))
        .filter((m): m is NonNullable<typeof m> => m !== undefined),
    }));
  });
}
