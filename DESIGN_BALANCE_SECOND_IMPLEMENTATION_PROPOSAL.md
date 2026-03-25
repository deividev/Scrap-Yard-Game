# Scrap Yard Idle - Segunda Propuesta de Implementación: Decisiones Activas, Boosts y Prioridades

## 1. Objetivo

Esta segunda propuesta se centra en una fase más ambiciosa que no solo rebalancea números, sino que añade decisiones activas para que la automatización cambie el tipo de juego en vez de apagarlo.

La meta es que, una vez la primera ola de balance esté estable, el jugador siga teniendo motivos para volver y tomar decisiones útiles.

## 2. Problema que resuelve

Aunque el balance manual vs automático mejore, el juego puede seguir perdiendo fuerza si la automatización solo sustituye acciones sin crear nuevas decisiones.

La segunda propuesta ataca ese problema con tres capas:

1. boosts temporales
2. prioridades de producción
3. decisiones activas de retorno corto

## 3. Línea principal de diseño

La automatización debe quitar trabajo repetitivo.
El jugador debe quedarse con las decisiones más valiosas.

## 4. Propuesta de sistemas

## 4.1. Boosts temporales por máquina

Idea:

Cada cierto tiempo el jugador puede activar un boost corto sobre una máquina concreta.

Ejemplos:

1. `Overdrive`: +25% velocidad durante 15 segundos
2. `Salida prioritaria`: la máquina entrega output instantáneamente una vez
3. `Ajuste fino`: reduce temporalmente el consumo de input

Objetivo:

- que entrar al juego tenga valor inmediato

## 4.2. Prioridades de producción

Idea:

Permitir que el jugador escoja una prioridad simple para la fábrica o para máquinas concretas.

Opciones iniciales posibles:

1. priorizar dinero
2. priorizar componentes
3. priorizar stock

Objetivo:

- que el jugador no solo observe; que decida la dirección del sistema

## 4.3. Ventanas de oportunidad activas

Idea:

Convertir algunas oportunidades de mercado en microeventos que se puedan aprovechar mejor si el jugador actúa.

Ejemplos:

1. demanda alta de metal
2. pedido urgente de components
3. bonificación por cadena de ventas manuales en poco tiempo

Objetivo:

- aumentar la sensación de retorno y de oportunidad perdida si no miras nunca el juego

## 4.4. Decisiones de cuello de botella

Idea:

No solo mostrar el cuello de botella; dejar al jugador intervenir sobre él.

Ejemplos:

1. liberar stock prioritario
2. reasignar producción hacia un recurso clave
3. activar un alivio temporal de capacidad o throughput

Objetivo:

- que el problema del sistema sea también una decisión jugable

## 5. Lista clara de implementaciones candidatas

## Prioridad alta

1. Sistema de boost corto para una máquina activa.
2. Selector simple de prioridad de producción.
3. Oportunidad temporal visible en UI con recompensa real.

## Prioridad media

4. Indicadores visuales claros de cuello de botella.
5. Acción manual para aliviar un atasco o aprovechar un pico de valor.
6. Eventos de venta encadenada o venta oportunista.

## Prioridad posterior

7. Contratos ligeros con objetivos de lote.
8. Boosts más especializados por tipo de máquina.
9. Decisiones avanzadas por cadena productiva.

## 6. Orden recomendado

1. Boost temporal simple.
2. Oportunidad temporal simple.
3. Prioridad de producción básica.
4. Feedback de cuello de botella.
5. Intervenciones activas de mayor profundidad.

## 7. Resultado esperado

Si esta segunda propuesta funciona bien, el jugador debería sentir:

1. la fábrica ya funciona sola, pero yo la hago rendir mejor
2. hay buenos momentos para entrar, no solo para mirar
3. automatizar no mata el juego; desbloquea decisiones nuevas

## 8. Criterio de validación

La propuesta va en buena dirección si:

1. el jugador vuelve voluntariamente a la partida para aprovechar momentos concretos
2. los boosts se usan porque tienen valor, no porque sean obligatorios
3. la prioridad de producción cambia decisiones reales y no solo cosmética
4. el juego gana tensión sin volverse pesado o agotador
