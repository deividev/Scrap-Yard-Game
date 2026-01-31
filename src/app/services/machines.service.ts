import { Injectable, signal } from '@angular/core';
import { Machine, MachineUpgradeCost } from '../models/machine.model';
import { INITIAL_MACHINES } from '../config/machines.config';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private machines = signal<Machine[]>(this.initializeMachines());

  private initializeMachines(): Machine[] {
    return INITIAL_MACHINES.map((m) => ({ ...m }));
  }

  getAll(): Machine[] {
    return this.machines();
  }

  getMachine(machineId: string): Machine | undefined {
    return this.machines().find((m) => m.id === machineId);
  }

  getLevel(machineId: string): number {
    const machine = this.getMachine(machineId);
    return machine ? machine.level : 0;
  }

  getSpeed(machineId: string): number {
    const machine = this.getMachine(machineId);
    return machine ? machine.baseSpeed : 0;
  }

  isActive(machineId: string): boolean {
    const machine = this.getMachine(machineId);
    return machine ? machine.isActive : false;
  }

  setActive(machineId: string, active: boolean): void {
    this.machines.update((machines) => {
      const machine = machines.find((m) => m.id === machineId);
      if (machine) {
        machine.isActive = active;
        if (!active) {
          machine.progress = 0;
        }
      }
      return [...machines];
    });
  }

  updateProgress(machineId: string, delta: number): void {
    this.machines.update((machines) => {
      const machine = machines.find((m) => m.id === machineId);
      if (machine) {
        machine.progress += delta;
      }
      return [...machines];
    });
  }

  resetProgress(machineId: string, amount: number): void {
    this.machines.update((machines) => {
      const machine = machines.find((m) => m.id === machineId);
      if (machine) {
        machine.progress -= amount;
      }
      return [...machines];
    });
  }

  upgradeLevel(machineId: string): void {
    this.machines.update((machines) => {
      const machine = machines.find((m) => m.id === machineId);
      if (machine) {
        machine.level++;
      }
      return [...machines];
    });
  }

  calculateUpgradeCostForNextLevel(currentLevel: number): MachineUpgradeCost {
    const safeCurrentLevel = Math.max(1, currentLevel);
    const newLevel = safeCurrentLevel + 1;
    const moneyCost = Math.ceil(20 * Math.pow(1.15, newLevel - 2));
    const componentsCost = newLevel < 4 ? 0 : newLevel - 3;

    return {
      money: moneyCost,
      components: componentsCost,
    };
  }

  getUpgradeCost(machineId: string): MachineUpgradeCost | null {
    const machine = this.getMachine(machineId);
    if (!machine) {
      return null;
    }
    return this.calculateUpgradeCostForNextLevel(machine.level);
  }

  getState(): Machine[] {
    return this.machines().map((m) => ({ ...m }));
  }

  setState(machines: Machine[]): void {
    this.machines.set(machines.map((m) => ({ ...m })));
  }
}
