import { ResourceType } from './resource.model';

export type ContractType = 'local' | 'regional' | 'corporate';
export type ContractUrgency = 'normal' | 'urgent';

export interface Contract {
  id: string;
  type: ContractType;
  urgency: ContractUrgency;
  resourceId: ResourceType;
  amount: number;
  reward: number;
  penaltyAmount: number;
  durationSeconds: number;
  spawnedAt: number;
  availableUntil: number; // ms timestamp; expires if not accepted before this
  acceptedAt: number;     // ms timestamp; 0 = not accepted
  isAccepted: boolean;
}
