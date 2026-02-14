import { Injectable, signal, inject } from '@angular/core';
import { Machine, MachineType } from '../models/machine.model';
import { INITIAL_MACHINES } from '../config/machines.config';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private machines = signal<Machine[]>(this.initializeMachines());
  private resourcesService = inject(ResourcesService);
  private saveService?: any;

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

  isUnlocked(machineId: string): boolean {
    const machine = this.getMachine(machineId);
    return machine ? machine.level > 0 : false;
  }

  setActive(machineId: string, active: boolean): void {
    this.machines.update((machines) =>
      machines.map((m) =>
        m.id === machineId && m.level > 0
          ? { ...m, isActive: active }
          : m,
      ),
    );
    this.saveService?.markDirty();
  }

  updateProgress(machineId: string, delta: number): void {
    this.machines.update((machines) =>
      machines.map((m) =>
        m.id === machineId ? { ...m, progress: Math.min(1.0, m.progress + delta) } : m,
      ),
    );
    this.saveService?.markDirty();
  }

  consumeProgress(machineId: string, amount: number): void {
    this.machines.update((machines) =>
      machines.map((m) => (m.id === machineId ? { ...m, progress: m.progress - amount } : m)),
    );
    this.saveService?.markDirty();
  }

  upgradeLevel(machineId: string): void {
    this.machines.update((machines) =>
      machines.map((m) => (m.id === machineId ? { ...m, level: m.level + 1 } : m)),
    );
    this.saveService?.markDirty();
  }

  getState(): Machine[] {
    return this.machines().map((m) => ({ ...m }));
  }

  setState(machines: Machine[]): void {
    // Merge loaded state with current config to ensure base values are always correct
    const mergedMachines = machines.map((loadedMachine) => {
      const configMachine = INITIAL_MACHINES.find((m) => m.id === loadedMachine.id);
      if (configMachine) {
        return {
          ...loadedMachine,
          name: configMachine.name,
          baseSpeed: configMachine.baseSpeed,
          baseConsumption: configMachine.baseConsumption,
          baseProduction: configMachine.baseProduction,
        };
      }
      return loadedMachine;
    });
    this.machines.set(mergedMachines);
  }

  setSaveService(saveService: any): void {
    this.saveService = saveService;
  }
}
