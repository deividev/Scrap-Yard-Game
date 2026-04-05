# PRD — Semana de ajuste fino antes de implementar

> **Objetivo:** Cerrar todos los gaps de especificación antes de tocar código.
> Al terminar esta semana, el PRD puede pasarse a cualquier desarrollador sin preguntas abiertas.
> Cada tarea indica exactamente qué archivo abrir, qué buscar, qué decidir y qué escribir en el PRD.
> Las propuestas ya están redactadas — solo hay que confirmarlas o ajustarlas.

---

## DÍA 1 — Reconocimiento de código (lunes)
**Leer y anotar hechos. No se modifica ningún archivo todavía.**

---

### D1-1 — Enum `ResourceType`: confirmar último valor y patrón de naming

**Archivo:** `src/app/models/resource.model.ts`

Estado actual confirmado:
```typescript
export enum ResourceType {
  SCRAP               = 'scrap',
  METAL               = 'metal',
  PLASTIC             = 'plastic',
  COMPONENTS          = 'components',
  MONEY               = 'money',
  COPPER              = 'copper',
  RECYCLED_PLASTIC    = 'recycled_plastic',
  ELECTRIC_COMPONENTS = 'electric_components',
}
```
Patrón: `SCREAMING_SNAKE_CASE` como key, `snake_case` como string value.
**Acción:** Confirmar visualmente que el archivo no ha cambiado. Si está igual, D2-4 puede proceder directamente con los valores propuestos.

---

### D1-2 — Enum `MachineType`: confirmar último valor y patrón

**Archivo:** `src/app/models/machine.model.ts`

Estado actual confirmado:
```typescript
export enum MachineType {
  CRUSHER            = 'crusher',
  SEPARATOR          = 'separator',
  SMELTER            = 'smelter',
  ASSEMBLER          = 'assembler',
  PACKAGER           = 'packager',
  ELECTRIC_PACKAGER  = 'electric_packager',
  RECYCLER           = 'recycler',
  ELECTRIC_ASSEMBLER = 'electric_assembler',
}
```
Mismo patrón. Último valor: `ELECTRIC_ASSEMBLER`.
**Acción:** Confirmar que no hay nuevos valores añadidos. D2-4 usa este patrón.

---

### D1-3 — Enum `UpgradeId`: confirmar colisión `UPG_STORE_007`

**Archivo:** `src/app/models/upgrade.model.ts`

Estado actual confirmado: `UPG_STORE_007 = 'UPG_STORE_007'` apunta a **Almacén de Cobre**.
Último `UPG_MACH`: `UPG_MACH_008` (Empaquetadora Eléctrica).
Último `UPG_STORE`: `UPG_STORE_007` (Cobre).

**Consecuencia directa:** Los upgrades T4-T7 del PRD original que empezaban en `UPG_STORE_007` son incorrectos. Ya está corregido en A.5 del PRD (empiezan en `UPG_STORE_008`).
**Acción:** Solo confirmar que el archivo refleja lo anterior. No hay nada que cambiar aquí.

---

### D1-4 — Config de balance: confirmar multiplicadores y conflicto precio Cobre

**Archivo:** `src/app/config/game-balance.config.ts`

Hechos confirmados:
- `DEFAULT_MULTIPLIER` para máquinas = **1.26** (no 1.20 — ya corregido en PRD A.4)
- `STORAGE_MULTIPLIER` = **1.20**
- `AUTO_GENERATION_RATES[3]` = **0.32 Scrap/s** (nivel 3)
- `MARKET_CONFIG.BASE_PRICES` solo tiene: `METAL: 1`, `PLASTIC: 1.2`, `COMPONENTS: 3`, `COPPER: 2.8`
  - `COPPER` sigue en 2.8 aunque el PRD lo bajó a 2.0 — **conflicto real, resolver en D2-1**
  - `RECYCLED_PLASTIC` y `ELECTRIC_COMPONENTS` no están en `BASE_PRICES` → tampoco son vendibles actualmente

**Acción:** Confirmar estos valores. El precio de Cobre en config vs PRD es la primera discrepancia real.

---

### D1-5 — `MachineUnlockService`: confirmar ausencia de event emitter

**Archivo:** `src/app/services/machine-unlock.service.ts`

Estado actual confirmado: el servicio **no tiene ningún `Subject`, `EventEmitter`, ni signal observable**. Cuando `checkAndUnlockMachines()` desbloquea una máquina, llama directamente a `NotificationService.show()` y `AudioService.playMachineUnlocked()`. No hay ningún hook para que otros servicios reaccionen al unlock.

**Consecuencia para F1:** `ContractsService` no puede observar el unlock de Assembler sin cambiar algo. La solución (decidida en D4-4) es que `ContractsService` observe `MachinesService` directamente con un `effect()`.

**Acción:** Confirmar leyendo el servicio que lo anterior es correcto.

---

### D1-6 — `upgrades.service.ts`: confirmar `getMachineUpgradeIdByMachineType` con 8 entradas

**Archivo:** `src/app/services/upgrades.service.ts`, buscar `getMachineUpgradeIdByMachineType`

Estado actual confirmado:
```typescript
getMachineUpgradeIdByMachineType(machineType: string): UpgradeId | null {
  const mapping: Record<string, UpgradeId> = {
    crusher:            UpgradeId.UPG_MACH_001,
    separator:          UpgradeId.UPG_MACH_003,
    smelter:            UpgradeId.UPG_MACH_002,
    assembler:          UpgradeId.UPG_MACH_004,
    packager:           UpgradeId.UPG_MACH_005,
    recycler:           UpgradeId.UPG_MACH_006,
    electric_assembler: UpgradeId.UPG_MACH_007,
    electric_packager:  UpgradeId.UPG_MACH_008,
  };
  return mapping[machineType] || null;
}
```
**Consecuencia para F2b:** Sin añadir los 9 nuevos tipos, `machine.level` nunca supera 1 para T4-T7 y las condiciones de unlock `≥ 2` y `≥ 3` son inalcanzables (documentado en PRD A.6).
**Acción:** Confirmar que el mapping tiene exactamente esos 8 tipos.

---

### D1-7 — `UpgradeDefinition`: confirmar ausencia de campo `unlockCondition`

**Archivo:** `src/app/models/upgrade.model.ts`, interface `UpgradeDefinition`

Estado actual confirmado: los campos son `id`, `category`, `name`, `baseCostMoney`, `extraCostComponents?`, `description`, `effectType`, `targetResourceId?`, `targetMachineId?`, `icon?`. **No existe `unlockCondition`**.

**Consecuencia para F2b:** El panel `upgrades-panel.component.ts` tiene `storageUpgrades()` como lista estática hardcodeada. Para ocultar upgrades T4-T7 hasta que corresponda, hay que filtrar esa lista con `machinesService.isUnlocked(machineId)`. No se cambia el modelo — solo el computed del panel.

**Acción:** Confirmar que la interface no tiene ese campo.

---

### D1-8 — `sell-resource-button`: confirmar que ya está parametrizado

**Archivo:** `src/app/components/sell-resource-button/sell-resource-button.component.ts`

Estado actual confirmado:
```typescript
resourceId = input.required<ResourceType>();
```
En `resources-header.component.ts` se instancia así:
```html
<app-sell-resource-button [resourceId]="ResourceType.COPPER"></app-sell-resource-button>
```
**Consecuencia para F2b:** Añadir los 9 sell buttons nuevos es solo añadir 9 líneas de HTML en `resources-header.component.ts`. No hay que crear ningún componente.

**Acción:** Confirmar leyendo el resources-header que el patrón es exactamente ese.

---

### D1-9 — i18n: verificar si el tutorial menciona Fundidora → Metal

**Archivos:** `src/assets/i18n/es.json` y `en.json`, sección `tutorial`

Estado encontrado: el tutorial menciona "procesar metal" y la "trituradora". La Fundidora **no aparece en el tutorial** — fue añadida después del tutorial.

**Consecuencia para F0:** El requisito funcional 6 del PRD sobre "actualizar tutorial si menciona Fundidora → Metal" **no aplica**.

**Acción:** Buscar `smelter` en ambos JSON dentro de la sección `tutorial`. Si no aparece, marcar el requisito como eliminado en D2-3.

---

## DÍA 2 — Cerrar gaps de F0 y F2a (martes)

---

### D2-1 — F0: Corregir precio de Cobre en `game-balance.config.ts`

**Problema:** `MARKET_CONFIG.BASE_PRICES.COPPER = 2.8` en el config actual, pero el PRD A.3 dice que debe bajar a **$2.0** con el rebalanceo F0 (descubierto en D1-4).

**Acción en el PRD:** Añadir en Requisitos funcionales de F0 una nueva línea:
> "5b. Actualizar `MARKET_CONFIG.BASE_PRICES.COPPER` de `2.8` a `2.0` en `game-balance.config.ts`."

Esto es una tarea de implementación F0, no una decisión de diseño — el precio ya está decidido en A.3. Solo faltaba que el requisito funcional lo nombrara explícitamente.

---

### D2-2 — F0: Revisar criterio de aceptación de Scrap con números reales

**Cálculo con datos reales:**
- `AUTO_GENERATION_RATES[3]` = **0.32 Scrap/s** (nivel 3 de UPG_SCRAP_002)
- Crusher: consume 1 Scrap × 0.5/s = **0.50 Scrap/s**
- Separator: consume 1 Scrap × 0.5/s = **0.50 Scrap/s**
- Smelter (post F0): consume 2 Scrap × 0.33/s = **0.66 Scrap/s**
- **Demanda total con las tres activas: 1.66 Scrap/s vs 0.32 Scrap/s de auto-gen nivel 3**

Conclusión: con las tres activas y solo auto-generación nivel 3, el Scrap se agota rápido. Esto es **normal e intencional** — el Scrap manual es el acelerador.

**Acción en el PRD:** Sustituir el criterio actual por:
> "Con Fundidora activa y auto-generación nivel 3, la cadena es sostenible con Scrap manual moderado (~5-10 clicks/min). Las pausas en producción son intencionales — no se requiere que las tres cadenas T2 corran simultáneamente sin intervención del jugador."

---

### D2-3 — F0: Eliminar requisito 6 del tutorial (resultado de D1-9)

Si D1-9 confirmó que el tutorial no menciona Fundidora → Metal:

**Acción en el PRD:** Eliminar el punto "6. Actualizar el tutorial si menciona Fundidora → Metal" de Requisitos funcionales de F0. Sustituir por:
> "6. Verificar en `docs/systems.md` que la descripción de la Fundidora es correcta post-F0; actualizar solo si describe la cadena antigua."

---

### D2-4 — F2a: Añadir Apéndice A.0 con todos los enum values nuevos

**Acción en el PRD:** Añadir sección **A.0 — Enum values nuevos** antes de A.1, con los valores exactos:

```typescript
// ResourceType — añadir después de ELECTRIC_COMPONENTS
CIRCUIT_BOARD  = 'circuit_board'
HDD            = 'hdd'
SCREEN         = 'screen'
GPU            = 'gpu'
SMARTPHONE     = 'smartphone'
LAPTOP         = 'laptop'
DESKTOP_PC     = 'desktop_pc'
SERVER_RACK    = 'server_rack'
MINING_RIG     = 'mining_rig'

// MachineType — añadir después de ELECTRIC_ASSEMBLER
PCB_PRINTER          = 'pcb_printer'
HDD_ASSEMBLER        = 'hdd_assembler'
SCREEN_FABRICATOR    = 'screen_fabricator'
GPU_FAB              = 'gpu_fab'
SMARTPHONE_FACTORY   = 'smartphone_factory'
LAPTOP_WORKSHOP      = 'laptop_workshop'
PC_BUILDER           = 'pc_builder'
DATA_CENTER_ASSEMBLY = 'data_center_assembly'
MINING_RIG_ASSEMBLY  = 'mining_rig_assembly'

// UpgradeId — añadir después de UPG_MACH_008 y UPG_STORE_007
UPG_MACH_009  = 'UPG_MACH_009'   // PCB Printer speed
UPG_MACH_010  = 'UPG_MACH_010'   // HDD Assembler speed
UPG_MACH_011  = 'UPG_MACH_011'   // Screen Fabricator speed
UPG_MACH_012  = 'UPG_MACH_012'   // GPU Fab speed
UPG_MACH_013  = 'UPG_MACH_013'   // Smartphone Factory speed
UPG_MACH_014  = 'UPG_MACH_014'   // Laptop Workshop speed
UPG_MACH_015  = 'UPG_MACH_015'   // PC Builder speed
UPG_MACH_016  = 'UPG_MACH_016'   // Data Center Assembly speed
UPG_MACH_017  = 'UPG_MACH_017'   // Mining Rig Assembly speed
UPG_STORE_008 = 'UPG_STORE_008'  // Circuit Board storage
UPG_STORE_009 = 'UPG_STORE_009'  // HDD storage
UPG_STORE_010 = 'UPG_STORE_010'  // Screen storage
UPG_STORE_011 = 'UPG_STORE_011'  // GPU storage
UPG_STORE_012 = 'UPG_STORE_012'  // Smartphone storage
UPG_STORE_013 = 'UPG_STORE_013'  // Laptop storage
UPG_STORE_014 = 'UPG_STORE_014'  // Desktop PC storage
UPG_STORE_015 = 'UPG_STORE_015'  // Server Rack storage
UPG_STORE_016 = 'UPG_STORE_016'  // Mining Rig storage
```

---

### D2-5 — F2a: Documentar visibilidad de máquinas T4-T7 en F2a

**Hecho clave:** El sistema de visibilidad ya existe. Máquinas con `level: 0` en `INITIAL_MACHINES` se muestran como tarjetas bloqueadas (`isLocked = machine.level === 0` en `machine-card-v2`). `MachineUnlockService` las desbloquea al cumplir condiciones.

**Decisión confirmada:** Opción A — añadir las 9 máquinas en `INITIAL_MACHINES` con `level: 0` desde F2a. Aparecen como tarjetas bloqueadas en la machine-list. Se desbloquean progresivamente al cumplir las condiciones de A.6.

**Acción en el PRD:** Añadir nota en F2a:
> "Las 9 máquinas nuevas se añaden a `INITIAL_MACHINES` con `level: 0` desde F2a. El sistema de tarjetas bloqueadas ya existe — nada de nueva UI. `MachineUnlockService` necesita las nuevas condiciones de A.6 añadidas en `checkAndUnlockMachines()`."

---

### D2-6 — F2a: Documentar refactor de `MarketService.getPrice()` con patrón exacto

**Código actual (`market.service.ts`):**
```typescript
getPrice(resourceId: string): number {
  if (resourceId === ResourceType.METAL)      return MARKET_CONFIG.BASE_PRICES.METAL;
  if (resourceId === ResourceType.PLASTIC)    return MARKET_CONFIG.BASE_PRICES.PLASTIC;
  if (resourceId === ResourceType.COMPONENTS) return MARKET_CONFIG.BASE_PRICES.COMPONENTS;
  if (resourceId === ResourceType.COPPER)     return MARKET_CONFIG.BASE_PRICES.COPPER;
  // retorna 0 para todo lo demás — incluyendo RECYCLED_PLASTIC y ELECTRIC_COMPONENTS
}
```

**Patrón de refactor a documentar en el PRD (Requisito 9 de F2):**
```typescript
// game-balance.config.ts — ampliar BASE_PRICES a todos los recursos
BASE_PRICES: {
  [ResourceType.METAL]:               1,
  [ResourceType.PLASTIC]:             1.2,
  [ResourceType.COPPER]:              2.0,  // F0 baja de 2.8 a 2.0
  [ResourceType.COMPONENTS]:          3,
  [ResourceType.RECYCLED_PLASTIC]:    3.5,
  [ResourceType.ELECTRIC_COMPONENTS]: 5,
  [ResourceType.CIRCUIT_BOARD]:       15,
  [ResourceType.HDD]:                 35,
  [ResourceType.SCREEN]:              40,
  [ResourceType.GPU]:                 80,
  [ResourceType.SMARTPHONE]:          70,
  [ResourceType.LAPTOP]:              150,
  [ResourceType.DESKTOP_PC]:          200,
  [ResourceType.SERVER_RACK]:         600,
  [ResourceType.MINING_RIG]:          500,
} as Partial<Record<ResourceType, number>>

// market.service.ts — getPrice() refactorizado
getPrice(resourceId: ResourceType): number {
  return MARKET_CONFIG.BASE_PRICES[resourceId] ?? 0;
}
```

---

### D2-7 — F2a: Confirmar recursos T4-T7 en save migration

**Acción en el PRD:** Añadir en la spec de migración de F0, punto 6b:
> "Los 9 recursos T4-T7 se inicializan en `save.resources` con `amount: 0` y `capacity` según A.5 si no existen ya en el save. Si `restoreState()` ya hace merge con `INITIAL_RESOURCES`, este paso puede ser implícito — verificar en F2a."

---

## DÍA 3 — Cerrar gaps de F2b (miércoles)

---

### D3-1 — F2b: Documentar sell buttons con patrón concreto

**Hecho confirmado (D1-8):** `<app-sell-resource-button [resourceId]="ResourceType.X">` ya funciona genéricamente. No se crean nuevos componentes.

**Dónde añadirlos:** `src/app/components/resources-header/resources-header.component.ts`

**Patrón para T4-T7:**
```html
@if (machinesService.isUnlocked(MachineType.PCB_PRINTER)) {
  <app-sell-resource-button [resourceId]="ResourceType.CIRCUIT_BOARD"></app-sell-resource-button>
}
```

**Acción en el PRD:** Añadir en Requisitos funcionales de F2, debajo del punto 5:
> "Los sell buttons T4-T7 se añaden en `resources-header.component.ts` usando el componente `<app-sell-resource-button>` existente, envueltos en `@if(machinesService.isUnlocked(MachineType.X))`. Aparecen solo al desbloquear la máquina upstream."

---

### D3-2 — F2b: Decidir condición de unlock de storage upgrades T4-T7

**Hecho confirmado (D1-7):** `storageUpgrades()` en `upgrades-panel.component.ts` es una lista estática hardcodeada (patrón `{id, resourceId, nameKey}`). El modelo `UpgradeDefinition` no tiene `unlockCondition`. El filtro de visibilidad se hace en el computed del panel.

**Decisión:** Añadir campo `unlockedBy: MachineType` a la lista interna del computed. El map existente ya produce `isLocked` — se extiende:

```typescript
// Lista interna (no en el modelo):
{ id: UpgradeId.UPG_STORE_008, resourceId: ResourceType.CIRCUIT_BOARD,
  nameKey: 'upgrades.storage.circuit_board', unlockedBy: MachineType.PCB_PRINTER }

// En el map del computed:
isLocked: !this.machinesService.isUnlocked(entry.unlockedBy)
```

**Acción en el PRD:** Añadir en Requisitos funcionales de F2, debajo del punto 7:
> "Los storage upgrades T4-T7 se añaden al computed `storageUpgrades()` en `upgrades-panel.component.ts` con un campo interno `unlockedBy: MachineType`. Se muestran bloqueados (`isLocked: true`) hasta que la máquina upstream se desbloquea."

---

### D3-3 — F2b: Documentar layout del panel de upgrades con 33 upgrades

**Estado actual:** 15 upgrades (7 storage + 8 machine speed). Con F2: **33 upgrades** (16 storage + 17 machine speed).

**Decisión:** Sin cambio de layout. Los nuevos machine upgrades se añaden al final de `machineOrder` en el orden de progresión de unlock:

```typescript
private readonly machineOrder = [
  // existentes (8)...
  MachineType.PCB_PRINTER, MachineType.HDD_ASSEMBLER, MachineType.SCREEN_FABRICATOR,
  MachineType.GPU_FAB, MachineType.SMARTPHONE_FACTORY, MachineType.LAPTOP_WORKSHOP,
  MachineType.PC_BUILDER, MachineType.DATA_CENTER_ASSEMBLY, MachineType.MINING_RIG_ASSEMBLY,
];
```

Los bloqueados aparecen al final de cada sección con estilo gris (`[class.locked]="machineUpgrade.isLocked"`). Scroll vertical ya existe en el panel.

**Acción en el PRD:** Añadir en Requisitos no funcionales de F2:
> "El panel de upgrades soporta 33 entradas con scroll vertical. `machineOrder` en `upgrades-panel.component.ts` se amplía con 9 valores de `MachineType` en orden de unlock."

---

### D3-4 — F1: Corregir "Out of scope" de F1 desactualizado

**Problema:** F1 dice "Contratos para recursos T4-T7 (esos llegan en F2)". Con el nuevo orden de fases (F2 antes que F1), cuando se implemente F1 los recursos T4-T7 ya existen.

**Acción en el PRD:** Sustituir esa línea por:
> "Out of scope F1: contratos para productos T6-T7 (Laptop, PC, Server Rack, Mining Rig) — sus tiempos de producción son demasiado largos para timers de horas. Se pueden habilitar en v1.1 con timers de 24h+."

---

## DÍA 4 — Cerrar gaps de F1 (jueves)

---

### D4-1 — F1: Definir comportamiento exacto de "Ignorar" contrato

**Decisión:** Ignorar un contrato lo **elimina del slot inmediatamente** sin penalización.
- El slot queda libre para el próximo check de spawn (hasta 60s después).
- La penalización solo aplica a contratos **aceptados** que expiran sin completarse.
- Un contrato ignorado no puede recuperarse.

**Flujo exacto:**
1. Slot muestra contrato disponible (no aceptado).
2. Jugador pulsa "Ignorar" → contrato se elimina → slot pasa a "Esperando contrato..."
3. En el próximo tick del spawn check aparece uno nuevo.

**Acción en el PRD:** Añadir en Requisitos funcionales de F1, punto 4b:
> "Ignorar un contrato lo elimina del slot inmediatamente sin penalización. El slot queda libre para el próximo spawn check. Solo los contratos **aceptados** que expiran generan penalización."

---

### D4-2 — F1: Definir `SavedContract` type

**Decisión:** `SavedContract = Contract` completo. No se necesita un tipo separado. Campos relevantes para serialización:
- `id`, `type`, `resourceId`, `quantity`, `rewardAmount`, `penaltyAmount` → siempre presentes
- `acceptedAt: 0` si no aceptado, `Date.now()` si aceptado
- `durationSeconds` → siempre presente (asignado al spawn)
- `isAccepted: false` hasta que el jugador pulsa "Aceptar"

**Acción en el PRD:** Añadir en A.7:
> "`SavedContract` es el mismo type que `Contract`. Los contratos expirados **no se guardan** — se eliminan del array al expirar. Solo persisten contratos activos (timer corriendo) y disponibles (no aceptados aún)."

---

### D4-3 — F1: Definir posición del panel de contratos

**Decisión:** El panel de contratos se implementa como una nueva **tab en el panel de upgrades existente** ("Contratos"). Reutiliza el sistema de tabs y el colapsado sin añadir un segundo panel al layout.

Si en QA el panel de upgrades queda demasiado cargado, se evalúa extraerlo.

**Acción en el PRD:** Añadir en Requisitos no funcionales de F1:
> "El panel de contratos se implementa como una nueva tab 'Contratos' en el panel de upgrades existente. Reutiliza el sistema de tabs y colapsado. Posición y estilo definitivos se confirman en QA."

---

### D4-4 — F1: Documentar patrón de integración para primer contrato forzado

**Hecho (D1-5):** `MachineUnlockService` no tiene ningún signal observable. Cero cambios en él.

**Opción B (elegida):** `ContractsService` inyecta `MachinesService` y usa un `effect()`:
```typescript
// En ContractsService constructor:
effect(() => {
  const level = this.machinesService.getMachine(MachineType.ASSEMBLER)?.level ?? 0;
  if (level >= 1 && !this.saveService.getState().firstContractSpawned) {
    this.spawnForcedLocalContract();
  }
});
```
Zero cambios en `MachineUnlockService`. El `effect()` se re-evalúa cada vez que el signal de `MachinesService` cambia.

**Acción en el PRD:** Añadir en Requisitos funcionales de F1, punto 11b:
> "El primer contrato forzado se detecta mediante `effect()` en `ContractsService` que observa `machinesService.getMachine(MachineType.ASSEMBLER)?.level`. Cuando level ≥ 1 y `firstContractSpawned = false`, se dispara. No se modifica `MachineUnlockService`."

---

### D4-5 — F1: Aclarar que contrato disponible ocupa slot

**Decisión:** Sí, **un contrato disponible (no aceptado) ocupa slot**. Los 3 slots pueden estar todos con contratos disponibles sin que el jugador haya aceptado ninguno.

**Acción en el PRD:** Añadir en A.7 bajo "Parámetros de spawn":
> "Un contrato disponible (offer state, no aceptado) **ocupa slot**. El jugador puede tener hasta 3 contratos en cualquier combinación: disponible, activo-con-timer. No hay un cuarto estado 'expirado visible' — los contratos expirados se eliminan del array al detectar expiración en el tick."

---

## DÍA 5 — Cerrar gaps de F3, F4 y transversales (viernes)

---

### D5-1 — F3: Documentar mecanismo de spawn de eventos

**Decisión:** `GameLoopService` llama `marketEventService.tick()` cada tick (1s). El servicio:
1. Si hay evento activo: decrementa timer. Cuando llega a 0, termina el evento y resetea `activeEventMultipliers` a `{}`.
2. Si no hay evento: incrementa `secondsSinceLastEvent`. Cuando `>= 300` (cooldown), elige tipo con distribución 35/35/20/10% y activa el nuevo evento.

**Spawn garantizado** al cumplir el cooldown — probabilidad base 100%.

**Acción en el PRD:** Añadir en Requisitos funcionales de F3, punto 1b:
> "`MarketEventService` se integra en el game loop mediante `tick()` llamado cada segundo. El spawn es garantizado al cumplirse el cooldown; solo la distribución de tipos usa probabilidades (35/35/20/10%). El timer del cooldown es interno y no persiste en el save."

---

### D5-2 — F3: Definir comportamiento del cooldown entre sesiones

**Decisión:** El cooldown **no persiste entre sesiones**. Al cargar, `secondsSinceLastEvent` se inicializa a `cooldown - 60` (= 240s), de modo que el primer evento llega ~60s después de cargar.

Esto evita un evento inmediato al cargar (que sorprendería) y no obliga a esperar 5 minutos.

**Acción en el PRD:** Añadir en A.8:
> "Cooldown entre sesiones: al cargar, `secondsSinceLastEvent = 240`. El primer evento llega ~60s después de cargar. El cooldown no se persiste en el save."

---

### D5-3 — F3: Documentar nombres de servicio y componente

**Acción en el PRD:** Añadir en Requisitos funcionales de F3, punto 1c:
> "Nuevo servicio: `MarketEventService` en `src/app/services/market-event.service.ts`.<br>Nuevo componente: `EventBannerComponent` en `src/app/components/event-banner/event-banner.component.ts`.<br>El banner se inserta en `app.html` al mismo nivel que `notification-container`."

---

### D5-4 — F4: Unificar semántica de triggers a "producir"

**Problema:** `first_laptop_sold` dice "Vender"; `first_server_rack` dice "Completar". Inconsistente.

**Decisión:** Todos los triggers de producto son al **producir** (output de máquina), no al vender. `GameLoopService` ya procesa outputs — puede notificar a `MilestoneService` tras cada output producido.

**Excepción:** `first_contract`, `first_urgent_done` → eventos de interacción UI. `first_boom_sell` → al vender durante boom.

**Acción en el PRD:** Actualizar A.9 columna "Trigger":
```
first_laptop_sold   → "Producir 1 Laptop por primera vez"
first_desktop_sold  → "Producir 1 Desktop PC por primera vez"
first_server_rack   → (sin cambio — ya dice "Completar 1 Server Rack")
```

---

### D5-5 — F4: Definir `MilestoneService` y sus dependencias

**Decisión:** Nuevo `MilestoneService` en `src/app/services/milestone.service.ts`.

**Responsabilidades:**
- `completedMilestones = signal<string[]>([])` — cargado desde save
- Método `check(milestoneId: string, condition: boolean): void` — si condition=true y no completado, dispara notificación y marca completado
- Para triggers de producción: `GameLoopService` llama `milestoneService.check('first_circuit_board', ...)` en el bloque de output
- Para triggers de contrato/boom: `ContractsService` y `MarketEventService` llaman `check()` directamente
- **No inyecta `ResourcesService`** — recibe push desde quien produce el evento

**Acción en el PRD:** Añadir en Requisitos funcionales de F4, punto 1b:
> "Nuevo `MilestoneService`. Recibe checks mediante `check(id, condition)`. Para triggers de producción, `GameLoopService` notifica tras cada output. Para contratos, `ContractsService` notifica. Para boom, `MarketEventService` notifica. Persiste en save y llama a `NotificationService.show(msg, 'milestone')`."

---

### D5-6 — F4: Añadir `resetToNewGame()` para milestones

**Acción en el PRD:** Añadir en Requisitos funcionales de F4, punto 6b:
> "`resetToNewGame()` en `save.service.ts` incluye `milestoneService.reset()` que limpia `completedMilestones = []`. Mismo patrón que el reset de contratos."

---

### D5-7 — F4: Spec exacta del tipo `'milestone'` en `NotificationService`

**Estado actual:**
```typescript
type: 'success' | 'info' | 'unlock';
DURATIONS = { success: 3000, info: 3500, unlock: 5000 };
```

**Cambios necesarios:**
1. `notification.service.ts` → añadir `'milestone'` al union type; añadir `milestone: 5000` a `DURATIONS`
2. `notification-container.component.ts` → añadir CSS:
   ```css
   .notification--milestone { border-left: 3px solid #f97316; } /* naranja Tailwind 500 */
   ```

**Acción en el PRD:** Añadir en Requisitos funcionales de F4, punto 4b:
> "En `notification.service.ts`: añadir `'milestone'` al union type y `DURATIONS.milestone = 5000`.<br>En `notification-container.component.ts`: añadir CSS `.notification--milestone { border-left: 3px solid #f97316; }`."

---

### D5-8 — Transversal: Convención de i18n keys

**Patrón existente:** `machines.crusher`, `resources.metal`, `upgrades.storage.scrap`, `tutorial.steps.X`.

**Convención propuesta para todo lo nuevo:**
```
// Recursos T4-T7
resources.circuit_board, resources.hdd, resources.screen,
resources.gpu, resources.smartphone, resources.laptop,
resources.desktop_pc, resources.server_rack, resources.mining_rig

// Máquinas T4-T7
machines.pcb_printer, machines.hdd_assembler, machines.screen_fabricator,
machines.gpu_fab, machines.smartphone_factory, machines.laptop_workshop,
machines.pc_builder, machines.data_center_assembly, machines.mining_rig_assembly

// Upgrades
upgrades.storage.circuit_board, upgrades.machine.pcb_printer  (etc.)

// Contratos
contracts.panel.title          → "Contratos"
contracts.type.local           → "Local"
contracts.type.corporate       → "Corporativo"
contracts.type.urgent          → "¡URGENTE!"
contracts.action.accept        → "Aceptar"
contracts.action.deliver       → "Entregar"
contracts.action.ignore        → "Ignorar"
contracts.status.expired       → "Expirado"
contracts.status.waiting       → "Esperando contrato..."
contracts.reward               → "Recompensa:"
contracts.penalty              → "Penalización:"

// Eventos de mercado
events.banner.title            → "Evento de Mercado"
events.type.boom_pcs           → "Boom de Demanda (PCs)"
events.type.boom_components    → "Boom de Componentes"
events.type.market_crash       → "Desplome de Mercado"
events.type.corporate_deal     → "Oferta Corporativa"
events.ends_in                 → "Termina en:"

// Milestones (textos en A.9)
milestones.first_circuit_board, milestones.first_laptop_sold, ...
```

**Acción en el PRD:** Añadir **Apéndice B — Convención i18n** con esta tabla completa.

---

### D5-9 — Transversal: Spec de audio para F1, F3 y F4

**Métodos existentes en `AudioService`:**
`playGameMusicLoop`, `playUiClick`, `playUpgradeStarted`, `playUpgradeCompleted`,
`playMaxLevelReached`, `playMachineUnlocked`, `playMachineComplete`, `playResourceSold`,
`playScrapGenerated`, `playProductionTick`, `playError`

**Spec F1 (contratos):**
| Evento | SFX | Justificación |
|--------|-----|---------------|
| Aceptar contrato | `playUiClick()` | Acción de UI confirmada |
| Completar contrato | `playUpgradeCompleted()` | Satisfacción, misma sensación que upgrade |
| Contrato URGENT expirado | `playError()` | Consecuencia negativa clara |
| Nuevo contrato spawneado | — | Aparece pasivamente, no interrumpir |

**Spec F3 (eventos de mercado):**
| Evento | SFX | Justificación |
|--------|-----|---------------|
| Inicio de Boom | `playMachineUnlocked()` | Fanfare existente, evento positivo |
| Market Crash | — | El silencio es el drama |
| Corporate Deal | `playMaxLevelReached()` | Es el SFX más épico disponible |
| Fin de evento | — | Sin audio |

**Spec F4 (milestones):** Sin SFX. La notificación visual es suficiente; no interrumpir el idle.

**No se requieren SFX nuevos para ninguna de las tres fases.**

**Acción en el PRD:** Añadir **Apéndice C — Spec de Audio** con estas tablas.

---

## CIERRE DE SEMANA — Commit y validación (viernes tarde)

- [ ] **CW-1** Leer el PRD de arriba a abajo una vez. Verificar que no queda ninguna frase "sin especificar", "por definir" o "ver implementación". Cada requisito debe poder convertirse directamente en código.
- [ ] **CW-2** Actualizar cabecera del PRD: `**Última actualización:** Abril 2026 — PRD cerrado, listo para implementación`.
- [ ] **CW-3** Commit: `docs: close all PRD gaps — ready for F0 implementation`
- [ ] **CW-4** Push a `full-game-dev`.
- [ ] **CW-5** Opcional: crear `docs/FULL_GAME_TASKS.md` con las tareas técnicas detalladas por fase como checklist de implementación.

---

## Tabla resumen — todos los gaps

| # | Gap | Día | Archivo PRD afectado |
|---|---|---|---|
| D1-1 | Confirmar enum `ResourceType` | Lunes | — |
| D1-2 | Confirmar enum `MachineType` | Lunes | — |
| D1-3 | Confirmar colisión `UPG_STORE_007` | Lunes | — (ya corregido A.5) |
| D1-4 | Confirmar multiplicadores y precio Cobre | Lunes | — |
| D1-5 | Confirmar ausencia event emitter MachineUnlock | Lunes | — |
| D1-6 | Confirmar `getMachineUpgradeIdByMachineType` | Lunes | — |
| D1-7 | Confirmar ausencia `unlockCondition` | Lunes | — |
| D1-8 | Confirmar sell button parametrizado | Lunes | — |
| D1-9 | Verificar tutorial sin Fundidora→Metal | Lunes | F0 req. 6 |
| D2-1 | Conflicto precio Cobre config vs PRD | Martes | F0 req. funcionales |
| D2-2 | Criterio Scrap con números reales | Martes | F0 criterios aceptación |
| D2-3 | Eliminar req. tutorial si no aplica | Martes | F0 req. funcionales |
| D2-4 | **Apéndice A.0** con todos los enum values | Martes | **Apéndice A.0 nueva** |
| D2-5 | Visibilidad máquinas T4-T7 en F2a | Martes | F2 req. funcionales |
| D2-6 | Patrón exacto refactor `MarketService` | Martes | F2 req. funcional 9 |
| D2-7 | Recursos T4-T7 en save migration | Martes | F0 spec migración |
| D3-1 | Sell buttons con patrón `@if` | Miércoles | F2 req. funcional 5 |
| D3-2 | Unlock storage upgrades T4-T7 | Miércoles | F2 req. funcional 7 |
| D3-3 | Layout upgrades panel 33 entradas | Miércoles | F2 req. no funcionales |
| D3-4 | Out-of-scope F1 desactualizado | Miércoles | F1 out of scope |
| D4-1 | Comportamiento "Ignorar" contrato | Jueves | F1 req. 4b + A.7 |
| D4-2 | `SavedContract` type definition | Jueves | A.7 |
| D4-3 | Posición panel contratos | Jueves | F1 req. no funcionales |
| D4-4 | Integración Assembler → ContractsService | Jueves | F1 req. 11b |
| D4-5 | Contrato disponible ocupa slot | Jueves | A.7 |
| D5-1 | Mecanismo spawn F3 (tick + cooldown) | Viernes | F3 req. 1b |
| D5-2 | Cooldown F3 entre sesiones | Viernes | A.8 |
| D5-3 | Nombres servicio/componente F3 | Viernes | F3 req. 1c |
| D5-4 | Triggers milestones: unificar a "producir" | Viernes | A.9 |
| D5-5 | `MilestoneService` dependencias | Viernes | F4 req. 1b |
| D5-6 | `resetToNewGame()` milestones | Viernes | F4 req. 6b |
| D5-7 | `NotificationService` tipo `'milestone'` | Viernes | F4 req. 4b |
| D5-8 | **Apéndice B** — Convención i18n | Viernes | **Apéndice B nueva** |
| D5-9 | **Apéndice C** — Spec de Audio | Viernes | **Apéndice C nueva** |
