import { Injectable, signal } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { ScrapGenerationService } from './scrap-generation.service';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private intervalId: any = null;
  private tickCount = signal(0);

  constructor(
    private resourcesService: ResourcesService,
    private machinesService: MachinesService,
    private scrapGenerationService: ScrapGenerationService,
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
    this.tickCount.update((count) => count + 1);
    this.scrapGenerationService.processAutomaticGeneration();
    this.processProduction();
  }

  private processProduction(): void {
    const machines = this.machinesService.getAll();

    for (const machine of machines) {
      if (!machine.isActive) {
        continue;
      }

      // 1) Check if machine CAN run cycle this tick (has inputs AND output space)
      const hasEnoughResources = machine.baseConsumption.every((consumption) =>
        this.resourcesService.hasEnough(consumption.resourceId, consumption.amount),
      );

      const hasOutputSpace =
        this.resourcesService.getAvailableSpace(machine.baseProduction.resourceId) >=
        machine.baseProduction.amount;

      const canRunCycle = hasEnoughResources && hasOutputSpace;

      if (canRunCycle) {
        const effectiveSpeed = machine.baseSpeed;
        this.machinesService.updateProgress(machine.id, effectiveSpeed);
      }

      const updatedMachine = this.machinesService.getMachine(machine.id);
      if (!updatedMachine || updatedMachine.progress < 1) {
        continue;
      }

      // 4) Execute cycle: consume inputs, produce outputs, progress -= 1
      // Add small delay so user can see 100% progress bar
      setTimeout(() => {
        for (const consumption of updatedMachine.baseConsumption) {
          this.resourcesService.subtract(consumption.resourceId, consumption.amount);
        }

        this.resourcesService.add(
          updatedMachine.baseProduction.resourceId,
          updatedMachine.baseProduction.amount,
        );

        this.machinesService.consumeProgress(machine.id, 1);
      }, 400);
    }
  }

  getTickCount(): number {
    return this.tickCount();
  }
}
