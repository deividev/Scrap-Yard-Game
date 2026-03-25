# Scrap Yard Idle - Propuestas Concretas Sobre Configs Actuales

## 1. Objetivo

Este documento traduce el marco definido en [DESIGN_BALANCE_LOOP_MINI_GDD.md](DESIGN_BALANCE_LOOP_MINI_GDD.md) a propuestas concretas sobre los configs y servicios actuales del proyecto.

No es una especificación final de implementación. Es una hoja de cambios sugeridos sobre el estado real del juego para acercarlo al objetivo de diseño:

- juego activo más rentable a corto plazo
- automatización útil para continuidad y escala
- decisiones más interesantes en ventas, timing y cuellos de botella

## 2. Archivos y puntos de control principales

Los puntos de ajuste más relevantes hoy son:

- `src/app/config/game-balance.config.ts`
- `src/app/config/upgrade-definitions.config.ts`
- `src/app/config/machines.config.ts`
- `src/app/services/market.service.ts`
- `src/app/services/scrap-generation.service.ts`
- `src/app/services/game-loop.service.ts`

## 3. Resumen de cambios propuestos por sistema

## 3.1. Scrap manual

### Estado actual

- `MANUAL_GENERATION = 5`
- `MANUAL_COST = 1`
- La acción manual ya existe y es el principal gesto activo inicial.

### Problema de diseño

Generar scrap manualmente sirve para arrancar el loop, pero no existe aún una recompensa económica suficientemente clara asociada a estar presente si la venta sigue siendo plana o limitada.

### Propuesta base

#### Opción recomendada de fase 1

- `MANUAL_GENERATION: 5 -> 6`
- `MANUAL_COST: 1 -> 1`

#### Opción alternativa si early game se siente demasiado duro

- `MANUAL_GENERATION: 5 -> 6`
- `MANUAL_COST: 1 -> 0.5`

### Intención

- Mantener el gesto manual como una acción con valor.
- Evitar que el primer tramo se vuelva una espera por generación pasiva.
- Dar más aire para que el jugador note la relación entre input manual, producción y dinero.

## 3.2. Scrap automático

### Estado actual

- `UPG_SCRAP_002.baseCostMoney = 60`
- `AUTO_GENERATION_RATES = [0.0, 0.2, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0]`
- `SCRAP_MULTIPLIER = 1.35`
- `COST_MULTIPLIER = 1.4` dentro de `SCRAP_GENERATION_CONFIG`

### Problema de diseño

La automatización de scrap debe sentirse útil, pero no debe anular la ventaja del juego activo en early y early-mid game.

### Propuesta base

#### Coste de entrada

- `UPG_SCRAP_002.baseCostMoney: 60 -> 75`

#### Ritmo de crecimiento sugerido

- `AUTO_GENERATION_RATES` actual:
  - `[0.0, 0.2, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0]`
- propuesta:
  - `[0.0, 0.12, 0.2, 0.32, 0.48, 0.7, 1.0, 1.45, 2.1, 3.0, 4.2]`

#### Curva de coste

- `SCRAP_GENERATION_CONFIG.COST_MULTIPLIER: 1.4 -> 1.45`

### Intención

- La automatización entra más tarde y empuja menos en early.
- Sigue siendo deseable por comodidad.
- Gana peso a partir de mid game sin comerse el margen activo demasiado pronto.

## 3.3. Venta manual y monetización automática por máquinas

### Estado actual

- `market.service.ts` está planteado como placeholder.
- `METAL_PRICE = 1`
- `PLASTIC_PRICE = 1`
- `COMPONENTS_PRICE = 3`
- El juego actual no tiene todavía una capa de mercado manual completa.
- La monetización automática real llega sobre todo por máquinas que convierten recursos en dinero.

### Problema de diseño

Sin una diferencia clara entre venta manual y monetización automática, no se puede reforzar la idea de que el jugador presente gana mejor.

Esta comparación debe centrarse en la venta manual frente a las máquinas que convierten recursos en dinero automáticamente, porque desde la perspectiva del jugador cumplen la función económica rival: monetizar stock sin intervención directa.

En la economía actual eso afecta sobre todo a:

- `PACKAGER`
- `ELECTRIC_PACKAGER`

### Propuesta base

#### Nuevos objetivos de precios manuales

| Recurso             | Venta manual    | Observación                                                                                                                  |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Metal               | 1.0             | Recurso temprano, bueno para enseñar margen activo                                                                           |
| Plastic             | 1.2             | Puede servir como recurso de decisión alternativa                                                                            |
| Components          | 3.0             | Debe mantener valor alto por ser intermedio avanzado                                                                         |
| Electric Components | 12.0 referencia | Referencia de balance para comparar contra `ELECTRIC_PACKAGER` aunque no se habilite su venta manual en la primera iteración |

#### Estructura sugerida

- sacar precios base a config dedicado de mercado
- separar claramente:
  - `BASE_PRICES`
  - `MANUAL_SELL_MULTIPLIER`
  - `BATCH_BONUS_THRESHOLDS`

### Intención

- Lo manual gana por margen.
- Lo automático por máquinas gana por continuidad y escala.
- El mercado deja de ser una idea abstracta y pasa a ser parte central del loop.

### Regla adicional de balance

La monetización automática total debe medirse como suma conceptual de:

1. máquinas que convierten recursos directamente en dinero
2. cualquier otra conversión futura automática de recursos a dinero, si alguna vez se introduce

Eso significa que el balance seguirá roto si `PACKAGER` o `ELECTRIC_PACKAGER` convierten recursos en dinero demasiado bien demasiado pronto.

#### Tabla comparativa actual vs venta manual

| Máquina             | Consumo actual          | Dinero actual por ciclo | Equivalente manual por ciclo | Ratio actual vs manual | Lectura                                                                                 |
| ------------------- | ----------------------- | ----------------------- | ---------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `PACKAGER`          | 4 `COMPONENTS`          | 22                      | 12                           | 183%                   | Rompe claramente la regla de que lo manual debe ser más rentable                        |
| `ELECTRIC_PACKAGER` | 6 `ELECTRIC_COMPONENTS` | 65                      | 72 referencia                | 90%                    | Más razonable como ratio, pero necesita referencia manual explícita para validarse bien |

#### Objetivos propuestos para máquinas de dinero

| Máquina             | Consumo                 | Actual | Propuesta base | Ratio propuesto vs manual             | Objetivo de fase                   |
| ------------------- | ----------------------- | ------ | -------------- | ------------------------------------- | ---------------------------------- |
| `PACKAGER`          | 4 `COMPONENTS`          | 22     | 10-11          | 83%-92% sobre venta manual de 12      | Mid game y automatización temprana |
| `ELECTRIC_PACKAGER` | 6 `ELECTRIC_COMPONENTS` | 65     | 58-60          | 81%-83% sobre referencia manual de 72 | Automatización consolidada         |

#### Escalado objetivo por fase para máquinas que generan dinero

| Máquina                                  | Early game | Mid game  | Automatización consolidada | Fase final |
| ---------------------------------------- | ---------- | --------- | -------------------------- | ---------- |
| `PACKAGER` dinero por ciclo              | N/A o 10   | 10-11     | 11-12                      | 12-13      |
| Ratio vs monetización manual equivalente | N/A o 83%  | 83%-92%   | 92%-100%                   | 100%-108%  |
| `ELECTRIC_PACKAGER` dinero por ciclo     | N/A        | N/A o 58  | 58-60                      | 66-76      |
| Ratio vs monetización manual equivalente | N/A        | N/A o 81% | 81%-83%                    | 92%-106%   |

Interpretación:

- `PACKAGER` no debería dar más dinero por `COMPONENT` que vender `COMPONENTS` manualmente hasta bastante avanzado el juego.
- `ELECTRIC_PACKAGER` puede quedar por debajo de la venta manual de referencia en automatización consolidada y acercarse o superar solo en fase final.
- Si no quieres habilitar venta manual de `ELECTRIC_COMPONENTS`, el valor de `12` por unidad debe mantenerse al menos como referencia interna de balance.

## 3.4. Bonus por lotes

### Estado actual

No existe sistema de lotes.

### Propuesta base

#### Umbrales sugeridos

| Tipo de lote | Threshold early | Threshold mid | Bonus |
| ------------ | --------------- | ------------- | ----- |
| Pequeño      | 5               | 10            | 0%    |
| Medio        | 15              | 25            | +5%   |
| Grande       | 30              | 50            | +10%  |

### Intención

- Introducir timing sin complejidad excesiva.
- Hacer que vender al instante no sea siempre la mejor decisión.
- Crear una pequeña tensión entre liquidez inmediata y rentabilidad.

## 3.5. Oportunidades temporales

### Estado actual

No existe sistema de oportunidades de mercado.

### Propuesta base

#### Primera versión recomendada

- una oportunidad activa como máximo a la vez
- duración: `20-30 s`
- frecuencia: cada `180-240 s`
- bonus de precio: `+15%`
- recursos válidos en primera iteración: metal o components

### Intención

- Dar motivos reales para mirar la partida.
- Premiar al jugador presente sin castigar al ausente.
- Añadir decisiones ligeras de corto plazo.

## 3.6. Capacidades iniciales y cuellos de botella

### Estado actual

- `SCRAP = 75`
- `METAL = 20`
- `PLASTIC = 15`
- `COMPONENTS = 8`
- `RECYCLED_PLASTIC = 20`
- `ELECTRIC_COMPONENTS = 10`

### Lectura de diseño

La presión actual existe, pero no está afinada explícitamente para apoyar el nuevo loop manual vs automático.

### Propuesta base

#### Versión conservadora

- `SCRAP = 75` mantener
- `METAL = 20` mantener
- `PLASTIC = 15` mantener
- `COMPONENTS = 8 -> 10`

#### Razón

Subir ligeramente componentes ayuda a que el jugador no sienta bloqueo excesivo justo cuando empieza a entender que guardar o vender ya importa.

#### Propuesta alternativa si se quiere más presión de gestión

- `COMPONENTS = 8 -> 6`

### Recomendación

Empezar con `COMPONENTS = 10` si el objetivo inmediato es mejorar sensaciones. Bajar a `6` solo si se quiere un perfil más exigente y más táctico.

## 3.7. Costes de upgrades

### Estado actual

- `DEFAULT_MULTIPLIER = 1.26`
- `SCRAP_MULTIPLIER = 1.35`
- `STORAGE_MULTIPLIER = 1.2`
- `UPG_MACH_001.baseCostMoney = 30`
- `UPG_SCRAP_001.baseCostMoney = 70`
- `UPG_SCRAP_002.baseCostMoney = 60`

### Problema de diseño

La estructura actual es funcional, pero no está orientada todavía a retrasar ligeramente la superioridad de la automatización ni a reforzar una fase 1 muy activa.

### Propuesta base

| Upgrade o constante  | Actual | Propuesta | Motivo                                            |
| -------------------- | ------ | --------- | ------------------------------------------------- |
| `UPG_MACH_001`       | 30     | 35        | Mantener valor, pero evitar pico demasiado barato |
| `UPG_SCRAP_001`      | 70     | 60        | Reforzar scrap manual como herramienta activa     |
| `UPG_SCRAP_002`      | 60     | 75        | Retrasar automatización dominante                 |
| `DEFAULT_MULTIPLIER` | 1.26   | 1.28      | Curva algo más exigente                           |
| `SCRAP_MULTIPLIER`   | 1.35   | 1.45      | Frenar escalado automático temprano               |
| `STORAGE_MULTIPLIER` | 1.2    | 1.2       | Mantener suave para no bloquear demasiado         |

## 3.8. Producción base de máquinas

### Estado actual relevante

- Crusher: 1 scrap -> 2 metal, `baseSpeed = 0.5`
- Smelter: 4 metal -> 2 components, `baseSpeed = 0.25`
- Assembler: 1 metal + 1 plastic -> 1 component, `baseSpeed = 0.17`
- Packager: 4 components -> 22 money, `baseSpeed = 0.1`

### Lectura de diseño

El paquete actual ya tiene una jerarquía de valor, pero el loop depende demasiado de que el dinero llegue por cadenas concretas si la venta manual no se vuelve central.

Además, `PACKAGER` y `ELECTRIC_PACKAGER` deben analizarse como parte del bloque de monetización automática, no solo como máquinas productivas neutras.

### Propuesta base

#### No tocar primero las recetas

Como primera iteración, no cambiaría recetas de máquinas. Cambiaría primero:

1. mercado
2. margen manual vs monetización automática
3. scrap manual vs scrap automático
4. bonus por lotes

#### Ajuste opcional de seguridad

Si el packager termina dominando demasiado pronto tras activar mercado:

- `PACKAGER` producción: `22 -> 10-11`

Y si la monetización automática tardía sigue aplastando demasiado la monetización manual:

- revisar también `ELECTRIC_PACKAGER` producción: `65 -> 58-60`

### Regla de validación para máquinas que generan dinero

El rendimiento de `PACKAGER` y `ELECTRIC_PACKAGER` no debería superar la monetización manual óptima durante early y mid game si se mide dinero por unidad de recurso valioso consumido.

Objetivo orientativo:

| Sistema                                             | Early game      | Mid game        | Automatización consolidada | Fase final      |
| --------------------------------------------------- | --------------- | --------------- | -------------------------- | --------------- |
| Monetización manual óptima                          | 100% referencia | 100% referencia | 100% referencia            | 100% referencia |
| `PACKAGER` / dinero automático equivalente          | N/A o 70% a 80% | 83% a 92%       | 92% a 100%                 | 100% a 108%     |
| `ELECTRIC_PACKAGER` / dinero automático equivalente | N/A             | N/A o 80% a 85% | 81% a 83%                  | 92% a 106%      |

Interpretación:

- early y mid: monetizar manualmente bien debe seguir siendo mejor negocio
- automatización consolidada: la distancia se reduce
- fase final: la automatización puede igualar o superar ligeramente si el jugador ya ha construido una cadena industrial avanzada

Solo lo tocaría si los tests muestran que sigue empujando demasiado hacia ingresos pasivos.

## 4. Propuesta de orden de cambios reales sobre configs

Orden recomendado:

1. Crear config de mercado y activar estructura manual vs automática.
2. Rebalancear `UPG_SCRAP_001` y `UPG_SCRAP_002`.
3. Ajustar `AUTO_GENERATION_RATES`.
4. Añadir bonus por lotes.
5. Añadir oportunidades temporales simples.
6. Revisar si hace falta tocar packager o capacidades.

## 5. Resultado esperado si se aplican estas propuestas

Si estas propuestas funcionan bien, el juego debería pasar a sentirse así:

- early game: jugar presente es claramente mejor
- mid game: la automatización ayuda, pero no manda
- automatización consolidada: el jugador optimiza mejor que el sistema
- fase final: lo automático domina la escala, pero lo manual sigue aportando picos, timing y mejor margen

## 6. Conclusión

La recomendación principal sobre el estado actual es no empezar retocando muchas recetas o sistemas avanzados. El mayor salto de calidad vendrá de:

1. activar una economía de venta real
2. distinguir claramente margen manual vs margen automático
3. frenar un poco la automatización de scrap temprana
4. introducir timing ligero mediante lotes y oportunidades
