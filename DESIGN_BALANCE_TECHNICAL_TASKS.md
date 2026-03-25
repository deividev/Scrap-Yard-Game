# Scrap Yard Idle - Tareas Técnicas Archivo por Archivo

## 1. Objetivo

Este documento traduce la primera propuesta de implementación a tareas técnicas concretas, organizadas por archivo y por bloque funcional.

El objetivo es que la implementación real pueda arrancar sin ambigüedad y con una secuencia clara de trabajo.

## 2. Bloque A - Economía manual y mercado

### [src/app/config/game-balance.config.ts](src/app/config/game-balance.config.ts)

Tareas:

1. Centralizar precios manuales del mercado.
2. Definir thresholds y multiplicadores de bonus por lotes.
3. Ajustar `MANUAL_GENERATION`.
4. Ajustar `SCRAP_GENERATION_CONFIG.COST_MULTIPLIER`.
5. Ajustar `AUTO_GENERATION_RATES`.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/services/market.service.ts](src/app/services/market.service.ts)

Tareas:

1. Dejar el servicio centrado solo en venta manual.
2. Calcular valor de venta usando precios desde config.
3. Añadir cálculo de bonus por lotes.
4. Exponer helpers para UI: cantidad vendible, valor esperado, porcentaje de bonus.
5. Mantener eventos tutoriales relevantes.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/components/sell-metal-button/sell-metal-button.component.ts](src/app/components/sell-metal-button/sell-metal-button.component.ts)

Tareas:

1. Mostrar cuánto se va a vender realmente.
2. Mostrar cuánto dinero se va a ganar.
3. Reflejar bonus por lotes en el propio botón.
4. Hacer que la acción de venta tenga valor jugable real.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/components/sell-components-button/sell-components-button.component.ts](src/app/components/sell-components-button/sell-components-button.component.ts)

Tareas:

1. Igualar comportamiento al botón de metal.
2. Hacer visible la relación entre stock acumulado y valor de venta.
3. Mostrar bonus por lotes.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/components/resources-header/resources-header.component.ts](src/app/components/resources-header/resources-header.component.ts)

Tareas:

1. Verificar que los botones de venta siguen siendo legibles con cantidades dinámicas.
2. Si hace falta, reservar mejor espacio para bonus y ganancias.
3. Evaluar si conviene añadir venta manual de plástico en la segunda iteración.

Estado recomendado:

- pendiente de revisión visual tras build/playtest

## 3. Bloque B - Automatización temprana y upgrades

### [src/app/config/upgrade-definitions.config.ts](src/app/config/upgrade-definitions.config.ts)

Tareas:

1. Aumentar coste base de `UPG_SCRAP_002`.
2. Mantener resto de upgrades sin tocar salvo que los tests muestren necesidad.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/services/upgrades.service.ts](src/app/services/upgrades.service.ts)

Tareas:

1. Verificar que la curva nueva de `UPG_SCRAP_002` se refleja bien en UI y compra.
2. Comprobar que el rate automático actualizado sigue sincronizado con el loop.
3. Más adelante, revisar si `UPG_SCRAP_001` también debe rebalancearse.

Estado recomendado:

- pendiente de validación funcional

### [src/app/services/scrap-generation.service.ts](src/app/services/scrap-generation.service.ts)

Tareas:

1. Confirmar el nuevo valor de generación manual.
2. Confirmar que la tabla de auto generación refleja bien la progresión esperada.
3. Evaluar si el coste manual debe bajar a `0.5` en una segunda prueba si early game queda demasiado duro.

Estado recomendado:

- pendiente de validación funcional

## 4. Bloque C - Máquinas que generan dinero

### [src/app/config/machines.config.ts](src/app/config/machines.config.ts)

Tareas:

1. Rebajar output base de `PACKAGER`.
2. Rebajar output base de `ELECTRIC_PACKAGER`.
3. Mantener el resto de recetas intactas en esta primera iteración.

Estado recomendado:

- implementado en la primera iteración mínima

### [src/app/services/game-loop.service.ts](src/app/services/game-loop.service.ts)

Tareas:

1. Verificar que la reducción de output cambia realmente la economía por tick.
2. En futuras iteraciones, añadir métricas internas o telemetría ligera para comparar monetización manual vs automática.

Estado recomendado:

- pendiente de validación funcional

## 5. Bloque D - Próxima iteración recomendable

### [src/app/components/resources-header/resources-header.component.ts](src/app/components/resources-header/resources-header.component.ts)

Tareas futuras:

1. Añadir mejor feedback visual de cuello de botella.
2. Añadir avisos de oportunidad temporal.
3. Mostrar cuándo una venta manual está siendo especialmente buena.

### [src/app/services/market.service.ts](src/app/services/market.service.ts)

Tareas futuras:

1. Implementar una oportunidad temporal simple de mercado.
2. Exponer estado de oportunidad activa a la UI.
3. Valorar contratos ligeros en una segunda fase.

### [src/app/components](src/app/components)

Tareas futuras:

1. Evaluar un botón manual de venta de plástico.
2. Añadir indicadores de bonus o prioridad sin sobrecargar la cabecera.

## 6. Secuencia técnica recomendada

1. Configs de balance.
2. Servicio de mercado.
3. Botones de venta.
4. Ajustes de máquinas de dinero.
5. Validación de costes y progresión de scrap automático.
6. Revisión visual y playtest corto.

## 7. Criterio de salida de esta primera fase

La fase puede considerarse conseguida si:

1. vender manualmente `COMPONENTS` sigue siendo más rentable que `PACKAGER`
2. la automatización de scrap entra más tarde y presiona menos al principio
3. el jugador ve que acumular más stock puede mejorar su venta
4. la economía temprana vuelve a premiar presencia real
