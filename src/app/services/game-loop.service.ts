import { Injectable, signal, inject } from '@angular/core';
import { ResourcesService } from './resources.service';
import { MachinesService } from './machines.service';
import { ScrapGenerationService } from './scrap-generation.service';
import { SaveService } from './save.service';
import { UpgradesService } from './upgrades.service';
import { UpgradeProgressService } from './upgrade-progress.service';
import { MachineUnlockService } from './machine-unlock.service';
import { UpgradeId } from '../models/upgrade.model';

@Injectable({
  providedIn: 'root',
})
export class GameLoopService {
  private intervalId: any = null;
  private tickCount = signal(0);
  private saveService = inject(SaveService);
  private upgradesService = inject(UpgradesService);
  private upgradeProgressService = inject(UpgradeProgressService);
  private machineUnlockService = inject(MachineUnlockService);
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

    // Procesar generación de chatarra
    this.scrapGenerationService.processAutomaticGeneration();

    // Procesar producción de máquinas
    this.processProduction();

    // Procesar progreso de upgrades (1 segundo de deltaTime)
    this.processUpgradeProgress(1);

    // Auto-guardado
    if (this.tickCount() % this.AUTO_SAVE_INTERVAL === 0) {
      this.saveService.save();
    }
  }

  /**
   * Procesa el progreso de todos los upgrades activos.
   * Completa y aplica efectos de los upgrades que terminan.
   */
  private processUpgradeProgress(deltaTime: number): void {
    const completedUpgrades = this.upgradeProgressService.updateProgress(deltaTime);

    // Aplicar efectos de upgrades completados
    for (const upgradeId of completedUpgrades) {
      this.upgradesService.completeUpgrade(upgradeId);

      // Si es un upgrade de almacenamiento, actualizar capacidades
      if (upgradeId.startsWith('UPG_STORE_')) {
        this.upgradesService.applyStorageUpgrades(this.resourcesService);
      }

      // Si es el upgrade de generación automática de chatarra, actualizar el rate
      if (upgradeId === UpgradeId.UPG_SCRAP_002) {
        const newLevel = this.upgradesService.getLevel(upgradeId);
        const newRate = this.scrapGenerationService.getAutoRateByLevel(newLevel);
        this.scrapGenerationService.setAutomaticGenerationRate(newRate);
      }

      // Si es un upgrade de máquina, verificar desbloqueos
      if (upgradeId.startsWith('UPG_MACH_')) {
        this.machineUnlockService.checkAndUnlockMachines();
      }
    }
  }

  private processProduction(): void {
    const machines = this.machinesService.getAll();

    for (const machine of machines) {
      if (!machine.isActive) {
        continue;
      }

      // Calculate effective amounts with separate multipliers
      const consumptionMultiplier = this.upgradesService.calculateConsumptionMultiplier(machine.id);
      const productionMultiplier = this.upgradesService.calculateProductionMultiplier(machine.id);

      const inputAmounts = machine.baseConsumption.map((c) => ({
        resourceId: c.resourceId,
        amount: c.amount * consumptionMultiplier,
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

      // At cycle END: Produce outputs immediately, but reset progress with delay for visual feedback
      this.resourcesService.add(updatedMachine.baseProduction.resourceId, outputAmount);
      setTimeout(() => {
        this.machinesService.consumeProgress(updatedMachine.id, 1);
      }, 500);
    }
  }

  getTickCount(): number {
    return this.tickCount();
  }
}
