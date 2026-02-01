import { Injectable, signal } from '@angular/core';
import { UpgradeState, UpgradeId, UpgradeCost } from '../models/upgrade.model';
import { UPGRADE_DEFINITIONS } from '../config/upgrade-definitions.config';

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
   * Formula: ceil(baseCost * (1.15 ^ currentLevel))
   *
   * @param upgradeId The upgrade to calculate cost for
   * @returns Cost object with money and components, or null if upgrade not found
   */
  getCostForNextLevel(upgradeId: UpgradeId): UpgradeCost | null {
    const upgrade = this.upgrades().find((u) => u.id === upgradeId);
    if (!upgrade) return null;

    const definition = UPGRADE_DEFINITIONS.find((d) => d.id === upgradeId);
    if (!definition) return null;

    const currentLevel = upgrade.level;
    const moneyCost = Math.ceil(definition.baseCostMoney * Math.pow(1.15, currentLevel));

    let componentsCost = 0;
    if (definition.extraCostComponents) {
      // For upgrades that cost components (e.g., UPG_STORE_004: +1 per level)
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

  // Future: purchaseUpgrade(upgradeId) will go here
  // Future: effect application methods will go here

  // Serialization support
  getState(): UpgradeState[] {
    return this.upgrades().map((u) => ({ ...u }));
  }

  setState(upgrades: UpgradeState[]): void {
    this.upgrades.set(upgrades.map((u) => ({ ...u })));
  }
}
