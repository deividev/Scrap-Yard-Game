# Scrap Yard Idle — Roadmap de Expansión (Post-Demo)

> Documento de ideación para el juego completo una vez terminada la demo.
> No es una especificación técnica, sino un mapa de posibilidades ordenado por capas de profundidad.

---

## ⚠️ Clasificación de Features — DECIDIR ANTES DE CONTINUAR

> Esta tabla es la fuente de verdad para el trailer y para la planificación del juego completo.
> Solo las features marcadas ✅ se mostrarán en el trailer. Las demás no se enseñan hasta estar confirmadas.

| Capa | Feature | Estado | Motivo |
|---|---|---|---|
| 1 | Sistema de Contratos | ✅ CONFIRMADA | Añade decisiones reales al idle. Baja complejidad técnica. Sin recursos nuevos. |
| 2+3 | Nuevas cadenas de recursos + máquinas (Circuit Boards → Laptops → Servers) | ✅ CONFIRMADA | Core del juego completo. Sin esto no hay juego final. |
| 4 | Tipos de Scrap diferenciados | ❌ DESCARTADA | Complejidad media con poco retorno visual. Se puede revisar post-launch. |
| 5 | Sistema de Trabajadores (con salarios) | ❌ DESCARTADA | Riesgo de complicar el loop económico. Revisar en v2 si el loop base lo pide. |
| 6 | Red Eléctrica | ❌ DESCARTADA | Alto riesgo de scope creep. El loop eléctrico ya existe vía Ensambladora Eléctrica. |
| 7 | Zonas físicas del patio | ❌ DESCARTADA | Rediseño de layout demasiado grande para el scope actual. |
| 8 | Eventos de mercado (booms, crashes) | ✅ CONFIRMADA | Mucho efecto, poco código. Se construye sobre el mercado ya implementado. |
| 9 | Prestige (soft reset) | ❌ DESCARTADA | Alta complejidad y riesgo de diseño. Fuera del scope del juego completo v1. |
| 10 | Narrativa mínima / flavor text | ✅ CONFIRMADA | Bajo coste. El FirstRunTutorialService ya existe como base. No se muestra en trailer. |

**Leyenda:**
- ✅ **CONFIRMADA** — entra en el juego final, se puede mostrar en el trailer
- 🔶 **PROBABLE** — intención clara de incluirla, puede simplificarse
- ❓ **POR DECIDIR** — buena idea pero sin compromiso todavía
- ❌ **DESCARTADA** — fuera del scope del juego completo

---

## Mi propuesta de clasificación inicial

Basada en impacto/complejidad y coherencia con el loop actual. **Cambiar según criterio del dev.**

| Capa | Feature | Propuesta | Razonamiento |
|---|---|---|---|
| 1 | Contratos | ✅ CONFIRMADA | Sin recursos nuevos. Crea decisiones. Capa 1 = primero en la lista. |
| 2+3 | Nuevas máquinas y productos (hasta Tier 6) | ✅ CONFIRMADA | Es el corazón del juego completo. Sin esto no hay juego final. |
| 4 | Scrap diferenciado | 🔶 PROBABLE | Enriquece los inputs. Sería una simplificación de no incluirlo. |
| 5 | Trabajadores | 🔶 PROBABLE | Añade la capa económica que falta. Complejidad manejable. |
| 6 | Red Eléctrica | ❌ DESCARTADA | Riesgo de scope creep alto. El loop eléctrico ya existe vía Ensambladora Eléctrica. |
| 7 | Zonas físicas | ❌ DESCARTADA | Rediseño de layout demasiado grande para el scope actual. |
| 8 | Eventos de mercado | ✅ CONFIRMADA | Mucho efecto, poco código. Fácil de implementar sobre el mercado existente. |
| 9 | Prestige | ❌ DESCARTADA | Alta complejidad, alto riesgo de diseño. Solo si el loop base es perfecto y sobra tiempo. |
| 10 | Narrativa mínima | ✅ CONFIRMADA | Bajo coste. El `FirstRunTutorialService` ya existe como base. |

> **Revisar esta tabla y marcar el estado final de cada feature antes de actualizar el trailer.**

---



El loop actual cubre:

```
Scrap (manual + auto)
  → Trituradora  → Metal
  → Separador    → Plástico
  → Fundidora    → Cobre
  → Ensambladora → Componentes (Metal + Plástico)
  → Ensambladora eléctrica → Componentes eléctricos (Metal + Plástico reciclado)
  → Empaquetadora          → $ (Componentes x4)
  → Empaquetadora eléctrica → $$ (Comp. eléctricos x4)
  → Recicladora  → Plástico reciclado
```

Las capas de expansión propuestas a continuación son **aditivas** — no rompen el loop base, lo profundizan progresivamente.

---

## Capa 1 — Sistema de Contratos

La capa más inmediata. No requiere recursos nuevos, solo una UI y una lógica de objetivos temporales.

### Tipos de contrato

| Tipo | Ejemplo | Reward |
|---|---|---|
| Contrato local (fácil) | "Entregar 50 Metal en 5 min" | +$ flat |
| Contrato corporativo (medio) | "Entregar 20 Componentes en 30 min" | +$ + unlock |
| Contrato urgente (presión) | x2 pago, mitad de tiempo | Penalización $ si fallas |
| Cadena de contratos (narrativo) | Misiones encadenadas con historia mínima | Desbloquea nueva máquina o zona |
| Contrato de producción masiva | "Ensamblar y vender 100 PCs" | Trigger del primer Prestige |

### Mecánica de contrato urgente
- Aparece aleatoriamente en pantalla con un timer.
- El jugador acepta o ignora.
- Si acepta y falla: penalización de $ o reputación.
- Si acepta y cumple: bonus sobre el precio base de mercado.

### Por qué importa
Los contratos obligan al jugador a **priorizar cadenas de producción concretas** en lugar de maximizar todo en paralelo. Crean decisiones genuinas en un juego idle.

---

## Capa 2 — Nuevas Cadenas de Recursos (Tiers)

Extensión natural de los recursos actuales hacia productos de mayor valor.

### Árbol de recursos extendido

> El árbol usa exclusivamente los recursos que el loop base ya produce. Cada recurso de Tier 2-3 tiene al menos un punto de consumo en Tier 4-7.

```
Tier 1  →  Scrap  (única fuente de input)

Tier 2  →  Metal | Plástico | Cobre                              [demo — sin cambios]

Tier 3  →  Componentes            (Metal + Plástico)             [Ensambladora]
           Plástico Reciclado     (Metal + Plástico)             [Recicladora]
           Comp. Eléctricos       (Metal + Plástico Reciclado)   [Ensambladora Eléctrica]
                                                                  [demo — sin cambios]

Tier 4  →  Circuit Board          (Cobre + Componentes)          [PCB Printer ← nueva]
           ↳ pivote de todo T5-T7. Todos los productos de alta gama lo requieren.

Tier 5  →  Disco Duro             (Circuit Board + Metal)        [HDD Assembler ← nueva]
           Pantalla               (Circuit Board + Comp. Eléctricos + Plástico) [Screen Fabricator ← nueva]
           ↳ dos máquinas, dos productos que se venden bien solos o se usan en T6.
           ↳ Plástico entra aquí → el Separador sigue siendo relevante en late game.

Tier 6  →  GPU                    (Circuit Board x2 + Cobre)     [GPU Fab ← nueva]
           Smartphone             (Pantalla + Circuit Board)      [Smartphone Factory ← nueva]
           Laptop                 (Disco Duro + Pantalla + Circuit Board) [Laptop Workshop ← nueva]
           Desktop PC             (Disco Duro + GPU + Metal)      [PC Builder ← nueva]
           ↳ GPU Fab se desbloquea primero y abre la rama Desktop PC / Mining Rig.
           ↳ Cobre mantiene relevancia como input de GPU en late game.
           ↳ Metal sigue siendo necesario (carcasa del Desktop PC).
           ↳ Sin "recetas variables" — cada producto es una máquina distinta.

Tier 7  →  Server Rack            (Desktop PC x2 + Circuit Board x4)          [Data Center Assembly ← nueva]
           Mining Rig             (Desktop PC + GPU x2 + Comp. Eléctricos x2)  [Mining Rig Assembly ← nueva]
           ↳ Comp. Eléctricos vuelve a ser crítico aquí tras ser usado en Pantalla (T5).
```

**Auditoría de recursos — todos los T2/T3 deben tener sinks en T4-7:**

| Recurso | Sinks post-T3 | Estado |
|---|---|---|
| Metal | Disco Duro (T5), Desktop PC (T6), Server Rack vía PC (T7) | ✅ relevante en late game |
| Plástico | Pantalla (T5) | ✅ el Separador no queda obsoleto |
| Cobre | Circuit Board (T4), GPU Fab (T6) | ✅ demanda constante en T4, puntual en T6 |
| Componentes | Circuit Board (T4) | ✅ consumo masivo — la PCB Printer lo drena todo |
| Plástico Reciclado | Comp. Eléctricos (T3 → T5 vía Pantalla, T7 vía Mining Rig) | ✅ demanda indirecta sostenida |
| Comp. Eléctricos | Pantalla (T5), Mining Rig (T7) | ✅ dos puntos de consumo directos |

**Por qué estas recetas concretamente:**
- `Circuit Board` — trazas de cobre soldadas a microcomponentes. Cobre + Componentes. Limpio.
- `Disco Duro` — plato magnético (Metal) + placa controladora (Circuit Board). Sin recursos nuevos.
- `Pantalla` — carcasa plástica + electrónica de control (CB) + drivers de imagen (CE). Plástico da el sink que faltaba.
- `GPU` — una PCB especializada de alta densidad. Circuit Board x2 + Cobre resuelve bien la abstracción.
- `Smartphone` — pantalla + placa principal. No repite los ingredientes de la Pantalla en la receta del dispositivo final.
- `Laptop` — almacenamiento + pantalla + procesador. Tres componentes T5, uno por cada función del dispositivo.
- `Desktop PC` — almacenamiento + gráficos + chasis metálico. Metal da un tercer sink en T6.
- `Server Rack` — varios PCs más PCBs de red adicionales. Drena Circuit Boards en T7 cuando el jugador tiene capacidad de producirlos en masa.
- `Mining Rig` — PC + más GPUs + gestión eléctrica. Comp. Eléctricos vuelve a ser crítico aquí.

### Regla de diseño
- **Tier 4**: 1 máquina (PCB Printer). Un solo unlock, enorme impacto — desbloquea todo lo que sigue.
- **Tier 5**: 2 máquinas (HDD + Screen). Ambas usan T4 outputs. Pueden venderse de inmediato sin ir a T6.
- **Tier 6**: 4 máquinas (GPU Fab + 3 device factories). GPU Fab es el primer unlock; habilita Desktop PC. Las 3 factories combinan recursos T5 en distintas configuraciones. Sin receta variable — cada producto es una máquina separada.
- **Tier 7**: 2 máquinas finales. Requieren producción masiva de T6 y drenan todos los recursos anteriores.

---

## Capa 3 — Nuevas Máquinas

Máquinas para procesar los recursos de los tiers 4-7.

| Máquina | Input | Output | Tier | Nota |
|---|---|---|---|---|
| PCB Printer | Cobre + Componentes | Circuit Board | 4 | Pivote de todo T5-T7. Primera unlock post-demo. |
| HDD Assembler | Circuit Board + Metal | Disco Duro | 5 | Storage para Laptop y Desktop PC. |
| Screen Fabricator | Circuit Board + Comp. Eléctricos + Plástico | Pantalla | 5 | Display para Smartphone y Laptop. Plástico relevante en late game. |
| GPU Fab | Circuit Board x2 + Cobre | GPU | 6 | Primer unlock de T6. Habilita Desktop PC y Mining Rig. |
| Smartphone Factory | Pantalla + Circuit Board | Smartphone | 6 | Producto de consumo medio. Sin redundancia de ingredientes. |
| Laptop Workshop | Disco Duro + Pantalla + Circuit Board | Laptop | 6 | Producto de consumo alto. |
| PC Builder | Disco Duro + GPU + Metal | Desktop PC | 6 | Producto premium. Metal sigue siendo necesario. |
| Data Center Assembly | Desktop PC x2 + Circuit Board x4 | Server Rack | 7 | Drena CBs en T7 cuando el jugador puede producirlos en masa. |
| Mining Rig Assembly | Desktop PC + GPU x2 + Comp. Eléctricos x2 | Mining Rig | 7 | CE vuelve a ser crítico aquí. |

### Máquina especial: Quality Control
- No produce, sino que **aplica un modificador de precio** al siguiente lote vendido.
- Incentiva la presencia activa del jugador: si estás en línea, activas QC antes de vender.

---

## Capa 4 — Tipos de Scrap (Inputs Diferenciados)

En lugar de un scrap genérico, **cuatro fuentes de scrap** con loot table propio. Se desbloquean progresivamente.

| Fuente | Recursos principales | Cómo se desbloquea |
|---|---|---|
| Scrap básico | Metal, Plástico | Desde el inicio |
| Scrap electrónico | Comp. Eléctricos, Circuit Board roto | Zona B / Contrato |
| Scrap industrial | Metal+, Cobre bruto | Zona C / Nivel de Trituradora |
| Scrap doméstico | Plástico, Vidrio, Goma | Zona B |
| Scrap de lujo | Oro, Titanio | Zona E / Late-game |

### Mecánica de fuente nueva
Cada fuente de scrap se activa comprando una **licencia de reciclaje** ($ + requisito de nivel). Esto crea una decisión de inversión antes de reubicar la producción.

---

## Capa 5 — Sistema de Trabajadores

Una capa de automatización con **costo operativo recurrente**, diferente a los upgrades de velocidad.

| Rol | Efecto | Costo |
|---|---|---|
| Operario | Reemplaza clicks manuales de scrap | Salario por hora |
| Técnico | Mantiene máquinas (reduce downtime/averías) | Salario por hora |
| Logístico | Prioriza flujos entre máquinas | Salario por hora |
| Gerente | Multiplica eficiencia de todos los del área | Salario mayor |
| Especialista | Desbloquea una mejora única de producción | Contrato puntual |

### Tensión de diseño
Los trabajadores generan la pregunta: *¿escalo o me mantengo rentable?*
Si pagas demasiados salarios sin suficiente producción, entras en pérdida. Si no contratas, el techo de producción es bajo.

### Salarios
Se pagan automáticamente en cada tick de juego. Si no hay dinero, los trabajadores se van o bajan rendimiento.

---

## Capa 6 — Red Eléctrica

Los recursos `ELECTRIC_COMPONENTS` y `ELECTRIC_ASSEMBLER` ya insinúan esto. Una capa de gestión energética:

| Generador | Costo | Salida | Tradeoff |
|---|---|---|---|
| Generador diesel | Barato, usa fuel | 100W | Contamina, requiere reabastecimiento |
| Panel solar | Sin costo operativo | 40W (variable) | Intermitente, depende del "día" |
| Turbina de viento | Caro de instalar | 150W | Estable, sin fuel |
| Batería de acumulación | Almacena excedente | Buffer | Requiere Baterías del Tier 5 |

### Mecánica
- Cada máquina consume X watts.
- Si la red no tiene energía suficiente, las máquinas más exigentes se apagan.
- Desbloquea un loop de producción de energía: reciclas baterías viejas → energía.
- El jugador gestiona qué máquinas tienen prioridad eléctrica.

---

## Capa 7 — Expansión Física del Patio (Zonas)

El patio crece comprando zonas nuevas. Cada zona tiene su propio contexto visual y mecánicas.

| Zona | Desbloqueada con | Contenido |
|---|---|---|
| Zona A (inicio) | Gratis | Trituradora, Separador, Mercado básico |
| Zona B | $ + Nivel básico de producción | Recicladora, Scrap electrónico, Separador eléctrico |
| Zona C | $ + Contrato completado | Fundidora avanzada, Glass Furnace, Litio |
| Zona D | $ + 10 PCs vendidos | Assembly Line completa, QC, Pantallas |
| Zona E | Prestige 1 | Data Center, Mining Rig, Server Rack |

### Diseño visual
Cada zona es una sección visual distinta del patio. Puede ser scroll horizontal o pantallas diferentes (similar a idle games AAA).

---

## Capa 8 — Mercado Dinámico y Eventos

### Eventos de mercado (aleatorios, tiempo limitado)
- **Boom de demanda** — "Holiday PC Season": x3 precio PCs por 10 min
- **Market Crash** — Precios caen 60% durante 2 min (decisión: aguantar o liquidar)
- **Subasta de Scrap** — Minijuego de bid para conseguir lote de Scrap de lujo
- **Deal corporativo** — Un contrato especial de x5 reward, 1h de tiempo, muy exigente

### Eventos de fábrica (aleatorios, internos)
- **Avería de máquina** — Requiere gastar Componentes para reparar. Incentiva tener stock de reserva.
- **Camión de scrap perdido** — Bonus de Scrap si el jugador está online cuando aparece
- **Fallo eléctrico** — Red eléctrica cae al 50% durante 30s (si está implementada)
- **Inspección de calidad** — Si tus máquinas están al máximo de nivel, cobras bonus de reputación

---

## Capa 9 — Sistema de Prestige / Ampliar el Negocio

Un **soft-reset** con progresión permanente. El jugador no empieza de cero — vende la empresa y monta una más grande.

### Condición de primer prestige
- Completar el contrato "Entregar 100 PCs a MegaCorp"
- O alcanzar X dinero acumulado lifetime

### Reward del prestige
- Tokens de **Reputación** (moneda meta-game)
- Cada prestige desbloquea una mejora permanente:
  - P1: Multiplicador de precio de mercado +10%
  - P2: Velocidad de todas las máquinas +5% permanente
  - P3: Unlocks zona E disponible desde el inicio
  - P4: Los trabajadores no cobran en la primera hora
  - P5+: Personalización de la fábrica (estético)

### Lo que se reinicia
- Recursos y dinero → a valores iniciales
- Niveles de máquinas → a nivel 1
- Upgrades comprados → se pierden

### Lo que NO se reinicia
- Tokens de Reputación
- Mejoras permanentes compradas con Reputación
- Zonas desbloqueadas (opcional: pueden reiniciarse también)
- Récord de producción (para leaderboard local/Steam)

---

## Capa 10 — Narrativa Mínima y Progresión Visual

No un juego story-heavy, pero sí **flavor text** que da contexto:

- Al inicio: *"Heredaste un patio de chatarra endeudado. Tienes 100 monedas y una trituradora rota."*
- Al desbloquear PCB Printer: *"Los técnicos dicen que estos valen mucho si sabes cómo usarlos."*
- Al vender el primer PC: *"MegaCorp ha notado tu operación. Quieren más."*
- Al hacer Prestige 1: *"Vendiste ScrapYard Básico a un inversor local. Con ese capital, abres ScrapYard Industries."*

### Milestones con diálogo
Basado en el `FirstRunTutorialService` existente, pero extendido a eventos de mid/late game:
- Primer PC ensamblado
- Primera avería reparada
- Primer contrato corporativo completado
- Primera zona nueva desbloqueada

---

## Resumen: Eje de Expansión (v1.0 — features confirmadas)

```
DEMO
  Trituradora → Separador → Ensambladora → Empaquetadora
  (T1-T2 completo — el jugador conoce el loop base)
    ↓
T3 completo
  Recicladora → Ensambladora Eléctrica → Empaquetadora Eléctrica
  (el jugador desbloquea la cadena eléctrica — techo actual de la demo)
    ↓
Contratos
  Sistema de objetivos temporales usando recursos T1-T3 ya conocidos.
  El jugador aprende la mecánica antes de enfrentarse a recursos nuevos.
    ↓
Tier 4 — PCB Printer
  Circuit Board (Cobre + Componentes) — pivote de todo lo que sigue.
  Los contratos empiezan a pedir Circuit Boards.
    ↓
Tier 5 — HDD Assembler + Screen Fabricator
  Disco Duro + Pantalla — primeros productos de alto valor.
  Plástico vuelve a ser crítico (Pantalla lo consume).
    ↓
Eventos de mercado
  Booms y crashes afectan precios de HDD y Pantalla.
  El jugador aprende la mecánica cuando los productos impactados tienen valor real.
  Ideal aquí: no es una sorpresa en T7 sino una herramienta que ya domina en T6.
    ↓
Tier 6 — GPU Fab → Smartphone Factory + Laptop Workshop + PC Builder
  GPU abre Desktop PC. Tres factories, tres productos premium.
  Eventos de mercado ya son conocidos — un boom de PCs en T6 tiene peso real.
    ↓
Tier 7 — Data Center Assembly + Mining Rig Assembly
  Server Rack + Mining Rig — techo del juego.
  Drena todos los recursos anteriores en paralelo.
    ↓
Flavor text en milestones clave a lo largo de toda la progresión.
```

TOTAL v1.0: 17 máquinas · 16 recursos · ~9-11h de juego
Tier 7 (Server Rack, Mining Rig) + Zonas D-E + Mercado dinámico
    ↓
Prestige 2+ — Multiplicadores. Meta-game de reputación
```

### Orden de implementación confirmado (v1.0)

> Seguir este orden estrictamente. Cada bloque se puede probar y pulir antes de abrir el siguiente.

| Orden | Feature | Complejidad | Estado |
|---|---|---|---|
| — | **Demo** — T1-T2: Trituradora → Separador → Ensambladora → Empaquetadora | — | ✅ Demo |
| 1 | **T3 completo** — Recicladora → Ensambladora Eléctrica → Empaquetadora Eléctrica | Baja | 🔲 Por implementar |
| 2 | **Sistema de Contratos** — UI de objetivos temporales con recursos T1-T3 | Baja | 🔲 Por implementar |
| 3 | **Tier 4** — PCB Printer → Circuit Board | Media | 🔲 Por implementar |
| 4 | **Tier 5** — HDD Assembler + Screen Fabricator → Disco Duro + Pantalla | Media | 🔲 Por implementar |
| 5 | **Eventos de mercado** — booms, crashes, contratos especiales sobre productos T5 | Media | 🔲 Por implementar |
| 6 | **Tier 6** — GPU Fab + Smartphone Factory + Laptop Workshop + PC Builder | Alta | 🔲 Por implementar |
| 7 | **Tier 7** — Data Center Assembly + Mining Rig Assembly | Alta | 🔲 Por implementar |
| 8 | **Narrativa / Flavor text** — milestones a lo largo de toda la progresión | Baja | 🔲 Por implementar |
| — | Tipos de Scrap diferenciados | Media | ❌ Descartado |
| — | Trabajadores con salarios | Media-Alta | ❌ Descartado |
| — | Red Eléctrica | Alta | ❌ Descartado |
| — | Zonas físicas | Alta | ❌ Descartado |
| — | Prestige | Alta | ❌ Descartado |

---

> Documento generado el 28 de marzo de 2026.
> Actualizar cuando se confirmen decisiones de diseño específicas.
