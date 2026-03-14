# Scrap Yard — mejoras para subir calidad hacia Steam

Fecha: 2026-03-12
Estado: borrador operativo para revisar y ejecutar mañana

## Objetivo
Convertir Scrap Yard de prototipo sólido / vertical slice funcional a juego con calidad suficiente para venderse en Steam.

---

## Prioridad 1 — impacto alto

### 1. Igualar la calidad visual del gameplay con el menú principal
- Revisar consistencia entre menú principal y pantalla de juego.
- Subir la percepción visual del gameplay para que no parezca un panel funcional sin pulir.
- Aplicar mejoras en cards, paneles, espaciado, bordes, sombras y jerarquía visual.

### 2. Reforzar la sensación de juego en el loop principal
- Hacer que generar, vender, producir, desbloquear y mejorar se sienta satisfactorio.
- Añadir más feedback visual y sonoro en acciones clave.
- Revisar si el juego se siente demasiado “app de gestión” y no lo bastante “management game”.

### 3. Validar y mejorar los primeros 10 minutos
- Revisar qué entiende el jugador en los primeros segundos.
- Confirmar si hay progreso visible en los primeros 5 minutos.
- Confirmar si en 10 minutos el jugador quiere seguir jugando.
- Detectar puntos muertos, esperas excesivas o confusión inicial.

### 4. Reforzar la fantasía de desguace / reciclaje / negocio industrial
- Revisar si el juego transmite de verdad que gestionas un desguace.
- Añadir más identidad temática en textos, nombres, eventos, acciones y feedback.
- Evitar sensación de sistema abstracto con números sin alma.

### 5. Mejorar feedback de recursos
- Hacer más visibles subidas y bajadas de recursos.
- Añadir microanimaciones, cambios de color o reacciones al ganar/perder recursos.
- Hacer más legible cuándo un recurso es cuello de botella.

---

## Prioridad 2 — producto y UX

### 6. Revisar claridad del pitch del juego
- Asegurar que se entiende en pocos segundos qué es Scrap Yard.
- Definir mejor el pitch corto para producto/Steam.
- Alinear UI, nombre, descripción y sensación general con ese pitch.

### 7. Revisar si cada recurso tiene propósito claro
- Scrap, metal, plástico, componentes, reciclado, eléctricos, dinero.
- Confirmar que el jugador entiende cómo se consigue cada uno y para qué sirve.
- Detectar recursos que aporten poco o se sientan redundantes.

### 8. Revisar si cada máquina aporta una capa real
- Confirmar que cada máquina cambia el juego y no solo añade otra caja más.
- Revisar si los desbloqueos son emocionantes o solo esperados.
- Revisar si las nuevas capas introducen decisiones interesantes.

### 9. Revisar el pacing y los posibles muros
- Detectar cuándo el ritmo se vuelve lento o poco interesante.
- Ajustar esperas, costes y recompensas.
- Revisar si el juego genera sensación de momentum o de atasco.

### 10. Revisar si hay decisiones reales y no solo ejecución obvia
- Identificar decisiones del jugador: qué mejorar, qué producir, qué vender, qué cuello de botella resolver.
- Detectar tramos demasiado lineales.

### 11. Revisar la jerarquía visual general
- Qué es importante ahora.
- Qué está bloqueado.
- Qué falta para avanzar.
- Qué produce valor.
- Qué está parado o atascado.

### 12. Revisar si la UI parece juego y no dashboard
- Analizar sensación de panel administrativo vs management game.
- Corregir elementos que huelan a herramienta interna o prototipo SaaS.

---

## Prioridad 3 — polish y presentación Steam

### 13. Mejorar los desbloqueos y recompensas
- Hacer que desbloquear una máquina nueva se note y se celebre.
- Mejorar feedback de upgrades completados.
- Hacer más memorables los hitos.

### 14. Revisar audio y mezcla
- Validar si la música y ambience ayudan de verdad.
- Revisar repetición/fatiga.
- Añadir o ajustar SFX donde falten.

### 15. Revisar si las capturas actuales venderían el juego
- Evaluar si una screenshot parece un juego publicable o un prototipo funcional.
- Detectar qué zonas visuales bajan la percepción de calidad.

### 16. Definir mejor identidad visual consistente
- Paleta, iconografía, espaciado, acabados, estilo de paneles.
- Unificar elementos visuales para dar sensación de producto terminado.

---

## Prioridad 4 — calidad técnica y release readiness

### 17. Limpiar branding heredado y restos de plantilla
- README aún arrastra referencias a template anterior.
- Output/build names con restos como `last-admin-online`.
- Revisar naming general del proyecto.

### 18. Revisar warnings de build
- Corregir o reducir warnings de presupuesto CSS.
- Decidir si se mantienen o si hay que refactorizar estilos/componentes.

### 19. Arreglar tests mínimos
- Actualmente los tests fallan / están mal configurados.
- Dejar al menos una base mínima de tests o smoke tests útiles.
- Asegurar build + test mínimo antes de pensar en release.

### 20. Revisar save/load y progreso offline
- Validar casos reales de guardado, cierre, carga y upgrades offline.
- Confirmar que no hay errores silenciosos ni riesgo de corrupción.

### 21. Revisar logs/debug para release
- Eliminar o controlar console logs y elementos de depuración visibles.
- Separar claramente modo desarrollo y modo release.

### 22. Revisar packaging como producto real
- Nombre correcto.
- Iconos correctos.
- Flujo de apertura/cierre.
- Persistencia estable.
- Branding consistente.

---

## Checklist rápida de evaluación manual

### Steam / producto
- [ ] El pitch se entiende en 5 segundos.
- [ ] La fantasía de desguace se siente de verdad.
- [ ] El juego tiene un hook reconocible.
- [ ] Se diferencia mínimamente de otros management/idle pequeños.

### Primeros 10 minutos
- [ ] Primeros 30 segundos claros y activos.
- [ ] En 5 minutos hay progreso visible.
- [ ] En 10 minutos apetece seguir.
- [ ] No hay confusión ni tiempos muertos fuertes.

### Game feel
- [ ] Generar recursos se siente bien.
- [ ] Vender se siente bien.
- [ ] Mejorar se siente bien.
- [ ] Desbloquear se siente bien.
- [ ] Las máquinas produciendo transmiten actividad.
- [ ] Los bloqueos (falta input / almacén lleno) se entienden rápido.

### UX/UI
- [ ] La UI parece juego y no dashboard.
- [ ] La jerarquía visual es clara.
- [ ] Los estados son legibles al instante.
- [ ] El layout aguanta sesiones largas.

### Loop / balance
- [ ] El loop base ya funciona sin depender de features futuras.
- [ ] Cada recurso tiene propósito claro.
- [ ] Cada máquina aporta algo real.
- [ ] El pacing no mete muros aburridos.
- [ ] Hay decisiones interesantes.

### Presentación / polish
- [ ] El gameplay está a la altura del menú.
- [ ] El audio suma.
- [ ] La identidad visual es consistente.
- [ ] Las screenshots parecen vendibles.

### Calidad técnica
- [ ] Branding limpio.
- [ ] Build estable.
- [ ] Tests mínimos funcionando.
- [ ] Save/load robusto.
- [ ] Debug controlado.
- [ ] Packaging con aspecto profesional.

---

## Siguiente uso previsto mañana
Usar este documento como guía para:
1. revisar el estado actual del juego,
2. decidir qué bloque atacar primero,
3. convertir estos puntos en acciones concretas por fases.
