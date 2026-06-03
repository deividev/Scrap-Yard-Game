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
    baseSpeed: 0.80, // Balance: 0.50→0.80 — Assembler(0.40/s)+Recycler(0.50/s) demand 0.90/s; Separator at 0.50 starved both
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
    baseSpeed: 0.33, // F0: Scrap directo, simétrica con Trituradora y Separador
    baseConsumption: [
      {
        resourceId: ResourceType.SCRAP,
        amount: 2,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.COPPER,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  {
    id: MachineType.ASSEMBLER,
    name: 'Ensambladora',
    icon: 'assets/cards/assembler_card_new_slot.png',
    level: 0,
    baseSpeed: 0.40, // Balance: 0.22→0.40 — must supply EA(0.50/s needs 0.50 comp/s) + Packager(2-comp at 0.1/s = 0.20 comp/s)
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
        amount: 2, // Balance: 4→2 — was destroying value ($12 input → $10 output). Now 2×$3=$6 input → $12 output.
      },
    ],
    baseProduction: {
      resourceId: ResourceType.MONEY,
      amount: 8, // Balance: 2×$3=$6 input → $8 output (~33% premium over selling components directly)
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
    baseSpeed: 0.50, // Balance: 0.32→0.50 — E.Packager needs 0.40/s + PCB Printer (EC:1) needs 0.30/s = 0.70/s total; EA now covers E.Packager solo and partial PCB
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
  // T4
  {
    id: MachineType.PCB_PRINTER,
    name: 'PCB Printer',
    icon: 'assets/cards/pcb_printer_card_new_slot.png',
    level: 0,
    baseSpeed: 0.30, // Balance pass: faster (0.17→0.30) to keep Circuit Boards flowing for T5-T7
    baseConsumption: [
      {
        resourceId: ResourceType.COPPER,
        amount: 1,
      },
      {
        resourceId: ResourceType.ELECTRIC_COMPONENTS,
        amount: 1, // Balance: 2→1 — halves EC appetite. EA(0.50/s) now covers E.Packager(0.40) + PCB(0.30) with 1 upgrade headroom.
      },
    ],
    baseProduction: {
      resourceId: ResourceType.CIRCUIT_BOARD,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T5
  {
    id: MachineType.HDD_ASSEMBLER,
    name: 'HDD Assembler',
    icon: 'assets/cards/hdd_assembler_card_new_slot.png',
    level: 0,
    baseSpeed: 0.08, // PRD A.2 T5: 1 CB + 3 Metal → 1 HDD
    baseConsumption: [
      {
        resourceId: ResourceType.CIRCUIT_BOARD,
        amount: 1,
      },
      {
        resourceId: ResourceType.METAL,
        amount: 5, // Balance pass: Metal×2→×5 to absorb Crusher excess mid-game
      },
    ],
    baseProduction: {
      resourceId: ResourceType.HDD,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T6
  {
    id: MachineType.SCREEN_FABRICATOR,
    name: 'Screen Fabricator',
    icon: 'assets/cards/screen_fabricator_card_new_slot.png',
    level: 0,
    baseSpeed: 0.07, // PRD T6: CB×1 + ElecComp×1 + Plastic×1 → Screen
    baseConsumption: [
      {
        resourceId: ResourceType.CIRCUIT_BOARD,
        amount: 1,
      },
      {
        resourceId: ResourceType.ELECTRIC_COMPONENTS,
        amount: 1,
      },
      {
        resourceId: ResourceType.RECYCLED_PLASTIC,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.SCREEN,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T7
  {
    id: MachineType.GPU_FAB,
    name: 'GPU Fab',
    icon: 'assets/cards/gpu_fab_card_new_slot.png',
    level: 0,
    baseSpeed: 0.10, // Balance: 0.05→0.10 — can now sustain T8 Smartphone(0.045/s) + T9 Laptop(0.035/s) simultaneously at base
    baseConsumption: [
      {
        resourceId: ResourceType.CIRCUIT_BOARD,
        amount: 1,
      },
      {
        resourceId: ResourceType.HDD,
        amount: 1,
      },
      {
        resourceId: ResourceType.COPPER,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.GPU,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T8
  {
    id: MachineType.SMARTPHONE_FACTORY,
    name: 'Smartphone Factory',
    icon: 'assets/cards/smartphone_factory_card_new_slot.png',
    level: 0,
    baseSpeed: 0.045,
    baseConsumption: [
      {
        resourceId: ResourceType.SCREEN,
        amount: 1,
      },
      {
        resourceId: ResourceType.GPU,
        amount: 1,
      },
      {
        resourceId: ResourceType.CIRCUIT_BOARD,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.SMARTPHONE,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T9
  {
    id: MachineType.LAPTOP_WORKSHOP,
    name: 'Laptop Workshop',
    icon: 'assets/cards/laptop_workshop_card_new_slot.png',
    level: 0,
    baseSpeed: 0.035, // PRD A.2: HDD×1 + Screen×1 + GPU×1 + CB×1 → Laptop
    baseConsumption: [
      {
        resourceId: ResourceType.HDD,
        amount: 1,
      },
      {
        resourceId: ResourceType.SCREEN,
        amount: 1,
      },
      {
        resourceId: ResourceType.GPU,
        amount: 1,
      },
      {
        resourceId: ResourceType.CIRCUIT_BOARD,
        amount: 1,
      },
    ],
    baseProduction: {
      resourceId: ResourceType.LAPTOP,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T10
  {
    id: MachineType.PC_BUILDER,
    name: 'PC Builder',
    icon: 'assets/cards/pc_builder_card_new_slot.png',
    level: 0,
    baseSpeed: 0.025, // PRD A.2: HDD×1 + GPU×2 + CB×2 + Metal×2 → Desktop PC
    baseConsumption: [
      { resourceId: ResourceType.HDD, amount: 1 },
      { resourceId: ResourceType.GPU, amount: 2 },
      { resourceId: ResourceType.CIRCUIT_BOARD, amount: 2 },
      { resourceId: ResourceType.METAL, amount: 2 }, // Balance pass: Metal×1→×2, PC chassis uses more metal
    ],
    baseProduction: {
      resourceId: ResourceType.DESKTOP_PC,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T11
  {
    id: MachineType.MINING_RIG_ASSEMBLY,
    name: 'Mining Rig Assembly',
    icon: 'assets/cards/mining_rig_assembly_card_new_slot.png',
    level: 0,
    baseSpeed: 0.018, // PRD A.2: DesktopPC×1 + GPU×2 + ElecComp×2 → Mining Rig
    baseConsumption: [
      { resourceId: ResourceType.DESKTOP_PC, amount: 1 },
      { resourceId: ResourceType.GPU, amount: 2 }, // Balance pass: GPU×4→×2 (GPU Fab can't supply 4/cycle at base speed)
      { resourceId: ResourceType.ELECTRIC_COMPONENTS, amount: 2 },
    ],
    baseProduction: {
      resourceId: ResourceType.MINING_RIG,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
  // T12
  {
    id: MachineType.DATA_CENTER_ASSEMBLY,
    name: 'Data Center Assembly',
    icon: 'assets/cards/data_center_assembly_card_new_slot.png',
    level: 0,
    baseSpeed: 0.017, // PRD A.2: DesktopPC×2 + GPU×1 + CB×4 → Server Rack
    baseConsumption: [
      { resourceId: ResourceType.DESKTOP_PC, amount: 2 },
      { resourceId: ResourceType.GPU, amount: 1 }, // Balance pass: GPU×2→×1 (same reason)
      { resourceId: ResourceType.CIRCUIT_BOARD, amount: 4 },
    ],
    baseProduction: {
      resourceId: ResourceType.SERVER_RACK,
      amount: 1,
    },
    isActive: false,
    progress: 0,
  },
];