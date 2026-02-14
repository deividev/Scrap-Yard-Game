/**
 * GAME BALANCE CONFIGURATION
 * Centraliza todas las fórmulas y constantes de balanceo del juego
 * para facilitar ajustes y balanceo sin modificar la lógica del código
 */

// ============================================
// UPGRADES - COST FORMULAS
// ============================================

export const UPGRADE_COST_FORMULAS = {
  DEFAULT_MULTIPLIER: 1.15,
  SCRAP_MULTIPLIER: 1.25,
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
    RECYCLED_PLASTIC: 10,
    ELECTRIC_COMPONENTS: 5,
  },
  BASE_COSTS: {
    SCRAP: 20,
    METAL: 35,
    PLASTIC: 35,
    COMPONENTS: 60,
    RECYCLED_PLASTIC: 50,
    ELECTRIC_COMPONENTS: 80,
  },
};

// ============================================
// SCRAP GENERATION
// ============================================

export const SCRAP_GENERATION_CONFIG = {
  MANUAL_GENERATION: 5,
  MANUAL_COST: 1, // Coste en dinero por cada click manual de chatarra
  MAX_LEVEL: 10,
  BASE_COST_MONEY: 150,
  COST_MULTIPLIER: 1.25,
  COMPONENTS_START_LEVEL: 6,
  AUTO_GENERATION_RATES: [0.0, 0.1, 0.2, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0],
};

// ============================================
// MACHINE LEVEL UPGRADES
// ============================================

export const MACHINE_UPGRADE_CONFIG = {
  MAX_LEVEL: 50,
  COST_MULTIPLIER: 1.15,
  COMPONENTS_START_LEVEL: 4,
  SPEED_BONUS_PER_LEVEL: 0.1,
  PRODUCTION_BONUS_EVERY_N_LEVELS: 10,
  BASE_COSTS: {
    CRUSHER: 30,
    SEPARATOR: 30,
    SMELTER: 50,
    ASSEMBLER: 60,
    PACKAGER: 80,
    ELECTRIC_PACKAGER: 90,
    RECYCLER: 70,
    ELECTRIC_ASSEMBLER: 100,
  },
};

// ============================================
// MACHINE BASE STATS
// ============================================

export const MACHINE_BASE_SPEEDS = {
  CRUSHER: 0.5,
  SEPARATOR: 0.5,
  SMELTER: 0.25,
  ASSEMBLER: 0.17,
  PACKAGER: 0.1,
  ELECTRIC_PACKAGER: 0.1,
  RECYCLER: 0.5,
  ELECTRIC_ASSEMBLER: 0.12,
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
  SCRAP: 50,
  METAL: 30,
  PLASTIC: 30,
  COMPONENTS: 10,
  MONEY: Infinity,
  RECYCLED_PLASTIC: 20,
  ELECTRIC_COMPONENTS: 10,
};
