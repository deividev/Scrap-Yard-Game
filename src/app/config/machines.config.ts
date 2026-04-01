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
    icon: 'assets/cards/crusher_card_new_slot.png',
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
    icon: 'assets/cards/separator_card_new_slot.png',
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
    icon: 'assets/cards/smelter_card_new_slot.png',
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
    icon: 'assets/cards/assembler_card_new_slot.png',
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
    icon: 'assets/cards/packager_card_new_slot.png',
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
    icon: 'assets/cards/electric_packager_card_new_slot.png',
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
    icon: 'assets/cards/recycler_card_new_slot.png',
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
    icon: 'assets/cards/electric_assembler_card_new_slot.png',
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
