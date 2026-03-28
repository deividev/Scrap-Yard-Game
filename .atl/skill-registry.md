# Skill Registry — Scrap Yard Idle

> Orchestrator: read this file once per session and cache the **Compact Rules** section.
> Inject matching rule blocks into every sub-agent prompt as `## Project Standards (auto-resolved)`.
> Sub-agents do NOT read this file — they receive rules pre-digested.

---

## Project Context

**Stack:** Angular 19 standalone + Electron (desktop), TypeScript strict mode, signals, no NgModules.
**Game type:** Idle/incremental. Player generates scrap → processes via machines → sells for money → buys upgrades.
**Version source of truth:** `package.json` fields `"version"` + `"releaseLabel"`.
**i18n:** `TranslationService.t('key')` — all user-facing strings translated; JSON files in `src/assets/i18n/`.

---

## Compact Rules

### [angular] Angular 19 conventions

- **Always `inject()`** — never constructor injection for services.
- **Signals for all reactive state** — `signal()`, `computed()`, `effect()`. No BehaviorSubject, no RxJS for local state.
- **`@if` / `@for`** — Angular 17+ block syntax exclusively. Never `*ngIf` / `*ngFor`.
- **`@for` track** — always provide `track` expression: `@for (x of list(); track x.id)` or `track $index` when no id.
- **Standalone components** — no NgModules, no `declarations`. Use `imports: [...]` on `@Component`.
- **Models are pure data** — no methods, no logic inside model files.
- **Config files for balance** — never hardcode game values in services. Use files under `src/app/config/`.
- **i18n all UI strings** — use `translationService.t('key')`, NOT `translate()`.

### [signals] Signal state patterns

- Services expose state as `private _foo = signal<T>(...)` + `readonly foo = this._foo.asReadonly()`.
- Mutations happen inside services only — components call service methods, never mutate signals directly.
- Signal objects (arrays/objects) must be replaced, never mutated in-place: use spread `{ ...obj, field: val }` or `[...arr]`.
- `computed()` for derived values — no getters that re-derive on every call.
- `effect()` for cross-service side effects (audio, analytics, persistence triggers) — inside injection context only.

### [save] Dirty flag & persistence pattern

- Every service that holds persisted state receives `SaveService` via `setSaveService(svc: SaveMarker)` — NOT via DI constructor (avoids circular dependency).
- Call `this.saveService?.markDirty()` immediately after any state mutation that should be saved.
- `SaveMarker` type (`src/app/models/save-marker.model.ts`) = `{ markDirty(): void }` — import this, not `SaveService`, in domain services.
- `SaveService.save()` is async; callers should `.catch()` errors — never fire-and-forget in lifecycle hooks.
- `isSaving` guard in `SaveService` prevents concurrent saves.

### [gameloop] Game loop conventions

- `GameLoopService` drives one `setInterval(1000ms)` tick — do not create competing intervals elsewhere.
- Adding new tick behavior: inject the service and call the new logic from inside `tick()` or register a callback.
- Track all `setTimeout` references inside an owned `Set<number>`; clear them in `ngOnDestroy` / `stop()`.
- `GameLoopService` implements `OnDestroy` — `ngOnDestroy()` calls `stop()`.
- Loop only runs when `GameStateService view === 'game'`.

### [electron] Electron IPC conventions

- Always guard: `private isElectron = typeof window !== 'undefined' && !!window.electronApi;`
- All IPC goes through `contextBridge` — never use `ipcRenderer` directly from Angular code.
- Validate IPC inputs server-side (main process) — type check + size limit before writing files.
- Use `window.electronApi!.xxx()` only inside `if (this.isElectron)` blocks.
- Added IPC handlers go in `electron/main.ts` (TypeScript) — `electron/main.js` is the compiled output.

### [version] Version management

- **Single source of truth:** `package.json` `"version"` (semver) + `"releaseLabel"` (e.g. `"demo"`).
- Menu display built as: `(releaseLabel ? releaseLabel + ' ' : '') + 'v' + version`.
- Import via `import { version, releaseLabel } from '../../../../package.json'` — `resolveJsonModule: true` is set.
- **Before every commit:** bump `version` in `package.json` — patch/minor/major per semver.
- Build artifacts named by `scripts/pack.js` using the same fields — no separate version file.

### [typescript] TypeScript conventions

- Strict mode is ON (`"strict": true`) — no `any` without explicit justification.
- Use typed interfaces/types for all service contracts. `any` in service parameters → replace with the proper type or `SaveMarker`.
- `resolveJsonModule: true` is enabled — JSON files can be imported directly.
- `intervalId: number | null` — not `any` for timer IDs; use `window.setTimeout` / `window.setInterval` to get `number`.

### [security] Security rules

- IPC `save-game` validates: `typeof data !== 'string' || data.length > 10 * 1024 * 1024` → reject.
- `set-window-mode`: whitelist‐validate mode (`fullscreen | windowed | maximized`); for `windowed` validate resolution format before `split('x')`.
- `set-resolution`: validate against `/^\d+x\d+$/` before use.
- Never deserialize save data without validation (JSON.parse inside try/catch).
- `contextIsolation: true`, `nodeIntegration: false` — never relax these.

### [components] Component structure rules

- Path: `src/app/components/<feature>/<feature>.component.ts` (single-file for simple components).
- Shared UI primitives: `src/app/components/ui/` — reuse `app-button`, `progress-bar`, `tooltip`, `confirmation-modal`.
- `AudioService` initialized in `App.ngOnInit()` — do not reinitialize elsewhere.
- `AudioContext` creation must be wrapped in try/catch (browser policy may block it).
- `beforeunload` save calls must `.catch()` errors.

---

## User Skills Trigger Table

| Trigger phrase                                                       | Skill to invoke          |
| -------------------------------------------------------------------- | ------------------------ |
| "judgment day", "juzgar", "doble review", "adversarial"              | `judgment-day`           |
| structuring components, where to place files, Angular project layout | `angular-architecture`   |
| Electron IPC, window management, packaging, electron-builder         | `electron-desktop`       |
| `/sdd-new`, `/sdd-ff`, `/sdd-explore`, `/sdd-apply`, `/sdd-verify`   | respective `sdd-*` skill |
| "create PR", "open pull request"                                     | `branch-pr`              |
| "create issue", "report bug"                                         | `issue-creation`         |
| "find a skill", "is there a skill for"                               | `find-skills`            |

---

## Key File Map (for sub-agent orientation)

```
src/app/
  app.ts                          # Root component, wires services, game lifecycle
  app.html                        # Root template (view router: main-menu | game | options)
  models/
    resource.model.ts             # ResourceType enum, Resource interface
    machine.model.ts              # MachineType enum, Machine interface
    upgrade.model.ts              # UpgradeId enum, Upgrade types
    save-marker.model.ts          # SaveMarker = { markDirty(): void }
  config/
    game-balance.config.ts        # All numeric balance values (rates, costs, multipliers)
    resources.config.ts           # Initial resource definitions
    machines.config.ts            # Machine catalog
    upgrades.config.ts            # Upgrade catalog
  services/
    game-state.service.ts         # View signal: 'main-menu' | 'game' | 'options'
    game-loop.service.ts          # setInterval tick, OnDestroy, timeout tracking
    resources.service.ts          # Resource amounts & capacities, markDirty
    machines.service.ts           # Machine state, activation, progress
    upgrades.service.ts           # Upgrade levels by UpgradeId
    upgrade-progress.service.ts   # Upgrade timers, offline progress
    scrap-generation.service.ts   # Manual + auto scrap generation
    save.service.ts               # Load/save, isSaving guard, dirty flag
    audio.service.ts              # AudioContext graph, try/catch init
    market.service.ts             # Buy/sell prices
    machine-unlock.service.ts     # Unlock conditions per machine
    notification.service.ts       # Toast notifications
    translation.service.ts        # t('key') i18n lookup
  components/
    main-menu/                    # Main menu view, version display
    options-menu/                 # Options/settings, window mode, reset
    machine-list/                 # All machines list
    machine-card/                 # Individual machine with progress
    upgrades-panel/               # Scrap/storage/machine upgrade tabs
    resources-header/             # Top bar resource amounts
    scrap-button/                 # Manual scrap click
    progression-hint/             # Progression hint display
    ui/
      app-button/                 # Shared button primitive
      progress-bar/               # Shared progress bar
      tooltip/                    # Inline tooltip
      confirmation-modal/         # Generic confirm dialog
      notification-container/     # Toast container
      background-grid/            # Background grid decoration
electron/
  main.ts                         # Electron main process (source)
  main.js                         # Compiled output
  preload.ts                      # contextBridge API definitions
  preload.js                      # Compiled output
scripts/
  pack.js                         # Electron builder wrapper, reads version from package.json
package.json                      # version + releaseLabel = single version source of truth
```
