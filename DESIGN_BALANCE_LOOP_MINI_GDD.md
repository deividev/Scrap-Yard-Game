# Scrap Yard Idle - Mini GDD de Loop, Balance y Ventas

## 1. Objetivo del documento

Este documento formaliza una dirección de diseño para el loop principal de Scrap Yard Idle a partir del feedback recibido en playtests.

La meta es corregir dos riesgos principales:

1. Que la automatización vuelva el juego demasiado pasivo demasiado pronto.
2. Que vender y producir se conviertan en acciones planas sin decisiones interesantes.

La dirección base de diseño es esta:

- Juego activo = más rentable a corto plazo.
- Automatización = más cómoda, más estable y más escalable a medio y largo plazo.

Esto implica que el jugador presente debe progresar mejor si juega bien, mientras que el jugador ausente debe seguir progresando de forma estable, aunque con menor eficiencia.

## 2. Principios de diseño

### 2.1. La automatización no debe sustituir el juego demasiado pronto

La automatización temprana debe eliminar tareas repetitivas, no eliminar la necesidad de tomar decisiones.

### 2.2. La presencia del jugador debe tener valor real

Entrar en partida debe mejorar el rendimiento del sistema mediante mejores ventas, boosts, prioridades o decisiones de timing.

### 2.3. Cada fase debe plantear una pregunta distinta

El juego no debe sentirse como el mismo bucle ampliado. Cada fase debe cambiar el foco mental del jugador.

### 2.4. La venta debe ser una capa jugable

Vender no debe ser solo convertir stock en dinero. Debe introducir pequeñas tensiones entre liquidez inmediata, margen y planificación.

### 2.5. La automatización debe tener tradeoffs legibles

La automatización debe aportar comodidad y estabilidad, a cambio de perder margen, control o flexibilidad.

### 2.6. La monetización automática incluye máquinas que convierten recursos directamente en dinero

En este proyecto, la comparación entre juego manual y juego automático no debe apoyarse en la auto-venta de mercado.

También debe incluir cualquier máquina que convierta recursos en dinero de forma automática, especialmente:

- Empaquetadora
- Empaquetadora eléctrica

Desde el punto de vista de diseño, estas máquinas forman parte de la monetización automática del sistema y deben evaluarse al responder esta pregunta:

- merece más la pena estar presente y monetizar bien, o dejar que el sistema monetice solo

La regla objetivo sigue siendo la misma:

- early y mid game: el jugador presente debe monetizar mejor que la automatización
- late game: la automatización puede dominar la escala, pero el jugador presente debe seguir conservando ventaja táctica en margen, timing o decisiones

## 3. Problema actual resumido

El feedback apunta a que, una vez aparece parte de la automatización, el jugador deja de sentir que su intervención mejora mucho la partida. El riesgo no es solo económico; también es de fantasía jugable.

La sensación a evitar es:

- Antes: genero, recojo y vendo.
- Después: espero y miro números.

La sensación buscada es:

- Antes: intervengo directamente para arrancar la fábrica.
- Después: intervengo menos en tareas básicas y más en decisiones útiles.

## 4. Estructura del early game en 3 fases

## 4.1. Fase 1 - Supervivencia Activa

### Objetivo de la fase

Enseñar el loop base y demostrar de forma clara que jugar activamente genera más progreso inmediato.

### Pregunta principal del jugador

Como gano dinero ya.

### Loop principal

1. Generar scrap manualmente.
2. Activar la primera máquina o flujo básico.
3. Convertir scrap en metal.
4. Vender manualmente.
5. Comprar mejora inmediata de capacidad, velocidad o margen.

### Sensación buscada

Si presto atención, avanzo claramente más rápido.

### Reglas de diseño de la fase

- La venta manual debe ser claramente superior a cualquier forma automática temprana.
- La capacidad y el almacenamiento deben crear presión ligera.
- El jugador debe notar pronto la tensión entre vender y guardar recursos.
- Las decisiones deben ser pocas, legibles y frecuentes.

### Riesgos a evitar

- Introducir automatización rentable demasiado pronto.
- Introducir demasiados sistemas simultáneamente.
- Permitir que el dinero resuelva todo sin fricción.

### Condición de salida

El jugador ya domina el loop base y empieza a sentir repetición operativa en lugar de aprendizaje.

## 4.2. Fase 2 - Semi-automatización con Ventaja Activa

### Objetivo de la fase

Introducir automatización como soporte y continuidad, manteniendo una ventaja clara para el jugador presente.

### Pregunta principal del jugador

Que automatizo primero sin perder rentabilidad.

### Loop principal

1. La producción base mantiene un flujo estable.
2. El jugador entra para vender mejor o aprovechar picos.
3. Usa boosts o decisiones de prioridad a corto plazo.
4. Resuelve el cuello de botella dominante.
5. Invierte en throughput, margen o capacidad según el estado de la línea.

### Sensación buscada

La fábrica sigue funcionando sola, pero cuando entro juego mejor que la automatización.

### Reglas de diseño de la fase

- La automatización debe mantener continuidad, no superar al juego activo en margen.
- Debe haber una primera capa de prioridades: dinero rápido, producción, stock o upgrades.
- Las ventas manuales deben seguir siendo el mejor uso del tiempo presente.
- Deben aparecer decisiones cortas de 10 a 30 segundos con impacto real.

### Riesgos a evitar

- Que automatizar haga irrelevante vender manualmente.
- Que el jugador sienta que ya no tiene nada significativo que decidir.
- Que el mejor movimiento sea dejar el juego abierto sin interactuar.

### Condición de salida

El jugador deja de pensar solo en supervivencia y empieza a pensar en eficiencia y dirección productiva.

## 4.3. Fase 3 - Optimización Temprana

### Objetivo de la fase

Convertir una línea funcional en una línea eficiente mediante decisiones de especialización, timing y cuello de botella.

### Pregunta principal del jugador

Que parte de mi fabrica me limita y que me conviene vender o reservar.

### Loop principal

1. La fábrica produce de forma estable.
2. El jugador interviene en momentos de valor alto.
3. Ajusta prioridades o boosts temporales.
4. Decide entre liquidez inmediata y valor futuro.
5. Compra mejoras estratégicas, no solo lineales.

### Sensación buscada

La fábrica funciona sola, pero yo marco la diferencia optimizando bien.

### Reglas de diseño de la fase

- Debe haber cuellos de botella visibles y comprensibles.
- La venta debe competir con la transformación a mayor valor.
- Las máquinas deben empezar a diferenciarse por función y tradeoff.
- La automatización puede ser potente, pero no completamente autosuficiente.

### Riesgos a evitar

- Que el sistema se reduzca a comprar la siguiente mejora más cara.
- Que todas las máquinas se sientan equivalentes.
- Que el dinero vuelva triviales las decisiones de recursos.

### Condición de salida

El jugador empieza a entrar en una fase de especialización y escala industrial.

## 5. Sistema de ventas propuesto

## 5.1. Objetivo

Añadir una capa ligera de decisión sin convertir el mercado en un sistema complejo o difícil de leer.

## 5.2. Estructura del sistema

El sistema de ventas debe tener cuatro capas simples:

1. Venta manual premium.
2. Bonus por lotes.
3. Oportunidades temporales.
4. Contratos ligeros.

## 5.3. Venta manual premium

La venta manual debe pagar mejor por unidad y representar la intervención óptima del jugador presente.

Objetivo de diseño:

- Manual = mejor margen.
- Automático por máquinas = continuidad y escala, pero con menor eficiencia económica en early y mid game.

## 5.4. Monetización automática por máquinas

La monetización automática por máquinas no debe ser una trampa, pero tampoco la forma más rentable de jugar en early y mid game.

Si una máquina monetiza por sí sola, su rendimiento efectivo debe entrar en la misma discusión de balance que la venta manual.

Debe servir para:

- mantener ingresos estables
- convertir excedentes en dinero sin intervención
- sostener el progreso offline o ausente

## 5.5. Bonus por lotes

Vender lotes concretos mejora ligeramente la eficiencia y crea timing sencillo.

Ejemplos de estructura:

- lote pequeño: sin bonus o bonus mínimo
- lote medio: bonus moderado
- lote grande: bonus notable pero sin romper el balance

## 5.6. Oportunidades temporales

El juego puede ofrecer ventanas breves de mayor demanda o mejor precio para recursos concretos.

Objetivos:

- premiar la presencia del jugador
- crear momentos de decisión
- evitar que vender sea siempre la misma acción

## 5.7. Contratos ligeros

En vez de un mercado complejo, pueden existir uno o dos contratos visibles que pidan lotes concretos a cambio de mejor precio.

Objetivos:

- generar metas de corto plazo
- introducir tensión entre vender ahora o guardar
- dar dirección sin tutorializar en exceso

## 6. Mecánicas jugables adicionales recomendadas

## 6.1. Boosts temporales

Boosts activables de 10 a 30 segundos que mejoren una máquina, una línea o una venta puntual.

## 6.2. Prioridades simples

Opciones claras para orientar la fábrica sin crear micromanagement excesivo.

Ejemplos:

- priorizar dinero
- priorizar metal
- priorizar componentes

## 6.3. Cuellos de botella legibles

La interfaz y el balance deben permitir entender fácilmente si el problema actual es:

- falta de input
- falta de capacidad
- saturación de almacenamiento
- velocidad de procesamiento
- margen de venta bajo

## 6.4. Identidad jugable por máquina

Cada máquina debe resolver un problema o introducir un tradeoff distinto.

Ejemplos de identidad:

- rápida pero poco eficiente
- lenta pero rentable
- transforma residuos en valor
- acelera la línea a costa de consumir más input

## 7. Tabla de balance objetivo por fases

Los siguientes números no son finales. Son objetivos de tuning para pruebas internas y playtests.

Nota: cuando este documento habla de ingreso automático total, incluye las máquinas que convierten recursos directamente en dinero, como empaquetadora y empaquetadora eléctrica.

| Área                                           | Early game       | Mid game         | Automatización consolidada | Fase final               |
| ---------------------------------------------- | ---------------- | ---------------- | -------------------------- | ------------------------ |
| Margen de venta manual                         | 1.00x valor base | 1.00x valor base | 0.98x a 1.00x valor base   | 0.95x a 1.00x valor base |
| Monetización automática por máquinas vs manual | 0.70x a 0.80x    | 0.80x a 0.92x    | 0.82x a 1.00x              | 0.95x a 1.08x            |
| Ventaja manual sobre monetización automática   | +25% a +43%      | +9% a +25%       | 0% a +18%                  | -8% a +5%                |
| Velocidad de progreso del jugador presente     | 1.35x a 1.60x    | 1.25x a 1.45x    | 1.15x a 1.30x              | 1.05x a 1.15x            |
| Valor de lote medio                            | +5%              | +6%              | +5%                        | +4%                      |
| Valor de lote grande                           | +10%             | +12%             | +10%                       | +8%                      |
| Bonus de oportunidad temporal                  | +15% a +20%      | +12% a +18%      | +10% a +15%                | +8% a +12%               |
| ROI deseado de automatización inicial          | 8 a 12 min       | 10 a 15 min      | 15 a 25 min                | 20 a 35 min              |
| Dependencia del juego manual                   | Alta             | Media-alta       | Media                      | Baja-media               |
| Peso del ingreso automático total              | 15% a 25%        | 35% a 50%        | 55% a 75%                  | 75% a 90%                |

## 8. Tabla de cambios concretos recomendados

| Sistema                              | Early game                             | Mid game                                | Automatización consolidada                  | Fase final                               |
| ------------------------------------ | -------------------------------------- | --------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Venta manual                         | Principal fuente de dinero             | Sigue siendo la mejor por margen        | Se convierte en herramienta de optimización | Se usa para picos, contratos y precisión |
| Monetización automática por máquinas | No dominante o no disponible           | Útil pero por debajo de la venta manual | Base estable de ingresos                    | Puede igualar o superar ligeramente      |
| Scrap manual                         | Dominante                              | Complementario                          | Situacional o táctico                       | Residual o asociado a skills/bonos       |
| Scrap automático                     | Muy débil                              | Útil pero inferior al juego activo      | Base productiva sólida                      | Totalmente integrado                     |
| Boosts temporales                    | Muy potentes para enseñar valor activo | Importantes para eficiencia             | Menos frecuentes pero aún útiles            | Enfocados a picos o eventos              |
| Contratos                            | Simples, 1 visible                     | 1 o 2 visibles                          | 2 visibles o rotación ligera                | Orientados a especialización             |
| Cuellos de botella                   | Capacidad y liquidez                   | Throughput y almacenamiento             | Energía, cadena y eficiencia                | Escala, routing y coste de oportunidad   |
| Prioridades de producción            | No necesarias o muy básicas            | Primera versión simple                  | Claras y relevantes                         | Parte del mastery loop                   |

## 9. Números orientativos de implementación por sistema

## 9.1. Venta manual vs automática

| Variable                                              | Early game  | Mid game        | Automatización consolidada | Fase final      |
| ----------------------------------------------------- | ----------- | --------------- | -------------------------- | --------------- |
| Precio manual del metal                               | 100%        | 100%            | 98% a 100%                 | 95% a 100%      |
| Precio manual de componentes                          | 100%        | 102%            | 100%                       | 98% a 100%      |
| Precio manual de componentes eléctricos de referencia | N/A         | 100% referencia | 100% referencia            | 100% referencia |
| Coste de comodidad automática por máquinas            | Muy visible | Visible         | Moderado                   | Bajo            |

## 9.2. Lotes y timing

| Acción                            | Early game     | Mid game       | Automatización consolidada | Fase final     |
| --------------------------------- | -------------- | -------------- | -------------------------- | -------------- |
| Lote mínimo recomendado           | 5              | 10             | 20                         | 40             |
| Bonus por lote medio              | +5%            | +6%            | +5%                        | +4%            |
| Bonus por lote grande             | +10%           | +12%           | +10%                       | +8%            |
| Caducidad de oportunidad temporal | 20 a 30 s      | 20 a 30 s      | 15 a 25 s                  | 15 a 20 s      |
| Frecuencia de oportunidades       | Cada 2 a 4 min | Cada 2 a 3 min | Cada 3 a 5 min             | Cada 4 a 6 min |

## 9.3. Boosts temporales

| Boost                 | Early game                  | Mid game          | Automatización consolidada | Fase final        |
| --------------------- | --------------------------- | ----------------- | -------------------------- | ----------------- |
| Overdrive de máquina  | +30% velocidad durante 15 s | +25% durante 15 s | +20% durante 12 s          | +15% durante 10 s |
| Venta premium puntual | +15% durante 20 s           | +12% durante 20 s | +10% durante 15 s          | +8% durante 12 s  |
| Cooldown recomendado  | 90 s                        | 120 s             | 150 s                      | 180 s             |

## 9.4. Automatización y retorno

| Elemento                                                           | Early game | Mid game    | Automatización consolidada | Fase final  |
| ------------------------------------------------------------------ | ---------- | ----------- | -------------------------- | ----------- |
| Auto-generación de scrap vs manual activo                          | 25% a 35%  | 40% a 55%   | 60% a 75%                  | 85% a 100%  |
| Monetización automática por máquinas vs monetización manual óptima | 70% a 80%  | 75% a 88%   | 85% a 95%                  | 95% a 110%  |
| Tiempo de retorno de upgrade automático                            | 8 a 12 min | 10 a 15 min | 15 a 25 min                | 20 a 35 min |
| Riesgo de atasco sin intervención                                  | Medio      | Medio-alto  | Bajo-medio                 | Bajo        |

## 9.5. Comparativa concreta de máquinas de dinero

Los siguientes valores usan la economía actual del proyecto como base comparativa:

- venta manual de `COMPONENTS`: `3` por unidad
- referencia manual de `ELECTRIC_COMPONENTS`: `12` por unidad para balance interno

| Máquina             | Consumo                 | Dinero actual | Equivalente manual | Ratio actual | Objetivo propuesto base | Ratio objetivo |
| ------------------- | ----------------------- | ------------- | ------------------ | ------------ | ----------------------- | -------------- |
| `PACKAGER`          | 4 `COMPONENTS`          | 22            | 12                 | 183%         | 10-11                   | 83%-92%        |
| `ELECTRIC_PACKAGER` | 6 `ELECTRIC_COMPONENTS` | 65            | 72                 | 90%          | 58-60                   | 81%-83%        |

Regla de interpretación:

- `PACKAGER` debe quedar claramente por debajo de la venta manual de `COMPONENTS` hasta bastante avanzado el juego.
- `ELECTRIC_PACKAGER` puede acercarse antes, pero no debería igualar o superar claramente la referencia manual hasta fase final.

## 10. Reglas de validación para playtests

Las siguientes preguntas deben usarse para validar si el diseño va en buena dirección:

1. El jugador siente que estar presente mejora claramente su progreso.
2. La automatización se percibe como ayuda, no como sustitución inmediata del juego.
3. Vender manualmente sigue siendo una decisión valiosa al menos durante early y mid game.
4. El jugador puede identificar cuál es su cuello de botella actual.
5. El juego ofrece decisiones pequeñas pero relevantes cuando el jugador vuelve a mirar la partida.
6. La fábrica sigue progresando sola, pero no juega mejor que el jugador demasiado pronto.

## 11. Recomendación de implementación por orden

Orden recomendado de trabajo:

1. Rebalancear margen manual vs automático.
2. Añadir bonus por lotes y una oportunidad temporal simple.
3. Introducir 1 boost corto de alto impacto y cooldown claro.
4. Añadir una primera prioridad de producción o decisión equivalente.
5. Revisar costes, almacenamiento y throughput para reforzar cuellos de botella.
6. Solo después, escalar el sistema con contratos o especialización mayor.

## 12. Conclusión

La dirección recomendada para Scrap Yard Idle es un modelo híbrido donde:

- el jugador activo gana más dinero y progresa mejor a corto plazo,
- la automatización mantiene continuidad y escala,
- y el paso de una fase a otra cambia el tipo de decisión, no solo el tamaño de los números.

El objetivo no es castigar la automatización, sino impedir que convierta demasiado pronto el juego en una experiencia de observación pasiva.
