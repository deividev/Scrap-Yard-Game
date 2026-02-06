import { UpgradeDefinition, UpgradeId, UpgradeCategory } from '../models/upgrade.model';
import { ResourceType } from '../models/resource.model';
import { MachineType } from '../models/machine.model';

/**
 * G) Upgrade Definitions Config
 * Based on UPGRADES_CATALOG.md - structural preparation only
 * NO logic implementation yet
 */

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // STORAGE UPGRADES
  {
    id: UpgradeId.UPG_STORE_001,
    category: UpgradeCategory.STORAGE,
    name: 'Almacén de Chatarra',
    baseCostMoney: 20,
    description: '+25 capacidad máxima de Chatarra por nivel',
    effectType: 'storage',
    targetResourceId: ResourceType.SCRAP,
  },
  {
    id: UpgradeId.UPG_STORE_002,
    category: UpgradeCategory.STORAGE,
    name: 'Almacén de Metal',
    baseCostMoney: 35,
    description: '+15 capacidad máxima de Metal por nivel',
    effectType: 'storage',
    targetResourceId: ResourceType.METAL,
  },
  {
    id: UpgradeId.UPG_STORE_003,
    category: UpgradeCategory.STORAGE,
    name: 'Almacén de Plástico',
    baseCostMoney: 35,
    description: '+15 capacidad máxima de Plástico por nivel',
    effectType: 'storage',
    targetResourceId: ResourceType.PLASTIC,
  },
  {
    id: UpgradeId.UPG_STORE_004,
    category: UpgradeCategory.STORAGE,
    name: 'Almacén de Componentes',
    baseCostMoney: 60,
    extraCostComponents: 1,
    description: '+5 capacidad máxima de Componentes por nivel',
    effectType: 'storage',
    targetResourceId: ResourceType.COMPONENTS,
  },

  // MACHINE SPEED UPGRADES
  {
    id: UpgradeId.UPG_MACH_001,
    category: UpgradeCategory.MACHINE,
    name: 'Trituradora: Velocidad',
    baseCostMoney: 30,
    description: 'Aumenta velocidad de Trituradora',
    effectType: 'machine_speed',
    targetMachineId: MachineType.CRUSHER,
  },
  {
    id: UpgradeId.UPG_MACH_002,
    category: UpgradeCategory.MACHINE,
    name: 'Fundidora: Velocidad',
    baseCostMoney: 50,
    description: 'Aumenta velocidad de Fundidora',
    effectType: 'machine_speed',
    targetMachineId: MachineType.SMELTER,
  },
  {
    id: UpgradeId.UPG_MACH_003,
    category: UpgradeCategory.MACHINE,
    name: 'Separador: Velocidad',
    baseCostMoney: 30,
    description: 'Aumenta velocidad de Separador',
    effectType: 'machine_speed',
    targetMachineId: MachineType.SEPARATOR,
  },
  {
    id: UpgradeId.UPG_MACH_004,
    category: UpgradeCategory.MACHINE,
    name: 'Ensambladora: Velocidad',
    baseCostMoney: 60,
    description: 'Aumenta velocidad de Ensambladora',
    effectType: 'machine_speed',
    targetMachineId: MachineType.ASSEMBLER,
  },
  {
    id: UpgradeId.UPG_MACH_005,
    category: UpgradeCategory.MACHINE,
    name: 'Empaquetadora: Velocidad',
    baseCostMoney: 80,
    description: 'Aumenta velocidad de Empaquetadora',
    effectType: 'machine_speed',
    targetMachineId: MachineType.PACKAGER,
  },

  // SCRAP GENERATION UPGRADES
  {
    id: UpgradeId.UPG_SCRAP_001,
    category: UpgradeCategory.SCRAP,
    name: 'Descarga Manual Mejorada',
    baseCostMoney: 40,
    description: '+1 Chatarra adicional por acción manual por nivel',
    effectType: 'scrap_manual',
  },
  {
    id: UpgradeId.UPG_SCRAP_002,
    category: UpgradeCategory.SCRAP,
    name: 'Llegada Automática de Chatarra',
    baseCostMoney: 60,
    description: 'Genera Chatarra automáticamente por segundo',
    effectType: 'scrap_auto',
  },
];
