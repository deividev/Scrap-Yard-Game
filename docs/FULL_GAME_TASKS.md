# Scrap Yard Idle — Tareas de Implementación del Juego Completo

> Última actualización: Mayo 17, 2026
> Este documento vuelve a ser la fuente de verdad del backlog activo.
> No usarlo para replanificar F0, F1 o F2 como si siguieran pendientes: esas fases ya están implementadas.

---

## Resumen actual

| Fase | Estado | Nota |
|---|---|---|
| F0 - Rebalanceo Tier 3 | Completada | Ya vive en `machines.config.ts` y balance actual |
| F1 - Sistema de contratos | Completada | Servicio, UI, save e intro modal integrados |
| F2 - Cadenas T4-T12 | Completada | Recursos, maquinas, upgrades, unlocks y mercado avanzado presentes |
| F3 - Eventos de mercado | Pendiente | Siguiente fase de producto recomendada |
| F4 - Milestones / flavor text | Pendiente | Depende de definir triggers y copy |
| D1 - Header late game | Pendiente | Refactor visual/ergonomico |
| D2 - Tabs/filtros de maquinas | Pendiente | Refactor de navegacion de UI |
| Release engineering | Pendiente | QA, packaging y Steam vendran despues del PRD completo |

## Qué NO hay que reimplementar

- No reabrir F0 salvo para bugs o rebalance puntual.
- No reimplementar contratos como feature nueva; ya existen en codigo.
- No replanificar T4-T12 como si fueran roadmap futuro; ya estan en el juego.
- No usar este archivo para tareas de demo/Next Fest antiguas.

## Fase activa recomendada — F3 Eventos de mercado

### Objetivo

Añadir variaciones temporales al mercado que obliguen al jugador a decidir si vender ahora, stockear o priorizar contratos durante ventanas de precio favorables o desfavorables.

### Checklist de implementación

- [ ] Definir modelo de evento de mercado.
- [ ] Crear config con tipos de evento, duracion, cooldown y multiplicadores.
- [ ] Crear `MarketEventService` con estado reactivo y tick.
- [ ] Integrar eventos con `GameLoopService`.
- [ ] Integrar multiplicadores en `MarketService`.
- [ ] Mostrar estado actual del mercado en UI.
- [ ] Añadir notificaciones y audio si corresponde.
- [ ] Persistir el estado necesario en save.
- [ ] Añadir i18n es/en para nombres y mensajes.
- [ ] Añadir tests unitarios del servicio y de integracion clave.

### Archivos candidatos

- `src/app/config/game-balance.config.ts`
- `src/app/services/market.service.ts`
- `src/app/services/game-loop.service.ts`
- `src/app/services/save.service.ts`
- `src/app/models/save-state.model.ts`
- `src/assets/i18n/es.json`
- `src/assets/i18n/en.json`
- Nuevo servicio/modelo/componente segun diseño final

## Fase siguiente — F4 Milestones y flavor text

### Objetivo

Dar feedback de progresion y narrativa minima sin convertir el juego en un sistema de quests pesado.

### Checklist de implementación

- [ ] Definir catalogo de milestones y sus condiciones.
- [ ] Crear `MilestoneService` o equivalente.
- [ ] Conectar milestones con sistemas existentes de recursos, maquinas, upgrades y contratos.
- [ ] Persistir milestones completados.
- [ ] Mostrar notificaciones y/o historial visible.
- [ ] Añadir flavor text es/en.
- [ ] Añadir tests unitarios y de persistencia.

### Archivos candidatos

- `src/app/models/save-state.model.ts`
- `src/app/services/save.service.ts`
- `src/app/services/notification.service.ts`
- `src/assets/i18n/es.json`
- `src/assets/i18n/en.json`
- Nuevos archivos de config, servicio y UI

## Mejoras de UI post-F4

### D1 — Refactor del header de recursos

- [ ] Reducir densidad visual en late game.
- [ ] Revisar cómo se presentan cantidades, capacidad y acciones de venta.
- [ ] Evitar que la escala T4-T12 vuelva inmanejable el header.

### D2 — Tabs o filtros de maquinas

- [ ] Separar basicas y avanzadas o introducir filtros por tier.
- [ ] Mantener legible la lista completa de maquinas una vez cerradas F3 y F4.
- [ ] Cubrir la nueva navegacion con tests de UI.

## Backlog de release engineering

Esto se ejecuta despues de cerrar el PRD funcional.

- [ ] Playthrough completo T1-T12 sin cheats.
- [ ] QA de save/load en toda la progresion.
- [ ] Balance economico final y deteccion de softlocks.
- [ ] Verificar `pnpm run package:win` en una corrida limpia.
- [ ] Revisar drift entre `electron/main.js` y `electron/main.ts`.
- [ ] Revisar drift entre `electron/preload.js` y `electron/preload.ts`.
- [ ] Revisar flags, labels o leftovers de beta/demo antes de release.
- [ ] Preparar assets, store page y pipeline de Steam.

## Criterio para considerar el PRD completo

El PRD se considera implementado cuando se cumplan todos estos puntos:

- [ ] F3 cerrada.
- [ ] F4 cerrada.
- [ ] D1 resuelta o descartada con decision explicita.
- [ ] D2 resuelta o descartada con decision explicita.
- [ ] QA funcional completo realizado.

Cuando eso ocurra, el proyecto pasa de backlog de producto a backlog de release.

Para cada recurso nuevo, añadir a `INITIAL_RESOURCES`:
- `id`: el nuevo `ResourceType`
- `name`: nombre en español (la i18n viene después)
- `amount: 0`
- `capacity`: valor inicial — usar las capacidades iniciales pequeñas (ej. 5 para T4, 3 para T5-T6, 2 para T7)
- `icon`: ruta a assets/icons/ (los iconos se crean en T-14)

Valores de capacidad inicial propuestos:
```
CIRCUIT_BOARD: 5
HDD: 5
SCREEN: 5
GPU: 3
SMARTPHONE: 3
LAPTOP: 3
DESKTOP_PC: 3
SERVER_RACK: 2
MINING_RIG: 2
```

---

### T-03 — Añadir capacidades iniciales en `game-balance.config.ts`

**Archivo:** `src/app/config/game-balance.config.ts`

- En `INITIAL_CAPACITIES`: añadir los 9 recursos nuevos con los valores de T-02
- En `STORAGE_UPGRADE_CONFIG.INCREMENTS`: añadir los 9 recursos (incremento sugerido: CB=3, HDD=3, SCREEN=3, GPU=2, SMARTPHONE=2, LAPTOP=2, DESKTOP_PC=2, SERVER_RACK=1, MINING_RIG=1)
- En `STORAGE_UPGRADE_CONFIG.BASE_COSTS`: costes propuestos (escalan con el tier):
  ```
  CIRCUIT_BOARD: 150
  HDD: 200
  SCREEN: 200
  GPU: 300
  SMARTPHONE: 250
  LAPTOP: 300
  DESKTOP_PC: 400
  SERVER_RACK: 600
  MINING_RIG: 600
  ```

---

### T-04 — Añadir precios de venta en `game-balance.config.ts`

**Archivo:** `src/app/config/game-balance.config.ts`

En `MARKET_CONFIG.BASE_PRICES`, añadir:
```
CIRCUIT_BOARD: 15
HDD: 35
SCREEN: 40
GPU: 80
SMARTPHONE: 70
LAPTOP: 150
DESKTOP_PC: 200
SERVER_RACK: 600
MINING_RIG: 500
```
Criterio de pricing: cada tier produce ~3-5× el valor del producto del tier anterior. El jugador siempre puede vender en cualquier punto de la cadena.

---

### T-05 — Añadir máquinas al enum `MachineType`

**Archivo:** `src/app/models/machine.model.ts`

Añadir al enum `MachineType`:
```typescript
PCB_PRINTER = 'pcb_printer',
HDD_ASSEMBLER = 'hdd_assembler',
SCREEN_FABRICATOR = 'screen_fabricator',
GPU_FAB = 'gpu_fab',
SMARTPHONE_FACTORY = 'smartphone_factory',
LAPTOP_WORKSHOP = 'laptop_workshop',
PC_BUILDER = 'pc_builder',
DATA_CENTER_ASSEMBLY = 'data_center_assembly',
MINING_RIG_ASSEMBLY = 'mining_rig_assembly',
```

---

### T-06 — Definir las 9 máquinas nuevas en `machines.config.ts`

**Archivo:** `src/app/config/machines.config.ts`

Añadir al array `INITIAL_MACHINES`:

```
PCB_PRINTER:
  inputs:  Cobre x1 + Componentes x2
  output:  Circuit Board x1
  speed:   0.15/s
  level:   0 (bloqueada)

HDD_ASSEMBLER:
  inputs:  Circuit Board x1 + Metal x2
  output:  HDD x1
  speed:   0.15/s
  level:   0

SCREEN_FABRICATOR:
  inputs:  Circuit Board x1 + Comp. Eléctricos x1 + Plástico x2
  output:  Pantalla x1
  speed:   0.12/s
  level:   0

GPU_FAB:
  inputs:  Circuit Board x2 + Cobre x1
  output:  GPU x1
  speed:   0.1/s
  level:   0

SMARTPHONE_FACTORY:
  inputs:  Pantalla x1 + Circuit Board x1
  output:  Smartphone x1
  speed:   0.12/s
  level:   0

LAPTOP_WORKSHOP:
  inputs:  HDD x1 + Pantalla x1 + Circuit Board x1
  output:  Laptop x1
  speed:   0.08/s
  level:   0

PC_BUILDER:
  inputs:  HDD x1 + GPU x1 + Metal x2
  output:  Desktop PC x1
  speed:   0.06/s
  level:   0

DATA_CENTER_ASSEMBLY:
  inputs:  Desktop PC x2 + Circuit Board x4
  output:  Server Rack x1
  speed:   0.04/s
  level:   0

MINING_RIG_ASSEMBLY:
  inputs:  Desktop PC x1 + GPU x2 + Comp. Eléctricos x2
  output:  Mining Rig x1
  speed:   0.04/s
  level:   0
```

Nota sobre speeds: las máquinas T4-T5 son más lentas que T3 para que el throughput total escale con upgrades, no gratis.

---

### T-07 — Definir condiciones de unlock en `MachineUnlockService`

**Archivo:** `src/app/services/machine-unlock.service.ts`

Añadir a la tabla de requisitos de desbloqueo:

```
PCB_PRINTER:          Empaquetadora Eléctrica desbloqueada + $500 acumulados
HDD_ASSEMBLER:        PCB Printer nivel 2
SCREEN_FABRICATOR:    PCB Printer nivel 2 + Ensambladora Eléctrica nivel 3
GPU_FAB:              PCB Printer nivel 3 + Fundidora nivel 3
SMARTPHONE_FACTORY:   Screen Fabricator nivel 2 + PCB Printer nivel 3
LAPTOP_WORKSHOP:      HDD Assembler nivel 2 + Screen Fabricator nivel 2
PC_BUILDER:           HDD Assembler nivel 3 + GPU Fab nivel 2
DATA_CENTER_ASSEMBLY: PC Builder nivel 3 + PCB Printer nivel 5
MINING_RIG_ASSEMBLY:  PC Builder nivel 2 + GPU Fab nivel 4
```

---

### T-08 — Añadir upgrades de velocidad para las máquinas nuevas

**Archivo:** `src/app/config/upgrade-definitions.config.ts`

- Para cada una de las 9 máquinas nuevas, añadir un `UpgradeId` del tipo `UPG_MACH_XXX`
- Seguir el mismo patrón que los upgrades de máquinas existentes
- Coste base proporcional al tier (T4 más barato que T7)

---

### T-09 — Añadir upgrades de almacenamiento para los recursos nuevos

**Archivo:** `src/app/config/upgrade-definitions.config.ts`

- Para Circuit Board, HDD, Screen, GPU: añadir upgrades de almacenamiento `UPG_STORE_XXX`
- Los productos vendibles de T6-T7 (Smartphone, Laptop, Desktop PC, Server Rack, Mining Rig) no necesitan storage upgrades porque se venden inmediatamente — pero si QA detecta que se llenan, añadirlos

---

### T-10 — Añadir slots de cards para las nuevas máquinas

**Archivo:** `src/app/config/machine-card-slots.config.ts`

- Añadir los 9 nuevos `MachineType` al orden de slots
- Mantener el order lógico: T4 → T5 → T6 → T7
- Verificar que el layout de machine-list soporta más cards (scroll o nueva fila)

---

### T-11 — Añadir botones de venta para los nuevos recursos

**Archivos:** verificar en `src/app/components/` cómo están implementados los sell buttons actuales

- Por cada producto vendible (los 9 nuevos recursos), añadir botón de venta en el mercado
- Si los sell buttons están en un componente genérico, configurarlos para los nuevos recursos
- Si son componentes individuales, crear o duplicar el patrón para cada uno

---

### T-12 — Migración de save para los nuevos recursos y máquinas

**Archivo:** `src/app/services/save.service.ts`

- Incrementar `SAVE_VERSION` a `2`
- En `migrateSave()`, añadir la rama `version === 1 → version 2`:
  - Inicializar los 9 recursos nuevos con `amount: 0`
  - Las 9 máquinas nuevas se inicializan desde `INITIAL_MACHINES` si no existen en el save

---

### T-13 — i18n para recursos y máquinas nuevas

**Archivos:** `src/assets/i18n/es.json` y `src/assets/i18n/en.json`

Claves a añadir:
```json
// Recursos
"resource.circuit_board": "Placa de Circuito",
"resource.hdd": "Disco Duro",
"resource.screen": "Pantalla",
"resource.gpu": "GPU",
"resource.smartphone": "Smartphone",
"resource.laptop": "Laptop",
"resource.desktop_pc": "PC de Escritorio",
"resource.server_rack": "Rack de Servidores",
"resource.mining_rig": "Mining Rig",

// Máquinas
"machine.pcb_printer.name": "Impresora PCB",
"machine.hdd_assembler.name": "Ensambladora de HDDs",
"machine.screen_fabricator.name": "Fabricadora de Pantallas",
"machine.gpu_fab.name": "Fab de GPUs",
"machine.smartphone_factory.name": "Fábrica de Smartphones",
"machine.laptop_workshop.name": "Taller de Laptops",
"machine.pc_builder.name": "Constructor de PCs",
"machine.data_center_assembly.name": "Ensamblaje de Data Center",
"machine.mining_rig_assembly.name": "Ensamblaje de Mining Rig"
```

---

### T-14 — Assets: iconos de recursos y cards de máquinas

**Directorios:** `src/assets/icons/` y `src/assets/cards/`

Para cada recurso nuevo, crear o colocar un icono en `assets/icons/`:
```
circuit_board_resource.png
hdd_resource.png
screen_resource.png
gpu_resource.png
smartphone_resource.png
laptop_resource.png
desktop_pc_resource.png
server_rack_resource.png
mining_rig_resource.png
```

Para cada máquina nueva, una card en `assets/cards/`:
```
pcb_printer_card_new_slot.png
hdd_assembler_card_new_slot.png
screen_fabricator_card_new_slot.png
gpu_fab_card_new_slot.png
smartphone_factory_card_new_slot.png
laptop_workshop_card_new_slot.png
pc_builder_card_new_slot.png
data_center_assembly_card_new_slot.png
mining_rig_assembly_card_new_slot.png
```

Nota: si no hay assets finales disponibles, usar placeholders temporales del mismo tamaño que las cards existentes.

---

### T-15 — QA de balance T4-T7 (sesión larga)

Sin archivo específico — sesión de juego completa.

Verificar que:
- PCB Printer no starvea de Cobre ni de Componentes con la cadena T3 activa
- Las máquinas T5 no saturan su output antes de que el jugador desbloquee T6
- Las máquinas T7 tienen una cadena viable sin requerir un número imposible de máquinas previas
- El dinero generado por Server Rack y Mining Rig no rompe la economía
- Los upgrades de velocidad de T4-T7 tienen un ROI razonable (se recuperan en <10 minutos de producción)

---

## Fase 3 — Eventos de Mercado

> Eventos aleatorios que modifican los precios del mercado temporalmente. Crean decisiones de timing (¿vender ahora o esperar el boom?).

---

### M-01 — Modelo: `market-event.model.ts`

**Archivo a crear:** `src/app/models/market-event.model.ts`

```typescript
interface MarketEvent {
  id: string;
  type: 'boom' | 'crash' | 'corporate_deal';
  affectedResources: ResourceType[];  // qué recursos afecta
  priceMultiplier: number;             // ej. 3.0 para ×3, 0.4 para crash
  durationSeconds: number;
  timeRemaining: number;
  isActive: boolean;
}
```

---

### M-02 — Config: `market-events.config.ts`

**Archivo a crear:** `src/app/config/market-events.config.ts`

```
SPAWN_INTERVAL_MIN:  300s  (5 min mínimo entre eventos)
SPAWN_INTERVAL_MAX:  600s  (10 min máximo entre eventos)
SPAWN_CHANCE:        0.3   (30% de probabilidad en cada ventana)

Tipos de evento:
  boom_pc:         PCs + Laptops ×3 precio,  120s,  probabilidad 0.4
  boom_components: Componentes ×2 precio,    180s,  probabilidad 0.3
  market_crash:    todos los recursos ×0.4,   60s,  probabilidad 0.2
  corporate_deal:  Servers + Mining Rig ×5,  300s,  probabilidad 0.1 (solo si T7 desbloqueado)
```

---

### M-03 — Servicio: `MarketEventService`

**Archivo a crear:** `src/app/services/market-event.service.ts`

- `activeEvent` signal: `MarketEvent | null`
- `ticksSinceLastEvent` counter interno
- `tick(): void` — llamado desde `GameLoopService`
  - Incrementa contador
  - Si contador supera la ventana de spawn, tira dado de probabilidad
  - Si hay evento activo, decrementa `timeRemaining`
  - Cuando `timeRemaining === 0`, desactiva el evento y resetea el contador
- `getEffectivePrice(resourceId, basePrice): number`
  - Si hay evento activo y el recurso está en `affectedResources`, aplica `priceMultiplier`
  - Si no, devuelve `basePrice`
- Integrar con `MarketService`: `MarketService` llama a `marketEventService.getEffectivePrice()` al calcular precio de venta

---

### M-04 — Integrar `MarketEventService` en `GameLoopService`

**Archivo:** `src/app/services/game-loop.service.ts`

- Inyectar `MarketEventService`
- En `tick()`: llamar `marketEventService.tick()` tras los demás ticks

---

### M-05 — UI: banner de evento activo

**Archivo a crear:** `src/app/components/ui/market-event-banner/market-event-banner.ts`

- Solo visible cuando hay evento activo (`activeEvent !== null`)
- Muestra: tipo de evento (con icono), recursos afectados, multiplicador, tiempo restante
- Timer en tiempo real (cuenta atrás)
- Para `market_crash`: estilo rojo/urgente; para `boom`: estilo verde/positivo
- Se coloca en la zona superior de la pantalla de juego (sobre el header de recursos)

---

### M-06 — Notificación al inicio y fin de evento

**Archivo:** integrar en `MarketEventService` con `NotificationService`

- Al activar un evento: `notificationService.show('market_event_start', tipo)`
- Al terminar un evento: `notificationService.show('market_event_end', tipo)`

---

### M-07 — i18n para eventos de mercado

**Archivos:** `src/assets/i18n/es.json` y `src/assets/i18n/en.json`

```json
"market.event.boom_pc": "¡Boom de PCs! ×{{multiplier}} por {{duration}}s",
"market.event.boom_components": "Alta demanda de Componentes ×{{multiplier}}",
"market.event.market_crash": "⚠️ Caída del mercado — precios a ×{{multiplier}}",
"market.event.corporate_deal": "Oferta corporativa — Servers y Rigs ×{{multiplier}}",
"market.event.ended": "El evento de mercado ha terminado"
```

---

## Fase 4 — Narrativa mínima / Flavor Text

> Bajo coste, gran efecto de inmersión. Pequeños textos de sabor que aparecen en milestones importantes del juego. Se apoyan en el `FirstRunTutorialService` ya existente.

---

### N-01 — Definir milestones de flavor text

**Archivo:** `src/app/config/first-run-tutorial.config.ts`

Añadir triggers de flavor text (sin bloquear el tutorial existente):

```
MILESTONE_PCB_FIRST:       Primera Circuit Board producida
MILESTONE_LAPTOP_FIRST:    Primer Laptop vendido
MILESTONE_PC_FIRST:        Primer Desktop PC vendido
MILESTONE_SERVER_FIRST:    Primer Server Rack completado
MILESTONE_CONTRACT_FIRST:  Primer contrato aceptado
MILESTONE_CONTRACT_URGENT: Primer contrato urgente completado
MILESTONE_MARKET_BOOM:     Primer boom de mercado aprovechado (venta durante evento)
```

---

### N-02 — Implementar los triggers de milestone

**Archivo:** `src/app/services/first-run-tutorial.service.ts`

- Añadir un método `checkMilestone(milestoneId: string)` que solo dispara una vez por milestone
- Los milestones se persisten en `SaveState` como `completedMilestones: string[]`
- Diferente del tutorial paso a paso: los milestones no bloquean ninguna acción, solo muestran flavor text

---

### N-03 — UI: mostrar flavor text en milestone

**Archivo:** reusar `NotificationService` con un tipo extendido, o usar `TooltipComponent` existente

- Mostrar el texto de flavor como notificación especial (duración más larga, estilo diferenciado)
- No es un modal — no bloquea la pantalla

---

### N-04 — Textos de flavor en i18n

**Archivos:** `src/assets/i18n/es.json` y `src/assets/i18n/en.json`

```json
"flavor.pcb_first":       "Primera placa ensamblada. Empieza lo bueno.",
"flavor.laptop_first":    "Un laptop. Alguien va a pagar mucho por esto.",
"flavor.pc_first":        "Un PC completo. Esto es industria de verdad.",
"flavor.server_first":    "Un rack de servidores. El patio ya no parece un patio.",
"flavor.contract_first":  "Tu primer contrato. Que empiece el negocio.",
"flavor.contract_urgent": "Presión, velocidad, dinero. Bienvenido.",
"flavor.market_boom":     "¿Ves el timing? Eso se llama vender bien."
```

---

## Orden de implementación recomendado

```
F0 (rebalanceo) → tarda ~2h, bloquea todo lo demás si los números son incorrectos
  ↓
F2-T01 a T05 (enum + config nuevos recursos y máquinas) → sin UI aún, base de datos
  ↓
F2-T06 a T07 (definiciones de máquinas + unlocks) → el loop ya funciona con las nuevas máquinas
  ↓
F2-T08 a T12 (upgrades + sell buttons + save migration) → el jugador puede interactuar con todo
  ↓
F1 (contratos) → capa de decisión sobre el loop ya expandido
  ↓
F3 (eventos de mercado) → capa de timing sobre el mercado ya con nuevos precios
  ↓
F2-T13 a T14 (i18n + assets) → pulir strings y visuales
  ↓
F4 (narrativa) → último, cuando el loop completo está validado
  ↓
F2-T15 (QA balance) → sesión larga antes del build final
```

---

## Checklist de archivos a crear (nuevos)

| Archivo | Fase |
|---|---|
| `src/app/models/contract.model.ts` | F1 |
| `src/app/models/market-event.model.ts` | F3 |
| `src/app/config/contracts.config.ts` | F1 |
| `src/app/config/market-events.config.ts` | F3 |
| `src/app/services/contract.service.ts` | F1 |
| `src/app/services/market-event.service.ts` | F3 |
| `src/app/components/contracts-panel/contracts-panel.ts` | F1 |
| `src/app/components/contracts-panel/contracts-panel.html` | F1 |
| `src/app/components/contracts-panel/contracts-panel.css` | F1 |
| `src/app/components/contracts-panel/contract-card/contract-card.ts` | F1 |
| `src/app/components/ui/market-event-banner/market-event-banner.ts` | F3 |

## Checklist de archivos a modificar (existentes)

| Archivo | Fases que lo tocan |
|---|---|
| `src/app/models/resource.model.ts` | F2-T01 |
| `src/app/models/machine.model.ts` | F2-T05 |
| `src/app/config/resources.config.ts` | F2-T02 |
| `src/app/config/machines.config.ts` | F0, F2-T06 |
| `src/app/config/game-balance.config.ts` | F0, F2-T03, F2-T04 |
| `src/app/config/upgrade-definitions.config.ts` | F2-T08, F2-T09 |
| `src/app/config/machine-card-slots.config.ts` | F2-T10 |
| `src/app/config/first-run-tutorial.config.ts` | F4-N01 |
| `src/app/services/game-loop.service.ts` | F1-C04, F3-M04 |
| `src/app/services/machine-unlock.service.ts` | F2-T07 |
| `src/app/services/first-run-tutorial.service.ts` | F4-N02 |
| `src/app/services/save.service.ts` | F1-C06, F2-T12 |
| `src/app/app.ts` | F1-C05 |
| `src/app/app.html` | F1-C09 |
| `src/assets/i18n/es.json` | F1-C10, F2-T13, F3-M07, F4-N04 |
| `src/assets/i18n/en.json` | F1-C10, F2-T13, F3-M07, F4-N04 |
| `docs/systems.md` | F0-06 |
