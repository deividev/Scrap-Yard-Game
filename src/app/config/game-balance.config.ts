/**
 * GAME BALANCE CONFIGURATION
 * Centraliza todas las fórmulas y constantes de balanceo del juego
 * para facilitar ajustes y balanceo sin modificar la lógica del código
 */

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
  },
  BASE_COSTS: {
    SCRAP: 20,
    METAL: 35,
    PLASTIC: 35,
    COMPONENTS: 60,
    COPPER: 40,
    RECYCLED_PLASTIC: 50,
    ELECTRIC_COMPONENTS: 80,
  },
};

// ============================================
// SCRAP GENERATION
// ============================================

export const SCRAP_GENERATION_CONFIG = {
  MANUAL_GENERATION: 6,
  MANUAL_COST: 1, // Coste en dinero por cada click manual de chatarra
  MAX_LEVEL: 10,
  BASE_COST_MONEY: 200,
  COST_MULTIPLIER: 1.45,
  COMPONENTS_START_LEVEL: 6,
  AUTO_GENERATION_RATES: [0.0, 0.12, 0.2, 0.32, 0.48, 0.7, 1.0, 1.45, 2.1, 3.0, 4.2],
};

// ============================================
// MARKET - MANUAL SELLING
// ============================================

export const MARKET_CONFIG = {
  BASE_PRICES: {
    METAL: 1,
    PLASTIC: 1.2,
    COMPONENTS: 3,
    COPPER: 3.0,             // Precio definitivo: >= Componentes ($3), Cobre se desbloquea después de Componentes
    RECYCLED_PLASTIC: 3.5,  // PRD A.3: recurso T3 vendible
    ELECTRIC_COMPONENTS: 6.5, // PRD A.3: recurso T3 vendible
  },
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
  },
};

// ============================================
// MACHINE BASE STATS
// ============================================

export const MACHINE_BASE_SPEEDS = {
  CRUSHER: 0.5,
  SEPARATOR: 0.5,
  SMELTER: 0.25, // Fix: was 0.35 (mismatch with machines.config)
  ASSEMBLER: 0.22, // Fix: was 0.17 (Packager starvation at unlock)
  PACKAGER: 0.1,
  ELECTRIC_PACKAGER: 0.1,
  RECYCLER: 0.5,
  ELECTRIC_ASSEMBLER: 0.2, // Fix: was 0.12 (E.Packager 80% deficit)
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
};

