export interface Resource {
  id: string;
  name: string;
  amount: number;
  capacity: number; // Infinity = unlimited (e.g., money)
  icon: string;
}

export enum ResourceType {
  SCRAP = 'scrap',
  METAL = 'metal',
  PLASTIC = 'plastic',
  COMPONENTS = 'components',
  MONEY = 'money',
  COPPER = 'copper',
  RECYCLED_PLASTIC = 'recycled_plastic',
  ELECTRIC_COMPONENTS = 'electric_components',
  // T4
  CIRCUIT_BOARD = 'circuit_board',
  // T5
  HDD = 'hdd',
  // T6
  SCREEN = 'screen',
  // T7
  GPU = 'gpu',
  // T8
  SMARTPHONE = 'smartphone',
  // T9
  LAPTOP = 'laptop',
  // T10
  DESKTOP_PC = 'desktop_pc',
  // T11
  MINING_RIG = 'mining_rig',
  // T12
  SERVER_RACK = 'server_rack',
}
