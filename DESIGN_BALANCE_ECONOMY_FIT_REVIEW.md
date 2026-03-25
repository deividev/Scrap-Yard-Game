# Scrap Yard Idle - Revisión de Encaje Entre Mini GDD y Economía Actual

## 1. Objetivo

Este documento revisa si los números y objetivos definidos en [DESIGN_BALANCE_LOOP_MINI_GDD.md](DESIGN_BALANCE_LOOP_MINI_GDD.md) encajan con la economía real implementada hoy en el proyecto.

El foco no es decidir todavía el balance final, sino detectar:

- qué partes ya encajan razonablemente
- qué partes todavía no existen en runtime
- qué partes contradicen directamente la dirección de diseño

## 2. Conclusión ejecutiva

La economía actual no contradice por completo el mini GDD, pero todavía no lo implementa de verdad.

La mayor divergencia no está en pequeños números. Está en la estructura del loop:

- el mini GDD exige una venta manual fuerte y una monetización automática por máquinas con tradeoffs claros
- la economía actual todavía no tiene esa relación afinada de forma real

Eso significa que varios objetivos del documento no pueden medirse todavía con fidelidad.

## 3. Lo que sí encaja con el mini GDD

## 3.1. Existen cuellos de botella reales

La economía actual ya tiene elementos que generan fricción útil:

- capacidad de scrap limitada
- capacidad de metal limitada
- capacidad de components bastante ajustada
- cadenas de transformación con distintas velocidades

Esto encaja con la idea de que el jugador debe identificar un problema concreto y resolverlo.

## 3.2. La automatización ya tiene un papel reconocible

La generación automática de scrap y las cadenas de máquinas ya empujan hacia una economía de continuidad.

Esto encaja con la parte del mini GDD que define la automatización como soporte y escala.

## 3.3. Las máquinas ya permiten una progresión por cadenas

Las recetas actuales ya crean varios niveles de valor:

- scrap -> metal
- metal -> components
- components -> money
- plastic -> recycled plastic -> electric components -> more money

Esto encaja con el objetivo de que el juego gane profundidad en fases posteriores.

## 4. Lo que no encaja todavía

## 4.1. La venta manual no es aún la base real del early game

El mini GDD define que en early game la venta manual debe ser la fuente principal de dinero o, al menos, la forma más rentable de monetizar presencia.

Hoy eso no está implementado de forma completa porque:

- `MarketService` sigue marcado como placeholder
- metal y plastic no forman todavía un sistema de mercado vivo
- el dinero termina dependiendo mucho de cadenas productivas y packager

Resultado:

- el principio “juego activo más rentable” todavía no está traducido al runtime

## 4.1.b. La monetización automática por máquinas también forma parte del problema

La comparación manual vs automático no puede analizarse solo desde el mercado.

En la economía real, ya existe monetización automática mediante máquinas que convierten recursos en dinero, especialmente:

- `PACKAGER`
- `ELECTRIC_PACKAGER`

Por tanto, aunque no exista auto-venta como sistema deseado, sí existe ya una forma de monetización automática que compite con el ideal del mini GDD.

Resultado:

- cualquier revisión seria de balance debe comparar también monetización manual frente a máquinas de dinero automático

### Comparativa numérica con la economía actual

| Máquina             | Consumo actual          | Dinero actual por ciclo | Manual equivalente | Ratio actual |
| ------------------- | ----------------------- | ----------------------- | ------------------ | ------------ |
| `PACKAGER`          | 4 `COMPONENTS`          | 22                      | 12                 | 183%         |
| `ELECTRIC_PACKAGER` | 6 `ELECTRIC_COMPONENTS` | 65                      | 72 referencia      | 90%          |

Lectura:

- `PACKAGER` es hoy el desajuste numérico más claro respecto al objetivo de diseño.
- `ELECTRIC_PACKAGER` no parece tan roto por ratio bruto si se usa una referencia manual de `ELECTRIC_COMPONENTS`, pero esa referencia todavía no existe explícitamente en runtime.

## 4.2. El mini GDD asume un tradeoff manual vs monetización automática que hoy no existe

El documento define márgenes distintos:

- venta manual premium
- monetización automática por máquinas menos eficiente en early y mid game

Hoy no existe todavía ese par de opciones funcionando como dos opciones comparables dentro del juego.

Resultado:

- no se puede validar bien la ventaja del jugador presente

## 4.3. No existe aún una capa de timing de ventas

El mini GDD define:

- bonus por lotes
- oportunidades temporales
- contratos ligeros

Nada de eso existe todavía en el runtime actual.

Resultado:

- vender sigue siendo una acción demasiado plana comparada con la intención del documento

## 4.4. La automatización temprana necesita mejor calibración respecto al juego activo

La dirección del mini GDD exige que el primer tramo mantenga una clara ventaja para la presencia del jugador.

La economía actual tiene ya una progresión hacia automatización de scrap y cadenas productivas, pero no tiene herramientas suficientes para que la presencia del jugador gane claramente por margen.

Resultado:

- la automatización puede sentirse demasiado pronto como “la dirección natural dominante”

## 5. Revisión de encaje por sistema

| Sistema                             | Encaje actual | Diagnóstico                                                                              |
| ----------------------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| Scrap manual                        | Parcial       | Existe, pero necesita reforzar su valor económico total                                  |
| Scrap automático                    | Parcial       | Existe y funciona, pero hay que afinar cuándo empieza a dominar                          |
| Venta manual                        | Bajo          | No estructura todavía el early game como propone el mini GDD                             |
| Máquinas de monetización automática | Parcial       | Existen y son relevantes; deben entrar explícitamente en el balance manual vs automático |
| Bonus por lotes                     | Nulo          | No existe                                                                                |
| Oportunidades temporales            | Nulo          | No existe                                                                                |
| Contratos ligeros                   | Nulo          | No existe                                                                                |
| Cuellos de botella                  | Medio-alto    | Existen, pero no están todavía alineados con un loop activo-premium                      |
| Progresión por fases                | Parcial       | La economía tiene fases implícitas, pero no están reforzadas sistemáticamente            |

## 6. Revisión de encaje por etapas del juego

## 6.1. Early game

### Mini GDD

- juego activo claramente superior
- venta manual relevante
- automatización aún secundaria

### Estado real

- scrap manual sí tiene protagonismo
- la monetización manual todavía no está suficientemente expresada
- el sistema de mercado no sostiene todavía una ventaja manual clara

### Veredicto

Encaje parcial, pero insuficiente.

## 6.2. Mid game

### Mini GDD

- automatización útil, pero aún con ventaja activa
- más decisiones de prioridad y cuello de botella

### Estado real

- ya aparece la lógica de continuidad automática
- aún faltan herramientas jugables que den valor a intervenir activamente

### Veredicto

Base válida, pero necesita sistemas de apoyo.

## 6.3. Automatización consolidada

### Mini GDD

- lo automático gana peso, pero el jugador aún puede optimizar mejor

### Estado real

- las cadenas automáticas ya pueden dominar el flujo
- faltan picos, oportunidades y decisiones manuales con valor táctico

### Veredicto

Encaje conceptual bueno, implementación incompleta.

## 6.4. Fase final

### Mini GDD

- escala industrial dominada por automatización
- lo manual aporta precisión, timing, contratos y picos

### Estado real

- la economía va camino de escalar en automático
- la capa manual sofisticada todavía no existe

### Veredicto

Compatible a nivel de estructura, pero todavía no soportado por sistemas concretos.

## 7. Números del mini GDD que hoy no pueden validarse del todo

Estos objetivos siguen siendo válidos como dirección, pero no pueden verificarse todavía con precisión porque falta runtime equivalente:

- margen manual vs monetización automática real
- ventaja porcentual del jugador presente
- bonus por lotes
- impacto de oportunidades temporales

No están mal planteados. Simplemente dependen de sistemas aún no desplegados.

## 8. Números del mini GDD que sí son útiles ya

Sí son útiles desde ahora como bandas objetivo:

- ROI de automatización inicial
- dependencia del juego manual por fase
- peso del ingreso automático por fase
- intensidad esperada de los boosts temporales
- umbrales orientativos para lotes futuros

Estos valores sirven como guía de tuning incluso antes de tener el sistema completo.

## 9. Qué cambiar primero para que el mini GDD empiece a encajar de verdad

Orden recomendado:

1. Activar o rediseñar la capa de mercado manual.
2. Introducir la separación entre venta manual y monetización automática por máquinas.
3. Rebajar `PACKAGER` a una banda objetivo aproximada de `10-11` por ciclo base.
4. Fijar `ELECTRIC_PACKAGER` en una banda objetivo aproximada de `58-60` por ciclo base.
5. Definir una referencia manual explícita para `ELECTRIC_COMPONENTS` a efectos de balance interno.
6. Rebalancear la automatización temprana de scrap para que no adelante al juego activo.
7. Añadir una primera capa muy simple de timing: lotes o una oportunidad temporal.
8. Revisar después capacidades y cuellos de botella con el nuevo flujo económico.

## 10. Diagnóstico final

El mini GDD no está mal alineado con el proyecto. De hecho, corrige bien el problema detectado en playtests.

La brecha principal es esta:

- el documento ya define el comportamiento deseado del juego
- la economía real todavía no tiene implementadas varias de las palancas que permitirían medir ese comportamiento

Por tanto, la prioridad no debería ser pulir números muy finos todavía, sino crear primero las palancas de diseño correctas:

1. mercado real
2. margen manual vs monetización automática
3. control explícito de máquinas que monetizan automáticamente
4. timing de ventas
5. automatización con tradeoff más legible

Cuando esas piezas existan, el resto del balance será mucho más fácil de iterar.
