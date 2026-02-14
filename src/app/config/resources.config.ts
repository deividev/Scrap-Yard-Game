import { Resource, ResourceType } from '../models/resource.model';
import { INITIAL_CAPACITIES } from './game-balance.config';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: ResourceType.SCRAP,
    name: 'Chatarra',
    amount: 50,
    capacity: INITIAL_CAPACITIES.SCRAP,
    icon: 'assets/icons/scrap_resource.png',
  },
  {
    id: ResourceType.METAL,
    name: 'Metal',
    amount: 0,
    capacity: INITIAL_CAPACITIES.METAL,
    icon: 'assets/icons/metal_resource.png',
  },
  {
    id: ResourceType.PLASTIC,
    name: 'Plástico',
    amount: 0,
    capacity: INITIAL_CAPACITIES.PLASTIC,
    icon: 'assets/icons/plastic_resource.png',
  },
  {
    id: ResourceType.COMPONENTS,
    name: 'Componentes',
    amount: 0,
    capacity: INITIAL_CAPACITIES.COMPONENTS,
    icon: 'assets/icons/components_resource.png',
  },
  {
    id: ResourceType.MONEY,
    name: 'Dinero',
    amount: 100,
    capacity: INITIAL_CAPACITIES.MONEY,
    icon: 'assets/icons/gold_resource.png',
  },
  {
    id: ResourceType.RECYCLED_PLASTIC,
    name: 'Plástico reciclado',
    amount: 0,
    capacity: INITIAL_CAPACITIES.RECYCLED_PLASTIC,
    icon: 'assets/icons/plastic_recycle_resource.png',
  },
  {
    id: ResourceType.ELECTRIC_COMPONENTS,
    name: 'Componentes eléctricos',
    amount: 0,
    capacity: INITIAL_CAPACITIES.ELECTRIC_COMPONENTS,
    icon: 'assets/icons/electric_components_resource.png',
  },
];
