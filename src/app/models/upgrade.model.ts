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
  UPG_STORE_007 = 'UPG_STORE_007', // Copper storage
  UPG_STORE_008 = 'UPG_STORE_008', // Circuit board storage
  UPG_STORE_009 = 'UPG_STORE_009', // HDD storage
  UPG_STORE_010 = 'UPG_STORE_010', // Screen storage
  UPG_STORE_011 = 'UPG_STORE_011', // GPU storage
  UPG_STORE_012 = 'UPG_STORE_012', // Smartphone storage
  UPG_STORE_013 = 'UPG_STORE_013', // Laptop storage
  UPG_STORE_014 = 'UPG_STORE_014', // Desktop PC storage
  UPG_STORE_015 = 'UPG_STORE_015', // Mining Rig storage
  UPG_STORE_016 = 'UPG_STORE_016', // Server Rack storage

  // Machine speed upgrades
  UPG_MACH_001 = 'UPG_MACH_001', // Trituradora speed
  UPG_MACH_002 = 'UPG_MACH_002', // Fundidora speed
  UPG_MACH_003 = 'UPG_MACH_003', // Separador speed
  UPG_MACH_004 = 'UPG_MACH_004', // Ensambladora speed
  UPG_MACH_005 = 'UPG_MACH_005', // Empaquetadora speed
  UPG_MACH_006 = 'UPG_MACH_006', // Recicladora speed
  UPG_MACH_007 = 'UPG_MACH_007', // Ensambladora eléctrica speed
  UPG_MACH_008 = 'UPG_MACH_008', // Empaquetadora eléctrica speed
  UPG_MACH_009 = 'UPG_MACH_009', // PCB Printer speed
  UPG_MACH_010 = 'UPG_MACH_010', // HDD Assembler speed
  UPG_MACH_011 = 'UPG_MACH_011', // Screen Fabricator speed
  UPG_MACH_012 = 'UPG_MACH_012', // GPU Fab speed
  UPG_MACH_013 = 'UPG_MACH_013', // Smartphone Factory speed
  UPG_MACH_014 = 'UPG_MACH_014', // Laptop Workshop speed
  UPG_MACH_015 = 'UPG_MACH_015', // PC Builder speed
  UPG_MACH_016 = 'UPG_MACH_016', // Mining Rig Assembly speed
  UPG_MACH_017 = 'UPG_MACH_017', // Data Center Assembly speed

  // Scrap generation upgrades
  UPG_SCRAP_001 = 'UPG_SCRAP_001', // Manual scrap boost
  UPG_SCRAP_002 = 'UPG_SCRAP_002', // Automatic scrap generation
}

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  /** i18n key for the upgrade name, e.g. 'upgrades.storage.scrap' or 'machines.crusher' */
  nameKey: string;
  baseCostMoney: number;
  extraCostComponents?: number; // Cost per level in components (if any)
  description: string;

  // For future implementation
  effectType: 'storage' | 'machine_speed' | 'scrap_manual' | 'scrap_auto';
  targetResourceId?: string; // For storage upgrades
  targetMachineId?: string; // For machine upgrades
  icon?: string; // Icon path shown in notifications
}

export interface UpgradeState {
  id: UpgradeId;
  level: number;
}

export interface UpgradeCost {
  money: number;
  components: number;
}
