import { Injectable, inject, isDevMode } from '@angular/core';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { MachineType } from '../models/machine.model';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';

export interface UnlockRequirement {
  machineType: MachineType;
  requiredLevel: number;
  currentLevel: number;
  isMet: boolean;
}

export interface MachineUnlockInfo {
  isUnlocked: boolean;
  requirements: UnlockRequirement[];
}

/**
 * Machine Unlock Service
 * Manages progressive unlocking of machines based on level conditions
 * according to the progression tree defined in ÁRBOL_PROGRESIÓN.md
 */
@Injectable({
  providedIn: 'root',
})
export class MachineUnlockService {
  private machinesService = inject(MachinesService);
  private upgradesService = inject(UpgradesService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private audioService = inject(AudioService);
  private readonly isDev = isDevMode();

  private debugLog(message: string): void {
    if (!this.isDev) {
      return;
    }

    console.log(message);
  }

  /**
   * Gets the real level of a machine (from upgrades, not machine.level)
   */
  private getMachineLevel(machineType: MachineType): number {
    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(machineType);
    if (upgradeId) {
      return this.upgradesService.getLevel(upgradeId);
    }
    const machine = this.machinesService.getMachine(machineType);
    return machine?.level || 0;
  }

  /**
   * Checks all unlock conditions and unlocks machines that meet requirements.
   * Should be called whenever a machine level changes.
   * Single source of truth: uses getUnlockInfo() so UI requirements and
   * actual unlock logic are always in sync.
   */
  checkAndUnlockMachines(): void {
    const unlockable = [
      MachineType.SEPARATOR,
      MachineType.ASSEMBLER,
      MachineType.PACKAGER,
      MachineType.SMELTER,
      MachineType.RECYCLER,
      MachineType.ELECTRIC_ASSEMBLER,
      MachineType.ELECTRIC_PACKAGER,
      MachineType.PCB_PRINTER,
      MachineType.HDD_ASSEMBLER,
      MachineType.SCREEN_FABRICATOR,
      MachineType.GPU_FAB,
      MachineType.SMARTPHONE_FACTORY,
      MachineType.LAPTOP_WORKSHOP,
      MachineType.PC_BUILDER,
      MachineType.MINING_RIG_ASSEMBLY,
      MachineType.DATA_CENTER_ASSEMBLY,
    ];
    unlockable
      .forEach((machineType) => this.checkUnlock(machineType));
  }

  private checkUnlock(machineType: MachineType): void {
    const machine = this.machinesService.getMachine(machineType);
    if (!machine || machine.level > 0) {
      return;
    }
    const { isUnlocked } = this.getUnlockInfo(machineType);
    if (isUnlocked) {
      this.machinesService.upgradeLevel(machineType);
      this.debugLog(`[MachineUnlock] ${machineType} unlocked!`);
      const machineName = this.translationService.t(`machines.${machineType}`);
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
        machine.icon,
      );
      this.audioService.playMachineUnlocked();

      // When the Packager unlocks, the manual scrap upgrade also becomes available
      if (machineType === MachineType.PACKAGER) {
        const upgradeName = this.translationService.t('upgrades.scrap_manual.name');
        this.notificationService.show(
          this.translationService.tp('notifications.upgrade_unlocked', { name: upgradeName }),
          'unlock',
          'assets/icons/scrap_manual.png',
        );
      }
    }
  }

  /**
   * Gets unlock information for a specific machine type.
   * Returns requirements and whether each one is met.
   */
  getUnlockInfo(machineType: MachineType): MachineUnlockInfo {
    const machine = this.machinesService.getMachine(machineType);

    if (!machine || machine.level > 0) {
      return { isUnlocked: true, requirements: [] };
    }

    let requirements: UnlockRequirement[] = [];

    switch (machineType) {
      case MachineType.SEPARATOR:
        requirements = this.getSeparatorRequirements();
        break;
      case MachineType.ASSEMBLER:
        requirements = this.getAssemblerRequirements();
        break;
      case MachineType.PACKAGER:
        requirements = this.getPackagerRequirements();
        break;
      case MachineType.SMELTER:
        requirements = this.getSmelterRequirements();
        break;
      case MachineType.RECYCLER:
        requirements = this.getRecyclerRequirements();
        break;
      case MachineType.ELECTRIC_ASSEMBLER:
        requirements = this.getElectricAssemblerRequirements();
        break;
      case MachineType.ELECTRIC_PACKAGER:
        requirements = this.getElectricPackagerRequirements();
        break;
      case MachineType.PCB_PRINTER:
        requirements = this.getPcbPrinterRequirements();
        break;
      case MachineType.HDD_ASSEMBLER:
        requirements = this.getHddAssemblerRequirements();
        break;
      case MachineType.SCREEN_FABRICATOR:
        requirements = this.getScreenFabricatorRequirements();
        break;
      case MachineType.GPU_FAB:
        requirements = this.getGpuFabRequirements();
        break;
      case MachineType.SMARTPHONE_FACTORY:
        requirements = this.getSmartphoneFactoryRequirements();
        break;
      case MachineType.LAPTOP_WORKSHOP:
        requirements = this.getLaptopWorkshopRequirements();
        break;
      case MachineType.PC_BUILDER:
        requirements = this.getPcBuilderRequirements();
        break;
      case MachineType.MINING_RIG_ASSEMBLY:
        requirements = this.getMiningRigAssemblyRequirements();
        break;
      case MachineType.DATA_CENTER_ASSEMBLY:
        requirements = this.getDataCenterAssemblyRequirements();
        break;
      default:
        requirements = [];
    }

    const allMet = requirements.length > 0 && requirements.every((r) => r.isMet);
    return { isUnlocked: allMet, requirements };
  }

  private getSeparatorRequirements(): UnlockRequirement[] {
    const crusherLevel = this.getMachineLevel(MachineType.CRUSHER);
    return [
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 4,
        currentLevel: crusherLevel,
        isMet: crusherLevel >= 4,
      },
    ];
  }

  private getAssemblerRequirements(): UnlockRequirement[] {
    const separatorLevel = this.getMachineLevel(MachineType.SEPARATOR);
    const crusherLevel = this.getMachineLevel(MachineType.CRUSHER);
    return [
      {
        machineType: MachineType.SEPARATOR,
        requiredLevel: 4,
        currentLevel: separatorLevel,
        isMet: separatorLevel >= 4,
      },
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 6,
        currentLevel: crusherLevel,
        isMet: crusherLevel >= 6,
      },
    ];
  }

  private getPackagerRequirements(): UnlockRequirement[] {
    const assemblerLevel = this.getMachineLevel(MachineType.ASSEMBLER);
    const crusherLevel = this.getMachineLevel(MachineType.CRUSHER);
    return [
      {
        machineType: MachineType.ASSEMBLER,
        requiredLevel: 3,
        currentLevel: assemblerLevel,
        isMet: assemblerLevel >= 3,
      },
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 8,
        currentLevel: crusherLevel,
        isMet: crusherLevel >= 8,
      },
    ];
  }

  private getSmelterRequirements(): UnlockRequirement[] {
    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);
    return [
      {
        machineType: MachineType.PACKAGER,
        requiredLevel: 3,
        currentLevel: packagerLevel,
        isMet: packagerLevel >= 3,
      },
    ];
  }

  private getRecyclerRequirements(): UnlockRequirement[] {
    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    return [
      {
        machineType: MachineType.PACKAGER,
        requiredLevel: 5,
        currentLevel: packagerLevel,
        isMet: packagerLevel >= 5,
      },
      {
        machineType: MachineType.SMELTER,
        requiredLevel: 3,
        currentLevel: smelterLevel,
        isMet: smelterLevel >= 3,
      },
    ];
  }

  private getElectricAssemblerRequirements(): UnlockRequirement[] {
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    const recyclerLevel = this.getMachineLevel(MachineType.RECYCLER);
    return [
      {
        machineType: MachineType.SMELTER,
        requiredLevel: 3,
        currentLevel: smelterLevel,
        isMet: smelterLevel >= 3,
      },
      {
        machineType: MachineType.RECYCLER,
        requiredLevel: 3,
        currentLevel: recyclerLevel,
        isMet: recyclerLevel >= 3,
      },
    ];
  }

  private getElectricPackagerRequirements(): UnlockRequirement[] {
    const electricAssemblerLevel = this.getMachineLevel(MachineType.ELECTRIC_ASSEMBLER);
    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);
    return [
      {
        machineType: MachineType.ELECTRIC_ASSEMBLER,
        requiredLevel: 5,
        currentLevel: electricAssemblerLevel,
        isMet: electricAssemblerLevel >= 5,
      },
      {
        machineType: MachineType.PACKAGER,
        requiredLevel: 8,
        currentLevel: packagerLevel,
        isMet: packagerLevel >= 8,
      },
    ];
  }

  private getPcbPrinterRequirements(): UnlockRequirement[] {
    const electricAssemblerLevel = this.getMachineLevel(MachineType.ELECTRIC_ASSEMBLER);
    return [
      {
        machineType: MachineType.ELECTRIC_ASSEMBLER,
        requiredLevel: 4,
        currentLevel: electricAssemblerLevel,
        isMet: electricAssemblerLevel >= 4,
      },
    ];
  }

  private getHddAssemblerRequirements(): UnlockRequirement[] {
    const pcbPrinterLevel = this.getMachineLevel(MachineType.PCB_PRINTER);
    return [
      {
        machineType: MachineType.PCB_PRINTER,
        requiredLevel: 3,
        currentLevel: pcbPrinterLevel,
        isMet: pcbPrinterLevel >= 3,
      },
    ];
  }

  private getScreenFabricatorRequirements(): UnlockRequirement[] {
    const pcbPrinterLevel = this.getMachineLevel(MachineType.PCB_PRINTER);
    return [
      {
        machineType: MachineType.PCB_PRINTER,
        requiredLevel: 5,
        currentLevel: pcbPrinterLevel,
        isMet: pcbPrinterLevel >= 5,
      },
    ];
  }

  private getGpuFabRequirements(): UnlockRequirement[] {
    const hddAssemblerLevel = this.getMachineLevel(MachineType.HDD_ASSEMBLER);
    const screenFabricatorLevel = this.getMachineLevel(MachineType.SCREEN_FABRICATOR);
    return [
      {
        machineType: MachineType.HDD_ASSEMBLER,
        requiredLevel: 2,
        currentLevel: hddAssemblerLevel,
        isMet: hddAssemblerLevel >= 2,
      },
      {
        machineType: MachineType.SCREEN_FABRICATOR,
        requiredLevel: 2,
        currentLevel: screenFabricatorLevel,
        isMet: screenFabricatorLevel >= 2,
      },
    ];
  }

  private getSmartphoneFactoryRequirements(): UnlockRequirement[] {
    const screenFabricatorLevel = this.getMachineLevel(MachineType.SCREEN_FABRICATOR);
    return [
      {
        machineType: MachineType.SCREEN_FABRICATOR,
        requiredLevel: 3,
        currentLevel: screenFabricatorLevel,
        isMet: screenFabricatorLevel >= 3,
      },
    ];
  }

  private getLaptopWorkshopRequirements(): UnlockRequirement[] {
    const hddLevel = this.getMachineLevel(MachineType.HDD_ASSEMBLER);
    const screenFabricatorLevel = this.getMachineLevel(MachineType.SCREEN_FABRICATOR);
    return [
      {
        machineType: MachineType.HDD_ASSEMBLER,
        requiredLevel: 4,
        currentLevel: hddLevel,
        isMet: hddLevel >= 4,
      },
      {
        machineType: MachineType.SCREEN_FABRICATOR,
        requiredLevel: 3,
        currentLevel: screenFabricatorLevel,
        isMet: screenFabricatorLevel >= 3,
      },
    ];
  }

  private getPcBuilderRequirements(): UnlockRequirement[] {
    const gpuFabLevel = this.getMachineLevel(MachineType.GPU_FAB);
    const hddLevel = this.getMachineLevel(MachineType.HDD_ASSEMBLER);
    return [
      {
        machineType: MachineType.GPU_FAB,
        requiredLevel: 2,
        currentLevel: gpuFabLevel,
        isMet: gpuFabLevel >= 2,
      },
      {
        machineType: MachineType.HDD_ASSEMBLER,
        requiredLevel: 3,
        currentLevel: hddLevel,
        isMet: hddLevel >= 3,
      },
    ];
  }

  private getMiningRigAssemblyRequirements(): UnlockRequirement[] {
    const gpuFabLevel = this.getMachineLevel(MachineType.GPU_FAB);
    const pcBuilderLevel = this.getMachineLevel(MachineType.PC_BUILDER);
    return [
      {
        machineType: MachineType.GPU_FAB,
        requiredLevel: 3,
        currentLevel: gpuFabLevel,
        isMet: gpuFabLevel >= 3,
      },
      {
        machineType: MachineType.PC_BUILDER,
        requiredLevel: 2,
        currentLevel: pcBuilderLevel,
        isMet: pcBuilderLevel >= 2,
      },
    ];
  }

  private getDataCenterAssemblyRequirements(): UnlockRequirement[] {
    const pcBuilderLevel = this.getMachineLevel(MachineType.PC_BUILDER);
    return [
      {
        machineType: MachineType.PC_BUILDER,
        requiredLevel: 3,
        currentLevel: pcBuilderLevel,
        isMet: pcBuilderLevel >= 3,
      },
    ];
  }

  /**
   * DESBLOQUEO 1: Separador
   * Condición: Trituradora nivel 4
   */
}
