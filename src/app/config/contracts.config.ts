import { ResourceType } from '../models/resource.model';
import { ContractType } from '../models/contract.model';

export interface ContractTemplate {
  resourceId: ResourceType;
  type: ContractType;
  amount: number;
  reward: number;          // total money reward (normal urgency)
  penaltyAmount: number;   // money penalty if accepted but failed (normal)
  durationSeconds: number; // time limit after accepting (normal)
  availableDurationSeconds: number; // how long it waits before expiring if unaccepted
}

// Market base prices for reference (1x):
// METAL:1, PLASTIC:1.2, COMPONENTS:3, COPPER:3, RECYCLED_PLASTIC:3.5
// ELECTRIC_COMPONENTS:9.5, CIRCUIT_BOARD:15, HDD:35, SCREEN:40
// GPU:100, SMARTPHONE:300, LAPTOP:600, DESKTOP_PC:800
// MINING_RIG:2200, SERVER_RACK:3000
// Contracts pay ~1.5x–2x market rate as incentive over raw selling.

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  // T1 — local contracts
  { resourceId: ResourceType.METAL,             type: 'local',     amount: 20, reward: 35,   penaltyAmount: 10,  durationSeconds: 90,  availableDurationSeconds: 120 },
  { resourceId: ResourceType.PLASTIC,           type: 'local',     amount: 15, reward: 30,   penaltyAmount: 10,  durationSeconds: 90,  availableDurationSeconds: 120 },
  // T2 — local contracts
  { resourceId: ResourceType.COMPONENTS,        type: 'local',     amount: 10, reward: 55,   penaltyAmount: 15,  durationSeconds: 120, availableDurationSeconds: 150 },
  { resourceId: ResourceType.COPPER,            type: 'local',     amount: 10, reward: 55,   penaltyAmount: 15,  durationSeconds: 120, availableDurationSeconds: 150 },
  // T3 — regional contracts
  { resourceId: ResourceType.RECYCLED_PLASTIC,  type: 'regional',  amount: 8,  reward: 50,   penaltyAmount: 20,  durationSeconds: 120, availableDurationSeconds: 150 },
  { resourceId: ResourceType.ELECTRIC_COMPONENTS, type: 'regional', amount: 5, reward: 80,   penaltyAmount: 25,  durationSeconds: 150, availableDurationSeconds: 180 },
  // T4 — regional contracts
  { resourceId: ResourceType.CIRCUIT_BOARD,     type: 'regional',  amount: 3,  reward: 75,   penaltyAmount: 30,  durationSeconds: 150, availableDurationSeconds: 180 },
  // T5 — regional contracts
  { resourceId: ResourceType.HDD,               type: 'regional',  amount: 3,  reward: 200,  penaltyAmount: 50,  durationSeconds: 180, availableDurationSeconds: 210 }, // Balance: 160→200 (1.90× vs $105 market)
  { resourceId: ResourceType.SCREEN,            type: 'regional',  amount: 3,  reward: 225,  penaltyAmount: 55,  durationSeconds: 180, availableDurationSeconds: 210 }, // Balance: 180→225 (1.88× vs $120 market)
  // T6 — corporate contracts
  { resourceId: ResourceType.GPU,               type: 'corporate', amount: 2,  reward: 380,  penaltyAmount: 80,  durationSeconds: 240, availableDurationSeconds: 270 }, // Balance: 290→380 (1.90× vs $200 market)
  // T8–T12 — corporate contracts
  { resourceId: ResourceType.SMARTPHONE,        type: 'corporate', amount: 2,  reward: 1080, penaltyAmount: 200, durationSeconds: 300, availableDurationSeconds: 330 }, // Balance: 870→1080 (1.80× vs $600 market)
  { resourceId: ResourceType.LAPTOP,            type: 'corporate', amount: 1,  reward: 1250, penaltyAmount: 300, durationSeconds: 300, availableDurationSeconds: 330 },
  { resourceId: ResourceType.DESKTOP_PC,        type: 'corporate', amount: 1,  reward: 1600, penaltyAmount: 400, durationSeconds: 360, availableDurationSeconds: 390 },
  { resourceId: ResourceType.MINING_RIG,        type: 'corporate', amount: 1,  reward: 4400, penaltyAmount: 800, durationSeconds: 420, availableDurationSeconds: 450 },
  { resourceId: ResourceType.SERVER_RACK,       type: 'corporate', amount: 1,  reward: 6000, penaltyAmount: 1000, durationSeconds: 420, availableDurationSeconds: 450 },
];

export const CONTRACTS_CONFIG = {
  MAX_AVAILABLE: 3,            // max contracts waiting for player acceptance
  MAX_ACTIVE: 2,               // max contracts accepted at the same time
  SPAWN_CHECK_INTERVAL: 30,    // check every N game ticks (seconds)
  URGENT_CHANCE: 0.2,          // 20% chance a spawned contract is urgent
  URGENT_DURATION_MULT: 0.65,  // urgent = 65% of normal duration
  URGENT_REWARD_MULT: 2.0,     // urgent = 2x reward (symmetric with 2x penalty — high risk, high reward)
  URGENT_PENALTY_MULT: 2.0,    // urgent = 2x penalty
};
