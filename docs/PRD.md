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

## FASE 0 — Rebalanceo Tier 3

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
4. El precio de venta del Cobre se revisa a la baja (era 2.8, propuesta 2.0) dado que ahora es más fácil de producir.
5. La cadena Fundidora → Ensambladora Eléctrica se verifica como viable (la Fundidora a 0.33/s produce suficiente Cobre para la E.Assembler a 0.2/s).
6. `docs/systems.md` se actualiza para reflejar la nueva cadena.

### Criterios de aceptación

- [ ] La Fundidora activa no reduce el suministro de Metal a la Ensambladora en ningún escenario.
- [ ] Con Fundidora + Ensambladora + Recicladora activas, el Scrap generado a nivel 3 de auto-generación es suficiente para alimentar las tres sin que alguna se quede en espera constantemente.
- [ ] El Cobre mantiene utilidad como recurso vendible (precio > Metal) y como input de la Ensambladora Eléctrica.
- [ ] El tutorial first-run no se rompe con el nuevo flujo (si menciona la Fundidora como downstream de Metal, actualizar el texto).

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
5. Al aceptar, el contrato queda activo y el timer empieza.
6. El botón "Entregar" solo se habilita cuando el jugador tiene la cantidad requerida en inventario.
7. Al entregar, los recursos se descuentan y el reward se añade al dinero.
8. Al llegar el timer a 0 con el contrato activo y no completado: si era URGENT, se aplica la penalización; si no, simplemente caduca sin penalización.
9. Los contratos se persisten en el save — si el jugador cierra el juego, los timers se recalculan al cargar como `acceptedAt + durationSeconds * 1000 - Date.now()`. Un contrato que ya expiró mientras el juego estuvo cerrado se marca como expirado en la carga; la penalización URGENT **no se aplica retroactivamente**.
10. Un nuevo contrato puede generarse solo cuando hay slot libre (< 3 activos/disponibles).
11. Spawn del primer contrato LOCAL disponible cuando la Ensambladora está desbloqueada.

### Requisitos no funcionales

- El panel es colapsable (igual que el panel de upgrades).
- Timer visual: barra de progreso + número de segundos en formato mm:ss.
- Para contratos URGENT: borde naranja/rojo, timer en rojo cuando queda < 30s, penalización claramente visible.
- Sin animaciones bloqueantes — el jugador nunca pierde control del juego por un contrato.

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
- Contratos para recursos T4-T7 (esos llegan en F2).

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
T4: Circuit Board          ← PCB Printer [Cobre + Componentes]
T5: Disco Duro             ← HDD Assembler [Circuit Board + Metal]
    Pantalla               ← Screen Fabricator [Circuit Board + CE + Plástico]
T6: GPU                    ← GPU Fab [Circuit Board x2 + Cobre]
    Smartphone             ← Smartphone Factory [Pantalla + Circuit Board]
    Laptop                 ← Laptop Workshop [HDD + Pantalla + Circuit Board]
    Desktop PC             ← PC Builder [HDD + GPU + Metal]
T7: Server Rack            ← Data Center Assembly [Desktop PC x2 + Circuit Board x4]
    Mining Rig             ← Mining Rig Assembly [Desktop PC + GPU x2 + CE x2]
```

### Principios de diseño del árbol

- **Ningún recurso T2-T3 queda obsoleto:** Metal entra en HDD (T5) y Desktop PC (T6). Plástico entra en Pantalla (T5). Cobre entra en Circuit Board (T4) y GPU (T6). Comp. Eléctricos entra en Pantalla (T5) y Mining Rig (T7).
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
4. Orden de unlock progresivo: PCB Printer primero; Data Center y Mining Rig los últimos.
5. Los nuevos recursos tienen botón de venta en el mercado.
6. Los upgrades de velocidad existen para todas las máquinas nuevas.
7. Los upgrades de almacenamiento existen para los recursos intermedios (CB, HDD, Screen, GPU).
8. El save versioning se incrementa a v2 con migración progresiva (spec en F0 — los campos F2 nuevos se inicializan a defaults en la misma rama de migración).
9. `MarketService.getPrice()` se refactoriza a mapa de config (`BASE_PRICES: Record<ResourceType, number>`) cubriendo **todos** los recursos (existentes y nuevos). Actualmente es una cadena `if` hardcodeada que retorna 0 para recursos desconocidos, haciendo `isManuallySellable() = false` para cualquier recurso nuevo — con lo que **todos los productos T4-T7 serían insellables** sin este cambio. La refactorización cubre todos los recursos a la vez (no solo los nuevos) porque: (a) evita mantener dos patrones en paralelo, y (b) es prerequisito necesario para que el sistema de multiplicadores de F3 funcione de forma uniforme sobre todos los recursos.
10. Los enums `ResourceType`, `MachineType` y `UpgradeId` se extienden con todos los valores nuevos antes de cualquier código de config. Los IDs a añadir: `UPG_MACH_009`–`UPG_MACH_017` y `UPG_STORE_008`–`UPG_STORE_016`.
11. Todos los assets (iconos y cards) existen al menos como placeholders del tamaño correcto.
12. Todos los textos en i18n (es y en).

### Requisitos no funcionales

- La UI de machine-list soporta el mayor número de cards sin overflow o layout roto.
- El rendimiento del game loop no degrada con 17 máquinas activas simultáneamente.

### Balance objetivo (T4-T7)

| Producto | $/unidad | Tiempo producción estimado (sin upgrades) | $/s efectivo |
|---|---|---|---|
| Circuit Board | 15 | ~6s | 2.5 |
| Disco Duro | 35 | ~12s | 2.9 |
| Pantalla | 40 | ~14s | 2.9 |
| GPU | 80 | ~20s | 4.0 |
| Smartphone | 70 | ~14s | 5.0 |
| Laptop | 150 | ~26s | 5.8 |
| Desktop PC | 200 | ~32s | 6.3 |
| Server Rack | 600 | ~60s | 10.0 |
| Mining Rig | 500 | ~55s | 9.1 |

Nota: estos números se ajustan en QA (T-15). Son targets de diseño, no valores hardcodeados.

### Criterios de aceptación

- [ ] El jugador puede completar la cadena entera desde Scrap hasta Server Rack en una sesión sin softlocks.
- [ ] El PCB Printer no starvea de inputs con cadena T3 activa al nivel de unlock.
- [ ] Los recursos intermedios (HDD, Screen, GPU) no se acumulan indefinidamente sin posibilidad de venta.
- [ ] La diferencia de dinero entre vender en T3 vs T7 es al menos ×10 en $/s sostenido.
- [ ] El layout de machine-list es jugable con las 17 máquinas activas (sin overflow visible, scroll si es necesario).
- [ ] Saves de v1 cargan correctamente en v2 (los nuevos recursos aparecen en 0, no hay crash).
- [ ] Todos los assets son visibles (no broken images).
- [ ] Todos los strings están en es y en sin claves faltantes.

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
| Primer Laptop vendido | Vender 1 Laptop | "Un laptop. Alguien va a pagar mucho por esto." |
| Primer Desktop PC vendido | Vender 1 PC | "Un PC completo. Esto es industria de verdad." |
| Primer Server Rack completado | Completar 1 Server Rack | "Un rack de servidores. El patio ya no parece un patio." |
| Primer contrato aceptado | Aceptar cualquier contrato | "Tu primer contrato. Que empiece el negocio." |
| Primer contrato urgente completado | Completar un contrato URGENT | "Presión, velocidad, dinero. Bienvenido." |
| Primer boom de mercado aprovechado | Vender durante un boom | "¿Ves el timing? Eso se llama vender bien." |

### Requisitos funcionales

1. Cada milestone solo se dispara una vez por partida (persistido en save).
2. El flavor text aparece como notificación especial (no modal — no bloquea el juego).
3. La notificación de flavor tiene una duración mayor que las notificaciones estándar (5s vs 2s).
4. Estilo visual diferenciado (borde o color distinto) para distinguished del feedback de sistema.
5. Textos en i18n (es y en).
6. Los milestones completados se guardan en el save como `string[]`.

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

- [ ] F0 — Fundidora recibe Scrap directo y el balance T3 está validado en QA.
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

### A.1 — Rebalanceo F0: Fundidora

| Parámetro | Antes | Después |
|---|---|---|
| Inputs/ciclo | 4 Metal | 2 Scrap |
| Output/ciclo | 2 Cobre | 1 Cobre |
| baseSpeed | 0.25/s | 0.33/s |
| Precio de venta Cobre | $2.8 | $2.0 |

**Rationale:** La Fundidora dejaba de competir con la Ensambladora por Metal. Precio de Cobre baja porque ahora es más fácil de producir (Scrap es abundante). A 0.33/s produce 0.33 Cobre/s — suficiente para alimentar al PCB Printer (0.17 Cobre/s consumido) con margen.

---

### A.2 — Máquinas T4-T7

| Máquina | Inputs / ciclo | Output / ciclo | baseSpeed | Ciclo | $/s efectivo |
|---|---|---|---|---|---|
| **PCB Printer** | 1 Cobre + 1 Componente | 1 Circuit Board | 0.17/s | ~6s | $2.55 |
| **HDD Assembler** | 1 Circuit Board + 1 Metal | 1 Disco Duro | 0.08/s | ~12s | $2.80 |
| **Screen Fabricator** | 1 Circuit Board + 1 Comp. Eléctrico + 1 Plástico | 1 Pantalla | 0.07/s | ~14s | $2.80 |
| **GPU Fab** | 2 Circuit Board + 1 Cobre | 1 GPU | 0.05/s | ~20s | $4.00 |
| **Smartphone Factory** | 1 Pantalla + 1 Circuit Board | 1 Smartphone | 0.07/s | ~14s | $4.90 |
| **Laptop Workshop** | 1 Disco Duro + 1 Pantalla + 1 Circuit Board | 1 Laptop | 0.04/s | ~25s | $6.00 |
| **PC Builder** | 1 Disco Duro + 1 GPU + 1 Metal | 1 Desktop PC | 0.03/s | ~33s | $6.00 |
| **Data Center Assembly** | 2 Desktop PC + 4 Circuit Board | 1 Server Rack | 0.017/s | ~59s | $10.20 |
| **Mining Rig Assembly** | 1 Desktop PC + 2 GPU + 2 Comp. Eléctrico | 1 Mining Rig | 0.018/s | ~56s | $9.00 |

#### Validación de supply chain (speeds base, sin upgrades)

| Recurso | Producción upstream | Demanda acumulada | Margen |
|---|---|---|---|
| Cobre | Smelter 0.33/s | PCB (0.17) + GPU Fab (0.05) + **E.Assembler (0.20)** = **0.42/s** | ⚠️ Déficit -0.09/s — E.Assembler ya consume 0.20 Cu/s en T3. Con GPU Fab activa, la Fundidora es el bottleneck. Requiere upgrade de Fundidora antes de activar GPU Fab. |
| Componentes | Assembler 0.22/s | PCB (0.17) + **E.Assembler (0.20)** = **0.37/s** | ⚠️ Déficit -0.15/s — E.Assembler consume 0.20 Comp/s para producir Comp. Eléctricos; el PCB Printer compite directamente. Upgrade de Assembler necesario antes de activar PCB Printer. |
| Circuit Board | PCB Printer 0.17/s | HDD (0.08) + Screen (0.07) + GPU (0.10) + Smartphone (0.07) + Laptop (0.04) + DataCenter (0.068) = **0.428/s** (cadena T4-T7 completa) | ⚠️ Déficit severo a plena cadena. Diseño en fases: activar HDD+Screen → upgrade PCB → activar GPU Fab → upgrade más antes de T7. Se necesitan ≥3 PCB Printers upgradeados para alimentar T6+T7 completo. |
| Disco Duro | HDD 0.08/s | Laptop (0.04) + PC Builder (0.03) = 0.07/s | ✅ +0.01/s |
| Pantalla | Screen 0.07/s | Smartphone (0.07) + Laptop (0.04) = 0.11/s | ⚠️ Déficit en base — jugador debe upgradear Screen Fabricator antes de activar Laptop Workshop (diseño intencional) |
| GPU | GPU Fab 0.05/s | PC Builder (0.03) + Mining Rig (0.036) = 0.066/s | ⚠️ Déficit en base — GPU Fab debe estar upgradeado para soportar ambos (diseño intencional) |
| Desktop PC | PC Builder 0.03/s | Data Center (0.034) + Mining Rig (0.018) = 0.052/s | ⚠️ Déficit en base — se necesitan upgrades o múltiples PC Builders (diseño intencional, son máquinas T7) |
| Comp. Eléctrico | E.Assembler 0.20/s | Screen (0.07) + Mining Rig (0.036) = 0.106/s | ✅ +0.094/s |
| Plástico | Separator 0.50/s | Screen (0.07/s) | ✅ holgado |
| Metal | Crusher 1.0 Metal/s | HDD (0.08) + PC Builder (0.03) = 0.11/s | ✅ muy holgado |

**Nota:** Los déficits marcados con ⚠️ son **intencionados**. Las máquinas T7 deben requerir que el jugador haya invertido en upgrades de las máquinas anteriores. Nunca debe ser posible activar Data Center Assembly sin haber upgradeado seriamente el PCB Printer y PC Builder.

---

### A.3 — Precios de mercado (sell)

| Recurso | $/unidad | Tier |
|---|---|---|
| Scrap | — (no vendible) | T1 |
| Metal | $1.0 | T2 |
| Plástico | $1.2 | T2 |
| Cobre | $2.0 *(era $2.8)* | T2 |
| Componentes | $3.0 | T3 |
| Plástico Reciclado | $3.5 | T3 |
| Comp. Eléctricos | $5.0 | T3 |
| Circuit Board | $15 | T4 |
| Disco Duro | $35 | T5 |
| Pantalla | $40 | T5 |
| GPU | $80 | T6 |
| Smartphone | $70 | T6 |
| Laptop | $150 | T6 |
| Desktop PC | $200 | T6 |
| Server Rack | $600 | T7 |
| Mining Rig | $500 | T7 |

Todos los recursos T4-T7 son vendibles en el mercado. El precio de la GPU es mayor que el Smartphone porque requiere más Circuit Boards y sigue siendo input de PC Builder y Mining Rig.

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
| **Smartphone Factory** | **UPG_MACH_013** | **800** |
| **Laptop Workshop** | **UPG_MACH_014** | **900** |
| **PC Builder** | **UPG_MACH_015** | **950** |
| **Data Center Assembly** | **UPG_MACH_016** | **1200** |
| **Mining Rig Assembly** | **UPG_MACH_017** | **1200** |

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
| Smartphone | **UPG_STORE_012** | 4 | +2 | 200 |
| Laptop | **UPG_STORE_013** | 3 | +2 | 250 |
| Desktop PC | **UPG_STORE_014** | 3 | +2 | 250 |
| Server Rack | **UPG_STORE_015** | 2 | +1 | 400 |
| Mining Rig | **UPG_STORE_016** | 2 | +1 | 400 |

Todos los recursos son intermedios o finales con demanda upstream (Desktop PC alimenta T7), así que todos necesitan upgrades de almacenamiento para que el jugador pueda acumular stock antes de vender.

---

### A.6 — Condiciones de unlock de máquinas T4-T7

Mismo patrón que `MachineUnlockService` actual: unlock cuando la(s) máquina(s) prerrequisito alcanzan el nivel indicado.

| Máquina a desbloquear | Prerrequisito(s) |
|---|---|
| PCB Printer | Electric Assembler nivel ≥ 1 (recién desbloqueada) |
| HDD Assembler | PCB Printer nivel ≥ 3 |
| Screen Fabricator | PCB Printer nivel ≥ 5 |
| GPU Fab | HDD Assembler nivel ≥ 2 **Y** Screen Fabricator nivel ≥ 2 |
| Smartphone Factory | Screen Fabricator nivel ≥ 3 |
| Laptop Workshop | HDD Assembler nivel ≥ 3 **Y** Screen Fabricator nivel ≥ 3 |
| PC Builder | GPU Fab nivel ≥ 2 **Y** HDD Assembler nivel ≥ 3 |
| Data Center Assembly | PC Builder nivel ≥ 3 |
| Mining Rig Assembly | GPU Fab nivel ≥ 3 **Y** PC Builder nivel ≥ 2 |

**Progresión de unlock resultante:**
```
E.Assembler desbloqueada
  → PCB Printer disponible
    → [Lv3] HDD Assembler disponible
    → [Lv5] Screen Fabricator disponible
      → [HDD Lv2 + Screen Lv2] GPU Fab disponible
      → [Screen Lv3] Smartphone Factory disponible
      → [HDD Lv3 + Screen Lv3] Laptop Workshop disponible
        → [GPU Lv2 + HDD Lv3] PC Builder disponible
          → [PC Lv3] Data Center Assembly disponible
          → [GPU Lv3 + PC Lv2] Mining Rig Assembly disponible
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

#### Parámetros por tipo

| Tipo | Recursos elegibles | Cantidad (rango) | Timer (rango) | Reward | Penalización |
|---|---|---|---|---|---|
| LOCAL | Metal, Plástico, Cobre | 20 – 80 | 180s – 600s | cantidad × precio × 1.2 | Ninguna (expira silenciosamente) |
| CORPORATE | Componentes, Comp. Eléctricos, Circuit Board | 5 – 25 | 600s – 1800s | cantidad × precio × 1.5 | Ninguna (expira silenciosamente) |
| URGENT | Cualquier recurso desbloqueado | 10 – 40 | 120s – 300s | cantidad × precio × 3.0 | cantidad × precio × 1.0 (descuento de dinero) |

#### Condiciones de spawn por recurso

Un contrato solo puede pedir un recurso que el jugador **ya puede producir** (la máquina que produce ese recurso está desbloqueada). Esta validación se hace en el spawn.

**Recursos excluidos del spawn pool (siempre):** `ResourceType.SCRAP`, `ResourceType.MONEY`. Aunque SCRAP tiene una máquina productora, no es un recurso acumulable por diseño. MONEY es la divisa, no un bien.

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

---

### A.9 — Flavor Text / Milestones (F4)

| ID | Trigger | Texto ES | Texto EN |
|---|---|---|---|
| `first_circuit_board` | Producir 1 Circuit Board | "Primera placa ensamblada. Empieza lo bueno." | "First board assembled. Now it gets interesting." |
| `first_laptop_sold` | Vender 1 Laptop | "Un laptop. Alguien va a pagar mucho por esto." | "One laptop. Someone's going to pay a lot for this." |
| `first_desktop_sold` | Vender 1 Desktop PC | "Un PC completo. Esto es industria de verdad." | "A full PC. This is real industry." |
| `first_server_rack` | Completar 1 Server Rack | "Un rack de servidores. El patio ya no parece un patio." | "A server rack. This place stopped looking like a junkyard." |
| `first_contract` | Aceptar cualquier contrato | "Tu primer contrato. Que empiece el negocio." | "Your first contract. Let's do business." |
| `first_urgent_done` | Completar un contrato URGENT | "Presión, velocidad, dinero. Bienvenido." | "Pressure, speed, money. Welcome." |
| `first_boom_sell` | Vender durante un evento Boom | "¿Ves el timing? Eso se llama vender bien." | "See the timing? That's called selling smart." |

Los milestones completados se guardan en `SaveState` como `completedMilestones: string[]`. Duración de la notificación: 5s (vs 2s estándar). Estilo: borde naranja, sin sonido bloqueante.
