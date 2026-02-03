/**
 * GAME BALANCE CONFIGURATION
 * Centraliza todas las fórmulas y constantes de balanceo del juego
 * para facilitar ajustes y balanceo sin modificar la lógica del código
 */

// ============================================
// UPGRADES - COST FORMULAS
// ============================================

export const UPGRADE_COST_FORMULAS = {
  // Multiplicador de coste por nivel para upgrades normales
  // Formula: baseCost * (DEFAULT_MULTIPLIER ^ currentLevel)
  DEFAULT_MULTIPLIER: 1.15,

  // Multiplicador de coste por nivel para upgrades de chatarra
  // Formula: baseCost * (SCRAP_MULTIPLIER ^ currentLevel)
  SCRAP_MULTIPLIER: 1.25,
};

// ============================================
// STORAGE UPGRADES - CAPACITY INCREMENTS
// ============================================

export const STORAGE_UPGRADE_CONFIG = {
  // Máximo nivel de upgrades de almacenamiento
  MAX_LEVEL: 50,

  // Cada cuántos niveles aumenta el tier (y el incremento)
  LEVELS_PER_TIER: 10,

  // Incremento base por recurso (tier 0: niveles 1-10)
  BASE_INCREMENTS: {
    SCRAP: 50,
    METAL: 20,
    PLASTIC: 20,
    COMPONENTS: 5,
  },

  // Factor de escalado: incremento aumenta 50% cada tier
  // Tier 0: base × 1
  // Tier 1: base × 1.5
  // Tier 2: base × 2.25
  // Tier 3: base × 3.375
  // Tier 4: base × 5.06
  SCALE_FACTOR: 1.5,
};

// ============================================
// SCRAP GENERATION
// ============================================

export const SCRAP_GENERATION_CONFIG = {
  // Generación manual por clic
  MANUAL_GENERATION: 1,

  // Tasas de generación automática por nivel de upgrade
  AUTO_GENERATION_RATES: [
    0, // Nivel 0: sin generación automática
    0.2, // Nivel 1: +0.2 chatarra/segundo
    0.5, // Nivel 2: +0.5 chatarra/segundo
    1.0, // Nivel 3: +1.0 chatarra/segundo (máximo)
  ],

  // Nivel máximo de upgrade de generación automática
  MAX_AUTO_LEVEL: 50,
};

// ============================================
// MACHINE LEVEL UPGRADES
// ============================================

export const MACHINE_UPGRADE_CONFIG = {
  // Coste base de dinero para primer upgrade de máquina
  BASE_MONEY_COST: 20,

  // Multiplicador de coste por nivel
  // Formula: ceil(BASE_MONEY_COST * (COST_MULTIPLIER ^ (newLevel - 2)))
  COST_MULTIPLIER: 1.15,

  // A partir de qué nivel se requieren componentes
  COMPONENTS_START_LEVEL: 4,

  // Fórmula para componentes: newLevel - 3 (a partir del nivel 4)
  // Nivel 4: 1 componente
  // Nivel 5: 2 componentes
  // Nivel 6: 3 componentes, etc.
};

// ============================================
// MACHINE BASE STATS
// ============================================

export const MACHINE_BASE_SPEEDS = {
  CRUSHER: 0.5, // 2 segundos por ciclo
  SEPARATOR: 0.5, // 2 segundos por ciclo
  SMELTER: 0.25, // 4 segundos por ciclo
  ASSEMBLER: 0.17, // ~6 segundos por ciclo
  PACKAGER: 0.1, // 10 segundos por ciclo
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
  MONEY: Infinity, // Sin límite
};
