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
F0 Rebalanceo  →  F2 Tiers (base de datos)  →  F2 Tiers (gameplay)
                                                      ↓
                                              F1 Contratos
                                                      ↓
                                              F3 Eventos de mercado
                                                      ↓
                                              F4 Narrativa
                                                      ↓
                                              QA balance sesión larga
                                                      ↓
                                              Build final
```

Cada fase se revisa y valida contra sus criterios de aceptación antes de empezar la siguiente.

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
9. Los contratos se persisten en el save — si el jugador cierra el juego, los timers se recalculan al cargar.
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
8. El save versioning se incrementa a v2 con migración progresiva.
9. Todos los assets (iconos y cards) existen al menos como placeholders del tamaño correcto.
10. Todos los textos en i18n (es y en).

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
3. El evento afecta los precios de venta en tiempo real (los botones de venta muestran el precio modificado).
4. El banner de evento es visible mientras el evento está activo y desaparece al terminar.
5. El banner muestra: tipo de evento, recursos afectados, multiplicador, tiempo restante.
6. Al inicio y al fin del evento se muestra una notificación.
7. Los eventos no se persisten en el save (son efímeros — si cierras el juego durante uno, simplemente no estará al volver).
8. El Corporate Deal solo puede generarse si el jugador tiene Data Center Assembly o Mining Rig Assembly desbloqueados.

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
