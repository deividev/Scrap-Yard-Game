import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameLoopService } from '../../services/game-loop.service';
import { MachinesService } from '../../services/machines.service';

@Component({
  selector: 'app-debug-machines-panel',
  imports: [CommonModule],
  standalone: true,
  template: `
    <div style="padding: 20px; border: 2px solid red; margin: 20px;">
      <h2>DEBUG PANEL (temporal)</h2>

      <div style="margin-bottom: 20px;">
        <button (click)="startGame()" style="margin-right: 10px;">Start Game Loop</button>
        <button (click)="stopGame()">Stop Game Loop</button>
      </div>

      <p>Tick Count: {{ tickCount() }}</p>

      <h3>Máquinas</h3>
      <div
        *ngFor="let machine of machines(); trackBy: trackByMachineId"
        style="margin-bottom: 15px; border: 1px solid gray; padding: 10px;"
      >
        <h4>
          {{ machine.name }} <span style="color: #66bb6a;">[Level {{ machine.level }}]</span>
        </h4>
        <p>
          Estado: {{ machine.isActive ? 'ACTIVA' : 'INACTIVA' }}
          <button (click)="toggleMachine(machine.id)">
            {{ machine.isActive ? 'Desactivar' : 'Activar' }}
          </button>
        </p>
        <p>
          Progress: {{ machine.progress.toFixed(2) }} / 1.00 ({{
            (machine.progress * 100).toFixed(0)
          }}%)
        </p>
        <p>Velocidad: {{ machine.baseSpeed }} ciclos/tick</p>
        <p>Consumo por ciclo:</p>
        <ul>
          <li *ngFor="let consumption of machine.baseConsumption">
            {{ consumption.resourceId }}: {{ consumption.amount }}
          </li>
        </ul>
        <p>
          Producción por ciclo: {{ machine.baseProduction.resourceId }}:
          {{ machine.baseProduction.amount }}
        </p>
      </div>
    </div>
  `,
  styles: [],
})
export class DebugMachinesPanelComponent {
  machines = computed(() => this.machinesService.getAll());
  tickCount = computed(() => this.gameLoopService.getTickCount());

  constructor(
    private gameLoopService: GameLoopService,
    private machinesService: MachinesService,
  ) {}

  toggleMachine(machineId: string): void {
    const machine = this.machinesService.getMachine(machineId);
    if (machine) {
      this.machinesService.setActive(machineId, !machine.isActive);
    }
  }

  startGame(): void {
    this.gameLoopService.start();
  }

  stopGame(): void {
    this.gameLoopService.stop();
  }

  trackByMachineId(index: number, machine: any): string {
    return machine.id;
  }
}
