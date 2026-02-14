import { Injectable, inject } from '@angular/core';
import { MachinesService } from './machines.service';
import { UpgradesService } from './upgrades.service';
import { MachineType } from '../models/machine.model';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';

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
   */
  checkAndUnlockMachines(): void {
    this.checkSmelterUnlock();
    this.checkPackagerUnlock();
    this.checkSeparatorUnlock();
    this.checkAssemblerUnlock();
    this.checkRecyclerUnlock();
    this.checkElectricAssemblerUnlock();
    this.checkElectricPackagerUnlock();
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
      case MachineType.SMELTER:
        requirements = this.getSmelterRequirements();
        break;
      case MachineType.PACKAGER:
        requirements = this.getPackagerRequirements();
        break;
      case MachineType.SEPARATOR:
        requirements = this.getSeparatorRequirements();
        break;
      case MachineType.ASSEMBLER:
        requirements = this.getAssemblerRequirements();
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
      default:
        requirements = [];
    }

    const allMet = requirements.length > 0 && requirements.every((r) => r.isMet);
    return { isUnlocked: allMet, requirements };
  }

  private getSmelterRequirements(): UnlockRequirement[] {
    const currentLevel = this.getMachineLevel(MachineType.CRUSHER);
    return [
      {
        machineType: MachineType.CRUSHER,
        requiredLevel: 2,
        currentLevel,
        isMet: currentLevel >= 2,
      },
    ];
  }

  private getPackagerRequirements(): UnlockRequirement[] {
    const currentLevel = this.getMachineLevel(MachineType.SMELTER);
    return [
      {
        machineType: MachineType.SMELTER,
        requiredLevel: 3,
        currentLevel,
        isMet: currentLevel >= 3,
      },
    ];
  }

  private getSeparatorRequirements(): UnlockRequirement[] {
    const currentLevel = this.getMachineLevel(MachineType.PACKAGER);
    return [
      {
        machineType: MachineType.PACKAGER,
        requiredLevel: 2,
        currentLevel,
        isMet: currentLevel >= 2,
      },
    ];
  }

  private getAssemblerRequirements(): UnlockRequirement[] {
    const separatorLevel = this.getMachineLevel(MachineType.SEPARATOR);
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    return [
      {
        machineType: MachineType.SEPARATOR,
        requiredLevel: 2,
        currentLevel: separatorLevel,
        isMet: separatorLevel >= 2,
      },
      {
        machineType: MachineType.SMELTER,
        requiredLevel: 4,
        currentLevel: smelterLevel,
        isMet: smelterLevel >= 4,
      },
    ];
  }

  private getRecyclerRequirements(): UnlockRequirement[] {
    const currentLevel = this.getMachineLevel(MachineType.SEPARATOR);
    return [
      {
        machineType: MachineType.SEPARATOR,
        requiredLevel: 3,
        currentLevel,
        isMet: currentLevel >= 3,
      },
    ];
  }

  private getElectricAssemblerRequirements(): UnlockRequirement[] {
    const recyclerLevel = this.getMachineLevel(MachineType.RECYCLER);
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    const assemblerLevel = this.getMachineLevel(MachineType.ASSEMBLER);
    return [
      {
        machineType: MachineType.RECYCLER,
        requiredLevel: 2,
        currentLevel: recyclerLevel,
        isMet: recyclerLevel >= 2,
      },
      {
        machineType: MachineType.SMELTER,
        requiredLevel: 5,
        currentLevel: smelterLevel,
        isMet: smelterLevel >= 5,
      },
      {
        machineType: MachineType.ASSEMBLER,
        requiredLevel: 1,
        currentLevel: assemblerLevel,
        isMet: assemblerLevel >= 1,
      },
    ];
  }

  private getElectricPackagerRequirements(): UnlockRequirement[] {
    const electricAssemblerLevel = this.getMachineLevel(MachineType.ELECTRIC_ASSEMBLER);
    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);
    return [
      {
        machineType: MachineType.ELECTRIC_ASSEMBLER,
        requiredLevel: 2,
        currentLevel: electricAssemblerLevel,
        isMet: electricAssemblerLevel >= 2,
      },
      {
        machineType: MachineType.PACKAGER,
        requiredLevel: 3,
        currentLevel: packagerLevel,
        isMet: packagerLevel >= 3,
      },
    ];
  }

  /**
   * DESBLOQUEO 0: Fundidora
   * Condición: Trituradora nivel 2
   */
  private checkSmelterUnlock(): void {
    const smelter = this.machinesService.getMachine(MachineType.SMELTER);
    if (!smelter || smelter.level > 0) {
      return;
    }

    const crusherLevel = this.getMachineLevel(MachineType.CRUSHER);
    if (crusherLevel >= 2) {
      this.machinesService.upgradeLevel(MachineType.SMELTER);
      console.log('[MachineUnlock] Smelter unlocked! (Crusher level 2 reached)');
      const machineName = this.translationService.t('machines.smelter');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 1: Empaquetadora
   * Condición: Fundidora nivel 3
   */
  private checkPackagerUnlock(): void {
    const packager = this.machinesService.getMachine(MachineType.PACKAGER);
    if (!packager || packager.level > 0) {
      return; // Already unlocked or doesn't exist
    }

    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    if (smelterLevel >= 3) {
      this.machinesService.upgradeLevel(MachineType.PACKAGER);
      console.log('[MachineUnlock] Packager unlocked! (Smelter level 3 reached)');
      const machineName = this.translationService.t('machines.packager');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 2: Separador
   * Condición: Empaquetadora nivel 2
   */
  private checkSeparatorUnlock(): void {
    const separator = this.machinesService.getMachine(MachineType.SEPARATOR);
    if (!separator || separator.level > 0) {
      return;
    }

    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);
    if (packagerLevel >= 2) {
      this.machinesService.upgradeLevel(MachineType.SEPARATOR);
      console.log('[MachineUnlock] Separator unlocked! (Packager level 2 reached)');
      const machineName = this.translationService.t('machines.separator');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 3: Ensambladora
   * Condición: Separador nivel 2 Y Fundidora nivel 4
   */
  private checkAssemblerUnlock(): void {
    const assembler = this.machinesService.getMachine(MachineType.ASSEMBLER);
    if (!assembler || assembler.level > 0) {
      return;
    }

    const separatorLevel = this.getMachineLevel(MachineType.SEPARATOR);
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);

    if (separatorLevel >= 2 && smelterLevel >= 4) {
      this.machinesService.upgradeLevel(MachineType.ASSEMBLER);
      console.log(
        '[MachineUnlock] Assembler unlocked! (Separator level 2 + Smelter level 4 reached)',
      );
      const machineName = this.translationService.t('machines.assembler');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 4: Recicladora
   * Condición: Separador nivel 3
   */
  private checkRecyclerUnlock(): void {
    const recycler = this.machinesService.getMachine(MachineType.RECYCLER);
    if (!recycler || recycler.level > 0) {
      return;
    }

    const separatorLevel = this.getMachineLevel(MachineType.SEPARATOR);
    if (separatorLevel >= 3) {
      this.machinesService.upgradeLevel(MachineType.RECYCLER);
      console.log('[MachineUnlock] Recycler unlocked! (Separator level 3 reached)');
      const machineName = this.translationService.t('machines.recycler');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 5: Ensambladora eléctrica
   * Condición: Recicladora nivel 2 Y Fundidora nivel 5 Y Ensambladora desbloqueada
   */
  private checkElectricAssemblerUnlock(): void {
    const electricAssembler = this.machinesService.getMachine(MachineType.ELECTRIC_ASSEMBLER);
    if (!electricAssembler || electricAssembler.level > 0) {
      return;
    }

    const recyclerLevel = this.getMachineLevel(MachineType.RECYCLER);
    const smelterLevel = this.getMachineLevel(MachineType.SMELTER);
    const assemblerLevel = this.getMachineLevel(MachineType.ASSEMBLER);

    if (recyclerLevel >= 2 && smelterLevel >= 5 && assemblerLevel >= 1) {
      this.machinesService.upgradeLevel(MachineType.ELECTRIC_ASSEMBLER);
      console.log(
        '[MachineUnlock] Electric Assembler unlocked! (Recycler level 2 + Smelter level 5 + Assembler unlocked)',
      );
      const machineName = this.translationService.t('machines.electric_assembler');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }

  /**
   * DESBLOQUEO 6: Empaquetadora eléctrica
   * Condición: Ensambladora eléctrica nivel 2 Y Empaquetadora nivel 3
   */
  private checkElectricPackagerUnlock(): void {
    const electricPackager = this.machinesService.getMachine(MachineType.ELECTRIC_PACKAGER);
    if (!electricPackager || electricPackager.level > 0) {
      return;
    }

    const electricAssemblerLevel = this.getMachineLevel(MachineType.ELECTRIC_ASSEMBLER);
    const packagerLevel = this.getMachineLevel(MachineType.PACKAGER);

    if (electricAssemblerLevel >= 2 && packagerLevel >= 3) {
      this.machinesService.upgradeLevel(MachineType.ELECTRIC_PACKAGER);
      console.log(
        '[MachineUnlock] Electric Packager unlocked! (Electric Assembler level 2 + Packager level 3)',
      );
      const machineName = this.translationService.t('machines.electric_packager');
      this.notificationService.show(
        this.translationService.tp('notifications.machine_unlocked', { name: machineName }),
        'unlock',
      );
    }
  }
}
