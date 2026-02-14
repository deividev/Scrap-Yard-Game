/**
 * G) Upgrade Models - Structural preparation
 * Based on UPGRADES_CATALOG.md
 * NO implementation logic yet, only data structures
 */

export enum UpgradeCategory {
  STORAGE = 'storage',
  MACHINE = 'machine',
  SCRAP = 'scrap',
}

export enum UpgradeId {
  // Storage upgrades
  UPG_STORE_001 = 'UPG_STORE_001', // Chatarra storage
  UPG_STORE_002 = 'UPG_STORE_002', // Metal storage
  UPG_STORE_003 = 'UPG_STORE_003', // Plastic storage
  UPG_STORE_004 = 'UPG_STORE_004', // Components storage
  UPG_STORE_005 = 'UPG_STORE_005', // Recycled plastic storage
  UPG_STORE_006 = 'UPG_STORE_006', // Electric components storage

  // Machine speed upgrades
  UPG_MACH_001 = 'UPG_MACH_001', // Trituradora speed
  UPG_MACH_002 = 'UPG_MACH_002', // Fundidora speed
  UPG_MACH_003 = 'UPG_MACH_003', // Separador speed
  UPG_MACH_004 = 'UPG_MACH_004', // Ensambladora speed
  UPG_MACH_005 = 'UPG_MACH_005', // Empaquetadora speed
  UPG_MACH_006 = 'UPG_MACH_006', // Recicladora speed
  UPG_MACH_007 = 'UPG_MACH_007', // Ensambladora eléctrica speed
  UPG_MACH_008 = 'UPG_MACH_008', // Empaquetadora eléctrica speed

  // Scrap generation upgrades
  UPG_SCRAP_001 = 'UPG_SCRAP_001', // Manual scrap boost
  UPG_SCRAP_002 = 'UPG_SCRAP_002', // Automatic scrap generation
}

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  name: string;
  baseCostMoney: number;
  extraCostComponents?: number; // Cost per level in components (if any)
  description: string;

  // For future implementation
  effectType: 'storage' | 'machine_speed' | 'scrap_manual' | 'scrap_auto';
  targetResourceId?: string; // For storage upgrades
  targetMachineId?: string; // For machine upgrades
}

export interface UpgradeState {
  id: UpgradeId;
  level: number;
}

export interface UpgradeCost {
  money: number;
  components: number;
}
