# Scrap Yard Idle - Roadmap Ejecutivo de Implementación de Balance y Loop

## 1. Objetivo

Este documento convierte en plan de trabajo los tres documentos de referencia:

- [DESIGN_BALANCE_LOOP_MINI_GDD.md](DESIGN_BALANCE_LOOP_MINI_GDD.md)
- [DESIGN_BALANCE_CONFIG_PROPOSALS.md](DESIGN_BALANCE_CONFIG_PROPOSALS.md)
- [DESIGN_BALANCE_ECONOMY_FIT_REVIEW.md](DESIGN_BALANCE_ECONOMY_FIT_REVIEW.md)

El objetivo es definir una secuencia de implementación pragmática, con tareas claras y prioridad alta en las palancas que más cambian la sensación jugable.

## 2. Resumen ejecutivo

La prioridad no es tocar todo el balance a la vez. La prioridad es introducir primero las palancas que permitan que el diseño deseado exista realmente en runtime.

Orden estratégico:

1. Hacer que la presencia del jugador tenga valor económico real.
2. Diferenciar claramente venta manual vs monetización automática por máquinas.
3. Añadir una capa ligera de timing de ventas.
4. Recalibrar automatización temprana y curvas de coste.
5. Validar con playtests antes de tocar sistemas avanzados.

## 3. Roadmap por bloques

## Bloque 1 - Activar economía jugable real

### Meta

Convertir la venta en una mecánica real del loop y no en una pieza parcial o placeholder.

### Tareas

1. Extraer precios y multiplicadores de venta a un config dedicado de mercado.
2. Definir precio base por recurso vendible.
3. Definir explícitamente la relación entre venta manual y monetización automática por máquinas.
4. Decidir qué recursos se pueden vender manualmente en la primera iteración.
5. Definir cómo encajan `PACKAGER` y `ELECTRIC_PACKAGER` dentro de la monetización automática total.
6. Integrar el flujo de venta en runtime de forma controlada.
7. Definir una referencia manual de balance para `ELECTRIC_COMPONENTS`, aunque no se habilite su venta directa en la primera iteración.

### Resultado esperado

- el jugador puede ganar dinero jugando de forma activa con una lógica clara
- el juego ya soporta la regla central de diseño

## Bloque 2 - Reforzar el valor del juego activo

### Meta

Hacer que el jugador presente gane mejor que el sistema automático en early y mid game.

### Tareas

1. Ajustar scrap manual para que siga siendo una acción útil.
2. Rebalancear `UPG_SCRAP_001` para reforzar presencia activa.
3. Rebalancear `UPG_SCRAP_002` para retrasar la superioridad automática.
4. Ajustar output o timings de `PACKAGER` si monetiza demasiado bien demasiado pronto.
5. Ajustar output o timings de `ELECTRIC_PACKAGER` si borra demasiado el valor del juego presente.
6. Ajustar curvas de costes de scrap automation si hace falta.
7. Medir cuánto mejora el progreso de una sesión activa frente a una pasiva.

### Números objetivo iniciales

| Máquina             | Estado actual                       | Objetivo inicial                       | Regla                                                                |
| ------------------- | ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| `PACKAGER`          | `4 COMPONENTS -> 22 MONEY`          | `4 COMPONENTS -> 10-11 MONEY`          | Debe quedar por debajo de vender `4 COMPONENTS` manualmente por `12` |
| `ELECTRIC_PACKAGER` | `6 ELECTRIC_COMPONENTS -> 65 MONEY` | `6 ELECTRIC_COMPONENTS -> 58-60 MONEY` | Debe quedar por debajo de la referencia manual `72` hasta late       |

### Resultado esperado

- entrar en la partida tiene valor real
- el jugador no siente que la mejor estrategia sea solo esperar

## Bloque 3 - Introducir timing de ventas sin complejidad alta

### Meta

Hacer que vender tenga decisiones ligeras y frecuentes.

### Tareas

1. Implementar bonus por lotes.
2. Definir thresholds de lote iniciales.
3. Añadir una oportunidad temporal simple de mercado.
4. Diseñar feedback visual claro para esas oportunidades.
5. Testear si el sistema mejora la sensación de presencia sin añadir ruido.

### Resultado esperado

- vender deja de ser una acción plana
- aparecen pequeños picos de valor que justifican volver a mirar la partida

## Bloque 4 - Revisión de cuellos de botella y capacidades

### Meta

Afinar la fricción del sistema para que los problemas del jugador sean comprensibles y jugables.

### Tareas

1. Revisar capacidades iniciales de recursos clave.
2. Confirmar si `COMPONENTS` debe subir, bajar o mantenerse.
3. Revisar si las mejoras de almacenamiento aparecen en buen momento.
4. Verificar que los cuellos de botella cambian por fase y no son siempre los mismos.
5. Añadir señales claras de saturación o falta de input si hiciera falta.

### Resultado esperado

- el jugador entiende qué problema está resolviendo
- la progresión tiene dirección y no solo inflación numérica

## Bloque 5 - Validación del packager y automatización tardía

### Meta

Evitar que una cadena tardía o una máquina concreta desplace demasiado pronto al resto del juego.

### Tareas

1. Medir el peso real del packager en generación de dinero.
2. Validar si domina demasiado pronto una vez activado mercado manual.
3. Ajustar output o timing solo si los tests lo justifican.
4. Revisar si el late game necesita más decisiones y no solo más throughput.

### Resultado esperado

- la automatización tardía escala sin borrar el valor del jugador presente

## 4. Lista maestra de tareas

## Fase A - Diseño y estructura de datos

1. Crear config de mercado.
2. Definir precios manuales base por recurso.
3. Definir métricas objetivo para comparar venta manual con monetización automática por máquinas.
4. Definir thresholds y bonus por lotes.
5. Definir parámetros de oportunidad temporal.
6. Definir valor manual de referencia para `ELECTRIC_COMPONENTS`.

## Fase B - Runtime económico

6. Integrar venta manual ampliada.
7. Unificar medición de monetización automática incluyendo máquinas de dinero.
8. Contrastar venta manual frente a monetización automática en runtime.
9. Conectar el cálculo de lotes al sistema de venta.
10. Conectar oportunidades temporales al precio efectivo.
11. Revisar el flujo de dinero desde machines y market juntos.

## Fase C - Rebalanceo de early game

12. Ajustar scrap manual.
13. Ajustar coste y progresión de `UPG_SCRAP_001`.
14. Ajustar coste y progresión de `UPG_SCRAP_002`.
15. Revisar `AUTO_GENERATION_RATES`.
16. Revisar curva de upgrades con impacto temprano.

## Fase D - Rebalanceo de capacidades y fricción

17. Revisar capacidades iniciales.
18. Revisar coste de almacenamiento por recurso.
19. Revisar si components genera la presión correcta.
20. Revisar si metal y plastic necesitan separación económica mayor.

## Fase E - UX y feedback jugable

21. Mostrar mejor qué venta conviene más.
22. Mostrar cuándo hay oportunidad temporal activa.
23. Mostrar cuándo se activa bonus por lote.
24. Mostrar cuándo una máquina de dinero está monetizando por debajo o por encima de lo esperado.
25. Señalizar cuellos de botella más relevantes.

## Fase F - Validación

26. Ejecutar playtests de sesión activa corta.
27. Ejecutar playtests de sesión mixta activa-idle.
28. Medir diferencia de progreso entre jugador presente y ausente.
29. Medir diferencia entre monetización manual y monetización automática por máquinas.
30. Revisar si la automatización sigue sintiéndose deseable.
31. Ajustar números a partir de resultados, no de intuición aislada.

## 5. Priorización recomendada

## Prioridad 1

Tareas 1, 2, 3, 5, 6, 7, 8, 12, 13, 14, 15

Estas tareas crean las palancas centrales del diseño.

## Prioridad 2

Tareas 4, 9, 10, 11, 17, 18, 19, 21, 22, 23, 24

Estas tareas convierten el sistema en algo legible y más rico.

## Prioridad 3

Tareas 16, 20, 25, 26, 27, 28, 29, 30, 31

Estas tareas consolidan, afinan y preparan iteraciones posteriores.

## 6. Criterios de éxito

El roadmap se considerará bien encaminado si, tras las primeras iteraciones:

1. El jugador activo gana claramente más dinero por minuto en early game.
2. La automatización temprana sigue siendo atractiva, pero no dominante en margen.
3. `PACKAGER` y `ELECTRIC_PACKAGER` no destruyen demasiado pronto el valor económico del juego presente.
4. Vender se siente más interesante sin volverse pesado.
5. El jugador puede explicar fácilmente cuál es su cuello de botella actual.
6. El mejor estilo de juego pasa a ser combinar presencia y automatización.

## 7. Riesgos de implementación

Los riesgos principales a vigilar son:

1. Sobrecargar el early game con demasiadas capas simultáneas.
2. Castigar tanto la automatización que parezca una mala compra.
3. Introducir demasiado micromanagement en ventas.
4. Rebalancear costes antes de crear las palancas correctas.
5. Afinar late game demasiado pronto sin haber validado early y mid.

## 8. Recomendación final

La implementación debería empezar por la economía de mercado y por la diferenciación entre venta manual y monetización automática por máquinas. Esa es la palanca con mayor retorno sobre la sensación del juego.

En esta dirección de diseño, eso significa venta manual fuerte y monetización automática centrada en máquinas, no en auto-venta de mercado.

Solo después conviene refinar cadenas más avanzadas, identidades de máquinas o optimizaciones tardías.
