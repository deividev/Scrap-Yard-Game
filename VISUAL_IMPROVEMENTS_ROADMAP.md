# 🎨 Roadmap de Mejoras Visuales del Juego

**Objetivo:** Elevar el nivel visual del gameplay para que coincida con la calidad profesional del menú principal.

**Estado:** Menú principal completado ✅ | Gameplay pendiente 🔄

---

## 📋 Índice

1. [Elementos Decorativos Industriales](#1-elementos-decorativos-industriales)
2. [Mejoras en Paneles/Cards](#2-mejoras-en-panelscards)
3. [Animaciones Sutiles](#3-animaciones-sutiles)
4. [Efectos de Profundidad](#4-efectos-de-profundidad)
5. [Header de Recursos](#5-header-de-recursos)
6. [Lista de Máquinas](#6-lista-de-máquinas)
7. [Panel de Upgrades](#7-panel-de-upgrades)
8. [Botones Generales](#8-botones-generales)
9. [Notificaciones/Feedback](#9-notificacionesfeedback)
10. [Fondo General](#10-fondo-general)
11. [Tipografía/Textos](#11-tipografíatextos)
12. [Transiciones de Estado](#12-transiciones-de-estado)

---

## 1. Elementos Decorativos Industriales

### Descripción

Añadir elementos visuales temáticos coherentes con el ambiente de desguace.

### Propuestas

- **Mini-engranajes decorativos**
  - Posición: Esquinas de paneles/cards principales
  - Tamaño: 30-40px
  - Animación: Rotación muy lenta (60s) o estáticos
  - Opacidad: 0.3-0.4 para no distraer

- **Líneas/remaches metálicos**
  - Bordes de paneles con patrón de remaches (círculos dorados espaciados)
  - Líneas diagonales en esquinas tipo "estructura metálica"
  - Color: rgba(255, 193, 7, 0.2)

- **Iconos temáticos de fondo**
  - Herramientas cruzadas, llave inglesa, martillo
  - Siluetas de chatarra muy sutiles (opacity: 0.05)
  - Posición: Fondos de secciones vacías

- **Textura metálica**
  - Patrón de metal cepillado (brushed metal)
  - Aplicar en fondos de paneles principales
  - Opacidad: 0.02-0.05 (apenas perceptible)

### Prioridad: 🟠 Media

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 2. Mejoras en Paneles/Cards

### Descripción

Elevar el aspecto de cards y contenedores para que tengan más profundidad y presencia.

### Propuestas

- **Box-shadows mejorados**

  ```css
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  ```

- **Bordes con gradiente dorado**

  ```css
  border: 2px solid transparent;
  background:
    linear-gradient(var(--color-bg-panel), var(--color-bg-panel)) padding-box,
    linear-gradient(135deg, rgba(255, 193, 7, 0.3), transparent) border-box;
  ```

- **Esquinas decorativas**
  - Pseudo-elementos (::before/::after) con círculos en esquinas
  - Simular tornillos/remaches metálicos
  - Border-radius: 8px con detalles en corners

- **Efecto biselado**
  - Borde superior con highlight sutil
  - Borde inferior con shadow interno
  - Simular profundidad tipo panel metálico

- **Hover effects elevados**

  ```css
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(255, 193, 7, 0.2);
  }
  ```

### Prioridad: 🔴 Alta

### Impacto Visual: ⭐⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 3. Animaciones Sutiles

### Descripción

Añadir movimiento y vida sin ser invasivo durante el gameplay.

### Propuestas

- **Pulse en recursos**

  ```css
  @keyframes resource-pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  /* Activar solo cuando el valor cambia */
  ```

- **Shake micro en acciones**
  - Al comprar máquina
  - Al activar upgrade
  - Duración: 0.3s

  ```css
  @keyframes micro-shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-2px);
    }
    75% {
      transform: translateX(2px);
    }
  }
  ```

- **Progress bars animadas**
  - Brillo que recorre la barra (shine effect)
  - Transición suave al cambiar progreso

  ```css
  @keyframes progress-shine {
    0% {
      background-position: -100px;
    }
    100% {
      background-position: 200px;
    }
  }
  ```

- **Números con contador**
  - Animación de subida/bajada de números
  - Implementar librería o custom directive
  - Color flash verde (aumenta) / rojo (disminuye)

- **Botones con ripple effect**
  - Onda al hacer click
  - Material Design style pero dorado

### Prioridad: 🟡 Media-Alta

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧🔧

---

## 4. Efectos de Profundidad

### Descripción

Crear sensación de capas y espacialidad en el layout.

### Propuestas

- **Gradientes en fondos**

  ```css
  background: radial-gradient(ellipse at center, #1a1a1a 0%, #121212 100%);
  ```

- **Inset shadows en contenedores**

  ```css
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  ```

- **Layering con z-index**
  - Header: z-index: 100
  - Panels: z-index: 10
  - Background: z-index: 1
  - Decorations: z-index: 0

- **Vignette sutil**

  ```css
  .app-layout::after {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.3) 100%);
    pointer-events: none;
  }
  ```

- **Parallax ligero** (opcional)
  - Elementos decorativos se mueven sutilmente con scroll
  - Muy sutil para no marear

### Prioridad: 🟠 Media

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 5. Header de Recursos

### Descripción

Mejorar la presentación del header superior con recursos y dinero.

### Propuestas

- **Iconos más prominentes**
  - Aumentar tamaño a 32px
  - Añadir drop-shadow dorado

  ```css
  filter: drop-shadow(0 2px 4px rgba(255, 193, 7, 0.4));
  ```

- **Separadores decorativos**
  - Entre cada recurso
  - Línea vertical con gradiente
  - Iconos de engranaje pequeño como separador

- **Background mejorado**

  ```css
  background:
    linear-gradient(180deg, #1a1a1a 0%, #141414 100%),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 48px,
      rgba(255, 193, 7, 0.02) 48px,
      rgba(255, 193, 7, 0.02) 50px
    );
  ```

- **Números con peso variable**
  - Money: font-weight: 700
  - Recursos principales: font-weight: 600
  - Recursos secundarios: font-weight: 500

- **Hover info tooltip mejorado**
  - Con animación de entrada
  - Fondo con blur backdrop
  - Bordes dorados

### Prioridad: 🔴 Alta

### Impacto Visual: ⭐⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 6. Lista de Máquinas

### Descripción

Mejorar las cards de máquinas para que tengan más personalidad.

### Propuestas

- **Cards elevadas**

  ```css
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 193, 7, 0.1);

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.4),
      0 0 0 2px rgba(255, 193, 7, 0.3);
  }
  ```

- **Progress bars con textura**
  - Gradiente animado en el fill
  - Striped pattern sutil

  ```css
  background: repeating-linear-gradient(
    45deg,
    var(--color-accent-main),
    var(--color-accent-main) 10px,
    var(--color-accent-dark) 10px,
    var(--color-accent-dark) 20px
  );
  ```

- **Badges con glow**
  - Estado "Activo" con pulsación
  - Estado "Máximo" con brillo dorado

  ```css
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
  animation: pulse-glow 2s ease-in-out infinite;
  ```

- **Iconos de máquinas mejorados**
  - Drop-shadow más pronunciado
  - Hover: rotación sutil o scale
  - Border circular con gradiente

- **Estados visuales claros**
  - Desbloqueada: borde dorado
  - Bloqueada: grayscale + lock icon
  - Activa: glow verde

### Prioridad: 🔴 Alta

### Impacto Visual: ⭐⭐⭐⭐⭐

### Complejidad: 🔧🔧🔧

---

## 7. Panel de Upgrades

### Descripción

Hacer que el panel lateral tenga aspecto de "tablero de mejoras industrial".

### Propuestas

- **Grid con separadores**
  - Líneas doradas entre upgrades
  - Efecto de "fichas en tablero"

  ```css
  border-bottom: 1px solid rgba(255, 193, 7, 0.15);
  ```

- **Cards tipo ficha metálica**
  - Borde biselado
  - Pequeños remaches en esquinas (pseudo-elementos)
  - Background con gradiente metálico sutil

- **Locks decorativos 3D**
  - Para upgrades bloqueados
  - Icono de candado con shadow y glow
  - Efecto "desbloqueo" cuando se activa

  ```css
  @keyframes unlock {
    0% {
      transform: translateY(0) rotate(0);
    }
    50% {
      transform: translateY(-5px) rotate(-10deg);
    }
    100% {
      transform: translateY(0) rotate(0);
      opacity: 0;
    }
  }
  ```

- **Animación de compra**
  - Stamp effect (sello/estampado)
  - Flash dorado
  - Shake breve

- **Progress de nivel**
  - Barra dorada con brillo
  - Números destacados
  - Efecto "level up" cuando sube

### Prioridad: 🟡 Media-Alta

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧🔧

---

## 8. Botones Generales

### Descripción

Unificar y mejorar todos los botones del juego usando el sistema del menú.

### Propuestas

- **Migrar a AppButtonComponent**
  - Usar size='sm' para botones pequeños
  - Usar size='md' para botones normales
  - Mantener size='lg' solo para menú

- **Consistencia de estados**

  ```css
  /* Primary: Golden glow */
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.35);

  /* Secondary: Border highlight */
  border: 2px solid rgba(255, 193, 7, 0.3);

  /* Disabled: Oxidado/blockeado */
  filter: grayscale(0.7);
  opacity: 0.5;
  cursor: not-allowed;
  ```

- **Hover unificado**

  ```css
  transform: translateY(-2px);
  filter: brightness(1.1);
  ```

- **Click feedback**

  ```css
  &:active {
    transform: translateY(0) scale(0.98);
  }
  ```

- **Loading state**
  - Spinner dorado
  - Texto "Procesando..."
  - Disabled mientras carga

### Prioridad: 🔴 Alta

### Impacto Visual: ⭐⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 9. Notificaciones/Feedback

### Descripción

Mejorar el feedback visual de acciones del usuario.

### Propuestas

- **Toast notifications mejoradas**
  - Entrada desde arriba con bounce
  - Background con blur backdrop
  - Borde dorado según tipo (success/error/info)

  ```css
  animation: toast-slide-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  backdrop-filter: blur(10px);
  ```

- **Partículas al comprar/vender**
  - 5-8 partículas doradas pequeñas
  - Explotan desde el botón
  - Duración: 0.8s
  - Similar a las del menú pero más pequeñas

- **Flash en recursos**
  - Verde cuando aumenta
  - Rojo cuando disminuye

  ```css
  @keyframes resource-flash-positive {
    0%,
    100% {
      background: transparent;
    }
    50% {
      background: rgba(76, 175, 80, 0.2);
    }
  }
  ```

- **Sound effects** (opcional)
  - Click: "clic metálico"
  - Compra: "ka-ching"
  - Error: "buzz"
  - Con toggle de mute en opciones

- **Ripple effect en botones**
  - Onda que se expande desde punto de click
  - Color dorado con fade out

### Prioridad: 🟡 Media

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧🔧

---

## 10. Fondo General

### Descripción

Mejorar el fondo del área de juego sin comprometer legibilidad.

### Propuestas

- **Gradiente radial sutil**

  ```css
  background:
    radial-gradient(ellipse at 50% 20%, rgba(255, 193, 7, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #1a1a1a 0%, #141414 50%, #0f0f0f 100%);
  ```

- **Textura de metal oxidado**
  - Imagen de textura o patrón CSS
  - Opacity: 0.03-0.05 (muy sutil)
  - Blend-mode: overlay

- **Rejilla solo en laterales** (opcional)

  ```css
  /* Solo visible en áreas sin contenido */
  .app-body::before,
  .app-body::after {
    content: '';
    position: absolute;
    width: 200px;
    height: 100%;
    /* Rejilla pattern */
    opacity: 0.15;
  }

  .app-body::before {
    left: 0;
  }
  .app-body::after {
    right: 0;
  }
  ```

- **Vignette perimetral**
  ```css
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.3);
  ```

### Prioridad: 🟠 Media

### Impacto Visual: ⭐⭐⭐

### Complejidad: 🔧

---

## 11. Tipografía/Textos

### Descripción

Consistencia tipográfica con el menú principal.

### Propuestas

- **Letter-spacing unificado**

  ```css
  /* Títulos */
  letter-spacing: 0.5px;

  /* Botones */
  letter-spacing: 0.5px;

  /* Números grandes */
  letter-spacing: 0.3px;
  ```

- **Text-shadows en títulos**

  ```css
  text-shadow:
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 0 8px rgba(255, 193, 7, 0.1);
  ```

- **Color highlighting**

  ```css
  /* Valores positivos */
  .positive {
    color: #4caf50;
    text-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }

  /* Valores negativos */
  .negative {
    color: #f44336;
  }

  /* Destacados */
  .highlight {
    color: var(--color-accent-main);
    font-weight: 600;
  }
  ```

- **Font weights consistentes**
  - Títulos: 700
  - Subtítulos: 600
  - Cuerpo: 500
  - Secundario: 400

- **Números monospace**
  ```css
  font-family: 'Roboto Mono', monospace;
  /* Para que no "salten" cuando cambian */
  ```

### Prioridad: 🟡 Media

### Impacto Visual: ⭐⭐⭐

### Complejidad: 🔧

---

## 12. Transiciones de Estado

### Descripción

Suavizar transiciones entre diferentes estados del juego.

### Propuestas

- **Fade entre menú y juego**

  ```css
  .app-layout {
    animation: fade-in 0.6s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  ```

- **Slide-in de paneles**

  ```css
  .machine-list {
    animation: slide-in-left 0.5s ease-out;
  }

  .upgrades-panel {
    animation: slide-in-right 0.5s ease-out;
  }
  ```

- **Skeleton loaders**
  - Mientras carga el save
  - Placeholders con shimmer effect

  ```css
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: 200px 0;
    }
  }
  ```

- **Page transitions**
  - Cross-fade routing entre vistas
  - Duración: 0.3s

- **Loading indicators elegantes**
  - Spinner dorado con glow
  - Progress bar con shine
  - Overlay con blur backdrop

### Prioridad: 🟡 Media

### Impacto Visual: ⭐⭐⭐⭐

### Complejidad: 🔧🔧

---

## 📊 Resumen de Prioridades

### 🔴 Alta Prioridad (Implementar Primero)

1. **Mejoras en Paneles/Cards** - Máximo impacto visual
2. **Botones Generales** - Unificación con menú
3. **Header de Recursos** - Primera impresión del juego
4. **Lista de Máquinas** - Core del gameplay

**Estimación:** 4-6 horas de trabajo

### 🟡 Media Prioridad (Segunda Fase)

5. **Animaciones Sutiles** - Da vida al juego
6. **Panel de Upgrades** - Mejora interacción
7. **Efectos de Profundidad** - Ambiente general
8. **Notificaciones/Feedback** - UX mejorada

**Estimación:** 4-5 horas de trabajo

### 🟠 Baja Prioridad (Polish Final)

9. **Elementos Decorativos Industriales** - Polish extra
10. **Fondo General** - Refinamiento
11. **Tipografía/Textos** - Consistencia
12. **Transiciones de Estado** - Suavizado

**Estimación:** 3-4 horas de trabajo

---

## 🎯 Objetivos de Diseño

### Mantener

- ✅ Legibilidad en todo momento
- ✅ Performance (60fps)
- ✅ Accesibilidad
- ✅ Responsive design

### Evitar

- ❌ Sobrecarga visual
- ❌ Animaciones que marean
- ❌ Elementos que distraen del gameplay
- ❌ Performance degradation

### Lograr

- 🎨 Cohesión visual entre menú y juego
- ⚡ Sensación de calidad premium
- 🏭 Atmósfera industrial consistente
- 💎 Polish profesional

---

## 🔄 Metodología de Implementación

### Fase 1: Foundation (Alta Prioridad)

1. Crear sistema de estilos compartidos (variables CSS)
2. Migrar botones a AppButtonComponent
3. Aplicar mejoras base a paneles
4. Revisar y ajustar

### Fase 2: Enhancement (Media Prioridad)

1. Añadir animaciones
2. Mejorar feedback visual
3. Aplicar efectos de profundidad
4. Testing en diferentes resoluciones

### Fase 3: Polish (Baja Prioridad)

1. Elementos decorativos
2. Transiciones suaves
3. Detalles tipográficos
4. Último pase de refinamiento

### Testing Continuo

- ✅ Visual regression testing
- ✅ Performance monitoring
- ✅ User feedback
- ✅ Cross-browser testing

---

## 📝 Notas Adicionales

### Inspiración

- Menú principal actual (ya implementado)
- Juegos idle industriales (Factorio, Satisfactory)
- UI de dashboards industriales
- Steampunk aesthetics (sutil)

### Recursos Necesarios

- Iconos adicionales (si es necesario)
- Texturas (metal, oxidado)
- Posibles SVG para engranajes decorativos
- Font monospace para números (Roboto Mono)

### Consideraciones Técnicas

- Usar CSS custom properties para fácil theming
- Mantener clases reutilizables
- Componentes standalone cuando sea posible
- Optimizar animaciones (transform, opacity)
- Lazy load de assets decorativos

---

**Documento creado:** 2026-02-15  
**Última actualización:** 2026-02-15  
**Versión:** 1.0  
**Estado:** Propuesta inicial
