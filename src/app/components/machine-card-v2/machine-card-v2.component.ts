import {
  Component,
  Input,
  computed,
  signal,
  ViewEncapsulation,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Machine, MachineType } from '../../models/machine.model';
import { MachinesService } from '../../services/machines.service';
import { UpgradesService } from '../../services/upgrades.service';
import { MachineSelectionService } from '../../services/machine-selection.service';
import { MachineUnlockService } from '../../services/machine-unlock.service';
import { ResourcesService } from '../../services/resources.service';
import { TranslationService } from '../../services/translation.service';
import { INITIAL_RESOURCES } from '../../config/resources.config';
import { MACHINE_UPGRADE_CONFIG } from '../../config/game-balance.config';
import {
  MACHINE_CARD_SLOTS,
  DEFAULT_CARD_SLOTS,
  type MachineCardSlots,
  type ParticleEffectType,
} from '../../config/machine-card-slots.config';
import { DEV_CALIBRATION_ENABLED } from '../../config/dev-flags.config';
import { MachineCardCalibratorComponent } from '../machine-card-calibrator/machine-card-calibrator.component';

type CardState = 'producing' | 'stopped' | 'input' | 'output' | 'locked';

// Colors resolved at runtime from CSS custom properties so we stay in sync with the token system
function getCssToken(token: string): string {
  return typeof getComputedStyle !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    : '';
}

const STATE_COLORS: Record<
  CardState,
  { led: string | null; bar: string[] | null; pulse: boolean }
> = {
  producing: { led: '#66bb6a', bar: ['#2a7040', '#42a85a', '#70cc88'], pulse: true },
  stopped: { led: null, bar: null, pulse: false },
  input: { led: '#ffca28', bar: ['#806000', '#b89000', '#e0b800'], pulse: false },
  output: { led: '#ef5350', bar: ['#7a1010', '#c03030', '#ef5350'], pulse: false },
  locked: { led: null, bar: null, pulse: false },
};

const CARD_IMAGES: Partial<Record<string, string>> = {
  [MachineType.CRUSHER]: 'assets/cards/crusher_card_new_slot.png',
  [MachineType.SEPARATOR]: 'assets/cards/separator_card_new_slot.png',
  [MachineType.SMELTER]: 'assets/cards/smelter_card_new_slot.png',
  [MachineType.ASSEMBLER]: 'assets/cards/assembler_card_new_slot.png',
  [MachineType.PACKAGER]: 'assets/cards/packager_card_new_slot.png',
  [MachineType.RECYCLER]: 'assets/cards/recycler_card_new_slot.png',
  [MachineType.ELECTRIC_ASSEMBLER]: 'assets/cards/electric_assembler_card_new_slot.png',
  [MachineType.ELECTRIC_PACKAGER]: 'assets/cards/electric_packager_card_new_slot.png',
};

@Component({
  selector: 'app-machine-card-v2',
  standalone: true,
  imports: [MachineCardCalibratorComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="mc-v2"
      [attr.data-state]="cardState()"
      [class.mc-v2--producing]="isProducing()"
      [class.mc-v2--stopped]="isStopped()"
      [class.mc-v2--input]="isInputBlocked()"
      [class.mc-v2--output]="isOutputBlocked()"
      [class.mc-v2--locked]="isLocked()"
      [class.mc-v2--selected]="isSelected()"
      [style.--shake-i]="shakeIntensityVar()"
      [style.--shake-speed]="shakeSpeedVar()"
      role="button"
      tabindex="0"
      (click)="selectMachine()"
      (keydown.enter)="selectMachine()"
      (keydown.space)="selectMachine()"
    >
      <img
        #imgEl
        class="mc-v2__img"
        [attr.src]="imgSrc() || null"
        [style.filter]="imgFilter()"
        [style.aspect-ratio]="cardSlots().aspectRatio"
        (error)="onImgError()"
        alt=""
      />
      <canvas #canvasEl class="mc-v2__canvas"></canvas>

      <!-- Tutorial anchor for step 4: zero-visual-impact div positioned exactly over the canvas bar slot -->
      <div
        class="mc-v2__progress-anchor"
        [attr.data-tutorial-id]="machineProgressTutorialId"
        [style.top.%]="cardSlots().canvas.bar.y * 100"
        [style.left.%]="cardSlots().canvas.bar.x * 100"
        [style.width.%]="cardSlots().canvas.bar.w * 100"
        [style.height.%]="cardSlots().canvas.bar.h * 100"
      ></div>

      <!-- SLOT 5: nombre máquina -->
      <div
        class="mc-v2__s5"
        [style.top]="cardSlots().overlay.name.top"
        [style.left]="cardSlots().overlay.name.left"
        [style.width]="cardSlots().overlay.name.width"
        [style.height]="cardSlots().overlay.name.height"
      >
        <span class="mc-v2__mname">{{ translatedMachineName() }}</span>
      </div>

      @if (!isLocked()) {
        <!-- SLOT 2: LED toggle button -->
        <button
          class="mc-v2__led-btn"
          [attr.data-tutorial-id]="machineToggleTutorialId"
          [style.top]="cardSlots().overlay.led.top"
          [style.left]="cardSlots().overlay.led.left"
          [style.width]="cardSlots().overlay.led.width"
          [style.height]="cardSlots().overlay.led.height"
          [class.mc-v2__led-btn--active]="currentIsActive()"
          [disabled]="!!forceState"
          (click)="toggleMachine()"
          [title]="
            currentIsActive()
              ? translationService.t('buttons.parada')
              : translationService.t('buttons.activa')
          "
          [attr.aria-label]="
            currentIsActive()
              ? translationService.t('buttons.parada')
              : translationService.t('buttons.activa')
          "
        ></button>

        <!-- SLOT 1: nivel / nivel máximo / velocidad -->
        <div
          class="mc-v2__s1"
          [style.top]="cardSlots().overlay.level.top"
          [style.left]="cardSlots().overlay.level.left"
          [style.width]="cardSlots().overlay.level.width"
          [class.mc-v2__s1--dim]="isStopped()"
        >
          <span class="mc-v2__s1-lv"
            >{{ translationService.t('common.level_short') }}&nbsp;{{ currentLevel() }}</span
          >
          <span class="mc-v2__s1-sep">/</span>
          <span class="mc-v2__s1-cap">{{ maxMachineLevel }}</span>
          <span class="mc-v2__s1-cycle">⚡ {{ effectiveSpeed().toFixed(2) }}&nbsp;{{ translationService.t('common.cycles_per_second') }}</span>
        </div>

        <!-- SLOT 3: receta -->
        <div
          class="mc-v2__recipe"
          [style.bottom]="cardSlots().overlay.recipe.bottom"
          [style.left]="cardSlots().overlay.recipe.left"
          [style.width]="cardSlots().overlay.recipe.width"
          [style.height]="cardSlots().overlay.recipe.height"
          [style.opacity]="isStopped() ? '0.35' : '1'"
        >
          @for (input of effectiveInputs(); track $index; let last = $last) {
            <div class="mc-v2__ri" [style.opacity]="isInputBlocked() ? '0.3' : '1'">
              <img class="mc-v2__ico" [src]="getResourceIcon(input.resourceId)" alt="" />
              <span class="mc-v2__qty">×{{ input.amount }}</span>
            </div>
            @if (!last) {
              <span class="mc-v2__rsep" [style.opacity]="isInputBlocked() ? '0.3' : '1'">+</span>
            }
          }
          <span class="mc-v2__rarr">→</span>
          <div class="mc-v2__ri mc-v2__ri--out">
            <img
              class="mc-v2__ico"
              [src]="getResourceIcon(currentBaseProduction().resourceId)"
              alt=""
            />
            <span class="mc-v2__qty">×{{ effectiveOutput() }}</span>
          </div>
        </div>

        @if (isOutputBlocked()) {
          <div
            class="mc-v2__output-full"
            [style.bottom]="cardSlots().overlay.recipe.bottom"
            [style.left]="cardSlots().overlay.recipe.left"
            [style.width]="cardSlots().overlay.recipe.width"
            [style.height]="cardSlots().overlay.recipe.height"
          >
            {{ translationService.t('status.output_lleno') }}
          </div>
        }

        <!-- SLOT 4: area de barra (canvas dibuja la barra) -->
        <div class="mc-v2__status"></div>
      }

      @if (isLocked() && !isDemoLocked()) {
        <div class="mc-v2__locked">
          <div class="mc-v2__lock-icon">
            <img src="assets/icons/lock_icon.png" alt="" aria-hidden="true" />
          </div>
          <div class="mc-v2__lock-text">
            @for (line of unlockRequirementLines(); track $index) {
              <div class="mc-v2__req">
                <span
                  [class.mc-v2__req-icon--met]="line.met"
                  [class.mc-v2__req-icon--unmet]="!line.met"
                  >{{ line.icon }}</span
                >
                <span class="mc-v2__req-label">{{ line.text }}</span>
              </div>
            }
          </div>
          <div class="mc-v2__lock-badge">{{ translationService.t('status.bloqueada') }}</div>
        </div>
      }

      @if (devCalibEnabled) {
        <button
          class="mc-v2__calib-toggle"
          [class.mc-v2__calib-toggle--on]="calibrationMode()"
          (click)="toggleCalibration()"
          title="Toggle slot calibration tool"
        >
          ⚙
        </button>
        @if (calibrationMode()) {
          <app-machine-card-calibrator
            [slots]="cardSlots()"
            [machineId]="machine.id"
            (slotsChanged)="onCalibChange($event)"
          />
        }
      }
    </div>
  `,
  styles: [
    `
      /* ── Root card ─────────────────────────────── */
      .mc-v2 {
        position: relative;
        width: 100%;
        overflow: hidden;
        cursor: pointer;
        font-family: var(--font-mono);
        container-type: inline-size;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease;
      }

      .mc-v2--locked {
        cursor: default;
      }

      /* No border, outline or transform on selected — avoids all clipping artifacts
         with the overflow:hidden card-clip wrapper. Selection communicated
         purely via name glow + image brightness (GPU-only). */
      .mc-v2--selected .mc-v2__mname {
        color: #f0d060;
        text-shadow:
          0 1px 0 rgba(0, 0, 0, 1),
          0 -1px 0 rgba(0, 0, 0, 0.75),
          1px 0 0 rgba(0, 0, 0, 0.75),
          -1px 0 0 rgba(0, 0, 0, 0.75),
          0 2px 5px rgba(0, 0, 0, 0.95),
          0 0 18px rgba(220, 174, 92, 0.9);
        opacity: 1;
      }

      /* ── Card image ─────────────────────────────── */
      .mc-v2__img {
        display: block;
        width: 100%;
        height: auto;
        /* Standard card size: 420×630 px (2:3).
         Prevents container collapse to 0 height while image loads. */
        aspect-ratio: 420 / 630;
      }

      /* ── Canvas overlay ──────────────────────────── */
      .mc-v2__progress-anchor {
        position: absolute;
        pointer-events: none;
      }

      .mc-v2__canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      /* ── SLOT 5: nombre máquina ──────────────────── */
      .mc-v2__s5 {
        position: absolute;
        top: 14%;
        left: 1.5%;
        width: 70%;
        height: 11%;
        display: flex;
        align-items: center;
        pointer-events: none;
        padding: 0 8px;
      }
      .mc-v2__mname {
        font-size: 3.1cqw;
        font-weight: bold;
        color: #bf8c26;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.92;
        text-shadow:
          0 1px 0 rgba(0, 0, 0, 1),
          0 -1px 0 rgba(0, 0, 0, 0.75),
          1px 0 0 rgba(0, 0, 0, 0.75),
          -1px 0 0 rgba(0, 0, 0, 0.75),
          0 2px 5px rgba(0, 0, 0, 0.95),
          0 0 16px rgba(0, 0, 0, 0.7);
        line-height: 1;
        white-space: nowrap;
        font-family: var(--font-mono);
      }
      [data-state='stopped'] .mc-v2__mname {
        color: #887755;
      }
      [data-state='locked'] .mc-v2__mname {
        color: #554433;
      }

      /* ── SLOT 1: level / output / speed ──────────── */
      .mc-v2__s1 {
        position: absolute;
        top: 21.5%;
        left: 15.5%;
        width: 49.5%;
        height: 11%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0 10px;
        pointer-events: none;
        font-family: var(--font-mono);
      }
      .mc-v2__s1-lv {
        font-size: 2.6cqw;
        font-weight: bold;
        color: #bf8c26;
        letter-spacing: 0.1em;
        text-shadow:
          0 1px 0 rgba(0, 0, 0, 1),
          0 -1px 0 rgba(0, 0, 0, 0.7),
          1px 0 0 rgba(0, 0, 0, 0.7),
          -1px 0 0 rgba(0, 0, 0, 0.7),
          0 2px 4px rgba(0, 0, 0, 0.9);
      }
      .mc-v2__s1-sep {
        font-size: 2.5cqw;
        color: rgba(120, 90, 30, 1);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
      }
      .mc-v2__s1-cap {
        font-size: 2.5cqw;
        color: rgba(160, 120, 45, 1);
        letter-spacing: 0.04em;
        text-shadow:
          0 1px 0 rgba(0, 0, 0, 0.95),
          0 0 6px rgba(0, 0, 0, 0.8);
      }
      .mc-v2__s1-cycle {
        font-size: 2.5cqw;
        color: rgba(80, 175, 110, 0.88);
        letter-spacing: 0.05em;
        margin-left: auto;
        text-shadow:
          0 1px 0 rgba(0, 0, 0, 0.95),
          0 0 6px rgba(0, 0, 0, 0.8);
      }
      .mc-v2__s1--dim .mc-v2__s1-lv {
        color: #775533;
      }
      .mc-v2__s1--dim .mc-v2__s1-cap {
        color: rgba(80, 60, 30, 0.6);
      }
      .mc-v2__s1--dim .mc-v2__s1-cycle {
        color: rgba(50, 90, 60, 0.55);
      }

      /* ── SLOT 3: receta ──────────────────────────── */
      .mc-v2__recipe {
        position: absolute;
        bottom: 33%;
        left: 4.5%;
        width: 45.5%;
        height: 13%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 5px;
        pointer-events: none;
        overflow: hidden;
        font-family: var(--font-mono);
      }
      .mc-v2__ri {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .mc-v2__ico {
        width: 8cqw;
        height: 8cqw;
        object-fit: contain;
        display: block;
        image-rendering: pixelated;
      }
      .mc-v2__qty {
        position: absolute;
        bottom: 0.75cqw;
        right: 0cqw;
        font-size: 2cqw;
        font-weight: bold;
        color: rgba(220, 240, 255, 0.95);
        /* line-height: 1; */
        background: rgba(0, 0, 0, 0.7);
        padding: 0 0.4cqw;
        border-radius: 0.5cqw;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
      }
      .mc-v2__ri--out .mc-v2__qty {
        color: rgba(140, 255, 160, 0.95);
      }
      .mc-v2__output-full {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.2cqw;
        font-weight: 700;
        color: var(--color-state-warning, #f97316);
        background: rgba(0, 0, 0, 0.65);
        pointer-events: none;
        letter-spacing: 0.04em;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        z-index: 5;
        border-radius: 0.5cqw;
      }
      .mc-v2__rsep {
        font-size: 3.5cqw;
        color: rgba(180, 180, 180, 0.55);
        line-height: 1;
        flex-shrink: 0;
      }
      .mc-v2__rarr {
        font-size: 3.8cqw;
        color: rgba(255, 200, 80, 0.8);
        line-height: 1;
        flex-shrink: 0;
      }

      /* ── SLOT 2: LED toggle button ──────────────── */
      .mc-v2__led-btn {
        position: absolute;
        /* Centre on LED canvas slot: cx=81.1%, cy=26.9%, r≈7.3% of width */
        top: 26.9%;
        left: 81.1%;
        transform: translate(-50%, -50%);
        width: 17cqw;
        height: 17cqw;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 0;
        transition: box-shadow 0.15s ease;
        z-index: 10;
      }
      .mc-v2__led-btn:not(:disabled):hover {
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
      }
      .mc-v2__led-btn:not(:disabled):active {
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.45);
      }
      .mc-v2__led-btn:focus-visible {
        outline: 2px solid var(--color-accent-main);
        outline-offset: 3px;
      }
      .mc-v2__led-btn:disabled {
        cursor: default;
        pointer-events: none;
      }

      /* ── SLOT 4: area status ─────────────────────── */
      .mc-v2__status {
        position: absolute;
        bottom: 20%;
        left: 20%;
        right: 28.5%;
        height: 10%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 3px;
        pointer-events: none;
      }

      /* ── Locked overlay ──────────────────────────── */
      .mc-v2__locked {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-family: var(--font-mono);
      }
      .mc-v2__lock-icon {
        width: 24cqw;
        height: 24cqw;
      }
      .mc-v2__lock-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
      }
      .mc-v2__lock-text {
        font-size: 2.4cqw;
        letter-spacing: 0.08em;
        text-align: center;
        line-height: 1.7;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mc-v2__req {
        display: flex;
        gap: 0.4em;
        align-items: baseline;
      }
      .mc-v2__req-icon--met {
        color: var(--color-accent-positive);
        font-weight: 700;
      }
      .mc-v2__req-icon--unmet {
        color: var(--color-state-danger);
        font-weight: 700;
      }
      .mc-v2__req-label {
        color: var(--color-text-primary, #e0e0e0);
      }
      .mc-v2__lock-badge {
        font-size: 2.1cqw;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: 4px;
        border: 1px solid rgba(255, 152, 0, 0.3);
        background: rgba(255, 152, 0, 0.1);
        color: #ff9800;
      }

      /* ── Calibration toggle button ─────────────────────── */
      .mc-v2__calib-toggle {
        position: absolute;
        top: 4px;
        right: 4px;
        z-index: 200;
        background: rgba(12, 40, 12, 0.8);
        border: 1px solid #3c7c3c;
        color: #80b880;
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
        transition: background 0.15s;
        pointer-events: auto;
      }
      .mc-v2__calib-toggle:hover,
      .mc-v2__calib-toggle--on {
        background: rgba(24, 80, 24, 0.95);
        border-color: #5cbc5c;
        color: #a0dca0;
      }

      /* ── D: producing vibration — intensity/speed driven by CSS vars from per-machine config ── */
      @keyframes mc-v2-shake {
        0% {
          transform: translate(0px, 0px);
        }
        20% {
          transform: translate(var(--shake-i, 0.35px), calc(var(--shake-i, 0.35px) * -0.86));
        }
        40% {
          transform: translate(calc(var(--shake-i, 0.35px) * -0.86), var(--shake-i, 0.35px));
        }
        60% {
          transform: translate(
            calc(var(--shake-i, 0.35px) * 0.57),
            calc(var(--shake-i, 0.35px) * 0.86)
          );
        }
        80% {
          transform: translate(
            calc(var(--shake-i, 0.35px) * -1),
            calc(var(--shake-i, 0.35px) * -0.57)
          );
        }
        100% {
          transform: translate(0px, 0px);
        }
      }
      .mc-v2--producing {
        /* will-change: transform promotes to a GPU compositing layer — eliminates
           per-frame CPU repaint of outline/box-shadow during @keyframes translate.
           transition: none removes the 0.18s ease that fought the 0.13s shake cycle. */
        will-change: transform;
        transition: none;
        animation: mc-v2-shake var(--shake-speed, 0.13s) linear infinite;
      }
    `,
  ],
})
export class MachineCardV2Component implements AfterViewInit, OnDestroy {
  @Input() machine!: Machine;
  /** Force a specific display state regardless of actual machine state (for previews). */
  @Input() forceState: CardState | null = null;
  /** Force a specific progress 0–100 (used with forceState). -1 = use real progress. */
  @Input() forceProgress = -1;

  @ViewChild('canvasEl') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imgEl') private imgRef!: ElementRef<HTMLImageElement>;

  private rafId?: number;
  private animT = 0;
  private resizeObserver?: ResizeObserver;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    r: number;
    op: number;
  }> = [];

  private machinesService = inject(MachinesService);
  private upgradesService = inject(UpgradesService);
  private machineSelectionService = inject(MachineSelectionService);

  isSelected = computed(
    () => this.machineSelectionService.getSelectedMachineId() === this.machine.id,
  );
  private machineUnlockService = inject(MachineUnlockService);
  private resourcesService = inject(ResourcesService);
  translationService = inject(TranslationService);

  /* ── Reactive machine state ── */
  private currentMachine = computed(
    () => this.machinesService.getMachine(this.machine.id) || this.machine,
  );

  currentLevel = computed(() => {
    const upgradeId = this.upgradesService.getMachineUpgradeIdByMachineType(this.machine.id);
    return upgradeId ? this.upgradesService.getLevel(upgradeId) : this.currentMachine().level;
  });

  currentIsActive = computed(() => this.currentMachine().isActive);
  currentBaseProduction = computed(() => this.currentMachine().baseProduction);

  get machineToggleTutorialId(): string {
    return `machine-toggle-${this.machine.id}`;
  }
  get machineProgressTutorialId(): string {
    return `machine-progress-${this.machine.id}`;
  }

  progressPercent = computed(() =>
    this.forceProgress >= 0 ? this.forceProgress : Math.round(this.currentMachine().progress * 100),
  );

  unlockInfo = computed(() =>
    this.machineUnlockService.getUnlockInfo(this.machine.id as MachineType),
  );

  isDemoLocked = computed(() => this.unlockInfo().isDemoLocked ?? false);

  unlockRequirementLines = computed(() => {
    const info = this.unlockInfo();
    if (info.isUnlocked || info.requirements.length === 0) return [];
    return info.requirements.map((req) => {
      const name = this.translationService.t(`machines.${req.machineType}`);
      const lv = this.translationService.t('common.level_short');
      return {
        icon: req.isMet ? '✓' : '✗',
        text: `${name} ${lv} ${req.requiredLevel} (${req.currentLevel}/${req.requiredLevel})`,
        met: req.isMet,
      };
    });
  });

  productionMultiplier = computed(() =>
    this.upgradesService.calculateProductionMultiplier(this.machine.id),
  );
  consumptionMultiplier = computed(() =>
    this.upgradesService.calculateConsumptionMultiplier(this.machine.id),
  );

  effectiveSpeed = computed(() =>
    this.upgradesService.calculateEffectiveSpeed(this.currentMachine().baseSpeed, this.machine.id),
  );

  effectiveInputs = computed(() => {
    const mult = this.consumptionMultiplier();
    return this.currentMachine().baseConsumption.map((c) => ({
      resourceId: c.resourceId,
      amount: c.amount * mult,
    }));
  });

  effectiveOutput = computed(
    () => this.currentMachine().baseProduction.amount * this.productionMultiplier(),
  );

  private machineAvailability = computed(() => {
    const machine = this.currentMachine();
    const cMult = this.consumptionMultiplier();
    const pMult = this.productionMultiplier();
    const hasInputs = machine.baseConsumption.every((c) =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * cMult),
    );
    const outAmount = machine.baseProduction.amount * pMult;
    const space = this.resourcesService.getAvailableSpace(machine.baseProduction.resourceId);
    return { hasInputs, hasSpace: !isFinite(space) || space >= outAmount };
  });

  isProducing = computed(() => {
    if (this.forceState) return this.forceState === 'producing';
    const m = this.currentMachine();
    if (m.level === 0 || !m.isActive) return false;
    if (m.progress > 0) return true;
    const { hasInputs, hasSpace } = this.machineAvailability();
    return hasInputs && hasSpace;
  });

  isStopped = computed(() => {
    if (this.forceState) return this.forceState === 'stopped';
    const m = this.currentMachine();
    return m.level > 0 && !m.isActive;
  });
  isInputBlocked = computed(() => {
    if (this.forceState) return this.forceState === 'input';
    const m = this.currentMachine();
    if (m.level === 0 || !m.isActive || m.progress > 0) return false;
    return !this.machineAvailability().hasInputs;
  });
  isOutputBlocked = computed(() => {
    if (this.forceState) return this.forceState === 'output';
    const m = this.currentMachine();
    if (m.level === 0 || !m.isActive || m.progress > 0) return false;
    const { hasInputs, hasSpace } = this.machineAvailability();
    return hasInputs && !hasSpace;
  });

  isLocked = computed(() => {
    if (this.forceState) return this.forceState === 'locked';
    return this.currentMachine().level === 0;
  });

  cardState = computed((): CardState => {
    if (this.forceState) return this.forceState;
    if (this.isLocked()) return 'locked';
    if (this.isStopped()) return 'stopped';
    if (this.isInputBlocked()) return 'input';
    if (this.isOutputBlocked()) return 'output';
    return 'producing';
  });

  translatedMachineName = computed(() => this.translationService.t(`machines.${this.machine.id}`));

  cardImageSrc = computed(() => CARD_IMAGES[this.machine.id] ?? '');

  // ── Calibration dev tool ──────────────────────────────────────────────────
  /** Exposed to template — falsy value is tree-shaken in production builds */
  readonly devCalibEnabled = DEV_CALIBRATION_ENABLED;
  /** Whether the calibration panel is currently open */
  calibrationMode = signal(false);
  /** Live slot override set by the calibrator; null = use config registry */
  private _calibOverride = signal<MachineCardSlots | null>(null);

  /** Per-machine slot config — canvas positions + HTML overlay positions */
  cardSlots = computed(
    () =>
      this._calibOverride() ?? MACHINE_CARD_SLOTS[this.currentMachine().id] ?? DEFAULT_CARD_SLOTS,
  );

  /** CSS custom property value fed to --shake-i (intensity in px, or 0px when disabled) */
  shakeIntensityVar = computed(() => {
    const s = this.cardSlots().effects.shake;
    return s.enabled ? `${s.intensityPx ?? 0.35}px` : '0px';
  });
  /** CSS custom property value fed to --shake-speed (animation cycle duration) */
  shakeSpeedVar = computed(() => `${this.cardSlots().effects.shake.speedMs ?? 130}ms`);

  private _imgError = signal(false);
  imgSrc = computed(() => (this._imgError() ? '' : this.cardImageSrc()));
  onImgError() {
    this._imgError.set(true);
  }

  imgFilter = computed((): string => {
    switch (this.cardState()) {
      case 'stopped':
        return 'brightness(0.6) saturate(0.4)';
      case 'input':
        return 'brightness(0.7) sepia(0.2)';
      case 'output':
        return 'brightness(0.7) sepia(0.3) hue-rotate(-15deg)';
      case 'locked':
        return 'brightness(0.3) grayscale(0.9)';
      default:
        // Selected producing cards get a warm brightness boost — GPU composited, no repaint
        return this.isSelected() ? 'brightness(1.12) saturate(1.08)' : 'none';
    }
  });

  readonly maxMachineLevel = MACHINE_UPGRADE_CONFIG.MAX_LEVEL;

  getResourceIcon(resourceId: string): string {
    return INITIAL_RESOURCES.find((r) => r.id === resourceId)?.icon ?? '';
  }

  toggleMachine(): void {
    if (this.forceState || this.isLocked()) return;
    this.machinesService.setActive(this.machine.id, !this.currentIsActive());
  }

  selectMachine(): void {
    if (!this.isLocked()) {
      this.machineSelectionService.selectMachine(this.machine.id);
    }
  }

  toggleCalibration(): void {
    const next = !this.calibrationMode();
    this.calibrationMode.set(next);
    if (!next) this._calibOverride.set(null); // reset to config on close
  }

  onCalibChange(newSlots: MachineCardSlots): void {
    this._calibOverride.set(newSlots);
  }

  /* ── Canvas lifecycle ── */
  ngAfterViewInit(): void {
    const img = this.imgRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    const syncSize = () => {
      // Use naturalWidth/Height as fallback when offsetWidth/Height is 0 during layout
      // (mirrors the mockup's logic: offsetWidth || naturalWidth)
      const w = img.offsetWidth || img.naturalWidth;
      const h = img.offsetHeight || img.naturalHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    if (img.complete) {
      syncSize();
      // Fallback: if image was cached, offsetHeight may still be 0 on first microtask.
      // Run again after one frame to catch the post-layout dimensions.
      requestAnimationFrame(syncSize);
    } else {
      img.addEventListener('load', syncSize, { once: true });
      img.addEventListener('error', syncSize, { once: true });
    }

    this.resizeObserver = new ResizeObserver(syncSize);
    this.resizeObserver.observe(img);

    const loop = (ts: number) => {
      this.animT = ts * 0.001;
      this.drawCanvas(canvas);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
  }

  private drawCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const t = this.animT;
    const prog = this.progressPercent() / 100;
    const colors = STATE_COLORS[this.cardState()];
    const slots = this.cardSlots().canvas;

    ctx.clearRect(0, 0, W, H);

    /* ── LED ── */
    if (colors.led) {
      const lx = W * slots.led.cx;
      const ly = H * slots.led.cy;
      const lr = W * slots.led.r; // horizontal radius (pixels)
      const lry = H * (slots.led.ry ?? slots.led.r); // vertical radius (pixels)
      const pulse = colors.pulse ? 0.7 + 0.3 * Math.sin(t * 2.4) : 1;

      // Helper: draw ellipse path (falls back to circle when rx === ry)
      const ledPath = () => {
        ctx.beginPath();
        ctx.ellipse(lx, ly, lr * 0.44, lry * 0.44, 0, 0, Math.PI * 2);
      };

      ctx.save();
      ctx.shadowColor = colors.led;
      ctx.shadowBlur = lr * 3.5 * pulse;
      ledPath();
      ctx.fillStyle = colors.led;
      ctx.globalAlpha = 0.92 * pulse;
      ctx.fill();
      ctx.restore();

      const coreGrad = ctx.createRadialGradient(
        lx - lr * 0.1,
        ly - lry * 0.13,
        lr * 0.02,
        lx,
        ly,
        Math.max(lr, lry) * 0.44,
      );
      coreGrad.addColorStop(0, 'rgba(255,255,255,.7)');
      coreGrad.addColorStop(0.4, colors.led);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ledPath();
      ctx.fillStyle = coreGrad;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(lx - lr * 0.11, ly - lry * 0.15, lr * 0.11, lry * 0.11, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();
      ctx.restore();
    }

    /* ── Progress bar ── */
    // fullFactor = the effectiveProg at which the bar fills exactly to the PNG slot right wall.
    // 'output': machine.progress is always 0 in this state → force fullFactor (full bar visible).
    const state = this.cardState();
    const ff = slots.bar.fullFactor;
    const effectiveProg = state === 'output' ? ff : prog * ff;
    if (colors.bar && effectiveProg > 0) {
      const bx = W * slots.bar.x;
      const by = H * slots.bar.y;
      const bw = W * slots.bar.w;
      const bh = H * slots.bar.h;
      // maxFillW = the actual PNG slot right wall, bounded by fullFactor
      const maxFillW = bw * ff;
      const fillW = bw * effectiveProg;

      const pulse = state === 'producing' ? 0.82 + 0.18 * Math.sin(t * 2.4) : 1.0;

      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, maxFillW, bh); // clip to actual slot, not oversized bw
      ctx.clip();

      // Trough — warm very-dark tone so it blends with the card's metallic slot
      ctx.fillStyle = 'rgba(6,14,8,0.88)';
      ctx.fillRect(bx, by, maxFillW, bh);
      // Recessed look: inner top shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(bx, by, maxFillW, 2);
      // Recessed look: inner bottom ambient
      ctx.fillStyle = 'rgba(60,100,50,0.12)';
      ctx.fillRect(bx, by + bh - 1, maxFillW, 1);

      // Base fill — solid gradient top→bottom (stable, no movement)
      const baseGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
      baseGrad.addColorStop(0, colors.bar[2] + 'ee');
      baseGrad.addColorStop(0.5, colors.bar[1] + 'ff');
      baseGrad.addColorStop(1, colors.bar[0] + 'cc');

      ctx.save();
      ctx.shadowColor = colors.bar[2];
      ctx.shadowBlur = bh * 2.5 * pulse;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = baseGrad;
      ctx.fillRect(bx, by, fillW, bh);
      ctx.restore();

      // L→R sweep shimmer: a bright band that travels left to right across fillW and loops
      const sweepFrac = state === 'producing' ? (t * 0.7) % 1 : 0;
      const sweepX = bx + sweepFrac * fillW;
      const sweepWidth = Math.max(8, fillW * 0.18);
      const sweepGrad = ctx.createLinearGradient(
        sweepX - sweepWidth * 0.3,
        0,
        sweepX + sweepWidth,
        0,
      );
      sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
      sweepGrad.addColorStop(0.45, 'rgba(255,255,255,0.28)');
      sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(bx, by, fillW, bh);

      // Diagonal hatch marks (industrial) — scroll L→R to match sweep direction
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = '#000';
      const slashSpacing = bh * 1.6;
      const offset = (t * slashSpacing * 0.5) % slashSpacing;
      for (let sx = bx - slashSpacing + offset; sx < bx + fillW + bh; sx += slashSpacing) {
        ctx.beginPath();
        ctx.moveTo(sx + bh * 0.5, by);
        ctx.lineTo(sx - bh * 0.5, by + bh);
        ctx.lineTo(sx - bh * 0.5 + 2, by + bh);
        ctx.lineTo(sx + bh * 0.5 + 2, by);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Top edge highlight
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, by, fillW, 1);

      // Bottom edge shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx, by + bh - 1, fillW, 1);

      // Leading-edge bright gradient
      if (fillW > 4) {
        const edgeGrad = ctx.createLinearGradient(bx + fillW - 5, 0, bx + fillW, 0);
        edgeGrad.addColorStop(0, 'rgba(255,255,255,0)');
        edgeGrad.addColorStop(1, 'rgba(255,255,255,0.55)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(bx + fillW - 5, by, 5, bh);
      }

      // Track border inset lines — bounded to maxFillW (actual slot width)
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, by + 0.5);
      ctx.lineTo(bx + maxFillW, by + 0.5);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(bx, by + bh - 0.5);
      ctx.lineTo(bx + maxFillW, by + bh - 0.5);
      ctx.stroke();

      ctx.restore();
    }

    /* ── C: Bar track bevel — always rendered, metal groove effect ── */
    {
      const bbx = W * slots.bar.x;
      const bby = H * slots.bar.y;
      const bbh = H * slots.bar.h;
      const bbw = W * slots.bar.w * slots.bar.fullFactor;
      ctx.save();
      // Dark top + left cavity walls (in shadow)
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bbx + bbw, bby);
      ctx.lineTo(bbx, bby);
      ctx.lineTo(bbx, bby + bbh);
      ctx.stroke();
      // Warm-light bottom + right lip (ambient bounce off lower edge)
      ctx.strokeStyle = 'rgba(180,155,110,0.24)';
      ctx.beginPath();
      ctx.moveTo(bbx, bby + bbh);
      ctx.lineTo(bbx + bbw, bby + bbh);
      ctx.lineTo(bbx + bbw, bby);
      ctx.stroke();
      ctx.restore();
    }

    /* ── B: Particle effects (steam | electricity | sparks) ── */
    const pfx = this.cardSlots().effects.particles;
    const { zone } = pfx;
    const maxCount = pfx.maxCount ?? 12;
    const spawnRate = pfx.spawnRate ?? 0.1;
    const spd = pfx.speedScale ?? 1.0;
    const [opMin, opMax] = pfx.opacityRange ?? [0.55, 0.8];
    const [szMin, szMax] = pfx.sizeRange ?? [0.018, 0.036];
    const pType: ParticleEffectType = pfx.type;
    // Parse optional custom color → [r, g, b] tuple
    let pRgb: [number, number, number] | null = null;
    if (pfx.color) {
      const h = pfx.color.replace('#', '');
      pRgb = [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    // Type-specific physics constants
    const decayRate =
      pType === 'electricity'
        ? 0.075
        : pType === 'sparks'
          ? 0.045
          : pType === 'fire'
            ? 0.014
            : pType === 'plasma'
              ? 0.025
              : 0.018;
    const growRate = pType === 'electricity' ? 0 : pType === 'plasma' ? W * 0.00008 : W * 0.00035;
    const vyBase =
      pType === 'electricity'
        ? 0.00008
        : pType === 'fire'
          ? 0.0018
          : pType === 'plasma'
            ? 0.00025
            : 0.001;
    const vyRnd =
      pType === 'electricity'
        ? 0.00004
        : pType === 'fire'
          ? 0.001
          : pType === 'plasma'
            ? 0.0002
            : 0.0008;

    // Spawn
    if (
      state === 'producing' &&
      pType !== 'none' &&
      this.particles.length < maxCount &&
      Math.random() < spawnRate
    ) {
      this.particles.push({
        x: W * (zone.xMin + Math.random() * (zone.xMax - zone.xMin)),
        y: H * (zone.yMin + Math.random() * (zone.yMax - zone.yMin)),
        vx: (Math.random() - 0.5) * W * 0.0012 * spd,
        vy: -(H * (vyBase + Math.random() * vyRnd) * spd),
        life: 1,
        r: W * (szMin + Math.random() * (szMax - szMin)),
        op: opMin + Math.random() * (opMax - opMin),
      });
    }
    // Update + cull (fade out even after machine stops)
    this.particles = this.particles.filter((p) => {
      if (pType === 'fire') p.vx += (Math.random() - 0.5) * W * 0.00015; // flame turbulence
      if (pType === 'plasma') p.vx = p.vx * 0.97 + (Math.random() - 0.5) * W * 0.00012; // plasma drift
      p.x += p.vx;
      p.y += p.vy;
      p.r += growRate;
      p.life -= decayRate;
      if (pType === 'sparks') p.vy += H * 0.00008; // gravity
      return p.life > 0;
    });
    // Draw
    for (const p of this.particles) {
      const a = p.life * p.op;
      ctx.save();
      if (pType === 'electricity') {
        // Jagged electric arcs: bright core + randomised polyline arms
        const [er, eg, eb] = pRgb ?? [140, 220, 255];
        ctx.shadowColor = `rgba(${er},${eg},${eb},${a.toFixed(3)})`;
        ctx.shadowBlur = p.r * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, er + 100)},${Math.min(255, eg + 32)},${Math.min(255, eb + 0)},${(a * 0.95).toFixed(3)})`;
        ctx.fill();
        const armCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < armCount; i++) {
          const angle = ((Math.PI * 2) / armCount) * i + (Math.random() - 0.5) * 0.9;
          const len = p.r * (0.5 + Math.random() * 0.6);
          const midAng = angle + (Math.random() - 0.5) * 0.7;
          const midLen = len * (0.3 + Math.random() * 0.35);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(midAng) * midLen, p.y + Math.sin(midAng) * midLen);
          ctx.lineTo(p.x + Math.cos(angle) * len, p.y + Math.sin(angle) * len);
          ctx.strokeStyle = `rgba(${er},${eg},${eb},${(a * 0.7).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      } else if (pType === 'sparks') {
        // Hot flying sparks: bright dot with glow
        const [sr, sg, sb] = pRgb ?? [255, 180, 50];
        ctx.shadowColor = `rgba(${sr},${sg},${sb},${a.toFixed(3)})`;
        ctx.shadowBlur = p.r * 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.min(255, sr + 0)},${Math.min(255, sg + 40)},${Math.min(255, sb + 30)},${(a * 0.95).toFixed(3)})`;
        ctx.fill();
      } else if (pType === 'fire') {
        // Fire: turbulent rising flame — hot white-yellow core fading to red at the edge
        const [fr, fg, fb] = pRgb ?? [255, 80, 10];
        ctx.shadowColor = `rgba(${fr},${Math.min(255, fg + 80)},20,${a.toFixed(3)})`;
        ctx.shadowBlur = p.r * 4;
        const fireGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        fireGrad.addColorStop(0, `rgba(255,255,180,${(a * 0.95).toFixed(3)})`);
        fireGrad.addColorStop(
          0.2,
          `rgba(${fr},${Math.min(255, fg + 100)},20,${(a * 0.9).toFixed(3)})`,
        );
        fireGrad.addColorStop(
          0.55,
          `rgba(${fr},${Math.max(0, fg - 10)},0,${(a * 0.65).toFixed(3)})`,
        );
        fireGrad.addColorStop(1, `rgba(${fr},0,0,0)`);
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 'plasma') {
        // Plasma: glowing energy orb with probabilistic arc discharges
        const [pcR, pcG, pcB] = pRgb ?? [80, 200, 255];
        ctx.shadowColor = `rgba(${pcR},${pcG},${pcB},${a.toFixed(3)})`;
        ctx.shadowBlur = p.r * 6;
        const plasmaGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        plasmaGrad.addColorStop(0, `rgba(255,255,255,${(a * 0.9).toFixed(3)})`);
        plasmaGrad.addColorStop(
          0.25,
          `rgba(${Math.min(255, pcR + 80)},${pcG},${pcB},${(a * 0.8).toFixed(3)})`,
        );
        plasmaGrad.addColorStop(
          0.65,
          `rgba(${pcR},${Math.max(0, pcG - 40)},${pcB},${(a * 0.45).toFixed(3)})`,
        );
        plasmaGrad.addColorStop(1, `rgba(${Math.max(0, pcR - 30)},0,${pcB},0)`);
        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() < 0.35) {
          const ang = Math.random() * Math.PI * 2;
          const len = p.r * (0.7 + Math.random() * 0.9);
          const midX = p.x + Math.cos(ang + (Math.random() - 0.5) * 1.2) * len * 0.45;
          const midY = p.y + Math.sin(ang + (Math.random() - 0.5) * 1.2) * len * 0.45;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(midX, midY);
          ctx.lineTo(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len);
          ctx.strokeStyle = `rgba(${pcR},${pcG},${pcB},${(a * 0.65).toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      } else {
        // Steam: soft expanding radial gradient blob
        const [tr, tg, tb] = pRgb ?? [220, 230, 215];
        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        pg.addColorStop(
          0,
          `rgba(${Math.min(255, tr + 20)},${Math.min(255, tg + 15)},${Math.min(255, tb + 20)},${(a * 0.9).toFixed(3)})`,
        );
        pg.addColorStop(0.45, `rgba(${tr},${tg},${tb},${(a * 0.55).toFixed(3)})`);
        pg.addColorStop(
          1,
          `rgba(${Math.max(0, tr - 40)},${Math.max(0, tg - 30)},${Math.max(0, tb - 40)},0)`,
        );
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
