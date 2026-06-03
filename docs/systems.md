# Systems — Scrap Yard Idle

## Resumen rápido

Este documento describe el estado real de los sistemas del juego en mayo de 2026. Sirve como inventario técnico, no como roadmap histórico.

## Arquitectura base

| Area | Implementación actual |
|---|---|
| UI | Angular 21 standalone |
| Estado reactivo | Signals en servicios |
| Inyección | `inject()` |
| Desktop runtime | Electron |
| Persistencia | `SaveService` + `userData` |
| i18n | `es.json` y `en.json` |
| Tests | `ng test` + gate de coverage |

## Recursos

### Recursos implementados

| Tier | Recursos |
|---|---|
| Base | `scrap`, `metal`, `plastic`, `components`, `money`, `copper`, `recycled_plastic`, `electric_components` |
| Avanzado | `circuit_board`, `hdd`, `screen`, `gpu`, `smartphone`, `laptop`, `desktop_pc`, `mining_rig`, `server_rack` |

### Comportamiento

- `ResourcesService` es la fuente de verdad de cantidades y capacidades.
- `money` es el unico recurso sin limite de capacidad.
- Las capacidades se amplian con upgrades de almacenamiento.
- Toda mutacion relevante termina marcando estado dirty para save.

## Maquinas y cadena de producción

### Maquinas implementadas

| Tier | Maquinas |
|---|---|
| Base | `crusher`, `separator`, `smelter`, `assembler`, `packager`, `recycler`, `electric_assembler`, `electric_packager` |
| Avanzado | `pcb_printer`, `hdd_assembler`, `screen_fabricator`, `gpu_fab`, `smartphone_factory`, `laptop_workshop`, `pc_builder`, `mining_rig_assembly`, `data_center_assembly` |

### Cadena real

```text
scrap
     -> crusher -> metal
     -> separator -> plastic
     -> smelter -> copper

metal + plastic -> assembler -> components
plastic -> recycler -> recycled_plastic
copper + components + recycled_plastic -> electric_assembler -> electric_components
components -> packager -> money
electric_components -> electric_packager -> money

copper + electric_components -> pcb_printer -> circuit_board
circuit_board + metal -> hdd_assembler -> hdd
circuit_board + electric_components + recycled_plastic -> screen_fabricator -> screen
circuit_board + hdd + copper -> gpu_fab -> gpu
screen + gpu + circuit_board -> smartphone_factory -> smartphone
hdd + screen + gpu + circuit_board -> laptop_workshop -> laptop
hdd + gpu + circuit_board + metal -> pc_builder -> desktop_pc
desktop_pc + gpu + electric_components -> mining_rig_assembly -> mining_rig
desktop_pc + gpu + circuit_board -> data_center_assembly -> server_rack
```

## Game loop

`GameLoopService` corre un tick global de 1 segundo y coordina:

1. Generacion automatica de scrap.
2. Estadisticas.
3. Produccion de maquinas.
4. Progreso de upgrades en curso.
5. Tick de contratos.
6. Tick de eventos de mercado.
7. Auto-save cuando corresponde.

Las maquinas consumen insumos al inicio de ciclo y producen al completar `progress >= 1`.

## Mercado

- `MarketService` permite venta manual de recursos.
- Hay bonus por lote configurados en `game-balance.config.ts`.
- `MarketEventService` aplica multiplicadores runtime sobre recursos concretos segun el evento activo.
- Las ventas manuales conservan precision de 2 decimales, de modo que eventos negativos tambien afectan recursos baratos de forma visible.
- `EventBannerComponent` vive en el hueco superior del panel de upgrades para mostrar tipo, multiplicador, recursos afectados y tiempo restante sin tapar el header.

## Upgrades

Los upgrades actuales cubren:

- Storage para recursos base y avanzados.
- Velocidad para maquinas base y avanzadas.
- Generacion automatica de scrap.

`UpgradeProgressService` sigue existiendo para upgrades con duracion aunque la mayor parte del arbol actual es inmediato o semilineal.

## Contratos

`ContractService` ya esta integrado en el juego.

### Comportamiento actual

- El primer contrato se fuerza al desbloquear la Ensambladora.
- Puede haber hasta 3 contratos visibles y 2 activos a la vez.
- Los contratos usan `type` y `urgency` como conceptos separados.
- El sistema persiste contratos, intro modal y flags relacionadas.
- `GameLoopService` ejecuta `contractService.tick()` en cada segundo.

## Persistencia

### Save actual

- El backend principal es Electron `userData`.
- La escritura es atomica mediante `save.tmp` y reemplazo posterior.
- `SAVE_VERSION` actual es `4`.

### Estado persistido

- Recursos.
- Maquinas.
- Upgrades.
- Estadisticas.
- Tutorial.
- Settings.
- Contratos y flags asociadas.
- Placeholder de milestones completados.

## UI principal

| Area | Rol |
|---|---|
| `resources-header` | Estado de recursos y acciones rapidas |
| `machine-list` | Lista principal de maquinas |
| `upgrades-panel` | Upgrades + tab de contratos + banner de evento de mercado |
| `statistics-panel` | Totales de la partida |
| `first-run-tutorial-overlay` | Onboarding guiado |
| `notification-container` | Feedback de eventos del juego |

## Runtime desktop

- El entrypoint real de Electron es `electron/main.js`.
- El bridge real expuesto al renderer vive en `electron/preload.js`.
- La app empaquetada corre sin menu, con ventana frameless y modo kiosk.
- Se bloquea la apertura de DevTools en builds empaquetados.

## Sistemas que todavía no existen

- F4 - Sistema real de milestones y flavor text.
- Preparacion operativa para Steam.

## Riesgos técnicos actuales

- Hay drift entre los archivos JS y TS de Electron; el runtime de release debe validarse contra los `.js`.
- La UI late game sigue necesitando limpieza visual en header y navegacion de maquinas.

### Carga

- Al iniciar la app: si existe `save.json` → cargar; si no → estado limpio

---

## 9. Statistics

**Servicio:** `StatisticsService`

Estadísticas de sesión y acumuladas. Se persisten en el save.

| Estadística | Descripción |
|---|---|
| `totalScrapGenerated` | Total de chatarra generada desde el inicio |
| `playTimeSeconds` | Tiempo total jugado en segundos |
| `totalMoneyEarned` | Dinero total ganado (ventas) |
| `activeMachinesCount` | Computed: máquinas activas y desbloqueadas |

---

## 10. Tutorial First-Run

**Servicio:** `FirstRunTutorialService`  
**Config:** `first-run-tutorial.config.ts`  
**Componente:** `first-run-tutorial-overlay`

Tutorial paso a paso que se activa la primera vez que se juega. Se omite si ya fue completado o saltado.

### Estados del tutorial

- `isActive` — tutorial en curso
- `isCompleted` — completado con éxito
- `isSkipped` — saltado por el jugador

### Eventos que avanza el tutorial

- `crusher-activated` — el jugador activa la Trituradora
- `metal-sold` — el jugador vende metal
- Otros eventos configurados en `first-run-tutorial.config.ts`

### Persistencia

El estado del tutorial se guarda en el `SaveState`.

---

## 11. Audio

**Servicio:** `AudioService`

Gestiona efectos de sonido del juego. Integrado en desbloqueos de máquinas y acciones del jugador. Los archivos de audio se encuentran en `src/app/assets/audio/`.

---

## 12. Notifications

**Servicio:** `NotificationService`

Muestra notificaciones en pantalla para eventos importantes:
- Desbloqueo de nuevas máquinas
- Completado de upgrades
- Otros eventos relevantes

---

## 13. Settings / i18n

**Servicios:** `SettingsService`, `TranslationService`  
**Config:** `src/assets/i18n/`

- `SettingsService` — gestiona preferencias del usuario (idioma, volumen, etc.)
- `TranslationService` — carga y sirve cadenas de texto del idioma activo
- El idioma activo se persiste en el `SaveState`

---

## 14. Game State

**Servicio:** `GameStateService`

Controla la vista principal de la aplicación.

| Vista | Descripción |
|---|---|
| `main-menu` | Pantalla inicial (por defecto al arrancar) |
| `game` | Vista de juego principal |
| `options` | Menú de opciones |

Las transiciones son: menú → juego, juego → opciones, opciones → juego/menú.
