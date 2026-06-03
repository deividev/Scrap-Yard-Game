import { ResourceType } from '../models/resource.model';
import { MarketEventDefinition } from '../models/market-event.model';

export const MARKET_EVENTS_CONFIG = {
  COOLDOWN_SECONDS: 300,
  INITIAL_SECONDS_SINCE_LAST_EVENT: 240,
  EVENTS: [
    {
      type: 'boom_pcs',
      affectedResources: [ResourceType.LAPTOP, ResourceType.DESKTOP_PC, ResourceType.SMARTPHONE],
      priceMultiplier: 1.65,
      durationSeconds: 90,
      weight: 16,
    },
    {
      type: 'boom_components',
      affectedResources: [ResourceType.COMPONENTS, ResourceType.ELECTRIC_COMPONENTS],
      priceMultiplier: 1.4,
      durationSeconds: 150,
      weight: 20,
    },
    {
      type: 'market_crash',
      affectedResources: [
        ResourceType.METAL,
        ResourceType.PLASTIC,
        ResourceType.COMPONENTS,
        ResourceType.COPPER,
        ResourceType.RECYCLED_PLASTIC,
        ResourceType.ELECTRIC_COMPONENTS,
        ResourceType.CIRCUIT_BOARD,
        ResourceType.HDD,
        ResourceType.SCREEN,
        ResourceType.GPU,
        ResourceType.SMARTPHONE,
        ResourceType.LAPTOP,
        ResourceType.DESKTOP_PC,
        ResourceType.MINING_RIG,
        ResourceType.SERVER_RACK,
      ],
      priceMultiplier: 0.8,
      durationSeconds: 60,
      weight: 12,
    },
    {
      type: 'corporate_deal',
      affectedResources: [ResourceType.SERVER_RACK, ResourceType.MINING_RIG],
      priceMultiplier: 2,
      durationSeconds: 120,
      weight: 6,
    },
    {
      type: 'tech_parts_rush',
      affectedResources: [
        ResourceType.CIRCUIT_BOARD,
        ResourceType.HDD,
        ResourceType.SCREEN,
        ResourceType.GPU,
      ],
      priceMultiplier: 1.5,
      durationSeconds: 120,
      weight: 18,
    },
    {
      type: 'materials_shortage',
      affectedResources: [
        ResourceType.METAL,
        ResourceType.PLASTIC,
        ResourceType.COPPER,
        ResourceType.RECYCLED_PLASTIC,
      ],
      priceMultiplier: 0.5,
      durationSeconds: 75,
      weight: 10,
    },
    {
      type: 'flash_sale',
      affectedResources: [
        ResourceType.CIRCUIT_BOARD,
        ResourceType.HDD,
        ResourceType.LAPTOP,
      ],
      priceMultiplier: 2,
      durationSeconds: 30,
      weight: 8,
    },
    {
      type: 'recycling_incentive',
      affectedResources: [
        ResourceType.RECYCLED_PLASTIC,
        ResourceType.ELECTRIC_COMPONENTS,
      ],
      priceMultiplier: 1.4,
      durationSeconds: 150,
      weight: 10,
    },
  ] satisfies MarketEventDefinition[],
};
