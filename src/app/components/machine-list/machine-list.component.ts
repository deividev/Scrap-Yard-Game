import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachinesService } from '../../services/machines.service';
import { ResourcesService } from '../../services/resources.service';
import { UpgradesService } from '../../services/upgrades.service';
import { MachineCardV2Component } from '../machine-card-v2/machine-card-v2.component';
import { Machine, MachineType } from '../../models/machine.model';
import { TranslationService } from '../../services/translation.service';
// import { DemoService } from '../../services/demo.service';

@Component({
  selector: 'app-machine-list',
  standalone: true,
  imports: [CommonModule, MachineCardV2Component],
  styleUrls: ['./machine-list.component.css'],
  template: `
    <div class="factory-view">

      <!-- ── ZONE SELECTOR ── -->
      <div class="zone-nav">
        @for (tier of tieredMachines(); track tier.labelKey; let i = $index) {
          <button
            class="zone-btn"
            [class.zone-btn--active]="selectedZone() === i"
            [attr.data-zone]="i"
            (click)="selectedZone.set(i)"
          >
            <span class="zone-btn__rivets">
              <span class="rv rv--tl"></span>
              <span class="rv rv--tr"></span>
              <span class="rv rv--bl"></span>
              <span class="rv rv--br"></span>
            </span>
            <div class="zone-btn__led-col">
              <span class="zone-led" [class.zone-led--on]="tier.activeCount > 0"></span>
            </div>
            <div class="zone-btn__body">
              <span class="zone-btn__id">Z-0{{ i + 1 }}</span>
              <span class="zone-btn__name">{{ translationService.t(tier.labelKey) }}</span>
              <div class="zone-btn__pips">
                @for (m of tier.machines; track m.id) {
                  <span class="pip" [attr.data-pip]="getMachineState(m)"></span>
                }
              </div>
            </div>
            <div class="zone-btn__stat">
              <span class="zone-btn__count">{{ tier.activeCount }}/{{ tier.machines.length }}</span>
              <span class="zone-btn__count-label">ACTIVAS</span>
            </div>
            <div class="zone-btn__bar"></div>
          </button>
        }
      </div>

      <!-- ── MACHINES PANEL ── -->
      @for (tier of tieredMachines(); track tier.labelKey; let i = $index) {
        @if (selectedZone() === i) {
          <div class="zone-panel" [attr.data-zone]="i">
            <div class="panel-overlay"></div>
            <div class="machines-container">
              @for (machine of tier.machines; track machine.id) {
                <div class="card-clip" [class.card-clip--tall]="isTallMachine(machine.id)">
                  <app-machine-card-v2 [machine]="machine" />
                </div>
              }
            </div>
          </div>
        }
      }

    </div>
  `,

  styles: [`
    /* ── ROOT ── */
    .factory-view {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ── ZONE NAV ── */
    .zone-nav {
      display: flex;
      gap: 4px;
      padding: 8px 8px 0;
      flex-shrink: 0;
    }

    .zone-btn {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px 9px 10px;
      background: linear-gradient(180deg, #111009 0%, #0a0805 100%);
      border: 1px solid rgba(70, 40, 8, 0.8);
      border-bottom: none;
      cursor: pointer;
      text-align: left;
      clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%);
      transition: background 0.14s;
      overflow: visible;
    }

    .zone-btn:hover:not([disabled]) {
      background: linear-gradient(180deg, #1a140a 0%, #110d06 100%);
    }

    .zone-btn--locked {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    .zone-btn--active[data-zone="0"] {
      background: linear-gradient(180deg, #211508 0%, #180f05 100%);
      border-color: rgba(200, 120, 28, 0.9);
      box-shadow: 0 -2px 12px rgba(200, 110, 20, 0.2), inset 0 1px 0 rgba(255, 190, 70, 0.08);
    }
    .zone-btn--active[data-zone="1"] {
      background: linear-gradient(180deg, #091422 0%, #060d18 100%);
      border-color: rgba(59, 130, 246, 0.85);
      box-shadow: 0 -2px 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(100, 180, 255, 0.08);
    }
    .zone-btn--active[data-zone="2"] {
      background: linear-gradient(180deg, #041618 0%, #030e10 100%);
      border-color: rgba(6, 182, 212, 0.85);
      box-shadow: 0 -2px 12px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(0, 220, 240, 0.08);
    }

    .zone-btn__bar {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 2px;
    }
    .zone-btn--active[data-zone="0"] .zone-btn__bar {
      background: linear-gradient(90deg, transparent, rgba(220, 140, 35, 0.9) 50%, transparent);
    }
    .zone-btn--active[data-zone="1"] .zone-btn__bar {
      background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.9) 50%, transparent);
    }
    .zone-btn--active[data-zone="2"] .zone-btn__bar {
      background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.9) 50%, transparent);
    }

    /* Rivets */
    .zone-btn__rivets { position: absolute; inset: 0; pointer-events: none; }
    .rv {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #6a4418, #1e0e04);
      border: 1px solid rgba(50, 28, 6, 0.8);
    }
    .rv--tl { top: 3px;    left: 3px;  }
    .rv--tr { top: 3px;    right: 3px; }
    .rv--bl { bottom: 3px; left: 3px;  }
    .rv--br { bottom: 3px; right: 3px; }

    /* LED */
    .zone-btn__led-col { flex-shrink: 0; }
    .zone-led {
      display: block;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: rgba(30, 18, 4, 0.9);
      border: 1px solid rgba(50, 28, 6, 0.8);
    }
    .zone-led--on {
      background: #22c55e;
      border-color: #16a34a;
      box-shadow: 0 0 6px #22c55e, 0 0 12px rgba(34, 197, 94, 0.35);
      animation: led-pulse 2.2s ease-in-out infinite;
    }
    @keyframes led-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    /* Zone info */
    .zone-btn__body { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }

    .zone-btn__id {
      font-family: var(--font-mono);
      font-size: 6.5px;
      letter-spacing: 0.18em;
      color: rgba(80, 48, 10, 0.85);
    }
    .zone-btn--active[data-zone="0"] .zone-btn__id { color: rgba(180, 110, 28, 0.9); }
    .zone-btn--active[data-zone="1"] .zone-btn__id { color: rgba(100, 160, 240, 0.9); }
    .zone-btn--active[data-zone="2"] .zone-btn__id { color: rgba(6, 182, 212, 0.9); }

    .zone-btn__name {
      font-family: var(--font-mono);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(160, 110, 30, 0.85);
    }
    .zone-btn--active[data-zone="0"] .zone-btn__name { color: rgba(255, 195, 65, 1);   text-shadow: 0 0 10px rgba(220, 150, 30, 0.45); }
    .zone-btn--active[data-zone="1"] .zone-btn__name { color: rgba(147, 197, 253, 1);  text-shadow: 0 0 10px rgba(59, 130, 246, 0.45); }
    .zone-btn--active[data-zone="2"] .zone-btn__name { color: rgba(103, 232, 249, 1);  text-shadow: 0 0 10px rgba(6, 182, 212, 0.45); }

    /* Stats */
    .zone-btn__stat { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .zone-btn__count {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      color: rgba(120, 72, 16, 0.8);
    }
    .zone-btn--active[data-zone="0"] .zone-btn__count { color: rgba(220, 150, 40, 0.95); }
    .zone-btn--active[data-zone="1"] .zone-btn__count { color: rgba(147, 197, 253, 0.95); }
    .zone-btn--active[data-zone="2"] .zone-btn__count { color: rgba(103, 232, 249, 0.95); }

    .zone-btn__count-label {
      font-family: var(--font-mono);
      font-size: 5.5px;
      letter-spacing: 0.1em;
      color: rgba(80, 48, 10, 0.65);
    }

    /* Pips */
    .zone-btn__pips {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-top: 4px;
      max-width: 96px;
    }
    .pip {
      display: block;
      width: 8px; height: 8px;
      border-radius: 50%;
    }
    /* locked / stopped */
    .pip[data-pip="locked"]  { background: rgba(40,24,6,0.8);  border: 1px solid rgba(60,36,8,0.5); }
    .pip[data-pip="stopped"] { background: rgba(80,70,60,0.7); border: 1px solid rgba(100,85,70,0.5); }
    /* producing — green */
    .pip[data-pip="producing"] {
      background: #22c55e;
      border: 1px solid #16a34a;
      box-shadow: 0 0 6px rgba(34,197,94,0.85);
    }
    /* input blocked — amber */
    .pip[data-pip="input"] {
      background: #f59e0b;
      border: 1px solid #d97706;
      box-shadow: 0 0 6px rgba(245,158,11,0.85);
    }
    /* output full — red */
    .pip[data-pip="output"] {
      background: #ef4444;
      border: 1px solid #dc2626;
      box-shadow: 0 0 6px rgba(239,68,68,0.85);
    }

    /* ── ZONE PANEL ── */
    .zone-panel {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 14px 10px 16px;
      border-top: 2px solid rgba(70, 40, 8, 0.5);
      position: relative;
      animation: zone-in 0.2s ease-out both;
    }
    @keyframes zone-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .zone-panel[data-zone="0"] {
      border-top-color: rgba(200, 120, 28, 0.7);
      background:
        linear-gradient(180deg, rgba(30, 16, 4, 0.55) 0%, rgba(0,0,0,0.4) 100%),
        url('/assets/image/factory_floor.png') repeat;
      background-size: auto, 220px 220px;
    }
    .zone-panel[data-zone="1"] {
      border-top-color: rgba(59, 130, 246, 0.7);
      background:
        linear-gradient(180deg, rgba(4, 14, 30, 0.55) 0%, rgba(0,0,0,0.4) 100%),
        url('/assets/image/factory_floor.png') repeat;
      background-size: auto, 220px 220px;
    }
    .zone-panel[data-zone="2"] {
      border-top-color: rgba(6, 182, 212, 0.7);
      background:
        linear-gradient(180deg, rgba(2, 18, 22, 0.55) 0%, rgba(0,0,0,0.4) 100%),
        url('/assets/image/factory_floor.png') repeat;
      background-size: auto, 220px 220px;
    }

    /* ── MACHINES GRID ── */
    .machines-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
    }

    .panel-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0, 0, 0, 0.07) 3px,
        rgba(0, 0, 0, 0.07) 4px
      );
      z-index: 1;
    }

    .card-clip {
      width: calc(25% - 12px);
      aspect-ratio: 420 / 530;
      overflow: hidden;
      position: relative;
    }
    .card-clip app-machine-card-v2 {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: block;
    }
    .card-clip ::ng-deep .mc-v2 { height: 100% !important; }
    .card-clip ::ng-deep .mc-v2__img {
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: unset !important;
      object-fit: cover !important;
      object-position: top center !important;
    }
    .card-clip--tall ::ng-deep .mc-v2__img {
      object-position: center center !important;
    }
  `],
})
export class MachineListComponent {
  private machinesService = inject(MachinesService);
  private resourcesService = inject(ResourcesService);
  private upgradesService = inject(UpgradesService);
  readonly translationService = inject(TranslationService);

  selectedZone = signal(0);

  getMachineState(m: Machine): 'producing' | 'input' | 'output' | 'stopped' | 'locked' {
    if (m.level === 0) return 'locked';
    if (!m.isActive) return 'stopped';
    if (m.progress > 0) return 'producing';
    const cMult = this.upgradesService.calculateConsumptionMultiplier(m.id);
    const pMult = this.upgradesService.calculateProductionMultiplier(m.id);
    const hasInputs = m.baseConsumption.every(c =>
      this.resourcesService.hasEnough(c.resourceId, c.amount * cMult)
    );
    const space = this.resourcesService.getAvailableSpace(m.baseProduction.resourceId);
    const hasSpace = !isFinite(space) || space >= m.baseProduction.amount * pMult;
    if (!hasInputs) return 'input';
    if (!hasSpace) return 'output';
    return 'producing';
  }

  readonly tallMachines = new Set([MachineType.PACKAGER, MachineType.ELECTRIC_PACKAGER, MachineType.SMARTPHONE_FACTORY, MachineType.DATA_CENTER_ASSEMBLY]);

  isTallMachine(id: string): boolean {
    return this.tallMachines.has(id as MachineType);
  }

  private machineTiers = [
    { labelKey: 'machines.tiers.linea_base', types: [
      MachineType.CRUSHER, MachineType.SEPARATOR, MachineType.ASSEMBLER,
      MachineType.PACKAGER, MachineType.SMELTER, MachineType.RECYCLER,
      MachineType.ELECTRIC_ASSEMBLER, MachineType.ELECTRIC_PACKAGER,
    ]},
    { labelKey: 'machines.tiers.electronica', types: [
      MachineType.PCB_PRINTER, MachineType.HDD_ASSEMBLER,
      MachineType.SCREEN_FABRICATOR, MachineType.GPU_FAB,
    ]},
    { labelKey: 'machines.tiers.manufactura_digital', types: [
      MachineType.SMARTPHONE_FACTORY, MachineType.LAPTOP_WORKSHOP,
      MachineType.PC_BUILDER, MachineType.MINING_RIG_ASSEMBLY, MachineType.DATA_CENTER_ASSEMBLY,
    ]},
  ];

  tieredMachines = computed(() => {
    const all = this.machinesService.getAll();
    return this.machineTiers.map(tier => {
      const machines = tier.types
        .map(type => all.find(m => m.id === type))
        .filter((m): m is NonNullable<typeof m> => m !== undefined);
      return {
        labelKey: tier.labelKey,
        machines,
        activeCount: machines.filter(m => m.isActive).length,
      };
    });
  });

}

