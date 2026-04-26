/**
 * GAME BALANCE CONFIGURATION
 * Centraliza todas las fórmulas y constantes de balanceo del juego
 * para facilitar ajustes y balanceo sin modificar la lógica del código
 */
import { ResourceType } from '../models/resource.model';

// ============================================
// UPGRADES - COST FORMULAS
// ============================================

export const UPGRADE_COST_FORMULAS = {
  DEFAULT_MULTIPLIER: 1.26,
  SCRAP_MULTIPLIER: 1.35,
  STORAGE_MULTIPLIER: 1.2,
};

// ============================================
// STORAGE UPGRADES - CAPACITY INCREMENTS
// ============================================

export const STORAGE_UPGRADE_CONFIG = {
  MAX_LEVEL: 50,
  INCREMENTS: {
    SCRAP: 25,
    METAL: 15,
    PLASTIC: 15,
    COMPONENTS: 5,
    COPPER: 15,
    RECYCLED_PLASTIC: 10,
    ELECTRIC_COMPONENTS: 5,
    CIRCUIT_BOARD: 4,
    HDD: 3,
    SCREEN: 3,
    GPU: 2,
    SMARTPHONE: 2,
    LAPTOP: 2,
    DESKTOP_PC: 2,
    MINING_RIG: 1,
    SERVER_RACK: 1,
  },
};

// ============================================
// SCRAP GENERATION
// ============================================

export const SCRAP_GENERATION_CONFIG = {
  MANUAL_GENERATION: 6,
  MANUAL_COST: 1, // Coste en dinero por cada click manual de chatarra
  MAX_LEVEL: 15,
  BASE_COST_MONEY: 200,
  COST_MULTIPLIER: 1.45,
  COMPONENTS_START_LEVEL: 6,
  AUTO_GENERATION_RATES: [0.0, 0.12, 0.2, 0.32, 0.48, 0.7, 1.0, 1.45, 2.1, 3.0, 4.2, 5.9, 8.3, 11.6, 16.2, 22.7],
};

// ============================================
// MARKET - MANUAL SELLING
// ============================================

export const MARKET_CONFIG = {
  // Claves usando ResourceType enum para habilitar lookup directo por resourceId
  BASE_PRICES: {
    [ResourceType.METAL]:               1,
    [ResourceType.PLASTIC]:             1.2,
    [ResourceType.COMPONENTS]:          3,
    [ResourceType.COPPER]:              3.0,             // >= Componentes ($3), Cobre se desbloquea después
    [ResourceType.RECYCLED_PLASTIC]:    3.5,             // PRD A.3: recurso T3 vendible
    [ResourceType.ELECTRIC_COMPONENTS]: 9.5,             // Balance pass: +46% — better mid-game emergency income
    // T4
    [ResourceType.CIRCUIT_BOARD]:       15,
    // T5
    [ResourceType.HDD]:                 35,
    [ResourceType.SCREEN]:              40,
    // T6
    [ResourceType.GPU]:                 100,
    // T8
    [ResourceType.SMARTPHONE]:          300,
    // T9
    [ResourceType.LAPTOP]:              600,
    // T10
    [ResourceType.DESKTOP_PC]:          800,
    // T11
    [ResourceType.MINING_RIG]:          2200,
    // T12
    [ResourceType.SERVER_RACK]:         3000,
  } as Partial<Record<ResourceType, number>>,
  BATCH_BONUSES: {
    MEDIUM: {
      threshold: 15,
      multiplier: 1.0,
    },
    LARGE: {
      threshold: 30,
      multiplier: 1.0,
    },
  },
};

// ============================================
// MACHINE LEVEL UPGRADES
// ============================================

export const MACHINE_UPGRADE_CONFIG = {
  MAX_LEVEL: 50,
  COST_MULTIPLIER: 1.26, // PRD A.4 CC-05: multiplicador de máquinas es 1.26 (storage usa 1.20)
  COMPONENTS_START_LEVEL: 4,
  // Per-machine override: Crusher must reach lv13 to unlock Packager,
  // but Components don't exist until Assembler is unlocked (requires Crusher lv9).
  // Defer its component cost to lv14 to break the deadlock.
  COMPONENTS_START_LEVEL_OVERRIDES: {
    UPG_MACH_001: 14, // Crusher — no components required until after Packager unlock
  } as Record<string, number>,
  SPEED_BONUS_PER_LEVEL: 0.1,
  PRODUCTION_BONUS_EVERY_N_LEVELS: 10,
  // Single source of truth for machine upgrade base costs.
  // upgrade-definitions.config.ts reads from here — do NOT hardcode costs there.
  BASE_COSTS: {
    CRUSHER: 65,
    SMELTER: 85,
    SEPARATOR: 90,
    ASSEMBLER: 120,
    PACKAGER: 135,
    RECYCLER: 165,
    ELECTRIC_ASSEMBLER: 365,
    ELECTRIC_PACKAGER: 405,
    // T4
    PCB_PRINTER: 550,
    HDD_ASSEMBLER: 650,
    // T6
    SCREEN_FABRICATOR: 700,
    // T7
    GPU_FAB: 850,
    // T8
    SMARTPHONE_FACTORY: 900,
    // T9
    LAPTOP_WORKSHOP: 1200,
    // T10
    PC_BUILDER: 1500,
    // T11
    MINING_RIG_ASSEMBLY: 1900,
    // T12
    DATA_CENTER_ASSEMBLY: 2400,
  },
};

// ============================================
// GAME LOOP
// ============================================

export const GAME_LOOP_CONFIG = {
  // Intervalo del game loop en milisegundos
  TICK_INTERVAL_MS: 1000,
};

// ============================================
// INITIAL CAPACITIES
// ============================================

export const INITIAL_CAPACITIES = {
  SCRAP: 75,
  METAL: 20,
  PLASTIC: 15,
  COMPONENTS: 8,
  MONEY: Infinity,
  COPPER: 20,
  RECYCLED_PLASTIC: 20,
  ELECTRIC_COMPONENTS: 10,
  // T4
  CIRCUIT_BOARD: 8,
  // T5
  HDD: 6,
  // T6
  SCREEN: 6,
  // T7
  GPU: 4,
  // T8
  SMARTPHONE: 5,
  // T9
  LAPTOP: 3,
  // T10
  DESKTOP_PC: 3,
  // T11
  MINING_RIG: 2,
  // T12
  SERVER_RACK: 2,
};

