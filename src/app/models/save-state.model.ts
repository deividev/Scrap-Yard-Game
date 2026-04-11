import { Resource } from './resource.model';
import { Machine } from './machine.model';
import { UpgradeState } from './upgrade.model';
import { UpgradeProgress } from './upgrade-progress.model';
import { FirstRunTutorialState } from './tutorial-step.model';
import { GameSettings } from '../services/settings.service';

export const SAVE_VERSION = 3; // F2: cadenas T4-T7 (9 recursos + 9 máquinas)

export interface SavedContract {
  id: string;
  type: 'local' | 'regional' | 'corporate';
  urgency: 'normal' | 'urgent';
  resourceId: string;
  amount: number;
  reward: number;
  penaltyAmount: number;
  durationSeconds: number;
  acceptedAt: number; // 0 si no aceptado
  isAccepted: boolean;
}

export interface SaveState {
  version: number;
  resources: Resource[];
  machines: Machine[];
  upgrades: UpgradeState[];
  scrapGenerationRate: number;
  upgradeProgress?: UpgradeProgress[]; // Lista de upgrades en progreso
  lastSaveTimestamp?: number; // Timestamp para cálculo offline
  settings?: GameSettings; // Configuración del juego
  gameStarted?: boolean; // Indica si el usuario ha iniciado el juego (true) o solo ha guardado configuraciones (false/undefined)
  statistics?: { totalScrapGenerated: number; playTimeSeconds: number };
  firstRunTutorial?: FirstRunTutorialState;
  // F1 fields (pre-initialized in v1→v2 migration)
  contracts?: SavedContract[]; // contratos activos/disponibles
  lastContractSpawnCheck?: number; // timestamp del último check de spawn
  firstContractSpawned?: boolean; // true una vez que se spawneó el primer contrato
  // F4 fields (pre-initialized in v1→v2 migration)
  completedMilestones?: string[]; // IDs de milestones completados
}
