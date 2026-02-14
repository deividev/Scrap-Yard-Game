import { Injectable, signal, computed } from '@angular/core';
import { UpgradeProgress, calculateUpgradeTime, UPGRADE_TIME_CONFIG } from '../models/upgrade-progress.model';
import { UpgradeId } from '../models/upgrade.model';

/**
 * Servicio que gestiona el progreso de upgrades con tiempo
 */
@Injectable({
  providedIn: 'root'
})
export class UpgradeProgressService {
  /** Lista de upgrades actualmente en progreso */
  private activeUpgrades = signal<UpgradeProgress[]>([]);
  
  /** Upgrades activos expuestos como computed */
  activeUpgrades$ = computed(() => this.activeUpgrades());
  
  /** Verifica si hay algún upgrade en progreso */
  hasActiveUpgrades$ = computed(() => this.activeUpgrades().length > 0);
  
  /**
   * Inicia un nuevo upgrade
   */
  startUpgrade(
    upgradeId: UpgradeId,
    targetLevel: number,
    category: 'STORAGE' | 'SCRAP' | 'MACHINE'
  ): void {
    // Verificar si ya existe un upgrade activo para este ID
    const existing = this.activeUpgrades().find(u => u.upgradeId === upgradeId);
    if (existing) {
      console.warn(`Upgrade ${upgradeId} ya está en progreso`);
      return;
    }
    
    // Calcular tiempo total
    const baseTime = UPGRADE_TIME_CONFIG[category].baseTime;
    const totalTime = calculateUpgradeTime(baseTime, targetLevel);
    
    // Crear nuevo progreso
    const newProgress: UpgradeProgress = {
      upgradeId,
      targetLevel,
      totalTime,
      elapsedTime: 0,
      startTimestamp: Date.now()
    };
    
    console.log(`[UpgradeProgress] Upgrade iniciado:`, {
      id: upgradeId,
      targetLevel,
      category,
      totalTime: totalTime.toFixed(1) + 's',
      baseTime
    });
    
    // Añadir a la lista
    this.activeUpgrades.update(upgrades => [...upgrades, newProgress]);
  }
  
  /**
   * Actualiza el progreso de todos los upgrades activos
   * Debe ser llamado desde el GameLoopService
   * IMPORTANTE: Crea nuevos objetos inmutables para que Angular detecte cambios
   */
  updateProgress(deltaTime: number): UpgradeId[] {
    const completedUpgrades: UpgradeId[] = [];
    
    this.activeUpgrades.update(upgrades => {
      // Mapear a nuevos objetos inmutables con elapsedTime actualizado
      const updated = upgrades
        .map(upgrade => ({
          ...upgrade,
          elapsedTime: upgrade.elapsedTime + deltaTime
        }))
        .filter(upgrade => {
          // Verificar si está completo
          if (upgrade.elapsedTime >= upgrade.totalTime) {
            completedUpgrades.push(upgrade.upgradeId);
            console.log(`[UpgradeProgress] Upgrade completado: ${upgrade.upgradeId}`);
            return false; // Remover de la lista
          }
          
          return true; // Mantener en la lista
        });
      
      // Log de debug si hay upgrades activos
      if (updated.length > 0) {
        console.log('[UpgradeProgress] Progreso actualizado:', updated.map(u => ({
          id: u.upgradeId,
          elapsed: u.elapsedTime.toFixed(1),
          total: u.totalTime.toFixed(1),
          progress: ((u.elapsedTime / u.totalTime) * 100).toFixed(1) + '%'
        })));
      }
      
      return updated;
    });
    
    return completedUpgrades;
  }
  
  /**
   * Obtiene el progreso de un upgrade específico (0-1)
   */
  getUpgradeProgress(upgradeId: UpgradeId): number {
    const upgrade = this.activeUpgrades().find(u => u.upgradeId === upgradeId);
    if (!upgrade) return 0;
    
    return Math.min(upgrade.elapsedTime / upgrade.totalTime, 1);
  }
  
  /**
   * Obtiene el tiempo restante de un upgrade (en segundos)
   */
  getRemainingTime(upgradeId: UpgradeId): number {
    const upgrade = this.activeUpgrades().find(u => u.upgradeId === upgradeId);
    if (!upgrade) return 0;
    
    return Math.max(upgrade.totalTime - upgrade.elapsedTime, 0);
  }
  
  /**
   * Verifica si un upgrade específico está en progreso
   */
  isUpgradeInProgress(upgradeId: UpgradeId): boolean {
    return this.activeUpgrades().some(u => u.upgradeId === upgradeId);
  }
  
  /**
   * Procesa el progreso offline
   * Devuelve los IDs de upgrades que se completaron durante la ausencia
   */
  processOfflineProgress(offlineTime: number): UpgradeId[] {
    const completedUpgrades: UpgradeId[] = [];
    
    this.activeUpgrades.update(upgrades => {
      return upgrades.filter(upgrade => {
        // Calcular tiempo real transcurrido desde el inicio
        const actualElapsed = (Date.now() - upgrade.startTimestamp) / 1000;
        
        // Verificar si se completó durante el tiempo offline
        if (actualElapsed >= upgrade.totalTime) {
          completedUpgrades.push(upgrade.upgradeId);
          return false; // Remover de la lista
        }
        
        // Actualizar el tiempo transcurrido
        upgrade.elapsedTime = actualElapsed;
        return true; // Mantener en la lista
      });
    });
    
    return completedUpgrades;
  }
  
  /**
   * Cancela un upgrade en progreso (para debug/testing)
   */
  cancelUpgrade(upgradeId: UpgradeId): void {
    this.activeUpgrades.update(upgrades => 
      upgrades.filter(u => u.upgradeId !== upgradeId)
    );
  }
  
  /**
   * Serializa el estado para guardar
   */
  serialize(): UpgradeProgress[] {
    return this.activeUpgrades();
  }
  
  /**
   * Restaura el estado desde un save
   */
  deserialize(data: UpgradeProgress[]): void {
    this.activeUpgrades.set(data || []);
  }
  
  /**
   * Reinicia el servicio (para new game)
   */
  reset(): void {
    this.activeUpgrades.set([]);
  }
}
