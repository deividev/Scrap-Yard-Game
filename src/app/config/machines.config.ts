import {
  Machine,
  MachineType,
  MachineConsumption,
  MachineProduction,
} from '../models/machine.model';
import { ResourceType } from '../models/resource.model';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: MachineType.CRUSHER,
    name: 'Trituradora',
    level: 1,
    baseSpeed: 0.5,
    baseConsumption: [
      {
        resourceId: ResourceType.SCRAP,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.METAL,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.SEPARATOR,
    name: 'Separador',
    level: 0,
    baseSpeed: 0.5,
    baseConsumption: [
      {
        resourceId: ResourceType.SCRAP,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.PLASTIC,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.SMELTER,
    name: 'Fundidora',
    level: 0,
    baseSpeed: 0.25,
    baseConsumption: [
      {
        resourceId: ResourceType.METAL,
        amount: 2,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.COMPONENTS,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ASSEMBLER,
    name: 'Ensambladora',
    level: 0,
    baseSpeed: 0.17,
    baseConsumption: [
      {
        resourceId: ResourceType.METAL,
        amount: 1,
      },
      {
        resourceId: ResourceType.PLASTIC,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.COMPONENTS,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.PACKAGER,
    name: 'Empaquetadora',
    level: 0,
    baseSpeed: 0.1,
    baseConsumption: [
      {
        resourceId: ResourceType.COMPONENTS,
        amount: 4,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.MONEY,
      amount: 20,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ELECTRIC_PACKAGER,
    name: 'Empaquetadora eléctrica',
    level: 0,
    baseSpeed: 0.1,
    baseConsumption: [
      {
        resourceId: ResourceType.ELECTRIC_COMPONENTS,
        amount: 6,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.MONEY,
      amount: 40,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.RECYCLER,
    name: 'Recicladora',
    level: 0,
    baseSpeed: 0.5,
    baseConsumption: [
      {
        resourceId: ResourceType.PLASTIC,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.RECYCLED_PLASTIC,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ELECTRIC_ASSEMBLER,
    name: 'Ensambladora eléctrica',
    level: 0,
    baseSpeed: 0.12,
    baseConsumption: [
      {
        resourceId: ResourceType.METAL,
        amount: 1,
      },
      {
        resourceId: ResourceType.COMPONENTS,
        amount: 1,
      },
      {
        resourceId: ResourceType.RECYCLED_PLASTIC,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.ELECTRIC_COMPONENTS,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
];
