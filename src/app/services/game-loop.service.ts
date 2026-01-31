import { Injectable } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private intervalId: any = null;
  private tickCount = 0;

  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
  ) {}

  start(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    this.tickCount++;
    this.processProduction();
  }

  private processProduction(): void {
    const machines = this.machinesService.getAll();

    for (const machine of machines) {
      if (!machine.isActive) {
        continue;
      }

      this.machinesService.updateProgress(machine.id, machine.baseSpeed);

      while (machine.progress >= 1) {
        const hasEnoughResources = machine.baseConsumption.every((consumption) =>
          this.resourcesService.hasEnough(consumption.resourceId, consumption.amount),
        );

        if (!hasEnoughResources) {
          break;
        }

        for (const consumption of machine.baseConsumption) {
          this.resourcesService.subtract(consumption.resourceId, consumption.amount);
        }

        this.resourcesService.add(machine.baseProduction.resourceId, machine.baseProduction.amount);

        this.machinesService.resetProgress(machine.id, 1);
      }
    }
  }

  getTickCount(): number {
    return this.tickCount;
  }
}
