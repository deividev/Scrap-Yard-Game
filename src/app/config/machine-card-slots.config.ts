import { MachineType } from '../models/machine.model';

// ── Canvas slot geometry ──────────────────────────────────────────────────────

export interface CardCanvasSlots {
  /** LED: centre (cx,cy) and radii as fractions of W. ry defaults to r when omitted (circle). */
  led: { cx: number; cy: number; r: number; ry?: number };
  /**
   * Progress bar track. x/y = top-left corner fractions. w/h = size fractions.
   * fullFactor: effectiveProg (0–1) that fills the bar exactly to the PNG slot right wall.
   */
  bar: { x: number; y: number; w: number; h: number; fullFactor: number };
}

// ── Overlay (HTML div positions) ──────────────────────────────────────────────

export interface CardOverlaySlots {
  /** Machine name label */
  name: { top: string; left: string; width: string; height: string };
  /** Level / speed panel */
  level: { top: string; left: string; width: string };
  /** LED toggle button anchor (centred on the LED via transform: translate(-50%,-50%)) */
  led: { top: string; left: string; width?: string; height?: string };
  /** Recipe row (inputs + output icons) */
  recipe: { bottom: string; left: string; width: string; height: string };
}

// ── Effects ───────────────────────────────────────────────────────────────────

/** Visual style of the ambient particle effect rendered on the canvas */
export type ParticleEffectType = 'steam' | 'electricity' | 'sparks' | 'fire' | 'plasma' | 'none';

export interface ParticleEffectConfig {
  /** Visual style to render */
  type: ParticleEffectType;
  /** Spawn zone as fractions of card W/H */
  zone: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Maximum simultaneous live particles (default: 12) */
  maxCount?: number;
  /** Chance 0–1 to spawn one particle per animation frame (default: 0.10) */
  spawnRate?: number;
  /**
   * Overall speed multiplier applied to both vx and vy.
   * 1.0 = default steam speed. Use ~0.15 for nearly static effects (electricity).
   * (default: 1.0)
   */
  speedScale?: number;
  /** Opacity [min, max] at full life. (default: [0.55, 0.80]) */
  opacityRange?: [number, number];
  /** Initial radius / arm-length as fractions of W [min, max]. (default: [0.018, 0.036]) */
  sizeRange?: [number, number];
  /** Override particle tint as CSS hex color e.g. '#ff9600'. When omitted uses type defaults. */
  color?: string;
}

export interface ShakeEffectConfig {
  /** Whether to apply the producing-state vibration (default: true) */
  enabled: boolean;
  /** Max pixel displacement at full intensity (default: 0.35) */
  intensityPx?: number;
  /** CSS animation cycle duration in ms (default: 130) */
  speedMs?: number;
}

export interface CardEffects {
  particles: ParticleEffectConfig;
  shake: ShakeEffectConfig;
}

// ── Full card config ──────────────────────────────────────────────────────────

export interface MachineCardSlots {
  /** CSS aspect-ratio string for the source PNG, e.g. "1024 / 1536" */
  aspectRatio: string;
  canvas: CardCanvasSlots;
  overlay: CardOverlaySlots;
  effects: CardEffects;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUSHER  (crusher_card_new_slot.png  1024×1536)
// Heavy industrial grinder — steam exhaust + strong mechanical shake
// ─────────────────────────────────────────────────────────────────────────────
export const CRUSHER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.811, cy: 0.321, r: 0.072, ry: 0.057 },
    bar: { x: 0.185, y: 0.816, w: 0.621, h: 0.038, fullFactor: 1 },
  },
  overlay: {
    name: { top: '14%', left: '1.5%', width: '70%', height: '11%' },
    level: { top: '26.9%', left: '16.4%', width: '48.5%' },
    led: { top: '32.4%', left: '80.9%', width: '13.7%', height: '9%' },
    recipe: { bottom: '22.1%', left: '5.4%', width: '45.5%', height: '9%' },
  },
  effects: {
    particles: {
      type: 'steam',
      zone: { xMin: 0.294, xMax: 0.711, yMin: 0.405, yMax: 0.601 },
      maxCount: 24,
      spawnRate: 0.1,
      speedScale: 1,
      opacityRange: [0.55, 0.8],
      sizeRange: [0.018, 0.036],
    },
    shake: { enabled: true, intensityPx: 0.7, speedMs: 130 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEPARATOR  (separator_card_new_slot.png  1024×1536)
// Electromagnetic separator — electric sparks + faster lighter shake
// TODO: fine-tune canvas slot values by visual inspection.
// ─────────────────────────────────────────────────────────────────────────────
export const SEPARATOR_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.81, cy: 0.339, r: 0.075, ry: 0.061 },
    bar: { x: 0.197, y: 0.902, w: 0.608, h: 0.03, fullFactor: 1 },
  },
  overlay: {
    name: { top: '12.9%', left: '17%', width: '72%', height: '10%' },
    level: { top: '28.6%', left: '17.8%', width: '45.8%' },
    led: { top: '34.1%', left: '81%', width: '14.3%', height: '9.9%' },
    recipe: { bottom: '10.4%', left: '24.7%', width: '52.5%', height: '8%' },
  },
  effects: {
    particles: {
      type: 'electricity',
      zone: { xMin: 0.231, xMax: 0.78, yMin: 0.448, yMax: 0.595 },
      maxCount: 8,
      spawnRate: 0.15,
      speedScale: 0.15,
      opacityRange: [0.65, 0.95],
      sizeRange: [0.014, 0.028],
    },
    shake: { enabled: true, intensityPx: 0.4, speedMs: 80 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SMELTER  (smelter_card_new_slot.png  420×630)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const SMELTER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.798, cy: 0.309, r: 0.063, ry: 0.053 },
    bar: { x: 0.196, y: 0.863, w: 0.609, h: 0.041, fullFactor: 1 },
  },
  overlay: {
    name: { top: '8.5%', left: '37%', width: '70%', height: '11%' },
    level: { top: '25.8%', left: '17%', width: '49.5%' },
    led: { top: '31.1%', left: '79.7%', width: '13.5%', height: '8.8%' },
    recipe: { bottom: '11.3%', left: '23.4%', width: '53.5%', height: '14.9%' },
  },
  effects: {
    particles: {
      type: 'fire',
      zone: { xMin: 0.325, xMax: 0.681, yMin: 0.347, yMax: 0.647 },
      maxCount: 18,
      spawnRate: 0.18,
      speedScale: 1.4,
      opacityRange: [0.7, 0.95],
      sizeRange: [0.018, 0.04],
    },
    shake: { enabled: true, intensityPx: 0.5, speedMs: 110 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// ASSEMBLER  (assembler_card_new_slot.png  420×630)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const ASSEMBLER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.796, cy: 0.244, r: 0.091, ry: 0.073 },
    bar: { x: 0.179, y: 0.835, w: 0.644, h: 0.037, fullFactor: 1 },
  },
  overlay: {
    name: { top: '10.1%', left: '3.6%', width: '70%', height: '11%' },
    level: { top: '19.3%', left: '14.7%', width: '50.5%' },
    led: { top: '24.8%', left: '79.5%', width: '17.6%', height: '11.6%' },
    recipe: { bottom: '17.9%', left: '20.5%', width: '55.7%', height: '12.9%' },
  },
  effects: {
    particles: {
      type: 'electricity',
      zone: { xMin: 0.377, xMax: 0.613, yMin: 0.536, yMax: 0.645 },
      maxCount: 12,
      spawnRate: 0.14,
      speedScale: 0.9,
      opacityRange: [0.65, 0.9],
      sizeRange: [0.01, 0.022],
      color: '#fddf49',
    },
    shake: { enabled: true, intensityPx: 0.4, speedMs: 100 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// PACKAGER  (packager_card_new_slot.png  420×630)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const PACKAGER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.716, cy: 0.047, r: 0.057, ry: 0.047 },
    bar: { x: 0.312, y: 0.869, w: 0.371, h: 0.057, fullFactor: 1 },
  },
  overlay: {
    name: { top: '-8.4%', left: '14.5%', width: '72%', height: '11%' },
    level: { top: '-0.7%', left: '27.9%', width: '40.2%' },
    led: { top: '4.8%', left: '71.5%', width: '9.2%', height: '7.5%' },
    recipe: { bottom: '14%', left: '37.7%', width: '22.4%', height: '5.7%' },
  },
  effects: {
    particles: {
      type: 'steam',
      zone: { xMin: 0.355, xMax: 0.654, yMin: 0.245, yMax: 0.45 },
      maxCount: 14,
      spawnRate: 0.16,
      speedScale: 1,
      opacityRange: [0.6, 0.9],
      sizeRange: [0.01, 0.024],
    },
    shake: { enabled: true, intensityPx: 0.6, speedMs: 120 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// RECYCLER  (recycler_card_new_slot.png  420×500)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const RECYCLER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 500',
  canvas: {
    led: { cx: 0.808, cy: 0.243, r: 0.077, ry: 0.058 },
    bar: { x: 0.186, y: 0.851, w: 0.619, h: 0.039, fullFactor: 1 },
  },
  overlay: {
    name: { top: '7%', left: '3.2%', width: '70%', height: '11%' },
    level: { top: '19.2%', left: '15.5%', width: '50.5%' },
    led: { top: '24.2%', left: '80.8%', width: '17%', height: '13%' },
    recipe: { bottom: '17.8%', left: '29.7%', width: '39.4%', height: '7.6%' },
  },
  effects: {
    particles: {
      type: 'steam',
      zone: { xMin: 0.261, xMax: 0.748, yMin: 0.263, yMax: 0.506 },
      maxCount: 12,
      spawnRate: 0.12,
      speedScale: 1,
      opacityRange: [0.65, 0.9],
      sizeRange: [0.01, 0.022],
      color: '#ffc800',
    },
    shake: { enabled: true, intensityPx: 0.5, speedMs: 110 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// ELECTRIC_ASSEMBLER  (electric_assembler_card_new_slot.png  420×630)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const ELECTRIC_ASSEMBLER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.809, cy: 0.289, r: 0.072, ry: 0.057 },
    bar: { x: 0.191, y: 0.835, w: 0.617, h: 0.044, fullFactor: 1 },
  },
  overlay: {
    name: { top: '10.1%', left: '3.6%', width: '70%', height: '11%' },
    level: { top: '24%', left: '16.4%', width: '50.5%' },
    led: { top: '29%', left: '81.1%', width: '16.7%', height: '11.4%' },
    recipe: { bottom: '19.1%', left: '26%', width: '46.9%', height: '9.4%' },
  },
  effects: {
    particles: {
      type: 'plasma',
      zone: { xMin: 0.38, xMax: 0.614, yMin: 0.45, yMax: 0.555 },
      maxCount: 8,
      spawnRate: 0.08,
      speedScale: 0.3,
      opacityRange: [0.6, 0.9],
      sizeRange: [0.018, 0.038],
      color: '#40b8ff',
    },
    shake: { enabled: true, intensityPx: 0.4, speedMs: 100 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// ELECTRIC_PACKAGER  (electric_packager_card_new_slot.png  420×630)
// NOTE: All slot values are initial estimates — calibrate with the ⚙ tool.
// ────────────────────────────────────────────────────────────────────────────────
export const ELECTRIC_PACKAGER_CARD_SLOTS: MachineCardSlots = {
  aspectRatio: '420 / 630',
  canvas: {
    led: { cx: 0.724, cy: 0.094, r: 0.052, ry: 0.042 },
    bar: { x: 0.275, y: 0.883, w: 0.455, h: 0.05, fullFactor: 1 },
  },
  overlay: {
    name: { top: '-3.9%', left: '16.7%', width: '72%', height: '11%' },
    level: { top: '4.3%', left: '27.5%', width: '39.9%' },
    led: { top: '9.4%', left: '73%', width: '11.6%', height: '8%' },
    recipe: { bottom: '13.4%', left: '37.5%', width: '24.9%', height: '6%' },
  },
  effects: {
    particles: {
      type: 'electricity',
      zone: { xMin: 0.349, xMax: 0.656, yMin: 0.175, yMax: 0.45 },
      maxCount: 16,
      spawnRate: 0.18,
      speedScale: 1.1,
      opacityRange: [0.65, 0.9],
      sizeRange: [0.01, 0.024],
      color: '#3ddfff',
    },
    shake: { enabled: true, intensityPx: 0.6, speedMs: 120 },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Registry — add new machines here
// ────────────────────────────────────────────────────────────────────────────────
export const MACHINE_CARD_SLOTS: Partial<Record<string, MachineCardSlots>> = {
  [MachineType.CRUSHER]: CRUSHER_CARD_SLOTS,
  [MachineType.SEPARATOR]: SEPARATOR_CARD_SLOTS,
  [MachineType.SMELTER]: SMELTER_CARD_SLOTS,
  [MachineType.ASSEMBLER]: ASSEMBLER_CARD_SLOTS,
  [MachineType.PACKAGER]: PACKAGER_CARD_SLOTS,
  [MachineType.RECYCLER]: RECYCLER_CARD_SLOTS,
  [MachineType.ELECTRIC_ASSEMBLER]: ELECTRIC_ASSEMBLER_CARD_SLOTS,
  [MachineType.ELECTRIC_PACKAGER]: ELECTRIC_PACKAGER_CARD_SLOTS,
};

export const DEFAULT_CARD_SLOTS = CRUSHER_CARD_SLOTS;
