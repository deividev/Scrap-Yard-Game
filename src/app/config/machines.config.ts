import { Machine, MachineType } from '../models/machine.model';
import { ResourceType } from '../models/resource.model';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: MachineType.CRUSHER,
    name: 'Trituradora',
    level: 1,
    baseSpeed: 1,
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
    level: 1,
    baseSpeed: 1,
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
    level: 1,
    baseSpeed: 0.5,
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
    level: 1,
    baseSpeed: 0.5,
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
    level: 1,
    baseSpeed: 0.2,
    baseConsumption: [
      {
        resourceId: ResourceType.COMPONENTS,
        amount: 5,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.MONEY,
      amount: 10,
    },
    isActive: false,
    progress: 0,
  },
];
