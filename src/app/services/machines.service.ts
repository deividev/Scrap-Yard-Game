import { Injectable, signal, inject } from '@angular/core';
import { Machine, MachineUpgradeCost } from '../models/machine.model';
import { INITIAL_MACHINES } from '../config/machines.config';
import { MACHINE_UPGRADE_CONFIG } from '../config/game-balance.config';
import { ResourcesService } from './resources.service';
import { ResourceType } from '../models/resource.model';

@Injectable({
  providedIn: 'root',
})
export class MachinesService {
  private machines = signal<Machine[]>(this.initializeMachines());
  private resourcesService = inject(ResourcesService);

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
          ? { ...m, isActive: active, progress: active ? m.progress : 0 }
          : m,
      ),
    );
  }

  updateProgress(machineId: string, delta: number): void {
    this.machines.update((machines) =>
      machines.map((m) =>
        m.id === machineId ? { ...m, progress: Math.min(1.0, m.progress + delta) } : m,
      ),
    );
  }

  consumeProgress(machineId: string, amount: number): void {
    this.machines.update((machines) =>
      machines.map((m) => (m.id === machineId ? { ...m, progress: m.progress - amount } : m)),
    );
  }

  upgradeLevel(machineId: string): void {
    this.machines.update((machines) =>
      machines.map((m) => (m.id === machineId ? { ...m, level: m.level + 1 } : m)),
    );
  }

  calculateUpgradeCostForNextLevel(currentLevel: number): MachineUpgradeCost {
    const safeCurrentLevel = Math.max(1, currentLevel);
    const newLevel = safeCurrentLevel + 1;
    const moneyCost = Math.ceil(
      MACHINE_UPGRADE_CONFIG.BASE_MONEY_COST *
        Math.pow(MACHINE_UPGRADE_CONFIG.COST_MULTIPLIER, newLevel - 2),
    );
    const componentsCost =
      newLevel < MACHINE_UPGRADE_CONFIG.COMPONENTS_START_LEVEL ? 0 : newLevel - 3;

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

  // F) Additional methods for upgrade affordability
  getNextLevelCost(machineId: string): MachineUpgradeCost | null {
    return this.getUpgradeCost(machineId);
  }

  canAffordNextLevel(machineId: string): boolean {
    const cost = this.getNextLevelCost(machineId);
    if (!cost) return false;

    const hasMoney = this.resourcesService.hasEnough(ResourceType.MONEY, cost.money);
    const hasComponents = this.resourcesService.hasEnough(ResourceType.COMPONENTS, cost.components);

    return hasMoney && hasComponents;
  }

  getState(): Machine[] {
    return this.machines().map((m) => ({ ...m }));
  }

  setState(machines: Machine[]): void {
    this.machines.set(machines.map((m) => ({ ...m })));
  }
}
