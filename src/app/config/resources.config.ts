import { Resource, ResourceType } from '../models/resource.model';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: ResourceType.SCRAP,
    name: 'Chatarra',
    amount: 0,
    icon: '♻️'
  },
  {
    id: ResourceType.METAL,
    name: 'Metal',
    amount: 0,
    icon: '⚙️'
  },
  {
    id: ResourceType.PLASTIC,
    name: 'Plástico',
    amount: 0,
    icon: '🧪'
  },
  {
    id: ResourceType.COMPONENTS,
    name: 'Componentes',
    amount: 0,
    icon: '🔧'
  },
  {
    id: ResourceType.MONEY,
    name: 'Dinero',
    amount: 0,
    icon: '💰'
  }
];
