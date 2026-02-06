import { Injectable, signal } from '@angular/core';
import { UpgradeState, UpgradeId, UpgradeCost } from '../models/upgrade.model';
import { ResourceType } from '../models/resource.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';
import {
  UPGRADE_COST_FORMULAS,
  STORAGE_UPGRADE_CONFIG,
  SCRAP_GENERATION_CONFIG,
  MACHINE_UPGRADE_CONFIG,
} from '../config/game-balance.config';

/**
 * G) Upgrades Service - Placeholder
 *
 * IMPORTANT: This service only manages upgrade STATE (levels).
 * It does NOT apply effects to resources or machines yet.
 * Effects will be implemented in a future phase.
 *
 * Current responsibilities:
 * - Track upgrade levels
 * - Calculate costs for next level
 * - Provide getters for serialization
 * - NO purchase logic
 * - NO effect application
 */
@Injectable({
  providedIn: 'root',
})
export class UpgradesService {
  private upgrades = signal<UpgradeState[]>(this.initializeUpgrades());
  private saveService?: any;

  private initializeUpgrades(): UpgradeState[] {
    return UPGRADE_DEFINITIONS.map((def) => ({
      id: def.id,
      level: 1,
    }));
  }

  getAll(): UpgradeState[] {
    return this.upgrades();
  }

  getLevel(upgradeId: UpgradeId): number {
    const upgrade = this.upgrades().find((u) => u.id === upgradeId);
    return upgrade ? upgrade.level : 0;
  }

  /**
   * Calculate cost for next level of an upgrade.
   * Formula: ceil(baseCost * (1.15 ^ currentLevel)) for most upgrades
   * Formula: ceil(baseCost * (1.25 ^ currentLevel)) for scrap upgrades
   * Storage upgrades are capped at level 50.
   *
   * @param upgradeId The upgrade to calculate cost for
   * @returns Cost object with money and components, or null if upgrade not found or max level reached
   */
  getCostForNextLevel(upgradeId: UpgradeId): UpgradeCost | null {
    const upgrade = this.upgrades().find((u) => u.id === upgradeId);
    if (!upgrade) return null;

    const definition = UPGRADE_DEFINITIONS.find((d) => d.id === upgradeId);
    if (!definition) return null;

    const currentLevel = upgrade.level;

    const isStorageUpgrade = upgradeId.startsWith('UPG_STORE_');
    if (isStorageUpgrade && currentLevel >= STORAGE_UPGRADE_CONFIG.MAX_LEVEL) {
      return null;
    }

    const isScrapAutoUpgrade = upgradeId === UpgradeId.UPG_SCRAP_002;
    if (isScrapAutoUpgrade && currentLevel >= SCRAP_GENERATION_CONFIG.MAX_LEVEL) {
      return null;
    }

    const isMachineUpgrade = upgradeId.startsWith('UPG_MACH_');
    if (isMachineUpgrade && currentLevel >= MACHINE_UPGRADE_CONFIG.MAX_LEVEL) {
      return null;
    }

    const isScrapUpgrade =
      upgradeId === UpgradeId.UPG_SCRAP_001 || upgradeId === UpgradeId.UPG_SCRAP_002;

    let multiplier: number;
    if (isStorageUpgrade) {
      multiplier = UPGRADE_COST_FORMULAS.STORAGE_MULTIPLIER;
    } else if (isScrapAutoUpgrade) {
      multiplier = SCRAP_GENERATION_CONFIG.COST_MULTIPLIER;
    } else if (isScrapUpgrade) {
      multiplier = UPGRADE_COST_FORMULAS.SCRAP_MULTIPLIER;
    } else {
      multiplier = UPGRADE_COST_FORMULAS.DEFAULT_MULTIPLIER;
    }

    const moneyCost = Math.ceil(definition.baseCostMoney * Math.pow(multiplier, currentLevel));

    let componentsCost = 0;
    if (definition.extraCostComponents) {
      componentsCost = definition.extraCostComponents * (currentLevel + 1);
    } else if (
      isScrapAutoUpgrade &&
      currentLevel >= SCRAP_GENERATION_CONFIG.COMPONENTS_START_LEVEL
    ) {
      componentsCost = currentLevel - SCRAP_GENERATION_CONFIG.COMPONENTS_START_LEVEL + 1;
    } else if (isMachineUpgrade && currentLevel >= MACHINE_UPGRADE_CONFIG.COMPONENTS_START_LEVEL) {
      componentsCost = currentLevel - MACHINE_UPGRADE_CONFIG.COMPONENTS_START_LEVEL + 1;
    }

    return {
      money: moneyCost,
      components: componentsCost,
    };
  }

  /**
   * Get definition for an upgrade (for UI display)
   */
  getDefinition(upgradeId: UpgradeId) {
    return UPGRADE_DEFINITIONS.find((d) => d.id === upgradeId);
  }

  purchaseUpgrade(upgradeId: UpgradeId): void {
    this.upgrades.update((upgrades) =>
      upgrades.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1 } : u)),
    );
    this.saveService?.markDirty();
  }

  /**
   * Apply all storage upgrade effects to resources service.
   * Should be called after loading a save or purchasing a storage upgrade.
   */
  applyStorageUpgrades(resourcesService: any): void {
    const storageUpgrades = [
      { upgradeId: UpgradeId.UPG_STORE_001, resourceId: ResourceType.SCRAP },
      { upgradeId: UpgradeId.UPG_STORE_002, resourceId: ResourceType.METAL },
      { upgradeId: UpgradeId.UPG_STORE_003, resourceId: ResourceType.PLASTIC },
      { upgradeId: UpgradeId.UPG_STORE_004, resourceId: ResourceType.COMPONENTS },
    ];

    for (const { upgradeId, resourceId } of storageUpgrades) {
      const level = this.getLevel(upgradeId);
      const baseCapacity = resourcesService.getBaseCapacity(resourceId);
      const newCapacity = this.calculateStorageCapacity(upgradeId, level, baseCapacity);
      resourcesService.setCapacity(resourceId, newCapacity);
    }
  }

  /**
   * Calculate total storage capacity based on base capacity and upgrade level.
   * Formula: capacity = baseCapacity + (increment * level)
   * This is linear scaling, while cost is exponential (1.15^level)
   */
  calculateStorageCapacity(upgradeId: UpgradeId, level: number, baseCapacity: number): number {
    let increment: number;

    switch (upgradeId) {
      case UpgradeId.UPG_STORE_001: // Scrap
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.SCRAP;
        break;
      case UpgradeId.UPG_STORE_002: // Metal
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.METAL;
        break;
      case UpgradeId.UPG_STORE_003: // Plastic
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.PLASTIC;
        break;
      case UpgradeId.UPG_STORE_004: // Components
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.COMPONENTS;
        break;
      default:
        return baseCapacity;
    }

    return baseCapacity + increment * level;
  }

  getMachineUpgradeIdByMachineType(machineType: string): UpgradeId | null {
    const mapping: Record<string, UpgradeId> = {
      crusher: UpgradeId.UPG_MACH_001,
      separator: UpgradeId.UPG_MACH_003,
      smelter: UpgradeId.UPG_MACH_002,
      assembler: UpgradeId.UPG_MACH_004,
      packager: UpgradeId.UPG_MACH_005,
    };
    return mapping[machineType] || null;
  }

  calculateEffectiveSpeed(baseSpeed: number, machineType: string): number {
    const upgradeId = this.getMachineUpgradeIdByMachineType(machineType);
    if (!upgradeId) return baseSpeed;

    const level = this.getLevel(upgradeId);
    return baseSpeed * (1 + MACHINE_UPGRADE_CONFIG.SPEED_BONUS_PER_LEVEL * level);
  }

  calculateProductionMultiplier(machineType: string): number {
    const upgradeId = this.getMachineUpgradeIdByMachineType(machineType);
    if (!upgradeId) return 1;

    const level = this.getLevel(upgradeId);
    if (level < MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS) {
      return 1;
    }

    return 1 + Math.floor(level / MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS);
  }

  getState(): UpgradeState[] {
    return this.upgrades().map((u) => ({ ...u }));
  }

  setState(upgrades: UpgradeState[]): void {
    this.upgrades.set(upgrades.map((u) => ({ ...u })));
  }

  setSaveService(saveService: any): void {
    this.saveService = saveService;
  }
}
