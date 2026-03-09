import { Resource } from './resource.model';
import { Machine } from './machine.model';
import { UpgradeState } from './upgrade.model';
import { UpgradeProgress } from './upgrade-progress.model';
import { GameSettings } from '../services/settings.service';

export interface SaveState {
  resources: Resource[];
  machines: Machine[];
  upgrades: UpgradeState[];
  scrapGenerationRate: number;
  upgradeProgress?: UpgradeProgress[]; // Lista de upgrades en progreso
  lastSaveTimestamp?: number; // Timestamp para cálculo offline
  settings?: GameSettings; // Configuración del juego
  gameStarted?: boolean; // Indica si el usuario ha iniciado el juego (true) o solo ha guardado configuraciones (false/undefined)
}
