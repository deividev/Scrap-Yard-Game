import { ResourceType } from './resource.model';

export type MarketEventType =
  | 'boom_pcs'
  | 'boom_components'
  | 'market_crash'
  | 'corporate_deal'
  | 'tech_parts_rush'
  | 'materials_shortage'
  | 'flash_sale'
  | 'recycling_incentive';

export interface MarketEventDefinition {
  type: MarketEventType;
  affectedResources: ResourceType[];
  priceMultiplier: number;
  durationSeconds: number;
  weight: number;
}

export interface MarketEvent {
  type: MarketEventType;
  affectedResources: ResourceType[];
  priceMultiplier: number;
  durationSeconds: number;
  timeRemaining: number;
}
