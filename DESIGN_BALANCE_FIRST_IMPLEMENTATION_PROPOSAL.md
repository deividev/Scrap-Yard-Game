# Scrap Yard Idle - Primera Propuesta de Implementación para Mejorar Jugabilidad y Balance

## 1. Objetivo

Este documento propone una primera ola de implementaciones concretas para mejorar el diseño jugable y el balance de Scrap Yard Idle con un criterio claro:

- hacer que jugar activamente sea más rentable y más satisfactorio
- mantener la automatización como una recompensa deseable
- evitar que el juego se convierta demasiado pronto en una experiencia pasiva
- aumentar la sensación de progreso, control y retorno al juego

No busca rehacer todo el juego a la vez. Busca una primera iteración de alto impacto con coste razonable.

## 2. Meta de diseño

La meta es que el jugador sienta esto:

- si estoy presente, progreso mejor
- si me ausento, sigo progresando, pero peor
- si automatizo, no dejo de jugar; cambio el tipo de decisión que tomo

## 3. Principio de priorización

Las primeras implementaciones deben centrarse en cambiar la sensación del juego antes que en añadir complejidad.

Por tanto, la prioridad no debe ser meter más sistemas grandes, sino introducir primero las palancas que más cambian el comportamiento del jugador:

1. monetización manual fuerte
2. monetización automática más contenida en early y mid game
3. decisiones de timing sencillas
4. cuellos de botella más legibles
5. mejores motivos para volver a mirar la partida

## 4. Primera propuesta de implementaciones

## Bloque 1 - Hacer que vender manualmente sea claramente mejor

### Implementación 1.1

Activar y consolidar la venta manual como fuente principal de dinero en early game.

Qué hacer:

1. formalizar precios manuales base en config
2. mantener `METAL`, `PLASTIC` y `COMPONENTS` como recursos vendibles manualmente
3. dejar muy claro en UI cuánto dinero gana el jugador por venta

Objetivo:

- que el jugador entienda que jugar activamente compensa

Impacto esperado:

- muy alto

Prioridad:

- crítica

### Implementación 1.2

Reducir el rendimiento base de `PACKAGER` para que no supere la venta manual de `COMPONENTS` durante early y mid game.

Qué hacer:

1. bajar `PACKAGER` de `22` a una banda inicial de `10-11`
2. validar que vender `4 COMPONENTS` manualmente siga siendo mejor que procesarlos automáticamente en dinero

Objetivo:

- evitar que la mejor decisión temprana sea automatizar dinero demasiado pronto

Impacto esperado:

- muy alto

Prioridad:

- crítica

### Implementación 1.3

Definir un valor manual de referencia para `ELECTRIC_COMPONENTS` y usarlo para rebalancear `ELECTRIC_PACKAGER`.

Qué hacer:

1. fijar referencia interna de `12` por `ELECTRIC_COMPONENT`
2. bajar `ELECTRIC_PACKAGER` de `65` a `58-60` como primer objetivo
3. permitir que solo en fase final pueda acercarse o superar esa referencia

Objetivo:

- impedir que la monetización automática avanzada elimine demasiado pronto el valor del juego presente

Impacto esperado:

- alto

Prioridad:

- alta

## Bloque 2 - Frenar la automatización temprana sin volverla inútil

### Implementación 2.1

Rebalancear la llegada automática de scrap para que entre más tarde y empuje menos al principio.

Qué hacer:

1. subir `UPG_SCRAP_002.baseCostMoney` de `60` a `75`
2. suavizar `AUTO_GENERATION_RATES` iniciales
3. endurecer ligeramente la curva de crecimiento de scrap automation

Objetivo:

- que el jugador no salte demasiado pronto al modo pasivo

Impacto esperado:

- alto

Prioridad:

- crítica

### Implementación 2.2

Reforzar el scrap manual como acción útil en fase 1.

Qué hacer:

1. subir `MANUAL_GENERATION` de `5` a `6`
2. mantener el coste en `1` como opción base
3. si el early se siente demasiado duro, probar `MANUAL_COST = 0.5`

Objetivo:

- hacer que el jugador note inmediatamente el valor de intervenir

Impacto esperado:

- medio-alto

Prioridad:

- alta

## Bloque 3 - Añadir una capa ligera de timing jugable

### Implementación 3.1

Introducir bonus por lotes de venta manual.

Qué hacer:

1. definir thresholds simples
2. aplicar `+5%` a lote medio y `+10%` a lote grande
3. mostrar feedback visual cuando se active el bonus

Objetivo:

- hacer que vender no sea solo pulsar un botón siempre igual

Impacto esperado:

- alto

Prioridad:

- alta

### Implementación 3.2

Introducir una oportunidad temporal simple de mercado.

Qué hacer:

1. una sola oportunidad activa a la vez
2. duración `20-30s`
3. bonus inicial `+15%`
4. aplicarlo a `METAL` o `COMPONENTS` en la primera versión

Objetivo:

- crear momentos de retorno al juego sin meter complejidad excesiva

Impacto esperado:

- alto

Prioridad:

- alta

## Bloque 4 - Hacer que la fricción del sistema sea más interesante

### Implementación 4.1

Revisar capacidades iniciales para que el cuello de botella sea jugable y no molesto.

Qué hacer:

1. probar `COMPONENTS = 10` como primera versión suave
2. medir si reduce frustración sin destruir la tensión entre vender y guardar

Objetivo:

- que el jugador perciba presión útil y no bloqueo arbitrario

Impacto esperado:

- medio

Prioridad:

- media

### Implementación 4.2

Añadir feedback visible de cuello de botella.

Qué hacer:

1. avisos de almacenamiento casi lleno
2. avisos de máquina sin input
3. avisos de recurso listo para venta valiosa

Objetivo:

- que el jugador entienda qué problema está resolviendo en cada momento

Impacto esperado:

- medio-alto

Prioridad:

- media-alta

## Bloque 5 - Hacer la automatización más atractiva sin regalar el juego

### Implementación 5.1

Replantear la automatización como sistema de continuidad y no como sistema de mejor rentabilidad.

Qué hacer:

1. mantener la automatización de dinero por debajo de la venta manual hasta juego avanzado
2. dejar que el valor de la automatización esté en estabilidad y escala
3. permitir que la distancia se cierre solo al final del mid game y el late game

Objetivo:

- que automatizar siga siendo apetecible, pero no dominante demasiado pronto

Impacto esperado:

- muy alto

Prioridad:

- crítica

## 5. Orden recomendado de implementación

Orden propuesto para una primera iteración real:

1. Implementación 1.1
2. Implementación 1.2
3. Implementación 2.1
4. Implementación 2.2
5. Implementación 3.1
6. Implementación 3.2
7. Implementación 1.3
8. Implementación 4.1
9. Implementación 4.2
10. Implementación 5.1

## 6. Versión mínima viable de esta propuesta

Si hubiera que hacer una versión mínima con el mejor retorno posible, sería esta:

1. activar venta manual fuerte
2. bajar `PACKAGER` a `10-11`
3. retrasar y suavizar `UPG_SCRAP_002`
4. subir `MANUAL_GENERATION` a `6`
5. añadir bonus por lotes

Con solo eso ya debería cambiar de forma visible la sensación del juego.

## 7. Cómo debería sentirse el juego tras esta primera ola

Si esta primera propuesta funciona bien, la sensación del jugador debería pasar de:

- automatizo y dejo de jugar

a algo más parecido a:

- vendo manualmente para sacar mejor margen
- automatizo para mantener flujo
- vuelvo a entrar para aprovechar mejores momentos de venta
- sigo teniendo decisiones incluso cuando ya tengo parte de la fábrica funcionando sola

## 8. Métricas de validación recomendadas

Después de implementar esta primera ola, convendría medir:

1. dinero por minuto de jugador activo en sesiones de 5 a 10 minutos
2. dinero por minuto de sesión pasiva equivalente
3. ratio entre venta manual de `COMPONENTS` y monetización por `PACKAGER`
4. ratio entre referencia manual de `ELECTRIC_COMPONENTS` y `ELECTRIC_PACKAGER`
5. frecuencia con la que el jugador interactúa voluntariamente tras desbloquear automatización

## 9. Conclusión

La primera propuesta no necesita más sistemas grandes. Necesita corregir primero qué acciones son mejores y por qué.

El objetivo no es hacer el juego más complicado.
El objetivo es que sea más difícil dejar de jugar porque estar presente siga siendo rentable, claro y satisfactorio.
