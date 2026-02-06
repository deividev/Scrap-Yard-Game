import { Injectable, signal, inject } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { SaveService } from './save.service';
import { UpgradesService } from './upgrades.service';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private intervalId: any = null;
  private tickCount = signal(0);
  private saveService = inject(SaveService);
  private upgradesService = inject(UpgradesService);
  private readonly AUTO_SAVE_INTERVAL = 15;

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

    if (this.tickCount() % this.AUTO_SAVE_INTERVAL === 0) {
      this.saveService.save();
    }
  }

  private processProduction(): void {
    const machines = this.machinesService.getAll();

    for (const machine of machines) {
      if (!machine.isActive) {
        continue;
      }

      // Calculate effective amounts with production multiplier
      const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

      const inputAmounts = machine.baseConsumption.map((c) => ({
        resourceId: c.resourceId,
        amount: c.amount * productionMultiplier,
      }));

      const outputAmount = machine.baseProduction.amount * productionMultiplier;

      // Check if machine is starting a new cycle (progress is 0 or very close to 0)
      const isStartingNewCycle = machine.progress < 0.01;

      if (isStartingNewCycle) {
        // At cycle START: Check if we have inputs and space, then consume inputs immediately
        const hasEnoughResources = inputAmounts.every((consumption) =>
          this.resourcesService.hasEnough(consumption.resourceId, consumption.amount),
        );

        const availableSpace = this.resourcesService.getAvailableSpace(
          machine.baseProduction.resourceId,
        );
        const hasOutputSpace = !isFinite(availableSpace) || availableSpace >= outputAmount;

        if (hasEnoughResources && hasOutputSpace) {
          // Consume inputs at cycle START
          for (const consumption of inputAmounts) {
            this.resourcesService.subtract(consumption.resourceId, consumption.amount);
          }

          // Now progress the cycle
          const effectiveSpeed = this.upgradesService.calculateEffectiveSpeed(
            machine.baseSpeed,
            machine.id,
          );
          this.machinesService.updateProgress(machine.id, effectiveSpeed);
        }
        // If not enough resources, machine stays at 0 progress
      } else {
        // Machine is mid-cycle, just progress normally
        const effectiveSpeed = this.upgradesService.calculateEffectiveSpeed(
          machine.baseSpeed,
          machine.id,
        );
        this.machinesService.updateProgress(machine.id, effectiveSpeed);
      }

      // Check if cycle completed (progress >= 1)
      const updatedMachine = this.machinesService.getMachine(machine.id);
      if (!updatedMachine || updatedMachine.progress < 1) {
        continue;
      }

      // At cycle END: Produce outputs and reset progress
      setTimeout(() => {
        this.resourcesService.add(updatedMachine.baseProduction.resourceId, outputAmount);
        this.machinesService.consumeProgress(updatedMachine.id, 1);
      }, 400);
    }
  }

  getTickCount(): number {
    return this.tickCount();
  }
}
