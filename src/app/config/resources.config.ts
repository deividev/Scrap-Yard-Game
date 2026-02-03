import { Resource, ResourceType } from '../models/resource.model';
import { INITIAL_CAPACITIES } from './game-balance.config';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: ResourceType.SCRAP,
    name: 'Chatarra',
    amount: 50,
    capacity: INITIAL_CAPACITIES.SCRAP,
    icon: '♻️',
  },
  {
    id: ResourceType.METAL,
    name: 'Metal',
    amount: 0,
    capacity: INITIAL_CAPACITIES.METAL,
    icon: '⚙️',
  },
  {
    id: ResourceType.PLASTIC,
    name: 'Plástico',
    amount: 0,
    capacity: INITIAL_CAPACITIES.PLASTIC,
    icon: '🧪',
  },
  {
    id: ResourceType.COMPONENTS,
    name: 'Componentes',
    amount: 0,
    capacity: INITIAL_CAPACITIES.COMPONENTS,
    icon: '🔧',
  },
  {
    id: ResourceType.MONEY,
    name: 'Dinero',
    amount: 100000,
    capacity: INITIAL_CAPACITIES.MONEY,
    icon: '💰',
  },
];
