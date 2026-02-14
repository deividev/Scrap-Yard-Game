import { Resource } from './resource.model';
import { Machine } from './machine.model';
import { UpgradeState } from './upgrade.model';
import { UpgradeProgress } from './upgrade-progress.model';

export interface SaveState {
  resources: Resource[];
  machines: Machine[];
  upgrades: UpgradeState[];
  scrapGenerationRate: number;
  upgradeProgress?: UpgradeProgress[]; // Lista de upgrades en progreso
  lastSaveTimestamp?: number; // Timestamp para cálculo offline
}
