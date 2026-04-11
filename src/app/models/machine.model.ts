export interface Machine {
  id: string;
  name: string;
  level: number;
  baseSpeed: number;
  baseConsumption: MachineConsumption[];
  baseProduction: MachineProduction;
  isActive: boolean;
  progress: number;
  icon?: string;
}

export interface MachineConsumption {
  resourceId: string;
  amount: number;
}

export interface MachineProduction {
  resourceId: string;
  amount: number;
}

export interface MachineUpgradeCost {
  money: number;
  components: number;
}

export enum MachineType {
  CRUSHER = 'crusher',
  SEPARATOR = 'separator',
  SMELTER = 'smelter',
  ASSEMBLER = 'assembler',
  PACKAGER = 'packager',
  ELECTRIC_PACKAGER = 'electric_packager',
  RECYCLER = 'recycler',
  ELECTRIC_ASSEMBLER = 'electric_assembler',
  // T4
  PCB_PRINTER = 'pcb_printer',
  // T5
  HDD_ASSEMBLER = 'hdd_assembler',
  // T6
  SCREEN_FABRICATOR = 'screen_fabricator',
  // T7
  GPU_FAB = 'gpu_fab',
  // T8
  SMARTPHONE_FACTORY = 'smartphone_factory',
  // T9
  LAPTOP_WORKSHOP = 'laptop_workshop',
  // T10
  PC_BUILDER = 'pc_builder',
  // T11
  MINING_RIG_ASSEMBLY = 'mining_rig_assembly',
  // T12
  DATA_CENTER_ASSEMBLY = 'data_center_assembly',
}
