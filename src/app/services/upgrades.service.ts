import { Injectable, signal } from '@angular/core';
import { UpgradeState, UpgradeId, UpgradeCost } from '../models/upgrade.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';
import { UPGRADE_COST_FORMULAS, STORAGE_UPGRADE_CONFIG } from '../config/game-balance.config';

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

  private initializeUpgrades(): UpgradeState[] {
    // Initialize all upgrades at level 0
    return UPGRADE_DEFINITIONS.map((def) => ({
      id: def.id,
      level: 0,
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

    // Check max level for storage upgrades
    const isStorageUpgrade = upgradeId.startsWith('UPG_STORE_');
    if (isStorageUpgrade && currentLevel >= STORAGE_UPGRADE_CONFIG.MAX_LEVEL) {
      return null; // Max level reached
    }

    const isScrapUpgrade =
      upgradeId === UpgradeId.UPG_SCRAP_001 || upgradeId === UpgradeId.UPG_SCRAP_002;
    const multiplier = isScrapUpgrade
      ? UPGRADE_COST_FORMULAS.SCRAP_MULTIPLIER
      : UPGRADE_COST_FORMULAS.DEFAULT_MULTIPLIER;

    const moneyCost = Math.ceil(definition.baseCostMoney * Math.pow(multiplier, currentLevel));

    let componentsCost = 0;
    if (definition.extraCostComponents) {
      componentsCost = definition.extraCostComponents * (currentLevel + 1);
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
  }

  /**
   * Calculate storage increment based on upgrade level.
   * Every 10 levels, the increment increases.
   */
  getStorageIncrement(upgradeId: UpgradeId, level: number): number {
    const tier = Math.floor(level / STORAGE_UPGRADE_CONFIG.LEVELS_PER_TIER);

    let baseIncrement: number;

    switch (upgradeId) {
      case UpgradeId.UPG_STORE_001: // Scrap
        baseIncrement = STORAGE_UPGRADE_CONFIG.BASE_INCREMENTS.SCRAP;
        break;
      case UpgradeId.UPG_STORE_002: // Metal
        baseIncrement = STORAGE_UPGRADE_CONFIG.BASE_INCREMENTS.METAL;
        break;
      case UpgradeId.UPG_STORE_003: // Plastic
        baseIncrement = STORAGE_UPGRADE_CONFIG.BASE_INCREMENTS.PLASTIC;
        break;
      case UpgradeId.UPG_STORE_004: // Components
        baseIncrement = STORAGE_UPGRADE_CONFIG.BASE_INCREMENTS.COMPONENTS;
        break;
      default:
        return 0;
    }

    // Increment increases by SCALE_FACTOR each tier
    return Math.floor(baseIncrement * Math.pow(STORAGE_UPGRADE_CONFIG.SCALE_FACTOR, tier));
  }

  // Serialization support
  getState(): UpgradeState[] {
    return this.upgrades().map((u) => ({ ...u }));
  }

  setState(upgrades: UpgradeState[]): void {
    this.upgrades.set(upgrades.map((u) => ({ ...u })));
  }
}
