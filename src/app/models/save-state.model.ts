import { Resource } from './resource.model';
import { Machine } from './machine.model';
import { UpgradeState } from './upgrade.model';

export interface SaveState {
  resources: Resource[];
  machines: Machine[];
  upgrades: UpgradeState[];
  scrapGenerationRate: number;
}
