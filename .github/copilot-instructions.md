# Scrap Yard Idle — Copilot Project Instructions

## Project Overview

Idle/incremental game built with Angular 19 standalone + Electron. The player generates scrap manually and automatically, processes it through machines, sells resources for money, and buys upgrades to expand production. Target: desktop app via Electron (Windows), also runs as web.

---

## Tech Stack

- **Angular 19** — standalone components, signals, `inject()` pattern
- **Electron** — desktop wrapper, `window.electronApi` IPC bridge
- **TypeScript** strict mode
- **i18n** via `TranslationService` (es/en JSON files in `src/assets/i18n/`)
- **No NgModules** — fully standalone

---

## Architecture & Key Services

### State Management — Angular Signals

All mutable state lives in services as `signal()`. Components read signals reactively, never store copies.

```typescript
// Services expose readonly signals
private items = signal<Resource[]>([]);
readonly items = this.items.asReadonly();

// Components consume via inject()
private resourcesService = inject(ResourcesService);
```

### Core Services

| Service                  | Responsibility                                                             |
| ------------------------ | -------------------------------------------------------------------------- |
| `GameStateService`       | Current view signal: `'main-menu' \| 'game' \| 'options'`                  |
| `ResourcesService`       | All resource amounts/capacities. Single source of truth for resources      |
| `MachinesService`        | Machine state, activation, progress                                        |
| `UpgradesService`        | Upgrade levels per `UpgradeId`                                             |
| `ScrapGenerationService` | Manual click + automatic scrap tick                                        |
| `GameLoopService`        | `setInterval` tick (1000ms). Runs machines, auto-scrap, triggers save      |
| `SaveService`            | Load/save game state. Dirty flag pattern. Supports Electron + localStorage |
| `AudioService`           | Music loop + SFX. Initialized in `App.ngOnInit()`                          |
| `NotificationService`    | In-game toast notifications                                                |
| `TranslationService`     | i18n string lookup                                                         |
| `MarketService`          | Buy/sell resource prices                                                   |
| `MachineUnlockService`   | Unlock conditions per machine                                              |
| `UpgradeProgressService` | Progress tracking for upgrade purchases                                    |

### SaveService — Dirty Flag Pattern

Services call `saveService.markDirty()` when state changes. `App` auto-saves every 10s only if dirty. Services receive `SaveService` via `setSaveService()` to avoid circular DI:

```typescript
// In App.ngOnInit():
this.resourcesService.setSaveService(this.saveService);
this.machinesService.setSaveService(this.saveService);
```

### Electron IPC

Check `window.electronApi` before using Electron-specific APIs:

```typescript
private isElectron = typeof window !== 'undefined' && !!window.electronApi;
if (this.isElectron) {
  const result = await window.electronApi!.getSavePath();
}
```

---

## Domain Models

### Resource (`resource.model.ts`)

```typescript
interface Resource { id: string; name: string; amount: number; capacity: number; icon: string; }
enum ResourceType { SCRAP | METAL | PLASTIC | COMPONENTS | MONEY | RECYCLED_PLASTIC | ELECTRIC_COMPONENTS }
```

- `capacity: Infinity` = unlimited (e.g., MONEY)
- Capacity is expanded via storage upgrades (`UPG_STORE_*`)

### Machine (`machine.model.ts`)

```typescript
interface Machine { id: string; name: string; level: number; baseSpeed: number;
  baseConsumption: MachineConsumption[]; baseProduction: MachineProduction; isActive: boolean; progress: number; }
enum MachineType { CRUSHER | SEPARATOR | SMELTER | ASSEMBLER | PACKAGER | ELECTRIC_PACKAGER | RECYCLER | ELECTRIC_ASSEMBLER }
```

### Upgrade (`upgrade.model.ts`)

```typescript
enum UpgradeId {
  UPG_STORE_001..006,  // Storage capacity upgrades
  UPG_MACH_001..008,   // Machine speed upgrades
  UPG_SCRAP_001,       // Manual scrap boost
  UPG_SCRAP_002,       // Automatic scrap rate
}
```

---

## Game Loop

```
GameLoopService.start() → setInterval(1000ms)
  → tick()
    → machines process (consume input resources, produce output)
    → auto-scrap generation (if UPG_SCRAP_002 active)
    → upgrade progress tick
    → machine unlock check
    → every 15 ticks: auto-save if dirty
```

The game loop only runs when view === `'game'`. Audio reacts to view changes via `effect()` in `App`.

---

## Component Structure

```
components/
├── machine-list/        # List of all machines
├── machine-card/        # Individual machine with progress bar
├── upgrades-panel/      # Upgrades tree panel (minimizable)
├── resources-header/    # Top bar showing resource amounts
├── scrap-button/        # Manual scrap generation button
├── sell-*-button/       # Sell resource buttons
├── main-menu/           # Main menu view
├── options-menu/        # Options/settings view
└── ui/                  # Shared UI primitives
    ├── app-button/
    ├── progress-bar/
    ├── notification-container/
    ├── confirmation-modal/
    ├── tooltip/
    └── background-grid/
```

---

## Conventions to Follow

1. **Always use `inject()`** — never constructor injection for services
2. **Signals for all reactive state** — no BehaviorSubject, no RxJS for local state
3. **`effect()` for cross-service side effects** — audio, analytics, derived persistence
4. **Models are pure data** — no methods, no logic in model files
5. **Config files for all balance numbers** — never hardcode game values in services
6. **i18n all user-facing strings** — use `TranslationService.translate(key)`
7. **Check `isElectron`** before any `window.electronApi` call
8. **markDirty()** after any state change that should be persisted
9. **`@if` / `@for`** Angular 17+ control flow — never `*ngIf` / `*ngFor`

---

## Config Files (balance values go here)

- `src/app/config/game-balance.config.ts` — scrap costs, generation rates
- `src/app/config/resources.config.ts` — initial resource definitions
- `src/app/config/machines.config.ts` — machine definitions
- `src/app/config/upgrades.config.ts` — upgrade catalog

---

## SDD Notes

When starting a new feature with `/sdd-new`:

- **Explorer** should check `GameLoopService` for tick integration needs
- **Designer** should consider dirty flag + SaveService integration
- **Tasks** should include i18n strings as a separate task
- Electron-specific behavior needs a separate task from web behavior
