import { Resource, ResourceType } from '../models/resource.model';
import { INITIAL_CAPACITIES } from './game-balance.config';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: ResourceType.SCRAP,
    name: 'Chatarra',
    amount: 30,
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
    icon: 'assets/icons/gold_resource_1.png',
  },
  {
    id: ResourceType.COPPER,
    name: 'Cobre',
    amount: 0,
    capacity: INITIAL_CAPACITIES.COPPER,
    icon: 'assets/icons/copper_resource.png',
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
  // T4
  {
    id: ResourceType.CIRCUIT_BOARD,
    name: 'Circuit Board',
    amount: 0,
    capacity: INITIAL_CAPACITIES.CIRCUIT_BOARD,
    icon: 'assets/icons/circuit_board_resource.png',
  },
  // T5
  {
    id: ResourceType.HDD,
    name: 'Disco Duro',
    amount: 0,
    capacity: INITIAL_CAPACITIES.HDD,
    icon: 'assets/icons/hdd_resource.png',
  },
  // T6
  {
    id: ResourceType.SCREEN,
    name: 'Pantalla',
    amount: 0,
    capacity: INITIAL_CAPACITIES.SCREEN,
    icon: 'assets/icons/screen_resource.png',
  },
  // T7
  {
    id: ResourceType.GPU,
    name: 'GPU',
    amount: 0,
    capacity: INITIAL_CAPACITIES.GPU,
    icon: 'assets/icons/gpu_resource.png',
  },
  // T8
  {
    id: ResourceType.SMARTPHONE,
    name: 'Smartphone',
    amount: 0,
    capacity: INITIAL_CAPACITIES.SMARTPHONE,
    icon: 'assets/icons/smartphone_resource.png',
  },
  // T9
  {
    id: ResourceType.LAPTOP,
    name: 'Laptop',
    amount: 0,
    capacity: INITIAL_CAPACITIES.LAPTOP,
    icon: 'assets/icons/laptop_resource.png',
  },
  // T10
  {
    id: ResourceType.DESKTOP_PC,
    name: 'Desktop PC',
    amount: 0,
    capacity: INITIAL_CAPACITIES.DESKTOP_PC,
    icon: 'assets/icons/desktop_pc_resource.png',
  },
  // T11
  {
    id: ResourceType.MINING_RIG,
    name: 'Mining Rig',
    amount: 0,
    capacity: INITIAL_CAPACITIES.MINING_RIG,
    icon: 'assets/icons/mining_rig_resource.png',
  },
  // T12
  {
    id: ResourceType.SERVER_RACK,
    name: 'Server Rack',
    amount: 0,
    capacity: INITIAL_CAPACITIES.SERVER_RACK,
    icon: 'assets/icons/server_rack_resource.png',
  },
];
