import { Injectable, signal, inject } from '@angular/core';
import { UpgradeState, UpgradeId, UpgradeCost, UpgradeDefinition, UpgradeCategory } from '../models/upgrade.model';
import { ResourceType } from '../models/resource.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';
import {
  UPGRADE_COST_FORMULAS,
  STORAGE_UPGRADE_CONFIG,
  SCRAP_GENERATION_CONFIG,
  MACHINE_UPGRADE_CONFIG,
} from '../config/game-balance.config';
import { UpgradeProgressService } from './upgrade-progress.service';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';
import { AudioService } from './audio.service';
import { FirstRunTutorialService } from './first-run-tutorial.service';
import { SaveMarker } from '../models/save-marker.model';

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
interface StorageUpdater {
  getBaseCapacity(resourceId: ResourceType): number;
  setCapacity(resourceId: ResourceType, capacity: number): void;
}

@Injectable({
  providedIn: 'root',
})
export class UpgradesService {
  private upgrades = signal<UpgradeState[]>(this.initializeUpgrades());
  private saveService?: SaveMarker;
  private upgradeProgressService = inject(UpgradeProgressService);
  private notificationService = inject(NotificationService);
  private translationService = inject(TranslationService);
  private audioService = inject(AudioService);
  private firstRunTutorialService = inject(FirstRunTutorialService);

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

    // Formula: baseCost * multiplier^(currentLevel - 1)
    // Level 1 (initial) -> cost for level 2 = baseCost * multiplier^0 = baseCost
    // Level 2 -> cost for level 3 = baseCost * multiplier^1 = baseCost * multiplier
    const moneyCost = Math.ceil(definition.baseCostMoney * Math.pow(multiplier, currentLevel - 1));

    let componentsCost = 0;
    if (definition.extraCostComponents) {
      componentsCost = definition.extraCostComponents * (currentLevel + 1);
    } else if (
      isScrapAutoUpgrade &&
      currentLevel >= SCRAP_GENERATION_CONFIG.COMPONENTS_START_LEVEL
    ) {
      componentsCost = currentLevel - SCRAP_GENERATION_CONFIG.COMPONENTS_START_LEVEL + 1;
    } else if (isMachineUpgrade) {
      const componentsStart =
        MACHINE_UPGRADE_CONFIG.COMPONENTS_START_LEVEL_OVERRIDES[upgradeId] ??
        MACHINE_UPGRADE_CONFIG.COMPONENTS_START_LEVEL;
      if (currentLevel >= componentsStart) {
        componentsCost = currentLevel - componentsStart + 1;
      }
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

  /**
   * Inicia el proceso de compra de un upgrade.
   * En lugar de aplicar el efecto inmediatamente, inicia el progreso con tiempo.
   */
  purchaseUpgrade(upgradeId: UpgradeId): void {
    // Verificar si ya hay un upgrade en progreso para este ID
    if (this.upgradeProgressService.isUpgradeInProgress(upgradeId)) {
      console.warn(`Upgrade ${upgradeId} ya está en progreso`);
      return;
    }

    const currentLevel = this.getLevel(upgradeId);
    const targetLevel = currentLevel + 1;
    const category = this.getUpgradeCategory(upgradeId);

    // Iniciar el progreso del upgrade
    this.upgradeProgressService.startUpgrade(upgradeId, targetLevel, category);
    this.audioService.playUpgradeStarted();
    this.firstRunTutorialService.recordEvent('first-upgrade-purchased');
    this.saveService?.markDirty();
  }

  /**
   * Completa un upgrade cuando su progreso llega al 100%.
   * Este método es llamado por GameLoopService.
   */
  completeUpgrade(upgradeId: UpgradeId): void {
    const definition = this.getDefinition(upgradeId);
    let newLevel = 0;
    this.upgrades.update((upgrades) =>
      upgrades.map((u) => {
        if (u.id === upgradeId) {
          newLevel = u.level + 1;
          return { ...u, level: newLevel };
        }
        return u;
      }),
    );

    if (definition && newLevel > 0) {
      const message = this.translationService.tp('notifications.upgrade_completed', {
        name: this.getUpgradeDisplayName(definition),
        level: newLevel.toString(),
      });
      this.notificationService.show(message, 'success', definition.icon);
    }

    this.audioService.playUpgradeCompleted();

    this.saveService?.markDirty();
  }

  private getUpgradeDisplayName(definition: UpgradeDefinition): string {
    const t = (key: string) => this.translationService.t(key);
    if (definition.category === UpgradeCategory.MACHINE && definition.targetMachineId) {
      return `${t(`machines.${definition.targetMachineId}`)}: ${t('upgrades.machine_tab.speed_label')}`;
    }
    if (definition.category === UpgradeCategory.STORAGE && definition.targetResourceId) {
      return t(`upgrades.storage.${definition.targetResourceId}`);
    }
    if (definition.id === UpgradeId.UPG_SCRAP_001) {
      return t('upgrades.scrap_manual.name');
    }
    if (definition.id === UpgradeId.UPG_SCRAP_002) {
      return t('upgrades.scrap_auto.name');
    }
    return t(definition.nameKey);
  }

  /**
   * Determina la categoría de un upgrade para calcular su tiempo base.
   */
  private getUpgradeCategory(upgradeId: UpgradeId): 'STORAGE' | 'SCRAP' | 'MACHINE' {
    if (upgradeId.startsWith('UPG_STORE_')) {
      return 'STORAGE';
    }
    if (upgradeId.startsWith('UPG_SCRAP_')) {
      return 'SCRAP';
    }
    if (upgradeId.startsWith('UPG_MACH_')) {
      return 'MACHINE';
    }
    // Default to MACHINE for unknown types
    return 'MACHINE';
  }

  /**
   * Apply all storage upgrade effects to resources service.
   * Should be called after loading a save or purchasing a storage upgrade.
   */
  applyStorageUpgrades(resourcesService: StorageUpdater): void {
    const storageUpgrades = [
      { upgradeId: UpgradeId.UPG_STORE_001, resourceId: ResourceType.SCRAP },
      { upgradeId: UpgradeId.UPG_STORE_002, resourceId: ResourceType.METAL },
      { upgradeId: UpgradeId.UPG_STORE_003, resourceId: ResourceType.PLASTIC },
      { upgradeId: UpgradeId.UPG_STORE_004, resourceId: ResourceType.COMPONENTS },
      { upgradeId: UpgradeId.UPG_STORE_005, resourceId: ResourceType.RECYCLED_PLASTIC },
      { upgradeId: UpgradeId.UPG_STORE_006, resourceId: ResourceType.ELECTRIC_COMPONENTS },
      { upgradeId: UpgradeId.UPG_STORE_007, resourceId: ResourceType.COPPER },
      { upgradeId: UpgradeId.UPG_STORE_008, resourceId: ResourceType.CIRCUIT_BOARD },
      { upgradeId: UpgradeId.UPG_STORE_009, resourceId: ResourceType.HDD },
      { upgradeId: UpgradeId.UPG_STORE_010, resourceId: ResourceType.SCREEN },
      { upgradeId: UpgradeId.UPG_STORE_011, resourceId: ResourceType.GPU },
      { upgradeId: UpgradeId.UPG_STORE_012, resourceId: ResourceType.SMARTPHONE },
      { upgradeId: UpgradeId.UPG_STORE_013, resourceId: ResourceType.LAPTOP },
      { upgradeId: UpgradeId.UPG_STORE_014, resourceId: ResourceType.DESKTOP_PC },
      { upgradeId: UpgradeId.UPG_STORE_015, resourceId: ResourceType.MINING_RIG },
      { upgradeId: UpgradeId.UPG_STORE_016, resourceId: ResourceType.SERVER_RACK },
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
   * Formula: capacity = baseCapacity + (increment * (level - 1))
   * Level 1 = base capacity, each upgrade adds one increment
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
      case UpgradeId.UPG_STORE_005: // Recycled Plastic
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.RECYCLED_PLASTIC;
        break;
      case UpgradeId.UPG_STORE_006: // Electric Components
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.ELECTRIC_COMPONENTS;
        break;
      case UpgradeId.UPG_STORE_007: // Copper
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.COPPER;
        break;
      case UpgradeId.UPG_STORE_008: // Circuit Board
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.CIRCUIT_BOARD;
        break;
      case UpgradeId.UPG_STORE_009: // HDD
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.HDD;
        break;
      case UpgradeId.UPG_STORE_010: // Screen
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.SCREEN;
        break;
      case UpgradeId.UPG_STORE_011: // GPU
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.GPU;
        break;
      case UpgradeId.UPG_STORE_012: // Smartphone
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.SMARTPHONE;
        break;
      case UpgradeId.UPG_STORE_013: // Laptop
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.LAPTOP;
        break;
      case UpgradeId.UPG_STORE_014: // Desktop PC
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.DESKTOP_PC;
        break;
      case UpgradeId.UPG_STORE_015: // Mining Rig
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.MINING_RIG;
        break;
      case UpgradeId.UPG_STORE_016: // Server Rack
        increment = STORAGE_UPGRADE_CONFIG.INCREMENTS.SERVER_RACK;
        break;
      default:
        return baseCapacity;
    }

    return Math.max(baseCapacity, baseCapacity + increment * (level - 1));
  }

  getMachineUpgradeIdByMachineType(machineType: string): UpgradeId | null {
    const mapping: Record<string, UpgradeId> = {
      crusher: UpgradeId.UPG_MACH_001,
      separator: UpgradeId.UPG_MACH_003,
      smelter: UpgradeId.UPG_MACH_002,
      assembler: UpgradeId.UPG_MACH_004,
      packager: UpgradeId.UPG_MACH_005,
      recycler: UpgradeId.UPG_MACH_006,
      electric_assembler: UpgradeId.UPG_MACH_007,
      electric_packager: UpgradeId.UPG_MACH_008,
      pcb_printer: UpgradeId.UPG_MACH_009,
      hdd_assembler: UpgradeId.UPG_MACH_010,
      screen_fabricator: UpgradeId.UPG_MACH_011,
      gpu_fab: UpgradeId.UPG_MACH_012,
      smartphone_factory: UpgradeId.UPG_MACH_013,
      laptop_workshop: UpgradeId.UPG_MACH_014,
      pc_builder: UpgradeId.UPG_MACH_015,
      mining_rig_assembly: UpgradeId.UPG_MACH_016,
      data_center_assembly: UpgradeId.UPG_MACH_017,
    };
    return mapping[machineType] || null;
  }

  calculateEffectiveSpeed(baseSpeed: number, machineType: string): number {
    const upgradeId = this.getMachineUpgradeIdByMachineType(machineType);
    if (!upgradeId) return baseSpeed;

    const level = this.getLevel(upgradeId);
    // Use (level - 1) because level 1 is the initial state with no upgrades
    const upgrades = level - 1;
    return baseSpeed * (1 + MACHINE_UPGRADE_CONFIG.SPEED_BONUS_PER_LEVEL * upgrades);
  }

  calculateProductionMultiplier(machineType: string): number {
    const upgradeId = this.getMachineUpgradeIdByMachineType(machineType);
    if (!upgradeId) return 1;

    const level = this.getLevel(upgradeId);
    const upgrades = level - 1;
    if (upgrades < MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS) {
      return 1;
    }

    // Progresión lineal: L10-19: x2, L20-29: x3, L30-39: x4, L40-50: x5
    const tier = Math.floor(upgrades / MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS);
    const productionValues = [1, 2, 3, 4, 5]; // tier 0-4
    return productionValues[Math.min(tier, 4)] || 1;
  }

  calculateConsumptionMultiplier(machineType: string): number {
    const upgradeId = this.getMachineUpgradeIdByMachineType(machineType);
    if (!upgradeId) return 1;

    const level = this.getLevel(upgradeId);
    const upgrades = level - 1;
    if (upgrades < MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS) {
      return 1;
    }

    // Consumo crece linealmente: L10-19: x2, L20-29: x3, L30-39: x4, L40-50: x5
    return 1 + Math.floor(upgrades / MACHINE_UPGRADE_CONFIG.PRODUCTION_BONUS_EVERY_N_LEVELS);
  }

  getState(): UpgradeState[] {
    return this.upgrades().map((u) => ({ ...u }));
  }

  setState(upgrades: UpgradeState[]): void {
    // Save migration: merge saved upgrades with initial state so new upgrade IDs
    // added after a save was created start at level 1 instead of missing (level 0).
    const savedMap = new Map(upgrades.map((u) => [u.id, u]));
    const merged = this.initializeUpgrades().map((initial) =>
      savedMap.has(initial.id) ? { ...savedMap.get(initial.id)! } : initial
    );
    this.upgrades.set(merged);
  }

  setSaveService(saveService: SaveMarker): void {
    this.saveService = saveService;
  }
}
