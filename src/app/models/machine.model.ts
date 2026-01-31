export interface Machine {
  id: string;
  name: string;
  level: number;
  baseSpeed: number;
  baseConsumption: MachineConsumption[];
  baseProduction: MachineProduction;
  isActive: boolean;
  progress: number;
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
}
