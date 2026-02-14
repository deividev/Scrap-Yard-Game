/**
 * Modelo para trackear el progreso de upgrades en curso
 */

import { UpgradeId } from './upgrade.model';

/**
 * Representa un upgrade que está siendo procesado
 */
export interface UpgradeProgress {
  /** ID del upgrade */
  upgradeId: UpgradeId;

  /** Nivel objetivo (el nivel que se alcanzará al completar) */
  targetLevel: number;

  /** Tiempo total requerido (en segundos) */
  totalTime: number;

  /** Tiempo transcurrido (en segundos) */
  elapsedTime: number;

  /** Timestamp de inicio (para cálculos offline) */
  startTimestamp: number;
}

/**
 * Configuración de tiempos base por categoría de upgrade
 */
export const UPGRADE_TIME_CONFIG = {
  /** Upgrades de almacenamiento */
  STORAGE: {
    baseTime: 1, // 1 segundo base (early)
    category: 'early' as const,
  },

  /** Upgrades de chatarra */
  SCRAP: {
    baseTime: 2, // 2 segundos base (early/mid)
    category: 'early' as const,
  },

  /** Upgrades de máquinas */
  MACHINE: {
    baseTime: 10, // 10 segundos base (mid)
    category: 'mid' as const,
  },
} as const;

/**
 * Calcula el tiempo requerido para un upgrade
 * Fórmula: tiempo = baseTime + (nivel ^ 1.2)
 */
export function calculateUpgradeTime(baseTime: number, targetLevel: number): number {
  return baseTime + Math.pow(targetLevel, 1.2);
}
