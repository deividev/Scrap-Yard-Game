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
    icon: 'assets/icons/machines/crusher_machine.png',
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
      amount: 2,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.SEPARATOR,
    name: 'Separador',
    icon: 'assets/icons/machines/separator_machine.png',
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
    icon: 'assets/icons/machines/smelter_machine.png',
    level: 0,
    baseSpeed: 0.25,
    baseConsumption: [
      {
        resourceId: ResourceType.METAL,
        amount: 4,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.COPPER,
      amount: 2,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ASSEMBLER,
    name: 'Ensambladora',
    icon: 'assets/icons/machines/assembler_machine.png',
    level: 0,
    baseSpeed: 0.22, // Fix: was 0.17 (Packager starvation at unlock)
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
    icon: 'assets/icons/machines/packager_machine.png',
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
      amount: 10,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ELECTRIC_PACKAGER,
    name: 'Empaquetadora eléctrica',
    icon: 'assets/icons/machines/electric_packager_machine.png',
    level: 0,
    baseSpeed: 0.1,
    baseConsumption: [
      {
        resourceId: ResourceType.ELECTRIC_COMPONENTS,
        amount: 4, // Fix: was 6 (E.Assembler 0.12/s could never feed it)
      },
    ],
    baseProduction: {
      resourceId: ResourceType.MONEY,
      amount: 60,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.RECYCLER,
    name: 'Recicladora',
    icon: 'assets/icons/machines/recycler_machine.png',
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
    icon: 'assets/icons/machines/electric_assembler_machine.png',
    level: 0,
    baseSpeed: 0.2, // Fix: was 0.12 (E.Packager 80% deficit at unlock)
    baseConsumption: [
      {
        resourceId: ResourceType.COPPER,
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
