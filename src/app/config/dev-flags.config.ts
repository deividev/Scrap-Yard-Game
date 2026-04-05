import { MachineType } from '../models/machine.model';

/**
 * DEV_CALIBRATION_ENABLED
 *
 * Set to `true` locally to show the slot calibration tool overlay on machine cards.
 * When active, each card shows a ⚙ button that opens a live drag-and-drop editor
 * for positions, sizes, particle zones, and shake settings.
 *
 * MUST be `false` in all Steam / production builds — the compiler will tree-shake
 * the entire calibrator component out when false.
 */
export const DEV_CALIBRATION_ENABLED = false;

/**
 * IS_DEMO
 *
 * When `true`, the game runs in demo mode:
 * - Player can only unlock machines up to and including the Packager.
 * - Machines in DEMO_MACHINE_CAP are permanently locked and shown without requirements.
 * - The demo-end modal fires on the first completed Packager cycle.
 *
 * Set to `false` for the full commercial release build.
 */
export const IS_DEMO = true;

/**
 * Machines that are locked in demo mode.
 * These cards are visible but their unlock requirements are hidden.
 */
export const DEMO_MACHINE_CAP: MachineType[] = [
  MachineType.SMELTER,
  MachineType.RECYCLER,
  MachineType.ELECTRIC_ASSEMBLER,
  MachineType.ELECTRIC_PACKAGER,
];
