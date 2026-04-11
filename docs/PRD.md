# PRD — Scrap Yard Idle: Juego Completo

> **Tipo:** Product Requirements Document  
> **Estado:** En progreso  
> **Última actualización:** Abril 2026  
> **Autor:** Equipo de desarrollo  
>
> Este documento define QUÉ se construye y POR QUÉ. El CÓMO está en `docs/FULL_GAME_TASKS.md`.  
> Cada fase tiene sus propios criterios de aceptación — una fase está terminada cuando cumple todos sus criterios, no antes.

---

## 1. Visión del Producto

**Scrap Yard Idle** es un juego idle/incremental de escritorio donde el jugador convierte chatarra en dinero construyendo y optimizando una cadena industrial de reciclaje. Empieza con un solo golpe de mazo y termina gestionando una fábrica de servidores y Mining Rigs.

### Propuesta de valor central
> *"Cada máquina que desbloqueas hace que la anterior sea más valiosa, no obsoleta."*

El loop económico nunca se rompe: la Trituradora sigue siendo relevante en el late game porque el Metal sigue siendo necesario. El jugador siempre tiene algo que mejorar y siempre puede ver el impacto de cada decisión.

### Plataforma objetivo
- **Primaria:** Windows desktop (Electron)
- **Secundaria:** Web (sin Electron API)

### Audiencia objetivo
Jugadores de idle games de PC (Clicker Heroes, Idle Factory Tycoon, Factorio-lite) que valoran la progresión visible, los números que escalan de forma satisfactoria y la toma de decisiones reales sin micro-gestión constante.

---

## 2. Scope del Juego Completo

### Features confirmadas (en scope)

| Feature | Fase | Motivo |
|---|---|---|
| Rebalanceo Tier 3 (Fundidora) | F0 | Corrige diseño incoherente antes de expandir |
| Nuevas cadenas T4-T7 (9 máquinas, 9 recursos) | F2 | Core del juego completo — sin esto no hay juego |
| Sistema de Contratos | F1 | Añade decisiones reales al idle. Poca complejidad técnica |
| Eventos de Mercado | F3 | Mucho efecto de gameplay, poco código sobre sistema existente |
| Narrativa mínima / Flavor text | F4 | Bajo coste, mejora inmersión en milestones |

### Features fuera de scope (no se implementan en v1)

| Feature | Razón del descarte |
|---|---|
| Tipos de Scrap diferenciados | Complejidad media, bajo retorno visual |
| Sistema de Trabajadores | Riesgo de complicar el loop económico |
| Red Eléctrica | Scope creep. El loop eléctrico ya existe vía Ensambladora Eléctrica |
| Zonas físicas del patio | Rediseño de layout demasiado grande |
| Prestige / soft-reset | Alta complejidad y riesgo de diseño |

---

## 3. Restricciones técnicas transversales

Aplican a todas las fases:

- **Angular 19 standalone** — sin NgModules, `inject()` en lugar de constructor injection
- **Signals para todo estado reactivo** — no RxJS, no BehaviorSubject para estado local
- **i18n obligatorio** — todo texto visible al jugador pasa por `translationService.t(key)`
- **Config files para balance** — ningún número de juego hardcodeado en servicios
- **Dirty flag pattern** — todo cambio de estado que se deba persistir llama `markDirty()`
- **Save versioning** — cada migración de save incrementa `SAVE_VERSION` y tiene su rama en `migrateSave()`
- **Electron safety** — cualquier uso de `window.electronApi` va precedido del check `isElectron`

---

## 4. Ciclo de desarrollo por fases

```
F0 Rebalanceo Fundidora
        ↓
F2a T4-T7 Base de datos (enums, configs, modelos — sin UI nueva)
        ↓
F2b T4-T7 Gameplay completo (upgrades, sell buttons, unlock, QA balance)
        ↓
F1 Sistema de Contratos
        ↓
F3 Eventos de Mercado
        ↓
F4 Narrativa / Flavor Text
        ↓
QA balance sesión larga
        ↓
Build final
```

**Orden justificado:**
- F0 primero porque corrige el diseño base antes de construir encima. Todo lo que viene después asume el nuevo comportamiento de la Fundidora.
- F2 completo (a+b) antes de F1 porque los contratos son más valiosos con recursos T4-T7 disponibles. Además, el refactor de `MarketService` (obligatorio en F2a) es prerequisito para el sistema de multiplicadores de F3.
- F1 antes de F3 porque los eventos de mercado interactúan con el sistema de contratos (multiplicador de precio afecta rewards URGENT). Mejor tener contratos funcionando y probados primero.
- F4 al final porque solo añade notificaciones sobre milestones — cero riesgo de romper mecánicas anteriores.

Cada fase se revisa y valida contra sus criterios de aceptación antes de empezar la siguiente.

### Filosofía de implementación incremental

> **Una fase a la vez. Probada y validada antes de continuar.**

Este proyecto sigue un modelo de desarrollo estrictamente secuencial e incremental:

1. **Implementar una fase completa** — todos sus requisitos funcionales, i18n, config y save integration.
2. **Probar en sesión real** — jugar desde cero hasta cubrir todos los criterios de aceptación de esa fase.
3. **Validar sin regresiones** — confirmar que las fases anteriores siguen funcionando correctamente.
4. **Solo entonces empezar la siguiente fase.**

**No se avanza hasta que la fase actual pasa todos sus criterios.** Una fase con una feature "al 80%" no cuenta como terminada. El objetivo no es velocidad de implementación — es solidez acumulativa.

#### Reglas concretas para cada sesión de trabajo

- Si una tarea falla en QA, se arregla en esa misma fase antes de tocar la siguiente.
- Los cambios de balance se hacen en config, no en código. Si un número de la Apéndice A demuestra ser incorrecto en QA, se corrige en el PRD y en el config file de esa fase antes de continuar.
- Ninguna feature parcial entra en `full-game-dev`. Si una implementación no está terminada, va en una rama de feature y solo se mergea cuando pasa QA.
- Los saves de prueba de una fase deben cargar correctamente en la siguiente (compatibilidad hacia adelante verificada antes de cada merge).

---

---

## FASE 0 — Rebalanceo Tier 3 ✅ COMPLETADA

### Objetivo
Corregir el problema de diseño de la Fundidora antes de construir nada encima. La Fundidora actualmente consume Metal, lo que la pone en competencia directa con la Ensambladora. Esto crea un dilema de asignación que no es interesante — el jugador simplemente detiene la Fundidora.

### Cambio de diseño

**Antes:**
```
Fundidora: 4 Metal → 2 Cobre (0.25/s)
```

**Después:**
```
Fundidora: 2 Scrap → 1 Cobre (0.33/s)
```

Las tres máquinas T2 quedan simétricas:
```
Trituradora: Scrap → Metal     (extracción física)
Separador:   Scrap → Plástico  (separación química)
Fundidora:   Scrap → Cobre     (fundición térmica)
```

### User stories

- Como jugador, quiero que la Fundidora y la Ensambladora no compitan por el mismo recurso, para poder tener ambas activas a la vez sin gestión manual constante.
- Como jugador, quiero que generar más Scrap (manual o automáticamente) mejore todas las cadenas a la vez, para que el Scrap siga siendo la palanca central de todo el loop.

### Requisitos funcionales

1. La Fundidora consume Scrap directo al igual que Trituradora y Separador.
2. El ratio de conversión es 2 Scrap → 1 Cobre por ciclo.
3. La velocidad base se ajusta a 0.33/s (de 0.25/s actual).
4. El precio de venta del Cobre se fija en **$3.0** (era $2.8). Cobre se desbloquea después de Componentes ($3.0) → debe valer al menos igual. La propuesta $2.0 original se descarta: eliminaba el incentivo de procesado.
5. La cadena Fundidora → Ensambladora Eléctrica se verifica como viable (la Fundidora a 0.33/s produce suficiente Cobre para la E.Assembler a 0.2/s).
6. Verificar en `docs/systems.md` que la descripción de la Fundidora es correcta post-F0; actualizar solo si describe la cadena antigua (4 Metal → 2 Cobre).

### Criterios de aceptación

- [x] La Fundidora activa no reduce el suministro de Metal a la Ensambladora en ningún escenario. (F0: consume Scrap, no Metal.)
- [x] Con Fundidora activa y auto-generación nivel 3, la cadena es sostenible con Scrap manual moderado (~5-10 clicks/min). (0.33/s = 1 Cobre cada 3s; E.Assembler demanda 1 Cobre cada 5s — excedente garantizado.)
- [x] El Cobre mantiene utilidad como recurso vendible (precio > Metal) y como input de la Ensambladora Eléctrica. (BASE_PRICES.COPPER = $3.0 > METAL $1.0; E.Assembler sigue consumiendo Cobre.)
- [x] El tutorial first-run no menciona la Fundidora en ningún paso — no requiere cambios. (Confirmado D1-9: ni es.json ni en.json hacen referencia al Smelter en la sección `tutorial`.)

### Out of scope para esta fase
- Añadir máquinas nuevas.
- Cambiar precios de otros recursos.
- Modificar la Ensambladora Eléctrica.

### Spec de migración de save — F0 (SAVE_VERSION 1 → 2)

`SAVE_VERSION` sube de **1 a 2** con F0. En `migrateSave()`, rama `v1 → v2`:

1. Localizar la entrada `SMELTER` en `save.machines`.
2. Reemplazar `baseConsumption` con `[{ resourceId: ResourceType.SCRAP, amount: 2 }]`.
3. Actualizar `baseProduction.amount = 1` y `baseSpeed = 0.33`.
4. Preservar `level` e `isActive`. Resetear `progress = 0`.
5. Inicializar campos F1 con defaults: `save.contracts = []`, `save.lastContractSpawnCheck = Date.now()`, `save.firstContractSpawned = false`.
6. Llamar `this.isDirty.set(true)` al terminar — sin esto el save migrado no se persiste si el jugador cierra el juego antes de una acción.

### Spec de migración de save — F2 (SAVE_VERSION 2 → 3)

`SAVE_VERSION` sube de **2 a 3** con F2. En `migrateSave()`, rama `v2 → v3`:

1. Inicializar los 9 recursos T4-T7 en `save.resources` con `amount: 0` y `capacity` inicial según A.5 si no existen ya en el save.
2. Inicializar las 9 máquinas T4-T7 en `save.machines` con `level: 0, isActive: false, progress: 0` si no existen ya en el save.
3. Llamar `this.isDirty.set(true)` al terminar.

> **Nota:** No se asume merge implícito de `restoreState()`. La inicialización es explícita en esta rama. Los nuevos recursos y máquinas se añaden como entradas adicionales a los arrays **existentes** `save.resources[]` y `save.machines[]` — **NO** se crean campos nuevos en el objeto `save`. Los saves de jugadores que instalaron F0 (v2) y luego saltan a F2 (v3) pasan por esta rama y quedan correctamente inicializados.

---

---

## FASE 1 — Sistema de Contratos

### Objetivo
Añadir una capa de decisiones activas al idle. Sin contratos, el jugador solo maximiza todas las cadenas en paralelo. Con contratos, tiene que elegir qué cadena priorizar en cada momento: ¿activo la Ensambladora y acumulo Componentes para el contrato, o vendo en mercado abierto?

### Experiencia del jugador

El jugador ve hasta 3 contratos simultáneos en un panel lateral. Cada contrato pide entregar X unidades de un recurso en Y segundos a cambio de Z dinero. Puede ignorar una oferta, aceptarla y trabajar hacia ella, o — si es urgente — decidir si el riesgo de la penalización vale el reward multiplicado.

Los contratos locales son fáciles (Metal, Plástico, Cobre) y muy frecuentes. Los corporativos piden Componentes o Comp. Eléctricos, pagan más y dan más tiempo. Los urgentes son raros, exigentes, pero doblan o triplican el precio de mercado.

### User stories

- Como jugador, quiero ver contratos disponibles en todo momento para tener siempre un objetivo claro más allá de "acumular dinero".
- Como jugador, quiero poder ignorar contratos que no me convengan, para que los contratos sean oportunidades y no obligaciones.
- Como jugador, quiero que los contratos urgentes sean visualmente urgentes (timer en rojo, penalización visible), para poder evaluar el riesgo antes de aceptar.
- Como jugador, quiero saber exactamente cuántos recursos necesito entregar y cuántos tengo ahora mismo, para decidir si acepto sin salir del panel.

### Requisitos funcionales

1. El panel de contratos muestra hasta 3 contratos activos/disponibles.
2. Un contrato tiene: tipo, recurso requerido, cantidad, timer, reward en $, penalización en $ (si urgente).
3. Tipos de contrato: LOCAL, CORPORATE, URGENT. El tipo CHAIN se pospone para una versión posterior.
4. El jugador puede aceptar o ignorar cada contrato ofertado.
4b. Ignorar un contrato lo elimina del slot inmediatamente sin penalización. El slot queda libre para el próximo spawn check. Solo los contratos **aceptados** que expiran generan penalización.
5. Al aceptar, el contrato queda activo y el timer empieza.
6. El botón "Entregar" solo se habilita cuando el jugador tiene la cantidad requerida en inventario.
7. Al entregar, los recursos se descuentan y el reward se añade al dinero.
8. Al llegar el timer a 0 con el contrato activo y no completado: si era URGENT, se aplica la penalización; si no, simplemente caduca sin penalización.
9. Los contratos se persisten en el save — si el jugador cierra el juego, los timers se recalculan al cargar como `acceptedAt + durationSeconds * 1000 - Date.now()`. Un contrato que ya expiró mientras el juego estuvo cerrado se marca como expirado en la carga; la penalización URGENT **no se aplica retroactivamente**. Cada vez que `ContractsService` muta el array `contracts` (spawn, aceptar, entregar, expirar, ignorar), debe llamar `this.saveService.markDirty()` para asegurar la persistencia.
10. Un nuevo contrato puede generarse solo cuando hay slot libre (< 3 activos/disponibles).
11. Spawn del primer contrato LOCAL disponible cuando la Ensambladora está desbloqueada.
11b. El primer contrato forzado se detecta mediante `effect()` en `ContractsService` que observa `machinesService.getMachine(MachineType.ASSEMBLER)?.level`. Cuando level ≥ 1 y `firstContractSpawned = false`, se dispara. No se modifica `MachineUnlockService`. El efecto se evalúa solo una vez con éxito: en saves cargados donde la Ensambladora ya estaba desbloqueada, `firstContractSpawned` llega como `true` desde el save y el efecto no re-dispara.

```typescript
// En ContractsService constructor:
effect(() => {
  const level = this.machinesService.getMachine(MachineType.ASSEMBLER)?.level ?? 0;
  if (level >= 1 && !this.saveService.getState().firstContractSpawned) {
    this.spawnForcedLocalContract();
  }
});
```

### Requisitos no funcionales

- El panel es colapsable (igual que el panel de upgrades).
- Timer visual: barra de progreso + número de segundos en formato mm:ss.
- Para contratos URGENT: borde naranja/rojo, timer en rojo cuando queda < 30s, penalización claramente visible.
- Sin animaciones bloqueantes — el jugador nunca pierde control del juego por un contrato.
- El panel de contratos se implementa como una nueva tab 'Contratos' en el panel de upgrades existente. Reutiliza el sistema de tabs y colapsado. Posición y estilo definitivos se confirman en QA.

### Criterios de aceptación

- [ ] El jugador puede completar tres contratos consecutivos sin que el game loop se interrumpa.
- [ ] Ignorar 10 contratos seguidos no rompe nada ni satura la UI.
- [ ] Un contrato URGENT que expira aplica la penalización exacta definida en config y muestra una notificación.
- [ ] Al cerrar y reabrir el juego con un contrato activo, el timer sigue donde estaba (o ha expirado si pasó el tiempo).
- [ ] Los contratos no aparecen antes de que el jugador pueda cumplirlos (el spawn respeta qué máquinas tiene desbloqueadas).
- [ ] Todos los textos del panel están en i18n (es y en).

### Out of scope para esta fase
- Contratos tipo CHAIN (narrativos, encadenados).
- Penalización de "reputación" — solo penalización monetaria.
- Contratos que desbloqueen máquinas como reward.
- Contratos para productos T6-T7 de producción larga (Laptop, PC, Server Rack, Mining Rig) — sus tiempos de producción son demasiado largos para timers de horas. Se pueden habilitar en v1.1 con timers de 24h+.

> ⚠️ **REQUERIMIENTO TRANSVERSAL (CB-07):** `resetToNewGame()` en `save.service.ts` debe extenderse para limpiar el estado de contratos: llamar a `contractsService.reset()` (o equivalente) y reiniciar `lastContractSpawnCheck` y `firstContractSpawned`.

---

---

## FASE 2 — Nuevas cadenas T4-T7

### Objetivo
Implementar el contenido principal del juego completo: 9 máquinas nuevas, 9 recursos nuevos, organizados en 4 tiers de complejidad creciente. Esta es la fase más grande y se divide en dos sub-fases internas:

- **F2a — Base de datos:** enums, configs, modelos. Sin UI nueva aún. El loop ya funciona con las nuevas máquinas.
- **F2b — Gameplay completo:** upgrades, sell buttons, condiciones de unlock, save migration, QA de balance.

### El árbol de producción completo (post-F2)

```
T1: Scrap
T2: Metal · Plástico · Cobre
T3: Componentes · Plástico Reciclado · Comp. Eléctricos
T4: Circuit Board          ← PCB Printer [Cobre + Comp. Eléctricos]
T5: Disco Duro             ← HDD Assembler [Circuit Board + Metal]
    Pantalla               ← Screen Fabricator [Circuit Board + CE + Plástico Reciclado]
T6: GPU                    ← GPU Fab [Circuit Board + Disco Duro + Cobre]
    Smartphone             ← Smartphone Factory [Pantalla + GPU + Circuit Board]
    Laptop                 ← Laptop Workshop [HDD + Pantalla + GPU + Circuit Board]
    Desktop PC             ← PC Builder [HDD + GPU x2 + Circuit Board x2 + Metal]
T7: Mining Rig             ← Mining Rig Assembly [Desktop PC + GPU x4 + CE x2]
    Server Rack            ← Data Center Assembly [Desktop PC x2 + GPU x2 + Circuit Board x4]
```

### Principios de diseño del árbol

- **Ningún recurso T2-T3 queda obsoleto:** Metal entra en HDD (T5) y Desktop PC (T6). Plástico entra en Pantalla (T5). Cobre entra en Circuit Board (T4) y GPU Fab (T6). Comp. Eléctricos entra en Pantalla (T5) y Mining Rig (T7).
- **Ningún recurso T5 queda sin uso inmediato:** Disco Duro entra en GPU Fab (T6), Laptop Workshop (T6) y PC Builder (T6) — el jugador ve destino visible desde el primer ciclo del HDD Assembler.
- **Sin recetas variables** — cada producto es exactamente una máquina. Sin ambigüedad.
- **Todos los productos intermedios son vendibles** — el jugador nunca está forzado a seguir la cadena.
- **El PCB Printer (T4) es el pivot** — desbloquear el T4 abre todo lo demás. Es el momento wow del mid-game.

### User stories

- Como jugador, quiero desbloquear el PCB Printer y sentir que "acaba de empezar el juego de verdad", con múltiples ramas de producción visibles.
- Como jugador, quiero poder vendeer un Laptop o un PC y ver una cantidad de dinero que hace que valga la pena toda la cadena de producción previa.
- Como jugador, quiero que mis mejoras de almacenamiento de Metal y Plástico sigan siendo útiles en T5-T6, para no sentir que mis inversiones anteriores fueron inútiles.
- Como jugador que llega a T7, quiero sentir que gestionó una fábrica industrial real, no solo hice click.

### Requisitos funcionales

1. Los 9 recursos nuevos existen como `ResourceType`, tienen capacidad inicial, precio de mercado y upgrade de almacenamiento.
2. Las 9 máquinas existen como `MachineType`, con inputs/outputs/speed definidos en config.
3. Cada máquina tiene condición de unlock en `MachineUnlockService` — nunca aparecen todas a la vez.
   > **Nota de implementación F2a:** Las 9 máquinas nuevas se añaden a `INITIAL_MACHINES` con `level: 0` desde F2a. El sistema de tarjetas bloqueadas ya existe (`isLocked = machine.level === 0` en `machine-card`). `MachineUnlockService` necesita las nuevas condiciones de A.6 añadidas en `checkAndUnlockMachines()`. No se requiere nueva UI.
4. Orden de unlock progresivo: PCB Printer primero; Data Center y Mining Rig los últimos.
5. Los nuevos recursos tienen botón de venta en el mercado.
   > **Patrón de implementación F2b (D3-1):** Los sell buttons T4-T7 se añaden en `resources-header.component.ts` usando el componente `<app-sell-resource-button>` existente, envueltos en `@if(machinesService.isUnlocked(MachineType.X))`. Aparecen solo al desbloquear la máquina upstream. Ejemplo: `@if (machinesService.isUnlocked(MachineType.PCB_PRINTER)) { <app-sell-resource-button [resourceId]="ResourceType.CIRCUIT_BOARD"></app-sell-resource-button> }`
6. Los upgrades de velocidad existen para todas las máquinas nuevas.
7. Los upgrades de almacenamiento existen para todos los recursos T4-T7: CB, HDD, Screen, GPU, Smartphone, Laptop, Desktop PC, Mining Rig y Server Rack (9 upgrades en total, UPG_STORE_008–016, ver A.5).
   > **Patrón de implementación F2b (D3-2):** Los storage upgrades T4-T7 se añaden al computed `storageUpgrades()` en `upgrades-panel.component.ts` con un campo interno `unlockedBy: MachineType`. Se muestran bloqueados (`isLocked: true`) hasta que la máquina upstream se desbloquea. Ejemplo: `{ id: UpgradeId.UPG_STORE_008, resourceId: ResourceType.CIRCUIT_BOARD, nameKey: 'upgrades.storage.circuit_board', unlockedBy: MachineType.PCB_PRINTER }` — en el map: `isLocked: !this.machinesService.isUnlocked(entry.unlockedBy)`. El modelo `UpgradeDefinition` no cambia — `unlockedBy` es solo un campo interno del computed.
8. El save versioning: F0 sube a v2 (spec en F0). F2 sube a **v3** con su propia rama `v2 → v3` en `migrateSave()` que inicializa los 9 recursos y 9 máquinas nuevas. No se confía en merge implícito de `restoreState()` — la inicialización es explícita en la rama de migración.
9. `MarketService.getPrice()` se refactoriza a mapa de config (`BASE_PRICES: Record<ResourceType, number>`) cubriendo **todos** los recursos (existentes y nuevos). Actualmente es una cadena `if` hardcodeada que retorna 0 para recursos desconocidos, haciendo `isManuallySellable() = false` para cualquier recurso nuevo — con lo que **todos los productos T4-T7 serían insellables** sin este cambio. La refactorización cubre todos los recursos a la vez (no solo los nuevos) porque: (a) evita mantener dos patrones en paralelo, y (b) es prerequisito necesario para que el sistema de multiplicadores de F3 funcione de forma uniforme sobre todos los recursos.
   > **Patrón exacto de implementación:**
   > ```typescript
   > // game-balance.config.ts — ampliar BASE_PRICES con todos los recursos
   > BASE_PRICES: {
   >   [ResourceType.METAL]:               1,
   >   [ResourceType.PLASTIC]:             1.2,
   >   [ResourceType.COPPER]:              3.0,
   >   [ResourceType.COMPONENTS]:          3,
   >   [ResourceType.RECYCLED_PLASTIC]:    3.5,
   >   [ResourceType.ELECTRIC_COMPONENTS]: 6.5,
   >   [ResourceType.CIRCUIT_BOARD]:       15,
   >   [ResourceType.HDD]:                 35,
   >   [ResourceType.SCREEN]:              40,
   >   [ResourceType.GPU]:                 100,
   >   [ResourceType.SMARTPHONE]:          300,
   >   [ResourceType.LAPTOP]:              600,
   >   [ResourceType.DESKTOP_PC]:          800,
   >   [ResourceType.MINING_RIG]:          2200,
   >   [ResourceType.SERVER_RACK]:         3000,
   > } as Partial<Record<ResourceType, number>>
   >
   > // market.service.ts — getPrice() refactorizado
   > getPrice(resourceId: ResourceType): number {
   >   return MARKET_CONFIG.BASE_PRICES[resourceId] ?? 0;
   > }
   > ```
10. Los enums `ResourceType`, `MachineType` y `UpgradeId` se extienden con todos los valores nuevos antes de cualquier código de config. Los IDs a añadir: `UPG_MACH_009`–`UPG_MACH_017` y `UPG_STORE_008`–`UPG_STORE_016`.
11. Todos los assets (iconos y cards) existen al menos como placeholders del tamaño correcto.
12. Todos los textos en i18n (es y en).

### Requisitos no funcionales

- La UI de machine-list soporta el mayor número de cards sin overflow o layout roto.
- El rendimiento del game loop no degrada con 17 máquinas activas simultáneamente.
- El panel de upgrades soporta 33 entradas (16 storage + 17 machine speed) con scroll vertical. `machineOrder` en `upgrades-panel.component.ts` se amplía con 9 valores de `MachineType` en orden de unlock: `PCB_PRINTER, HDD_ASSEMBLER, SCREEN_FABRICATOR, GPU_FAB, SMARTPHONE_FACTORY, LAPTOP_WORKSHOP, PC_BUILDER, MINING_RIG_ASSEMBLY, DATA_CENTER_ASSEMBLY`. Los bloqueados aparecen al final de cada sección con estilo gris.

### Balance objetivo (T4-T7)

| Producto | $/unidad | Tiempo producción estimado (sin upgrades) | $/s efectivo |
|---|---|---|---|
| Circuit Board | 15 | ~6s | 2.55 |
| Disco Duro | 35 | ~12s | 2.80 |
| Pantalla | 40 | ~14s | 2.80 |
| GPU | 100 | ~20s | 5.0 |
| Smartphone | 300 | ~22s | 13.5 |
| Laptop | 600 | ~28s | 21.0 |
| Desktop PC | 800 | ~40s | 20.0 |
| Mining Rig | 2200 | ~56s | 39.6 |
| Server Rack | 3000 | ~59s | 51.0 |

Nota: estos números se ajustan en QA (T-15). Son targets de diseño, no valores hardcodeados.

### Criterios de aceptación

- [ ] El jugador puede completar la cadena entera desde Scrap hasta Server Rack en una sesión sin softlocks.
- [ ] El PCB Printer no starvea de inputs con cadena T3 activa al nivel de unlock.
- [ ] Los recursos intermedios (HDD, Screen, GPU) no se acumulan indefinidamente sin posibilidad de venta.
- [ ] La diferencia de dinero entre vender en T3 vs T7 es al menos ×10 en $/s sostenido.
- [x] El layout de machine-list es jugable con las 17 máquinas activas (sin overflow visible, scroll si es necesario).
- [x] Saves antiguos cargan correctamente — migración v2→v3 explícita en `migrateSave()` inicializa recursos y máquinas T4-T7.
- [ ] Todos los assets son visibles (no broken images) — pendiente confirmar iconos: `desktop_pc_resource.png`, `mining_rig_resource.png`, `server_rack_resource.png`.
- [x] Todos los strings están en es y en sin claves faltantes.
- [x] Sell buttons aparecen/desaparecen correctamente según máquina upstream desbloqueada (guard `@if(machinesService.isUnlocked(...))`).

### Estado de implementación F2 (actualizado)

**✅ Completado — todos los requisitos funcionales:**
- Req 1–4: 9 recursos + 9 máquinas + unlock conditions + orden progresivo
- Req 5: Sell buttons T4-T7 en `resources-header` con `@if(machinesService.isUnlocked(MachineType.X))`. T1-T3 también uniformizados con el mismo patrón.
- Req 6: Upgrades de velocidad UPG_MACH_009–017 (todas las máquinas)
- Req 7: Upgrades de almacenamiento UPG_STORE_008–016 (todos los recursos T4-T7) con `isLocked` vía `unlockedBy`
- Req 8: `SAVE_VERSION = 3`, rama `v2 → v3` en `migrateSave()` inicializa explícitamente los 9 recursos y 9 máquinas T4-T7, llama `isDirty.set(true)`
- Req 9: `getPrice()` refactorizado a `return MARKET_CONFIG.BASE_PRICES[resourceId as ResourceType] ?? 0`. `BASE_PRICES` cubre los 15 recursos vendibles con precios exactos del PRD A.3
- Req 10: Enums `ResourceType`, `MachineType`, `UpgradeId` extendidos. `getMachineUpgradeIdByMachineType()` mapea las 17 máquinas
- Req 11: Assets presentes (verificación visual pendiente QA)
- Req 12: i18n completo (es + en)

**⏳ Pendiente QA (criterios de aceptación — requieren sesión de juego):**
- Jugar cadena completa Scrap → Server Rack
- Verificar balance PCB Printer (no starvation)
- Verificar diferencia ×10 en $/s T3 vs T7
- Confirmar assets sin broken images (desktop_pc, mining_rig, server_rack)

### Out of scope para esta fase
- Animaciones de producción por máquina.
- Más tiers más allá de T7.
- Recetas variables o máquinas con múltiples outputs.
- Quality Control (máquina especial del roadmap) — pospuesta a v1.1 si aplica.

---

---

## FASE 3 — Eventos de Mercado

### Objetivo
Añadir variabilidad temporal a los precios. Los eventos de mercado crean decisiones de timing que no existen actualmente: ¿vendo ahora o espero el boom? ¿liquido todo durante el crash o aguanto?

Esta capa transforma el mercado de "vende cuando puedas" a "el cuándo importa".

### Tipos de evento

| Tipo | Efecto | Duración | Frecuencia |
|---|---|---|---|
| Boom de demanda (PCs) | Laptops, Desktop PC, Smartphones ×3 precio | 120s | Común |
| Boom de componentes | Componentes, Comp. Eléctricos ×2 precio | 180s | Común |
| Market Crash | Todos los recursos ×0.4 precio | 60s | Poco frecuente |
| Corporate Deal | Server Rack, Mining Rig ×5 precio | 300s | Raro, solo si T7 desbloqueado |

Solo puede estar activo un evento a la vez. Entre eventos hay un intervalo mínimo de 5 minutos.

### User stories

- Como jugador, quiero ver en pantalla cuando hay un evento activo (sin tener que buscar en menús) para poder reaccionar a tiempo.
- Como jugador, quiero que los eventos de boom me recompensen si estaba acumulando stock para vender, no solo si tengo buena suerte.
- Como jugador durante un market crash, quiero tener la opción de aguantar (no vender nada) y que eso sea una decisión válida, no una pérdida automática.
- Como jugador, quiero que los eventos no sean tan frecuentes que pierdan su valor de decisión.

### Requisitos funcionales

1. Un evento de mercado es un estado global temporal con un timer.
1b. `MarketEventService` se integra en el game loop mediante `tick()` llamado cada segundo. El spawn es garantizado al cumplirse el cooldown; solo la distribución de tipos usa probabilidades (35/35/20/10%). El timer del cooldown es interno y no persiste en el save.
1c. Nuevo servicio: `MarketEventService` en `src/app/services/market-event.service.ts`. Nuevo componente: `EventBannerComponent` en `src/app/components/event-banner/event-banner.component.ts`. El banner se inserta en `app.html` al mismo nivel que `notification-container`.
2. Solo puede haber un evento activo simultáneamente.
3. El evento afecta los precios de venta en tiempo real (los botones de venta muestran el precio modificado). **Arquitectura:** `MarketService` expone un signal `activeEventMultipliers = signal<Partial<Record<ResourceType, number>>>({})`. El precio efectivo de un recurso es `BASE_PRICES[resourceId] * (activeEventMultipliers()[resourceId] ?? 1.0)`. Esto permite que cada evento afecte exactamente los recursos que le corresponden (Boom PCs → solo Laptop/Desktop/Smartphone; Market Crash → todos; etc.) sin que se filtren unos con otros. No mutar `BASE_PRICES` — es una constante estática. Fórmula final con batch bonus: `BASE_PRICE × eventMultiplier × batchBonus` (multiplicativo). Al terminar un evento, se resetea `activeEventMultipliers` a `{}`.
4. El banner de evento es visible mientras el evento está activo y desaparece al terminar.
5. El banner muestra: tipo de evento, recursos afectados, multiplicador, tiempo restante.
6. Al inicio y al fin del evento se muestra una notificación.
7. Los eventos no se persisten en el save (son efímeros — si cierras el juego durante uno, simplemente no estará al volver).
8. El Corporate Deal solo puede generarse si el jugador tiene **`MachineType.DATA_CENTER_ASSEMBLY`** (Data Center Assembly) o **`MachineType.MINING_RIG_ASSEMBLY`** (Mining Rig Assembly) desbloqueados — cualquiera de los dos es suficiente. Estas son las únicas máquinas T7. El término “T7 machine unlocked” en cualquier parte del documento se refiere exclusivamente a estas dos.

### Criterios de aceptación

- [ ] El precio mostrado en el botón de venta cambia visiblemente durante un evento (sin necesidad de cerrar/abrir el panel).
- [ ] El market crash dura exactamente 60s y los precios vuelven a 100% al segundo 61.
- [ ] En una sesión de 60 minutos, el jugador ve entre 4 y 8 eventos de distinto tipo (probabilidades correctas).
- [ ] El Corporate Deal no aparece hasta que el jugador tiene al menos una máquina T7 desbloqueada.
- [ ] Los eventos no se solapan (si hay uno activo, no puede generarse otro hasta que termine).
- [ ] El banner de evento no tapa controles importantes de la UI.

### Out of scope para esta fase
- Minijuego de subasta.
- Eventos de fábrica (averías, camiones de scrap) — posibles en v1.1.
- Eventos de mercado que afecten el coste de upgrades.

---

---

## FASE 4 — Narrativa mínima / Flavor Text

### Objetivo
Dar personalidad al patio sin añadir sistemas nuevos. Pequeñas líneas de texto que aparecen en momentos clave de la progresión del jugador. El jugador no las busca — le sorprenden cuando llega a un milestone.

Esta fase hace que el juego se sienta vivo con el mínimo de trabajo.

### Lista de milestones con flavor text

| Milestone | Trigger | Texto (ES) |
|---|---|---|
| Primera Circuit Board | Producir 1 CB | "Primera placa ensamblada. Empieza lo bueno." |
| Primer Laptop vendido | Producir 1 Laptop por primera vez | "Un laptop. Alguien va a pagar mucho por esto." |
| Primer Desktop PC vendido | Producir 1 Desktop PC por primera vez | "Un PC completo. Esto es industria de verdad." |
| Primer Server Rack completado | Completar 1 Server Rack | "Un rack de servidores. El patio ya no parece un patio." |
| Primer contrato aceptado | Aceptar cualquier contrato | "Tu primer contrato. Que empiece el negocio." |
| Primer contrato urgente completado | Completar un contrato URGENT | "Presión, velocidad, dinero. Bienvenido." |
| Primer boom de mercado aprovechado | Vender durante un boom | "¿Ves el timing? Eso se llama vender bien." |

### Requisitos funcionales

1. Cada milestone solo se dispara una vez por partida (persistido en save).
1b. Nuevo `MilestoneService` en `src/app/services/milestone.service.ts`. Expone `completedMilestones = signal<string[]>([])` cargado desde save. Método `check(id: string, condition: boolean): void` — si `condition = true` y el milestone no está completado, marca completado y llama `NotificationService.show(msg, 'milestone')`. No inyecta `ResourcesService` — recibe push desde quien detecta el evento.
- Para triggers de producción: `GameLoopService` llama `milestoneService.check()` tras cada output de máquina.
- Para triggers de contrato: `ContractsService` llama `check()` al aceptar y al completar.
- Para triggers de boom: `MarketService.sell()` llama `milestoneService.check('first_boom_sell', this.activeEventMultipliers().size > 0)` directamente al completar una venta. `MarketService` inyecta `MilestoneService` (no hay ciclo DI: MarketService → MilestoneService es directo). `MarketEventService` no participa en este flujo.
2. El flavor text aparece como notificación especial (no modal — no bloquea el juego).
3. La notificación de flavor tiene una duración mayor que las notificaciones estándar (5s vs 2s).
4. Estilo visual diferenciado (borde o color distinto) para distinguished del feedback de sistema.
4b. En `notification.service.ts`: añadir `'milestone'` al union type y `DURATIONS.milestone = 5000`. En `notification-container.component.ts`: añadir CSS `.notification--milestone { border-left: 3px solid #f97316; }` (naranja Tailwind 500).
5. Textos en i18n (es y en).
6. Los milestones completados se guardan en el save como `string[]`.
6b. `resetToNewGame()` en `save.service.ts` incluye `milestoneService.reset()` que limpia `completedMilestones = []`. Mismo patrón que el reset de contratos.

### Criterios de aceptación

- [ ] Cada flavor text aparece exactamente una vez por partida, incluso si recargo el save.
- [ ] Ninguno de los flavor texts bloquea una acción del jugador.
- [ ] El flavor text del primer contrato aceptado aparece en el momento en que el jugador pulsa "Aceptar", no antes.
- [ ] Todos los textos están en i18n (es y en).

### Out of scope para esta fase
- Diálogos con NPCs.
- Historia con progresión narrativa (arcos, personajes).
- Flavor text para cada upgrade comprado (demasiado voluminoso).

---

---

## 5. Criterios de finalización del juego completo

El juego completo está terminado cuando:

- [x] F0 — Fundidora recibe Scrap directo y el balance T3 está validado en QA.
- [ ] F1 — El jugador puede completar, ignorar y que expiren contratos en una sesión de 30 min sin bugs.
- [ ] F2 — El jugador puede llegar de Scrap a Server Rack en una sesión sin softlocks ni crashes.
- [ ] F3 — Los 4 tipos de evento aparecen con las frecuencias correctas y los precios cambian en tiempo real.
- [ ] F4 — Los 7 flavor texts aparecen exactamente una vez en el momento correcto.
- [ ] Build de producción (`pnpm package:win`) genera un `.exe` funcional sin errores de consola.
- [ ] El save es compatible hacia adelante: un save de v1 (demo) carga en el juego completo.
- [ ] Sin strings en inglés/sin traducir en la build final.

---

## 6. Referencias

| Documento | Contenido |
|---|---|
| `docs/FULL_GAME_TASKS.md` | Tareas técnicas detalladas, archivo por archivo |
| `docs/FULL_GAME_EXPANSION_ROADMAP.md` | Diseño y razonamiento de cada capa |
| `docs/todo.md` | Tareas de la demo + roadmap de lanzamiento |
| `docs/systems.md` | Documentación técnica de los sistemas actuales |

---

---

## Apéndice A — Tablas de Balance

> **Fuente de verdad numérica para la implementación.**
> Todos los valores de esta sección se copian directamente a los archivos de config.
> No hardcodear nada en servicios — todo va en `machines.config.ts`, `game-balance.config.ts` y `upgrade-definitions.config.ts`.

### Cómo leer la tabla de máquinas

- `baseSpeed` = fracción de ciclo completada por tick (1 tick = 1 segundo).
  - baseSpeed 0.17 → ciclo de ~6s → 0.17 outputs/s
- `$/s efectivo` = precio_output × baseSpeed (sin upgrades, sin batch bonus)
- La supply chain se valida a speeds base: cada máquina upstream puede alimentar a la downstream **sin upgrades** para las primeras máquinas de cada tier. En tiers altos, los upgrades son obligatorios por diseño.

---

### A.0 — Enum values nuevos (F2a)

Valores exactos a añadir en los enums existentes. Patrón: `SCREAMING_SNAKE_CASE` como key, `snake_case` como string value.

```typescript
// ResourceType — añadir después de ELECTRIC_COMPONENTS
CIRCUIT_BOARD  = 'circuit_board',
HDD            = 'hdd',
SCREEN         = 'screen',
GPU            = 'gpu',
SMARTPHONE     = 'smartphone',
LAPTOP         = 'laptop',
DESKTOP_PC     = 'desktop_pc',
SERVER_RACK    = 'server_rack',
MINING_RIG     = 'mining_rig',

// MachineType — añadir después de ELECTRIC_ASSEMBLER
PCB_PRINTER          = 'pcb_printer',
HDD_ASSEMBLER        = 'hdd_assembler',
SCREEN_FABRICATOR    = 'screen_fabricator',
GPU_FAB              = 'gpu_fab',
SMARTPHONE_FACTORY   = 'smartphone_factory',
LAPTOP_WORKSHOP      = 'laptop_workshop',
PC_BUILDER           = 'pc_builder',
DATA_CENTER_ASSEMBLY = 'data_center_assembly',
MINING_RIG_ASSEMBLY  = 'mining_rig_assembly',

// UpgradeId — añadir después de UPG_MACH_008 y UPG_STORE_007
UPG_MACH_009  = 'UPG_MACH_009',   // PCB Printer speed
UPG_MACH_010  = 'UPG_MACH_010',   // HDD Assembler speed
UPG_MACH_011  = 'UPG_MACH_011',   // Screen Fabricator speed
UPG_MACH_012  = 'UPG_MACH_012',   // GPU Fab speed
UPG_MACH_013  = 'UPG_MACH_013',   // Smartphone Factory speed
UPG_MACH_014  = 'UPG_MACH_014',   // Laptop Workshop speed
UPG_MACH_015  = 'UPG_MACH_015',   // PC Builder speed
UPG_MACH_016  = 'UPG_MACH_016',   // Mining Rig Assembly speed
UPG_MACH_017  = 'UPG_MACH_017',   // Data Center Assembly speed
UPG_STORE_008 = 'UPG_STORE_008',  // Circuit Board storage
UPG_STORE_009 = 'UPG_STORE_009',  // HDD storage
UPG_STORE_010 = 'UPG_STORE_010',  // Screen storage
UPG_STORE_011 = 'UPG_STORE_011',  // GPU storage
UPG_STORE_012 = 'UPG_STORE_012',  // Smartphone storage
UPG_STORE_013 = 'UPG_STORE_013',  // Laptop storage
UPG_STORE_014 = 'UPG_STORE_014',  // Desktop PC storage
UPG_STORE_015 = 'UPG_STORE_015',  // Mining Rig storage
UPG_STORE_016 = 'UPG_STORE_016',  // Server Rack storage
```

---

### A.1 — Rebalanceo F0: Fundidora

| Parámetro | Antes | Después |
|---|---|---|
| Inputs/ciclo | 4 Metal | 2 Scrap |
| Output/ciclo | 2 Cobre | 1 Cobre |
| baseSpeed | 0.25/s | 0.33/s |
| Precio de venta Cobre | $2.8 | $3.0 |

**Rationale:** La Fundidora dejaba de competir con la Ensambladora por Metal. Precio de Cobre se ajusta a $3.0 (Cobre se desbloquea después de Componentes; $2.0 original eliminaba incentivo de procesado). A 0.33/s produce 0.33 Cobre/s — suficiente para alimentar al PCB Printer (0.17 Cobre/s consumido) con margen.

---

### A.2 — Máquinas T4-T7

| Máquina | Inputs / ciclo | Output / ciclo | baseSpeed | Ciclo | $/s efectivo |
|---|---|---|---|---|---|
| **PCB Printer** | 1 Cobre + 2 Comp. Eléctrico | 1 Circuit Board | 0.17/s | ~6s | $2.55 |
| **HDD Assembler** | 1 Circuit Board + 2 Metal | 1 Disco Duro | 0.08/s | ~12s | $2.80 |
| **Screen Fabricator** | 1 Circuit Board + 1 Comp. Eléctrico + 1 Plástico Reciclado | 1 Pantalla | 0.07/s | ~14s | $2.80 |
| **GPU Fab** | 1 Circuit Board + 1 Disco Duro + 1 Cobre | 1 GPU | 0.05/s | ~20s | $5.00 |
| **Smartphone Factory** | 1 Pantalla + 1 GPU + 1 Circuit Board | 1 Smartphone | 0.045/s | ~22s | $13.50 |
| **Laptop Workshop** | 1 Disco Duro + 1 Pantalla + 1 GPU + 1 Circuit Board | 1 Laptop | 0.035/s | ~28s | $21.00 |
| **PC Builder** | 1 Disco Duro + 2 GPU + 2 Circuit Board + 1 Metal | 1 Desktop PC | 0.025/s | ~40s | $20.00 |
| **Mining Rig Assembly** | 1 Desktop PC + 4 GPU + 2 Comp. Eléctrico | 1 Mining Rig | 0.018/s | ~56s | $39.60 |
| **Data Center Assembly** | 2 Desktop PC + 2 GPU + 4 Circuit Board | 1 Server Rack | 0.017/s | ~59s | $51.00 |

#### Validación de supply chain (speeds base, sin upgrades)

| Recurso | Producción upstream | Demanda acumulada | Margen |
|---|---|---|---|
| Cobre | Smelter 0.33/s | PCB (0.17) + GPU Fab (0.05) + **E.Assembler (0.20)** = **0.42/s** | ⚠️ Déficit -0.09/s — E.Assembler ya consume 0.20 Cu/s en T3. Con GPU Fab activa, la Fundidora es el bottleneck. Requiere upgrade de Fundidora antes de activar GPU Fab. |
| Componentes | Assembler 0.22/s | **E.Assembler (0.20)** = **0.20/s** | ✅ +0.02/s — PCB Printer no consume Componentes (solo Comp. Eléctrico); solo E.Assembler los consume. |
| Circuit Board | PCB Printer 0.17/s | HDD (0.08) + Screen (0.07) + GPU (0.05) + Smartphone (0.045) + Laptop (0.035) + PC Builder (0.05) + DataCenter (0.068) = **0.398/s** (cadena T4-T7 completa) | ⚠️ Déficit severo a plena cadena, pero menor que antes (GPU Fab ya solo consume 0.05 CB/s vs 0.10 anterior). Diseño en fases: activar HDD+Screen → upgrade PCB → activar GPU Fab → upgrade más antes de T7. Se necesitan ≥3 PCB Printers upgradeados para alimentar T6+T7 completo. |
| Disco Duro | HDD 0.08/s | **GPU Fab (0.05)** + Laptop (0.035) + PC Builder (0.025) = **0.11/s** | ⚠️ Déficit leve con GPU Fab activa — diseño intencional. HDD Assembler es el primer bottleneck del jugador en T6. Upgrade de HDD Assembler necesario antes de activar Laptop Workshop. |
| Pantalla | Screen 0.07/s | Smartphone (0.045) + Laptop (0.035) = 0.08/s | ⚠️ Déficit en base — jugador debe upgradear Screen Fabricator antes de activar Laptop Workshop (diseño intencional) |
| GPU | GPU Fab 0.05/s | Smartphone (0.045) + Laptop (0.035) + PC Builder (0.05) + Mining Rig (0.072) + Data Center (0.034) = **0.236/s** | ⚠️ **Cuello de botella principal T6-T7** — GPU Fab es la máquina crítica del mid-game. El jugador decide constantemente entre vender GPUs ($80) o alimentar la cadena. Requiere upgrades masivos antes de activar T7. |
| Desktop PC | PC Builder 0.025/s | Mining Rig (0.018) + Data Center (0.034) = 0.052/s | ⚠️ Déficit en base — se necesitan upgrades o múltiples PC Builders (diseño intencional, son máquinas T7) |
| Comp. Eléctrico | E.Assembler 0.20/s | PCB (0.34) + Screen (0.07) + Mining Rig (0.036) = **0.446/s** | ⚠️ Déficit -0.246/s — PCB Printer consume 2 CE/ciclo (0.34 CE/s). Upgrade de E.Assembler obligatorio antes de activar el PCB Printer. GPU Fab ya no consume CE. |
| Plástico Reciclado | Recycler 0.50/s | E.Assembler (0.20) + Screen (0.07) = 0.27/s | ✅ holgado — Recycler tiene capacidad suficiente para ambos consumidores |
| Plástico | Separator 0.50/s | — (Screen Fabricator ya no lo consume) | ✅ sin competencia |
| Metal | Crusher 1.0 Metal/s | HDD (0.16) + PC Builder (0.025) = 0.185/s | ✅ holgado — HDD Assembler consume 2 Metal/ciclo (0.16 Metal/s). Crusher sigue siendo suficiente. |

**Nota:** Los déficits marcados con ⚠️ son **intencionados**. Las máquinas T7 deben requerir que el jugador haya invertido en upgrades de las máquinas anteriores. Nunca debe ser posible activar Data Center Assembly sin haber upgradeado seriamente el PCB Printer y PC Builder.

---

### A.3 — Precios de mercado (sell)

| Recurso | $/unidad | Tier |
|---|---|---|
| Scrap | — (no vendible) | T1 |
| Metal | $1.0 | T2 |
| Plástico | $1.2 | T2 |
| Cobre | $3.0 | T2 |
| Componentes | $3.0 | T3 |
| Plástico Reciclado | $3.5 | T3 |
| Comp. Eléctricos | $6.5 | T3 |
| Circuit Board | $15 | T4 |
| Disco Duro | $35 | T5 |
| Pantalla | $40 | T5 |
| GPU | $100 | T6 |
| Smartphone | $300 | T6 |
| Laptop | $600 | T6 |
| Desktop PC | $800 | T6 |
| Mining Rig | $2200 | T7 |
| Server Rack | $3000 | T7 |

Todos los recursos T4-T7 son vendibles en el mercado. La GPU ($100) es el componente pivote de la cadena T6-T7: procesar un HDD en GPU ya es estrictamente más rentable ($2.35/s) que vender el HDD directamente ($1.52/s), pero el mayor valor está como input de Smartphone, Laptop, PC Builder, Mining Rig y Data Center — el jugador decide constantemente si vende o reinvierte.

---

### A.4 — Costes base de upgrade de máquina

Se usa el mismo sistema que las máquinas actuales: `base_cost × COST_MULTIPLIER^(level-1)`.

> ⚠️ **CORRECCIÓN (CC-05):** El multiplicador para upgrades de **máquinas** en código es `DEFAULT_MULTIPLIER = 1.26` (ver `game-balance.config.ts`), **no 1.20**. El storage usa `STORAGE_MULTIPLIER = 1.20`. Los costes base son para nivel 1. A nivel 10: `base × 1.26^9 ≈ base × 11.3×`. Usa `1.26` para estimar costes reales de upgrades de máquina.

| MachineType | UpgradeId | Base cost $ |
|---|---|---|
| Crusher | UPG_MACH_001 | 65 *(sin cambio)* |
| Smelter | UPG_MACH_002 | 85 *(sin cambio)* |
| Separator | UPG_MACH_003 | 90 *(sin cambio)* |
| Assembler | UPG_MACH_004 | 120 *(sin cambio)* |
| Packager | UPG_MACH_005 | 135 *(sin cambio)* |
| Recycler | UPG_MACH_006 | 165 *(sin cambio)* |
| Electric Assembler | UPG_MACH_007 | 365 *(sin cambio)* |
| Electric Packager | UPG_MACH_008 | 405 *(sin cambio)* |
| **PCB Printer** | **UPG_MACH_009** | **550** |
| **HDD Assembler** | **UPG_MACH_010** | **650** |
| **Screen Fabricator** | **UPG_MACH_011** | **700** |
| **GPU Fab** | **UPG_MACH_012** | **850** |
| **Smartphone Factory** | **UPG_MACH_013** | **1200** |
| **Laptop Workshop** | **UPG_MACH_014** | **1600** |
| **PC Builder** | **UPG_MACH_015** | **2000** |
| **Mining Rig Assembly** | **UPG_MACH_016** | **2500** |
| **Data Center Assembly** | **UPG_MACH_017** | **3200** |

---

### A.5 — Upgrades de almacenamiento (recursos T4-T7)

Usa el mismo sistema: `base_cost × STORAGE_MULTIPLIER^(level-1)` con `STORAGE_MULTIPLIER = 1.20`, `MAX_LEVEL = 50`.

> ⚠️ **CORRECCIÓN (CB-02):** `UPG_STORE_007` está **ya ocupado en código** por el upgrade de almacenamiento de **Cobre** (`upgrade.model.ts`, `upgrade-definitions.config.ts`). Los upgrades T4-T7 empiezan en `UPG_STORE_008`.

| Recurso | UpgradeId | Capacidad inicial | Incremento/nivel | Base cost $ |
|---|---|---|---|---|
| Circuit Board | **UPG_STORE_008** | 8 | +4 | 100 |
| Disco Duro | **UPG_STORE_009** | 6 | +3 | 150 |
| Pantalla | **UPG_STORE_010** | 6 | +3 | 150 |
| GPU | **UPG_STORE_011** | 4 | +2 | 200 |
| Smartphone | **UPG_STORE_012** | 5 | +2 | 200 |
| Laptop | **UPG_STORE_013** | 3 | +2 | 250 |
| Desktop PC | **UPG_STORE_014** | 3 | +2 | 250 |
| Mining Rig | **UPG_STORE_015** | 2 | +1 | 400 |
| Server Rack | **UPG_STORE_016** | 2 | +1 | 400 |

Todos los recursos son intermedios o finales con demanda upstream (Desktop PC alimenta T7), así que todos necesitan upgrades de almacenamiento para que el jugador pueda acumular stock antes de vender.

---

### A.6 — Condiciones de unlock de máquinas T4-T7

Mismo patrón que `MachineUnlockService` actual: unlock cuando la(s) máquina(s) prerrequisito alcanzan el nivel indicado.

| Máquina a desbloquear | Prerrequisito(s) |
|---|---|
| PCB Printer | Electric Assembler nivel ≥ 4 |
| HDD Assembler | PCB Printer nivel ≥ 3 |
| Screen Fabricator | PCB Printer nivel ≥ 5 |
| GPU Fab | HDD Assembler nivel ≥ 2 **Y** Screen Fabricator nivel ≥ 2 |
| Smartphone Factory | Screen Fabricator nivel ≥ 3 |
| Laptop Workshop | HDD Assembler nivel ≥ 4 **Y** Screen Fabricator nivel ≥ 3 |
| PC Builder | GPU Fab nivel ≥ 2 **Y** HDD Assembler nivel ≥ 3 |
| Mining Rig Assembly | GPU Fab nivel ≥ 3 **Y** PC Builder nivel ≥ 2 |
| Data Center Assembly | PC Builder nivel ≥ 3 |

**Progresión de unlock resultante:**
```
E.Assembler desbloqueada
  → PCB Printer disponible (E.Assembler Lv4)
    → [Lv3] HDD Assembler disponible
    → [Lv5] Screen Fabricator disponible
      → [HDD Lv2 + Screen Lv2] GPU Fab disponible
      → [Screen Lv3] Smartphone Factory disponible
      → [HDD Lv4 + Screen Lv3] Laptop Workshop disponible  ← escalonado 1 nivel tras Smartphone
        → [GPU Lv2 + HDD Lv3] PC Builder disponible
          → [GPU Lv3 + PC Lv2] Mining Rig Assembly disponible
          → [PC Lv3] Data Center Assembly disponible
```

El jugador nunca ve 3+ máquinas nuevas de golpe. Cada unlock es un momento individual con su notificación.

> **Notación `≥ N`:** En todas las condiciones de esta tabla, `N` es el **nivel** (`machine.level`) de la máquina, no la cantidad de instancias. Nivel 1 = recién desbloqueada. Nivel 3 = el jugador compró el upgrade de velocidad 2 veces.

> ⚠️ **REQUERIMIENTO DE IMPLEMENTACIÓN (CB-03):** `getMachineUpgradeIdByMachineType()` en `upgrades.service.ts` mapea actualmente solo los 8 `MachineType` existentes. Para que las condiciones `≥ 2` y `≥ 3` funcionen, debe extenderse para mapear los 9 nuevos tipos (`PCB_PRINTER` → `UPG_MACH_009`, … `MINING_RIG_ASSEMBLY` → `UPG_MACH_017`). Sin este mapeo, `machine.level` nunca supera 1 y **toda la cadena T5-T7 queda bloqueada permanentemente**.

---

### A.7 — Sistema de Contratos (F1)

#### Parámetros de spawn

| Config | Valor |
|---|---|
| Slots máximos simultáneos | 3 |
| Intervalo de comprobación de spawn | 60s |
| Distribución LOCAL / CORPORATE / URGENT | 60% / 30% / 10% |
| Primer contrato | Spawn forzado LOCAL cuando Assembler se desbloquea |

> **Slot note:** Un contrato disponible (offer state, no aceptado) **ocupa slot**. El jugador puede tener hasta 3 contratos en cualquier combinación: disponible, activo-con-timer. No hay un cuarto estado 'expirado visible' — los contratos expirados se eliminan del array al detectar expiración en el tick.

#### Parámetros por tipo

Los multiplicadores de reward/penalty son fijos por tipo. Los rangos de cantidad y timer son orientativos — los valores exactos los definen los templates del pool (ver abajo).

| Tipo | Recursos elegibles | Multiplier reward | Penalización |
|---|---|---|---|
| LOCAL | Materias primas (T1-T3): Metal, Plástico, Cobre | ×1.2 | Ninguna (expira silenciosamente) |
| CORPORATE | Componentes manufacturados (T2-T7): Components → Server Rack | ×1.5 | Ninguna (expira silenciosamente) |
| URGENT | Cualquier recurso desbloqueado | ×3.0 | qty × BASE_PRICE × 1.0 (descuento de dinero) |

> **Durations note:** Los timers de URGENT varían según el recurso: 120s (materias primas) hasta 600s (Mining Rig). Los templates son la fuente de verdad — la tabla de tipos es orientativa.

#### Condiciones de spawn por recurso

Un contrato solo puede pedir un recurso que el jugador **ya puede producir** (la máquina que produce ese recurso está desbloqueada en `level >= 1`). El gating lo impone el campo `requiredMachine` de cada template (ver pool abajo) — no hay lógica de gating adicional.

**Recursos excluidos del spawn pool (siempre):** `ResourceType.SCRAP`, `ResourceType.MONEY`.

---

#### Pool de templates de contratos

Los templates son el **single source of truth** para los contratos. El spawn no trabaja con rangos aleatorios — samplea un template, aplica las cantidades y calcula el reward en el momento.

**Algoritmo de spawn:**
1. Filtrar templates donde `machinesService.getMachine(template.requiredMachine)?.level >= 1`.
2. Elegir tipo — LOCAL / CORPORATE / URGENT — con distribución 60 / 30 / 10 %.
3. Filtrar templates del tipo elegido del set del paso 1.
4. **Si el subset está vacío** (ninguna máquina del tipo elegido está desbloqueada): re-intentar paso 2 hasta 3 veces con re-roll del tipo. Si tras 3 intentos sigue vacío, elegir tipo que tenga templates disponibles (fallback al pool LOCAL, que siempre tiene al menos CRUSHER). Si el pool global del paso 1 está completamente vacío, no se spawnea ningún contrato en este ciclo.
5. Elegir un template al azar del subset filtrado.
6. Calcular al spawn: `rewardAmount = qty × BASE_PRICE[resource] × typeMultiplier`. `penaltyAmount = qty × BASE_PRICE[resource] × 1.0` (solo URGENT).

Config en `src/app/config/contracts.config.ts`.

```typescript
interface ContractTemplate {
  id: string;
  type: 'LOCAL' | 'CORPORATE' | 'URGENT';
  resourceId: ResourceType;
  quantity: number;
  durationSeconds: number;
  requiredMachine: MachineType; // gate: requiere level >= 1
}
```

**LOCAL — Compradores locales (materias primas T1-T3)**

| ID | Recurso | Qty | Duración | Reward aprox. | Gate |
|---|---|---|---|---|---|
| `local_metal_sm` | Metal | 30 | 240s | $36 | CRUSHER |
| `local_metal_md` | Metal | 60 | 450s | $72 | CRUSHER |
| `local_plastic_sm` | Plástico | 25 | 240s | $36 | SEPARATOR |
| `local_plastic_md` | Plástico | 50 | 420s | $72 | SEPARATOR |
| `local_copper_sm` | Cobre | 20 | 300s | $72 | SMELTER |
| `local_copper_md` | Cobre | 35 | 480s | $126 | SMELTER |

*Reward aprox. = qty × BASE_PRICE × 1.2. Solo informativo — siempre se calcula al spawn.*

**CORPORATE — Compradores B2B (componentes manufacturados, T2-T7)**

| ID | Recurso | Qty | Duración | Reward aprox. | Gate |
|---|---|---|---|---|---|
| `corp_components_sm` | Componentes | 10 | 900s | $45 | ASSEMBLER |
| `corp_components_md` | Componentes | 20 | 1500s | $90 | ASSEMBLER |
| `corp_ec_sm` | Comp. Eléctricos | 8 | 900s | $78 | ELECTRIC_ASSEMBLER |
| `corp_ec_md` | Comp. Eléctricos | 15 | 1500s | $146 | ELECTRIC_ASSEMBLER |
| `corp_pcb_sm` | Circuit Board | 5 | 900s | $113 | PCB_PRINTER |
| `corp_pcb_md` | Circuit Board | 12 | 1800s | $270 | PCB_PRINTER |
| `corp_hdd_sm` | Hard Drive | 3 | 1200s | $158 | HDD_ASSEMBLER |
| `corp_screen_sm` | Pantalla | 3 | 1200s | $180 | SCREEN_FABRICATOR |
| `corp_gpu_sm` | GPU | 2 | 1200s | $240 | GPU_FAB |
| `corp_smartphone_sm` | Smartphone | 3 | 1200s | $1 350 | SMARTPHONE_FACTORY |
| `corp_laptop_sm` | Laptop | 1 | 1800s | $900 | LAPTOP_WORKSHOP |
| `corp_pc_sm` | Desktop PC | 1 | 1800s | $1 200 | PC_BUILDER |
| `corp_mining_rig` | Mining Rig | 1 | 1800s | $3 300 | MINING_RIG_ASSEMBLY |
| `corp_server_rack` | Server Rack | 1 | 1800s | $4 500 | DATA_CENTER_ASSEMBLY |

**URGENT — Pedido urgente (cualquier recurso desbloqueado, timer ajustado)**

| ID | Recurso | Qty | Duración | Reward aprox. | Penalización aprox. | Gate |
|---|---|---|---|---|---|---|
| `urgent_metal` | Metal | 40 | 150s | $120 | $40 | CRUSHER |
| `urgent_plastic` | Plástico | 30 | 120s | $108 | $36 | SEPARATOR |
| `urgent_copper` | Cobre | 15 | 180s | $135 | $45 | SMELTER |
| `urgent_components` | Componentes | 15 | 240s | $135 | $45 | ASSEMBLER |
| `urgent_ec` | Comp. Eléctricos | 10 | 200s | $195 | $65 | ELECTRIC_ASSEMBLER |
| `urgent_pcb` | Circuit Board | 8 | 300s | $360 | $120 | PCB_PRINTER |
| `urgent_hdd` | Hard Drive | 4 | 300s | $420 | $140 | HDD_ASSEMBLER |
| `urgent_screen` | Pantalla | 3 | 250s | $360 | $120 | SCREEN_FABRICATOR |
| `urgent_gpu` | GPU | 3 | 400s | $720 | $240 | GPU_FAB |
| `urgent_smartphone` | Smartphone | 2 | 300s | $1 800 | $600 | SMARTPHONE_FACTORY |
| `urgent_mining_rig` | Mining Rig | 1 | 600s | $6 600 | $2 200 | MINING_RIG_ASSEMBLY |

> **Progression note:** Al inicio (solo CRUSHER activo) el pool contiene únicamente `local_metal_sm` y `local_metal_md`. El pool crece automáticamente según el jugador desbloquea máquinas — no requiere código condicional adicional fuera del filtro `requiredMachine`.

> **Nota CORPORATE / Circuit Board:** `corp_pcb_sm` y `corp_pcb_md` están listados en F1 como recursos elegibles, pero en la práctica no aparecerán hasta F2 (PCB_PRINTER desbloqueado). El mecanismo de gating por `requiredMachine` es la única guarda necesaria. Aunque SCRAP tiene una máquina productora, no es un recurso acumulable por diseño. MONEY es la divisa, no un bien.

#### Definición TypeScript — interfaz Contract

```typescript
interface Contract {
  id: string;               // UUID generado al spawn
  type: 'LOCAL' | 'CORPORATE' | 'URGENT';
  resourceId: ResourceType; // recurso a entregar
  quantity: number;         // cantidad requerida
  rewardAmount: number;     // $ fijado al SPAWN (precio_base × qty × multiplicador_tipo)
  penaltyAmount: number;    // $ fijado al SPAWN (URGENT: precio_base × qty × 1.0; otros: 0)
  acceptedAt: number;       // timestamp ms — Date.now() cuando el jugador pulsa Aceptar
  durationSeconds: number;  // duración total del contrato en segundos
  isAccepted: boolean;
  isExpired: boolean;
}
```

**Timer spec:** `remainingMs = acceptedAt + durationSeconds * 1000 - Date.now()`. Nunca usar delta de `lastSaveTimestamp` — genera offset acumulativo en cada ciclo de save.

**Reward/Penalty lock:** `rewardAmount` y `penaltyAmount` se calculan y fijan al **spawn** usando `BASE_PRICE`, independientemente de si hay un evento de mercado activo al entregar o al expirar.

**Penalty floor:** Si el jugador tiene menos dinero que `penaltyAmount` al expirar un URGENT, la deducción se aplica hasta $0. El dinero **no puede ir a negativo**.

#### Campos requeridos en SaveState (F1)

```typescript
contracts: SavedContract[];          // array de contratos activos/disponibles (max 3)
lastContractSpawnCheck: number;      // timestamp absoluto ms del último spawn check
firstContractSpawned: boolean;       // one-time flag: primer LOCAL forzado ya disparado
```

> **`SavedContract` type:** `SavedContract` es el mismo type que `Contract`. Los contratos expirados **no se guardan** — se eliminan del array al expirar. Solo persisten contratos activos (timer corriendo) y disponibles (no aceptados aún). Para contratos no aceptados: `acceptedAt = 0`, `isAccepted = false`.

> **Save versioning:** F1 **no incrementa SAVE_VERSION**. Los campos `contracts`, `lastContractSpawnCheck` y `firstContractSpawned` son pre-inicializados por la migración F0 v1→v2. Cuando F1 se implementa, los saves ya tienen esos campos en sus valores por defecto — no se necesita ninguna rama v2→v3 adicional en F1. `SAVE_VERSION 3` corresponde a F2 (primera vez que se añaden campos de recursos/máquinas T4-T7).

**Spawn counter:** `lastContractSpawnCheck` es un timestamp absoluto, no un contador de ticks. Al cargar, los ciclos perdidos son `Math.floor((Date.now() - lastContractSpawnCheck) / 60000)`. Por diseño, **no se spawnean contratos retroactivos** — solo se actualiza el timestamp.

**Reset:** En `resetToNewGame()`, limpiar: `contracts = []`, `lastContractSpawnCheck = Date.now()`, `firstContractSpawned = false`.

---

### A.8 — Eventos de Mercado (F3)

| Tipo | Recursos afectados | Multiplicador | Duración | Frecuencia relativa |
|---|---|---|---|---|
| Boom PCs | Laptop, Desktop PC, Smartphone | ×3 | 120s | 35% |
| Boom Componentes | Componentes, Comp. Eléctricos | ×2 | 180s | 35% |
| Market Crash | Todos los recursos | ×0.4 | 60s | 20% |
| Corporate Deal | Server Rack, Mining Rig | ×5 | 300s | 10% |

| Config | Valor |
|---|---|
| Intervalo mínimo entre eventos | 300s (5 min) |
| Solo 1 evento activo simultáneamente | Sí |
| Corporate Deal requiere | Data Center Assembly O Mining Rig Assembly desbloqueada |
| Eventos se persisten en save | No (efímeros) |

> **Cooldown entre sesiones:** En el constructor de `MarketEventService`, inicializar `secondsSinceLastEvent = 240` (runtime only, no persisted). Al cargar un save, no se restaura este valor — el constructor siempre parte en 240. El primer evento llega ~60s después de cargar. El cooldown no se persiste en el save.

---

### A.9 — Flavor Text / Milestones (F4)

| ID | Trigger | Texto ES | Texto EN |
|---|---|---|---|
| `first_circuit_board` | Producir 1 Circuit Board | "Primera placa ensamblada. Empieza lo bueno." | "First board assembled. Now it gets interesting." |
| `first_laptop_produced` | Producir 1 Laptop por primera vez | "Un laptop. Alguien va a pagar mucho por esto." | "One laptop. Someone's going to pay a lot for this." |
| `first_desktop_produced` | Producir 1 Desktop PC por primera vez | "Un PC completo. Esto es industria de verdad." | "A full PC. This is real industry." |
| `first_server_rack` | Completar 1 Server Rack | "Un rack de servidores. El patio ya no parece un patio." | "A server rack. This place stopped looking like a junkyard." |
| `first_contract` | Aceptar cualquier contrato | "Tu primer contrato. Que empiece el negocio." | "Your first contract. Let's do business." |
| `first_urgent_done` | Completar un contrato URGENT | "Presión, velocidad, dinero. Bienvenido." | "Pressure, speed, money. Welcome." |
| `first_boom_sell` | Vender durante un evento Boom | "¿Ves el timing? Eso se llama vender bien." | "See the timing? That's called selling smart." |

Los milestones completados se guardan en `SaveState` como `completedMilestones: string[]`. Duración de la notificación: 5s (vs 2s estándar). Estilo: borde naranja, sin sonido bloqueante.

---

## Apéndice B — Convención i18n

Patrón existente: `machines.crusher`, `resources.metal`, `upgrades.storage.scrap`, `tutorial.steps.X`. Todo lo nuevo sigue la misma convención.

**Recursos T4-T7**
```
resources.circuit_board  resources.hdd          resources.screen
resources.gpu            resources.smartphone   resources.laptop
resources.desktop_pc     resources.server_rack  resources.mining_rig
```

**Máquinas T4-T7**
```
machines.pcb_printer         machines.hdd_assembler      machines.screen_fabricator
machines.gpu_fab             machines.smartphone_factory machines.laptop_workshop
machines.pc_builder          machines.data_center_assembly
machines.mining_rig_assembly
```

**Upgrades** — patrón: `upgrades.storage.{resource_key}` / `upgrades.machine.{machine_key}`
```
upgrades.storage.circuit_board   upgrades.machine.pcb_printer
(etc. — siguiendo el mismo patrón para los 18 nuevos upgrades de F2b)
```

**Contratos (F1)**
```
contracts.panel.title        → "Contratos"
contracts.type.local         → "Local"
contracts.type.corporate     → "Corporativo"
contracts.type.urgent        → "¡URGENTE!"
contracts.action.accept      → "Aceptar"
contracts.action.deliver     → "Entregar"
contracts.action.ignore      → "Ignorar"
contracts.status.expired     → "Expirado"
contracts.status.waiting     → "Esperando contrato..."
contracts.reward             → "Recompensa:"
contracts.penalty            → "Penalización:"
```

**Eventos de mercado (F3)**
```
events.banner.title          → "Evento de Mercado"
events.type.boom_pcs         → "Boom de Demanda (PCs)"
events.type.boom_components  → "Boom de Componentes"
events.type.market_crash     → "Desplome de Mercado"
events.type.corporate_deal   → "Oferta Corporativa"
events.ends_in               → "Termina en:"
```

**Milestones (F4)** — las claves siguen el `ID` de A.9:
```
milestones.first_circuit_board   milestones.first_laptop_produced
milestones.first_desktop_produced  milestones.first_server_rack
milestones.first_contract        milestones.first_urgent_done
milestones.first_boom_sell
```

---

## Apéndice C — Spec de Audio

Métodos existentes en `AudioService`: `playGameMusicLoop`, `playUiClick`, `playUpgradeStarted`, `playUpgradeCompleted`, `playMaxLevelReached`, `playMachineUnlocked`, `playMachineComplete`, `playResourceSold`, `playScrapGenerated`, `playProductionTick`, `playError`.

**No se requieren SFX nuevos para F1, F3 ni F4.** Reutilización de métodos existentes.

**F1 — Contratos**

| Evento | SFX | Justificación |
|---|---|---|
| Aceptar contrato | `playUiClick()` | Acción de UI confirmada |
| Completar contrato | `playUpgradeCompleted()` | Satisfacción, misma sensación que upgrade |
| Contrato URGENT expirado | `playError()` | Consecuencia negativa clara |
| Nuevo contrato spawneado | — | Aparece pasivamente, no interrumpir |

**F3 — Eventos de mercado**

| Evento | SFX | Justificación |
|---|---|---|
| Inicio de Boom | `playMachineUnlocked()` | Fanfare existente, evento positivo |
| Market Crash | — | El silencio es el drama |
| Corporate Deal | `playMaxLevelReached()` | SFX más épico disponible |
| Fin de evento | — | Sin audio |

**F4 — Milestones:** Sin SFX. La notificación visual con borde naranja es suficiente.

---

## Apéndice D — Backlog Post-F2

Tareas identificadas durante la implementación de F2 que no bloquean el gameplay pero deben resolverse antes del release.

### D.1 — Refactor UI del Resources Header

**Contexto:** Con 9+ recursos (T1-T7) el header se satura visualmente. Todos aparecen desde el inicio aunque el jugador aún no tenga acceso a ellos.

**Objetivo:** Reorganizar el header para que escale bien conforme el jugador progresa, sin sobrecarga visual en el early game.

**Opciones a evaluar:**

| Opción | Pro | Contra |
|---|---|---|
| Ocultar recursos T4+ hasta desbloquear la máquina upstream | Limpio, progresivo, discovery natural | Puede confundir si el jugador no sabe que existen |
| Dos filas: básicos arriba / avanzados abajo | Todo visible, bien organizado | Header más alto, ocupa más pantalla |
| Scroll horizontal en la fila de recursos avanzados | Sin cambio de layout | UX poco obvia en desktop |
| Panel colapsable "Recursos avanzados" con toggle | Compacto, el jugador elige ver | Un click extra, estado de UI a persistir |
| **Sidebar izquierdo vertical con scroll** | Liberaría toda la altura de pantalla para las máquinas; natural en desktop; escala indefinidamente a más recursos | Requiere rediseño mayor del layout raíz (app.html); el dinero y las acciones (idioma, menú) necesitarían reubicarse |

**Recomendación inicial:** ocultar con `@if(machinesService.isUnlocked(...))` — consistente con el patrón ya usado para los sell buttons (D3-1 en F2b). Los recursos aparecen naturalmente al desbloquear la máquina que los produce.

**Pendiente:** Decidir opción, diseñar layout, implementar. Revisar también si el `resource-capacity` (`/ X`) es necesario mostrarlo siempre en el header o solo en tooltip.

---

**Estado tras implementación parcial (D1-impl):** Se implementaron dos filas (Básicos / Avanzados) con labels de sección y dinero movido al topbar. Resultado funcional, pero quedan dos problemas abiertos a resolver:

**Problema 1 — Fila básica sigue densa:**
Con 7 recursos + sus sell buttons en una sola fila horizontal la carga visual sigue siendo alta. En resoluciones medias los elementos se aprietan. Opciones:
- Reducir tamaño de icono en la fila básica (32px en lugar de 44px)
- Mostrar los sell buttons solo en hover del recurso (no siempre visibles)
- Separar los recursos "raw" (Chatarra, Metal, Plástico) de los "procesados" (Cobre, Reciclado, Comp. Eléctricos) en sub-grupos visuales

**Problema 2 — Sell buttons crean ruido visual excesivo:**
Los botones de venta son de color naranja sólido con texto — el mismo color de acción principal del juego. En la fila de recursos compiten visualmente con los datos de cantidad/capacidad y rompen la jerarquía visual. Opciones a evaluar:
- Reducir padding y tamaño de fuente de los sell buttons en el header
- Cambiar a variante `ghost` o `outline` para el header (reservar el naranja sólido para acciones primarias del panel principal)
- Mostrar solo el ícono de venta (💲) sin texto, con tooltip que explique acción
- Ocultar sell buttons hasta hover del `resource-column`

**Idea adicional — Progressive disclosure de la fila avanzada:**
No mostrar la sección "RECURSOS AVANZADOS" hasta que el jugador desbloquee la PCB Printer (primera máquina que produce Circuit Board). Implementación: `@if(machinesService.isUnlocked(MachineType.PCB_PRINTER))` envolviendo todo el `.resources-section` avanzado. Beneficios: early game más limpio, la aparición de la segunda fila actúa como milestone visual de progresión. A evaluar junto con el resto del refactor.

**Prioridad:** Baja — primero completar todas las máquinas e imágenes T4-T7, luego refactor visual del header.

> **Idea (sidebar vertical):** Convertir el header de recursos en un panel lateral izquierdo fijo con scroll vertical. Los recursos se listarían en columna (icono + cantidad / capacidad), el dinero quedaría fijado en la parte superior del sidebar, y las acciones (idioma, menú) se moverían al topbar o al sidebar inferior. Beneficio principal: la lista de máquinas ganaría toda la altura disponible de la ventana. Requiere refactorizar `app.html` de `flex-column` a `flex-row` o CSS Grid con una columna fija izquierda. Evaluar junto al resto del rediseño de layout.

---

### D.2 — Navegación de Máquinas (tabs / filtros)

**Contexto:** Con 9+ máquinas (T1-T7) el panel de máquinas crece verticalmente hasta requerir mucho scroll para encontrar una máquina específica. En el juego completo habrá ~11 máquinas.

**Objetivo:** Dar al jugador una forma rápida de localizar y acceder a cualquier máquina sin scroll excesivo.

**Opciones a evaluar:**

| Opción | Pro | Contra |
|---|---|---|
| Tabs "Básicas / Avanzadas" | Simple, consistente con el header | Solo 2 grupos, puede no escalar |
| Tabs por tier (T1-T3 / T4-T5 / T6-T7) | Más granular, escala bien | Más tabs, el jugador necesita saber los tiers |
| Barra de filtro por estado (Activas / Bloqueadas / Todas) | Útil para gestión rápida | No ayuda a encontrar una máquina específica |
| Mini-mapa / grid de iconos tipo "dock" | Visual, muy rápido | Más trabajo de UI |
| Scroll con sticky header por grupo | Sin cambio de paradigma, natural | El scroll se mantiene |

**Recomendación inicial:** Tabs "Básicas / Avanzadas" alineado con la misma división del header de recursos. Las tab labels pueden reutilizar las mismas claves i18n `resources.section_basic` / `resources.section_advanced`.

**Prioridad:** Baja — después del refactor del header y con todas las máquinas integradas.

---

### D.3 — Balance del loop económico T4-T7 (post-QA)

**Contexto:** Los recursos avanzados (Circuit Board, HDD, Screen, GPU, etc.) solo tienen dos salidas: venta manual a precio base o contratos. El gap entre ambas opciones crece a cada tier, y los contratos tienen frecuencia fija (cada 60s, 3 slots). Cuando el jugador llega a T5-T7 puede acabar con almacenamiento lleno y máquinas paradas esperando contratos — lo que en idle games se percibe como "el juego está roto" aunque sea intencional.

**Tensiones identificadas:**
- Venta manual = accesible pero poco rentable en tiers altos
- Contratos = rentables pero con throughput limitado (frecuencia + slots)
- Sin término medio entre ambas opciones
- El problema empeora a cada tier porque el coste de producción sube pero los outlets no escalan

**Ideas a evaluar en QA:**

1. **Mining Rig y Data Center como money generators pasivos** — output directo en MONEY por tick mientras están activas, sin objeto a almacenar ni vender. Serían las únicas máquinas con output = MONEY. Payoff satisfactorio del T7: "tengo dinero pasivo sin depender de contratos ni ventas manuales."

2. **Contratos escalables por progreso** — cuando el jugador desbloquea T5-T6, los contratos de T4 se vuelven más frecuentes porque ya son baratos de producir. La tasa de spawn de contratos por tier podría ajustarse dinámicamente según máquinas desbloqueadas.

3. **Ajuste de precios de venta manual T4+** — subirlos moderadamente para que la venta manual siga siendo viable aunque subóptima respecto a contratos.

**Cuándo revisarlo:** Primera sesión de QA con el juego completamente implementado según el PRD actual. Las cifras reales de throughput y acumulación de stock van a decir si es un problema real o percibido.

---

### D.4 — Rebalanceo de recetas T5-T7: reducir dependencia de Circuit Board

**Contexto:** Durante la implementación de las máquinas T5-T7 se detectó un cuello de botella estructural: todas las máquinas avanzadas (GPU Fab, Smartphone Factory, Laptop Workshop y las futuras PC Builder, Mining Rig, Data Center) consumen Circuit Board como ingrediente. Esto hace que la PCB Printer sea el único punto crítico de toda la cadena alta — una bottleneck que no va a escalar bien.

**Problema concreto:**
- GPU Fab: CB×1 + HDD×1 + Copper×1
- Smartphone Factory: CB×1 + Screen×1 + Components×1
- Laptop Workshop: CB×1 + Screen×1 + GPU×1 + HDD×1
- Las 3 máquinas T7 (PC Builder, Mining Rig, Data Center) probablemente también usarán CB

Todas estas recetas compiten por el mismo output de la PCB Printer. A velocidades altas, la PCB Printer no puede abastecer a todas.

**Opciones a evaluar:**

| Opción | Pro | Contra |
|--------|-----|--------|
| Sustituir CB por componentes básicos en algunas recetas (Metal, Cobre, Comp. Eléctricos) | Diversifica la supply chain, reduce el cuello | Cambia recetas ya "fijadas", puede romper el narrative de la cadena |
| Introducir un segundo tier de PCB (Advanced Board) producido por una máquina nueva | Crea un upgrade natural de la PCB Printer | Más máquinas, más complejidad |
| Aumentar la velocidad de la PCB Printer vía upgrades extra | Sin cambio de recetas | El problema se pospone, no se resuelve |
| Hacer que algunos recursos T5-T7 consuman recursos intermedios distintos (Reciclados, Plástico, etc.) | Activa recursos infrautilizados | Requiere rediseño narrativo de la cadena |

**Recomendación:** Revisar las recetas de las 3 máquinas T7 (PC Builder, Mining Rig, Data Center) antes de implementarlas. Si alguna puede sustituir CB por Metal, Cobre o Comp. Eléctricos sin romper la narrativa del craft, hacerlo. Para GPU Fab, Smartphone y Laptop (ya implementadas), evaluar en QA si el cuello es real antes de cambiar recetas cod.

**Cuándo revisarlo:** Antes de implementar las recetas de las máquinas T7 (PC Builder, Mining Rig, Data Center). Confirmar en QA si la PCB Printer es el bottleneck real o si los upgrades de velocidad lo absorben.
