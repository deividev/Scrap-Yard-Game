/**
 * MachineCardCalibratorComponent
 *
 * Dev-only visual calibration overlay for machine card slots.
 * Renders draggable/resizable handles directly on top of the card image,
 * plus a fixed side panel with numeric inputs and effect parameters.
 *
 * Usage (in machine-card-v2 template, guarded by DEV_CALIBRATION_ENABLED):
 *   <app-machine-card-calibrator [slots]="cardSlots()" [machineId]="machine.id"
 *     (slotsChanged)="onCalibChange($event)" />
 *
 * The component fills its host absolutely (host has position:absolute;inset:0),
 * so it must be placed inside the relative-positioned card container.
 *
 * The side panel is position:fixed so it appears outside the card visually
 * without disrupting the card layout.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
  HostListener,
  ChangeDetectionStrategy,
  signal,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MachineCardSlots, ParticleEffectType } from '../../config/machine-card-slots.config';

// ── Internal types ────────────────────────────────────────────────────────────

/** A draggable/resizable box — ALL coordinates in [0–1] card-fraction space */
interface CHandle {
  id: string;
  label: string;
  border: string;
  bg: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Show the box as a circle (border-radius 50%) */
  isCircle?: boolean;
  /** Lock w === h during resize (keeps circles round) */
  keepSquare?: boolean;
}

type RCorner = 'body' | 'nw' | 'ne' | 'sw' | 'se';

interface DragState {
  id: string;
  corner: RCorner;
  cardW: number;
  cardH: number;
  sx: number;
  sy: number;
  orig: CHandle;
}

// ── Module-level helper ───────────────────────────────────────────────────────

/** Parse a CSS percentage string to a 0–1 fraction */
const pct = (s: string) => parseFloat(s) / 100;

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-machine-card-calibrator',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Host fills the card container absolutely; panel is teleported to body
  host: { style: 'position:absolute;inset:0;pointer-events:none;z-index:100' },
  template: `
    <!-- ── In-card drag handles ─────────────────────────────────────────── -->
    @for (h of _handles(); track h.id) {
      <div
        class="cc-handle"
        [class.cc-handle--circle]="h.isCircle"
        [style.left.%]="h.x * 100"
        [style.top.%]="h.y * 100"
        [style.width.%]="h.w * 100"
        [style.height.%]="h.h * 100"
        [style.border-color]="h.border"
        (mousedown)="onDown($event, h.id, 'body')"
      >
        <div class="cc-corner cc-nw" (mousedown)="onDown($event, h.id, 'nw')"></div>
        <div class="cc-corner cc-ne" (mousedown)="onDown($event, h.id, 'ne')"></div>
        <div class="cc-corner cc-sw" (mousedown)="onDown($event, h.id, 'sw')"></div>
        <div class="cc-corner cc-se" (mousedown)="onDown($event, h.id, 'se')"></div>
      </div>
    }

    <!-- ── Fixed side panel ──────────────────────────────────────────────── -->
    <div class="cc-panel" #panel>
      <div class="cc-panel-hdr">
        <span class="cc-panel-title">⚙ {{ machineId }}</span>
        <div class="cc-hdr-actions">
          @if (_isDirty()) {
            <span class="cc-dirty-badge">● sin guardar</span>
          }
          <button
            class="cc-save-btn"
            [class.cc-save-btn--dirty]="_isDirty()"
            [disabled]="!_isDirty()"
            (click)="saveNow()"
            title="Guardar cambios en machine-card-slots.config.ts"
          >
            💾 Guardar
          </button>
          <button
            class="cc-copy-btn"
            (click)="copyTs()"
            title="Copy config as TypeScript to clipboard"
          >
            📋 Copy TS
          </button>
        </div>
      </div>

      <div class="cc-panel-body">
        <!-- Position / size handles -->
        <div class="cc-section">Posición / Tamaño</div>
        @for (h of _handles(); track h.id) {
          <div class="cc-group">
            <div class="cc-group-lbl" [style.border-left-color]="h.border">{{ h.label }}</div>
            <div class="cc-fields">
              <label
                >x<input
                  type="number"
                  step="0.001"
                  [ngModel]="r4(h.x)"
                  (ngModelChange)="setField(h.id, 'x', $event)"
              /></label>
              <label
                >y<input
                  type="number"
                  step="0.001"
                  [ngModel]="r4(h.y)"
                  (ngModelChange)="setField(h.id, 'y', $event)"
              /></label>
              <label
                >w<input
                  type="number"
                  step="0.001"
                  [ngModel]="r4(h.w)"
                  (ngModelChange)="setField(h.id, 'w', $event)"
              /></label>
              <label
                >h<input
                  type="number"
                  step="0.001"
                  [ngModel]="r4(h.h)"
                  (ngModelChange)="setField(h.id, 'h', $event)"
              /></label>
            </div>
          </div>
        }

        <!-- Particles -->
        <div class="cc-section">Partículas</div>
        <div class="cc-group">
          <div class="cc-fields cc-fields--wrap">
            <label class="cc-wide"
              >tipo
              <select [(ngModel)]="pType" (ngModelChange)="emit()">
                <option value="steam">steam</option>
                <option value="electricity">electricity</option>
                <option value="sparks">sparks</option>
                <option value="fire">fire</option>
                <option value="plasma">plasma</option>
                <option value="none">none</option>
              </select>
            </label>
            <label
              >maxCount <input type="number" step="1" [(ngModel)]="pMax" (ngModelChange)="emit()"
            /></label>
            <label
              >spawnRate
              <input type="number" step="0.01" [(ngModel)]="pSpawn" (ngModelChange)="emit()"
            /></label>
            <label
              >speedScale
              <input type="number" step="0.05" [(ngModel)]="pSpeed" (ngModelChange)="emit()"
            /></label>
            <label
              >opMin <input type="number" step="0.01" [(ngModel)]="pOpMin" (ngModelChange)="emit()"
            /></label>
            <label
              >opMax <input type="number" step="0.01" [(ngModel)]="pOpMax" (ngModelChange)="emit()"
            /></label>
            <label
              >szMin
              <input type="number" step="0.001" [(ngModel)]="pSzMin" (ngModelChange)="emit()"
            /></label>
            <label
              >szMax
              <input type="number" step="0.001" [(ngModel)]="pSzMax" (ngModelChange)="emit()"
            /></label>
            <label class="cc-wide cc-color-row">
              <input type="checkbox" [(ngModel)]="pColorEnabled" (ngModelChange)="emit()" />
              color
              <input
                type="color"
                [(ngModel)]="pColor"
                (ngModelChange)="emit()"
                [disabled]="!pColorEnabled"
                class="cc-color-swatch"
              />
              <span class="cc-color-hex">{{ pColor }}</span>
            </label>
          </div>
        </div>

        <!-- Shake -->
        <div class="cc-section">Shake</div>
        <div class="cc-group">
          <div class="cc-fields cc-fields--wrap">
            <label
              >enabled <input type="checkbox" [(ngModel)]="shakeOn" (ngModelChange)="emit()"
            /></label>
            <label
              >intensityPx
              <input type="number" step="0.05" [(ngModel)]="shakeI" (ngModelChange)="emit()"
            /></label>
            <label
              >speedMs <input type="number" step="5" [(ngModel)]="shakeMs" (ngModelChange)="emit()"
            /></label>
          </div>
        </div>

        <!-- Bar: handle width = max-fill zone, fullFactor always 1.0 when saved -->
      </div>
    </div>
  `,
  styles: [
    `
      /* ── Handles ─────────────────────────────────────────────── */
      .cc-handle {
        position: absolute;
        border: 2px dashed;
        box-sizing: border-box;
        cursor: move;
        pointer-events: auto;
        user-select: none;
        min-width: 8px;
        min-height: 8px;
      }
      .cc-handle--circle {
        border-radius: 50%;
      }
      .cc-lbl {
        position: absolute;
        top: 2px;
        left: 3px;
        font:
          bold 9px/1 'Courier New',
          monospace;
        color: #fff;
        text-shadow:
          0 0 4px #000,
          0 0 8px #000;
        pointer-events: none;
        white-space: nowrap;
      }
      /* ── Resize corners ── */
      .cc-corner {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #fff;
        border: 1px solid #222;
        box-sizing: border-box;
        pointer-events: auto;
      }
      .cc-nw {
        top: -4px;
        left: -4px;
        cursor: nw-resize;
      }
      .cc-ne {
        top: -4px;
        right: -4px;
        cursor: ne-resize;
      }
      .cc-sw {
        bottom: -4px;
        left: -4px;
        cursor: sw-resize;
      }
      .cc-se {
        bottom: -4px;
        right: -4px;
        cursor: se-resize;
      }

      /* ── Fixed panel ─────────────────────────────────────────── */
      .cc-panel {
        position: fixed;
        top: 12px;
        right: 12px;
        width: 350px;
        max-height: calc(100vh - 68px);
        overflow-y: auto;
        background: rgba(8, 14, 9, 0.97);
        border: 1px solid #2c6e2c;
        border-radius: 6px;
        font:
          11px/1.5 'Courier New',
          monospace;
        color: #b0d8b0;
        pointer-events: auto;
        z-index: 9999;
        box-shadow: 0 6px 32px rgba(0, 0, 0, 0.88);
      }
      .cc-panel-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 12px;
        background: rgba(24, 54, 24, 0.97);
        border-bottom: 1px solid #2c6e2c;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      .cc-panel-title {
        font-weight: bold;
        font-size: 12px;
      }
      .cc-hdr-actions {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .cc-dirty-badge {
        font-size: 9px;
        color: #ffaa44;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .cc-save-btn {
        background: #1a3a1a;
        color: #5a8a5a;
        border: 1px solid #2c5c2c;
        border-radius: 3px;
        padding: 3px 10px;
        cursor: pointer;
        font:
          11px 'Courier New',
          monospace;
        opacity: 0.5;
      }
      .cc-save-btn--dirty {
        background: #1c4e1c;
        color: #88ff88;
        border-color: #4faf4f;
        opacity: 1;
        box-shadow: 0 0 6px rgba(80, 200, 80, 0.35);
      }
      .cc-save-btn--dirty:hover {
        background: #2c6e2c;
      }
      .cc-copy-btn {
        background: #1c4e1c;
        color: #88d088;
        border: 1px solid #3c8e3c;
        border-radius: 3px;
        padding: 3px 10px;
        cursor: pointer;
        font:
          11px 'Courier New',
          monospace;
      }
      .cc-copy-btn:hover {
        background: #2c6e2c;
      }

      .cc-panel-body {
        padding: 6px 12px 14px;
      }
      .cc-section {
        margin: 10px 0 5px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #4e9a4e;
      }
      .cc-group {
        margin-bottom: 7px;
      }
      .cc-group-lbl {
        font-size: 10px;
        font-weight: bold;
        border-left: 3px solid;
        padding-left: 5px;
        margin-bottom: 4px;
        color: #90c890;
      }
      .cc-hint {
        font-size: 9px;
        color: #4e7a4e;
        margin-top: 2px;
        line-height: 1.3;
      }
      .cc-fields {
        display: flex;
        gap: 4px;
        flex-wrap: nowrap;
        align-items: center;
      }
      .cc-fields--wrap {
        flex-wrap: wrap;
        row-gap: 5px;
      }
      label {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        color: #78a878;
        white-space: nowrap;
      }
      label.cc-wide {
        width: 100%;
      }
      label.cc-color-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
      }
      input[type='color'].cc-color-swatch {
        width: 28px;
        height: 18px;
        padding: 0;
        border: 1px solid #285828;
        border-radius: 2px;
        background: none;
        cursor: pointer;
      }
      input[type='color'].cc-color-swatch:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .cc-color-hex {
        font-size: 10px;
        color: #78c878;
        font-family: 'Courier New', monospace;
      }
      input[type='number'] {
        width: 56px;
        background: #080e09;
        color: #b8e8b8;
        border: 1px solid #285828;
        border-radius: 2px;
        padding: 1px 3px;
        font:
          11px 'Courier New',
          monospace;
      }
      select {
        background: #080e09;
        color: #b8e8b8;
        border: 1px solid #285828;
        border-radius: 2px;
        padding: 1px 4px;
        font:
          11px 'Courier New',
          monospace;
      }
      input[type='checkbox'] {
        width: auto;
        cursor: pointer;
      }
    `,
  ],
})
export class MachineCardCalibratorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) slots!: MachineCardSlots;
  @Input() machineId = '';
  @Output() slotsChanged = new EventEmitter<MachineCardSlots>();

  @ViewChild('panel') private _panelEl!: ElementRef<HTMLElement>;

  _handles = signal<CHandle[]>([]);

  // ── Particle panel fields ─────────────────────────────────────────────────
  pType: ParticleEffectType = 'steam';
  pMax = 12;
  pSpawn = 0.1;
  pSpeed = 1.0;
  pOpMin = 0.55;
  pOpMax = 0.8;
  pSzMin = 0.018;
  pSzMax = 0.036;
  pColor = '#ff9600';
  pColorEnabled = false;

  // ── Shake panel fields ────────────────────────────────────────────────────
  shakeOn = true;
  shakeI = 0.35;
  shakeMs = 130;

  // ── Bar extra ────────────────────────────────────────────────────────────
  barFullFactor = 0.65;

  private _drag: DragState | null = null;
  private readonly _el = inject(ElementRef<HTMLElement>);

  // ── Template helper ───────────────────────────────────────────────────────
  /** Round to 4 decimal places for display */
  r4 = (n: number) => +n.toFixed(4);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slots']) {
      this._handles.set(this._parse(this.slots));
      this._loadEffects(this.slots);
    }
  }

  // ── Parse slots → handles ─────────────────────────────────────────────────
  private _parse(s: MachineCardSlots): CHandle[] {
    const {
      overlay: ov,
      canvas: cv,
      effects: {
        particles: { zone: pz },
      },
    } = s;
    return [
      {
        id: 'ov.name',
        label: 'Name',
        border: '#ff6464',
        bg: 'rgba(255,100,100,0.18)',
        x: pct(ov.name.left),
        y: pct(ov.name.top),
        w: pct(ov.name.width),
        h: pct(ov.name.height),
      },
      {
        id: 'ov.level',
        label: 'Level',
        border: '#6495ff',
        bg: 'rgba(100,149,255,0.18)',
        x: pct(ov.level.left),
        y: pct(ov.level.top),
        w: pct(ov.level.width),
        h: 0.045, // level has no height in config
      },
      {
        id: 'ov.recipe',
        label: 'Recipe',
        border: '#64dc64',
        bg: 'rgba(100,220,100,0.18)',
        x: pct(ov.recipe.left),
        y: 1 - pct(ov.recipe.bottom) - pct(ov.recipe.height),
        w: pct(ov.recipe.width),
        h: pct(ov.recipe.height),
      },
      {
        // LED overlay — centred via CSS transform:translate(-50%,-50%); w/h stored in config
        id: 'ov.led',
        label: 'LED-btn',
        border: '#ffdc00',
        bg: 'rgba(255,220,0,0.28)',
        x: pct(ov.led.left) - (ov.led.width ? pct(ov.led.width) : 0.17) / 2,
        y: pct(ov.led.top) - (ov.led.height ? pct(ov.led.height) : 0.17) / 2,
        w: ov.led.width ? pct(ov.led.width) : 0.17,
        h: ov.led.height ? pct(ov.led.height) : 0.17,
        isCircle: true,
      },
      {
        id: 'cv.led',
        label: 'LED-dot',
        border: '#ff9600',
        bg: 'rgba(255,150,0,0.22)',
        x: cv.led.cx - cv.led.r,
        y: cv.led.cy - (cv.led.ry ?? cv.led.r),
        w: cv.led.r * 2,
        h: (cv.led.ry ?? cv.led.r) * 2,
        isCircle: true,
      },
      {
        id: 'cv.bar',
        label: 'Bar',
        border: '#00dcdc',
        bg: 'rgba(0,220,220,0.14)',
        // w represents the actual max-fill zone (bar.w * fullFactor)
        // so the handle aligns exactly with the bar at 100% progress
        x: cv.bar.x,
        y: cv.bar.y,
        w: cv.bar.w * cv.bar.fullFactor,
        h: cv.bar.h,
      },
      {
        id: 'pfx.zone',
        label: 'Particles',
        border: '#c864ff',
        bg: 'rgba(180,100,255,0.16)',
        x: pz.xMin,
        y: pz.yMin,
        w: pz.xMax - pz.xMin,
        h: pz.yMax - pz.yMin,
      },
    ];
  }

  // ── Load effect params into panel inputs ──────────────────────────────────
  private _loadEffects(s: MachineCardSlots): void {
    const p = s.effects.particles;
    this.pType = p.type;
    this.pMax = p.maxCount ?? 12;
    this.pSpawn = p.spawnRate ?? 0.1;
    this.pSpeed = p.speedScale ?? 1.0;
    [this.pOpMin, this.pOpMax] = p.opacityRange ?? [0.55, 0.8];
    [this.pSzMin, this.pSzMax] = p.sizeRange ?? [0.018, 0.036];
    this.pColorEnabled = !!p.color;
    this.pColor = p.color ?? '#ff9600';
    const sh = s.effects.shake;
    this.shakeOn = sh.enabled;
    this.shakeI = sh.intensityPx ?? 0.35;
    this.shakeMs = sh.speedMs ?? 130;
    this.barFullFactor = s.canvas.bar.fullFactor;
  }

  // ── Mouse drag ────────────────────────────────────────────────────────────
  onDown(e: MouseEvent, id: string, corner: RCorner): void {
    e.preventDefault();
    e.stopPropagation();
    const rect = this._el.nativeElement.getBoundingClientRect();
    const orig = this._handles().find((h) => h.id === id)!;
    this._drag = {
      id,
      corner,
      cardW: rect.width,
      cardH: rect.height,
      sx: e.clientX,
      sy: e.clientY,
      orig: { ...orig },
    };
  }

  @HostListener('document:mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    if (!this._drag) return;
    const { id, corner, cardW, cardH, sx, sy, orig } = this._drag;
    const dx = (e.clientX - sx) / cardW;
    const dy = (e.clientY - sy) / cardH;
    const list = this._handles().map((h) =>
      h.id === id ? this._apply({ ...orig }, corner, dx, dy) : h,
    );
    this._handles.set(list);
    this._emitFromHandles(list);
  }

  @HostListener('document:mouseup')
  onUp(): void {
    this._drag = null;
  }

  private _apply(h: CHandle, corner: RCorner, dx: number, dy: number): CHandle {
    if (corner === 'body') {
      h.x += dx;
      h.y += dy;
      return h;
    }
    if (corner.includes('w')) {
      h.x += dx;
      h.w -= dx;
    }
    if (corner.includes('e')) {
      h.w += dx;
    }
    if (corner.includes('n')) {
      h.y += dy;
      h.h -= dy;
    }
    if (corner.includes('s')) {
      h.h += dy;
    }
    if (h.keepSquare) {
      const s = Math.max(Math.abs(h.w), Math.abs(h.h));
      h.w = s;
      h.h = s;
    }
    h.w = Math.max(0.005, h.w);
    h.h = Math.max(0.005, h.h);
    return h;
  }

  // ── Panel input changes ───────────────────────────────────────────────────
  setField(id: string, field: 'x' | 'y' | 'w' | 'h', value: number): void {
    const list = this._handles().map((h) => (h.id === id ? { ...h, [field]: +value } : h));
    this._handles.set(list);
    this._emitFromHandles(list);
  }

  emit(): void {
    this._emitFromHandles(this._handles());
  }

  // ── Build + emit new MachineCardSlots ─────────────────────────────────────
  private _emitFromHandles(hs: CHandle[]): void {
    const newSlots = this._build(hs);
    this._pendingSlots = newSlots;
    this._isDirty.set(true);
    this.slotsChanged.emit(newSlots); // live UI update — no file write yet
  }

  private _build(hs: CHandle[]): MachineCardSlots {
    const g = (id: string) => hs.find((h) => h.id === id)!;
    const r3 = (n: number) => +n.toFixed(3);
    const p1 = (n: number) => `${+(n * 100).toFixed(1)}%`;

    const name = g('ov.name');
    const level = g('ov.level');
    const recipe = g('ov.recipe');
    const ledBtn = g('ov.led');
    const ledDot = g('cv.led');
    const bar = g('cv.bar');
    const pzone = g('pfx.zone');

    // Write overlay.led width/height only when explicitly set or meaningfully non-default.
    const ledSized =
      !!this.slots.overlay.led.width ||
      Math.abs(ledBtn.w - 0.17) > 0.004 ||
      Math.abs(ledBtn.h - 0.17) > 0.004;

    return {
      ...this.slots,
      canvas: {
        led: {
          cx: r3(ledDot.x + ledDot.w / 2),
          cy: r3(ledDot.y + ledDot.h / 2),
          r: r3(ledDot.w / 2),
          ...(Math.abs(ledDot.w - ledDot.h) > 0.005 ? { ry: r3(ledDot.h / 2) } : {}),
        },
        bar: {
          ...this.slots.canvas.bar,
          x: r3(bar.x),
          y: r3(bar.y),
          w: r3(bar.w),
          h: r3(bar.h),
          fullFactor: 1.0, // handle width IS the max-fill width
        },
      },
      overlay: {
        name: { top: p1(name.y), left: p1(name.x), width: p1(name.w), height: p1(name.h) },
        level: { top: p1(level.y), left: p1(level.x), width: p1(level.w) },
        led: {
          top: p1(ledBtn.y + ledBtn.h / 2),
          left: p1(ledBtn.x + ledBtn.w / 2),
          ...(ledSized ? { width: p1(ledBtn.w), height: p1(ledBtn.h) } : {}),
        },
        recipe: {
          bottom: p1(1 - recipe.y - recipe.h),
          left: p1(recipe.x),
          width: p1(recipe.w),
          height: p1(recipe.h),
        },
      },
      effects: {
        particles: {
          ...this.slots.effects.particles,
          type: this.pType,
          zone: {
            xMin: r3(pzone.x),
            xMax: r3(pzone.x + pzone.w),
            yMin: r3(pzone.y),
            yMax: r3(pzone.y + pzone.h),
          },
          maxCount: this.pMax,
          spawnRate: this.pSpawn,
          speedScale: this.pSpeed,
          opacityRange: [this.pOpMin, this.pOpMax],
          sizeRange: [this.pSzMin, this.pSzMax],
          ...(this.pColorEnabled ? { color: this.pColor } : {}),
        },
        shake: {
          enabled: this.shakeOn,
          intensityPx: this.shakeI,
          speedMs: this.shakeMs,
        },
      },
    };
  }

  // ── Manual save to config file via calib-server ──────────────────────────
  _isDirty = signal(false);
  private _pendingSlots: MachineCardSlots | null = null;

  saveNow(): void {
    // Use last emitted slots (after a drag), or build from current handles if no drag yet.
    const slots = this._pendingSlots ?? this._build(this._handles());
    fetch('/api/calib', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: this.machineId, slots }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          this._isDirty.set(false);
          console.log(`[calib] ✓ ${d.constName} guardado en disco`);
        } else {
          console.warn('[calib] Server error:', d.error);
        }
      })
      .catch(() => console.warn('[calib] calib-server no disponible — lanza npm run start:calib'));
  }

  // ── Panel portal: move panel node to document.body so position:fixed     ──
  // ── is relative to the viewport even when the card has CSS transforms    ──
  ngAfterViewInit(): void {
    document.body.appendChild(this._panelEl.nativeElement);
  }

  ngOnDestroy(): void {
    this._panelEl?.nativeElement?.remove();
  }

  // ── Copy TypeScript config block to clipboard ─────────────────────────────
  copyTs(): void {
    const hs = this._handles();
    const g = (id: string) => hs.find((h) => h.id === id)!;
    const r3 = (n: number) => +n.toFixed(3);
    const fp = (n: number) => `'${+(n * 100).toFixed(1)}%'`;

    const name = g('ov.name');
    const level = g('ov.level');
    const recipe = g('ov.recipe');
    const ledBtn = g('ov.led');
    const ledDot = g('cv.led');
    const bar = g('cv.bar');
    const pzone = g('pfx.zone');

    const ledCx = r3(ledDot.x + ledDot.w / 2);
    const ledCy = r3(ledDot.y + ledDot.h / 2);
    const ledR = r3(ledDot.w / 2);
    const recipeBottom = r3(1 - recipe.y - recipe.h);
    const ledSized =
      !!this.slots.overlay.led.width ||
      Math.abs(ledBtn.w - 0.17) > 0.004 ||
      Math.abs(ledBtn.h - 0.17) > 0.004;

    const ts = [
      `  canvas: {`,
      `    led: { cx: ${ledCx}, cy: ${ledCy}, r: ${ledR}${Math.abs(ledDot.w - ledDot.h) > 0.005 ? `, ry: ${r3(ledDot.h / 2)}` : ''} },`,
      `    bar: { x: ${r3(bar.x)}, y: ${r3(bar.y)}, w: ${r3(bar.w)}, h: ${r3(bar.h)}, fullFactor: 1.0 },`,
      `  },`,
      `  overlay: {`,
      `    name:   { top: ${fp(name.y)},   left: ${fp(name.x)},   width: ${fp(name.w)},   height: ${fp(name.h)} },`,
      `    level:  { top: ${fp(level.y)},  left: ${fp(level.x)},  width: ${fp(level.w)} },`,
      `    led:    { top: ${fp(ledBtn.y + ledBtn.h / 2)}, left: ${fp(ledBtn.x + ledBtn.w / 2)}${ledSized ? `, width: ${fp(ledBtn.w)}, height: ${fp(ledBtn.h)}` : ''} },`,
      `    recipe: { bottom: ${fp(recipeBottom)}, left: ${fp(recipe.x)}, width: ${fp(recipe.w)}, height: ${fp(recipe.h)} },`,
      `  },`,
      `  effects: {`,
      `    particles: {`,
      `      type:         '${this.pType}',`,
      `      zone:         { xMin: ${r3(pzone.x)}, xMax: ${r3(pzone.x + pzone.w)}, yMin: ${r3(pzone.y)}, yMax: ${r3(pzone.y + pzone.h)} },`,
      `      maxCount:     ${this.pMax},`,
      `      spawnRate:    ${this.pSpawn},`,
      `      speedScale:   ${this.pSpeed},`,
      `      opacityRange: [${this.pOpMin}, ${this.pOpMax}],`,
      `      sizeRange:    [${this.pSzMin}, ${this.pSzMax}],`,
      ...(this.pColorEnabled ? [`      color:        '${this.pColor}',`] : []),
      `    },`,
      `    shake: { enabled: ${this.shakeOn}, intensityPx: ${this.shakeI}, speedMs: ${this.shakeMs} },`,
      `  },`,
    ].join('\n');

    navigator.clipboard
      .writeText(ts)
      .then(() => console.log('[CalibTool] Config copied to clipboard ✓'));
  }
}
