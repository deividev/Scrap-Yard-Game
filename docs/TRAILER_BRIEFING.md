# Scrap Yard Idle — Trailer Briefing (Juego Completo)

---

## Ficha rápida

| Campo | Valor |
|---|---|
| **Título del juego** | Scrap Yard Idle |
| **Género** | Idle / Incremental / Factory |
| **Plataforma** | PC (Steam) |
| **Duración objetivo** | 45–50 segundos |
| **Idioma** | Inglés |
| **Tono** | Industrial gritty → satisfacción creciente → ambición épica |

---

## Dirección de Audio

### Fuente de música
Usar exclusivamente la **música original del juego**.

**Archivos entregados:**
| Archivo | Uso |
|---|---|
| `ScrapYard_Game_Loop.mp3` | Track principal — base del trailer |
| `Initial_ScrapYard_Game_Loop.mp3` | Variante de intro, más suave |
| `scrapyard_ambience_loop.wav` | Ambiente de fábrica — inicio del trailer |
| `machine_hum_loop.wav` | Zumbido de maquinaria — fondo constante |
| `metal_clank_soft_01.wav` | SFX metálico — usar en momentos de impacto |
| `conveyor_rattle_01.wav` | SFX transportador — color industrial |
| `hydraulic_hiss_01.wav` | SFX hidráulico — color industrial |

### Estructura de audio sugerida
El trailer necesita un arco claro: empieza apagado, construye energía, termina en clímax y luego cae.

1. **Inicio**: Solo ambiente (`scrapyard_ambience_loop.wav`). Fábrica en silencio.
2. **Arranque**: Entra `ScrapYard_Game_Loop.mp3` gradualmente cuando la primera máquina arranca.
3. **Desarrollo**: Música a plena energía durante la secuencia de unlocks y producción en marcha.
4. **Clímax**: Máxima densidad musical en la secuencia de cards de contenido futuro.
5. **Cierre**: El beat cae. Solo el hum de la fábrica se desvanece con el logo.

> **Nota importante**: No se necesita sincronización perfecta de cada corte con cada beat. El ritmo general del montaje debe fluir con la música, no al revés. Si los cortes casi coinciden con los golpes, es suficiente.

---

## Dirección Visual

### Estética
El juego tiene un estilo visual ya establecido: **isométrico industrial dark**, con metal oxidado, luces naranja/ámbar brillante y detalles mecánicos. Todo el material nuevo para el trailer debe respetar esta paleta.

- **Fondo**: Negro profundo
- **Color de acento**: Naranja/ámbar (`#FF8C00` aproximadamente)
- **Tipografía de textos en pantalla**: Usar exactamente las mismas fuentes del juego para consistencia total de marca:
  - **Títulos y textos de impacto** (cards de Bloque 3, "SCRAP YARD IDLE"): `Cinzel` — serif industrial, mayúsculas, peso Bold
  - **Textos narrativos y UI** ("You inherited a scrap yard.", CTA): `Oswald` — sans-serif condensado, peso SemiBold
  - **Datos técnicos o contadores** (si se usan): `Share Tech Mono` — monospace industrial
  - Ambas fuentes están disponibles en Google Fonts de forma gratuita.
- **Las barras de progreso** de las máquinas (naranja sobre oscuro) son la imagen más hipnótica del juego — mostrarlas prominentemente.

### Qué grabar (gameplay real)
- Captura de pantalla limpia del juego corriendo en resolución máxima
- Desactivar el tutorial si aparece
- Preparar una save con las máquinas desbloqueadas y produciendo activamente
- El contador de dinero subiendo debe ser visible en varios planos

### Qué NO mostrar
- Labels técnicos internos (`baseSpeed`, `productionMultiplier`, etc.)
- Pantallas de error o loading
- El tutorial de first-run

---

## Storyboard

El trailer tiene **4 bloques** en aproximadamente 45 segundos. Los tiempos son orientativos, no exactos.

---

### BLOQUE 1 — El Arranque (~10s) 🎮 *gameplay real*

Empieza directamente con el juego en pantalla. Depósito vacío, una sola Trituradora detenida, dinero en **$0**.

El jugador recoge chatarra → la Trituradora arranca → la barra de progreso avanza → ciclo completa → **Metal** en el inventario → se vende → el dinero sube.

**Texto en pantalla** (aparece una vez, fade suave):
```
You inherited a scrap yard.
```

---

### BLOQUE 2 — La Cadena (~15s) 🎮 *gameplay real*

Secuencia de cortes mostrando los unlocks en cascada. Cada corte muestra una máquina diferente activa y produciendo. El objetivo es mostrar **todas las máquinas implementadas** en el juego actual:

| Máquina | Lo que se ve |
|---|---|
| **Trituradora** | Chatarra entra → Metal sale |
| **Separador** | Chatarra entra → Plástico sale |
| **Fundidora** | Metal + Plástico → Cobre |
| **Ensambladora** | Metal + Plástico → Componentes |
| **Recicladora** | Metal + Plástico → Plástico Reciclado |
| **Ensambladora Eléctrica** | Componentes + Cobre → Componentes Eléctricos |
| **Empaquetadora** | Componentes → $ |
| **Empaquetadora Eléctrica** | Componentes Eléctricos → $$ |

No hace falta mostrar cada una el mismo tiempo. Priorizar las que visualmente son más impactantes y terminar con la **vista general de todas activas en paralelo**, barras de progreso llenándose, contador de dinero subiendo solo.

**Texto en pantalla** (al final del bloque):
```
Collect. Process. Sell. Upgrade.
```

---

### BLOQUE 3 — Lo que Viene (~15s) 🎨 *cards con arte generado*

Secuencia de cards sobre fondo negro. Cada card muestra un icono isométrico + nombre de la feature. Los cards no muestran ninguna UI del juego — son promesas de contenido futuro.

**Cards en orden — solo features 100% confirmadas para el juego completo:**

| Card | Texto | Icono |
|---|---|---|
| 1 | `Contracts` | Tablón industrial con timer y documento metálico |
| 2 | `New Machines & Products` | PCB Printer con Circuit Board → Laptop → Server Rack |
| 3 | `Market Events` | Pantalla de mercado con precio disparándose |

**Texto en pantalla** (aparece antes de los cards):
```
This is just the beginning.
```

Ver sección **"Assets a generar"** para los prompts exactos de los iconos.

---

### BLOQUE 4 — Logo y CTA (~8s)

Corte a negro. Logo del juego aparece centrado. Debajo, el badge de Steam.

```
SCRAP YARD IDLE
```
```
Play the Demo — Wishlist the Full Game
```

El `machine_hum_loop.wav` se desvanece lentamente. La fábrica sigue corriendo sola aunque el trailer haya terminado.

---

## Textos en pantalla — copia final

Solo 5 líneas en todo el trailer:

```
You inherited a scrap yard.

Collect. Process. Sell. Upgrade.

This is just the beginning.

SCRAP YARD IDLE

Play the Demo — Wishlist the Full Game
```

---

## Assets a generar — Iconos del Bloque 3 (3 cards)

Los iconos deben tener el mismo **ambiente visual** que el juego (metal oscuro oxidado, iluminación ámbar/naranja cálida, estética industrial steampunk) pero **cada uno con un sujeto principal distinto y silueta única**. No son máquinas — son conceptos.

Herramienta recomendada: **Midjourney v6** o **DALL-E 3**. Los prompts están listos para copiar/pegar.

---

### Estilo de ambiente — aplicar en todos, NO forzar estructura de máquina

```
dark industrial steampunk aesthetic, oxidized bronze and copper tones, 
warm amber and orange dramatic lighting, painterly detailed illustration, 
dark background, no text, no UI, centered composition, square format, game asset style
```

---

### Card 1 — Contracts

**Sujeto principal**: Un contrato o documento industrial firmado, con un timer de cuenta atrás encima. Silhouette clara de papel + reloj. No es una máquina — es el objeto del contrato.

```
a single industrial contract document on a dark metal surface, heavy paper with 
a wax seal and metal binding clips, a large analog countdown clock mounted above it 
with glowing amber numerals, dramatic side lighting casting warm orange shadows, 
dark industrial steampunk aesthetic, oxidized bronze and copper tones, 
warm amber and orange dramatic lighting, painterly detailed illustration, 
dark background, no text, no UI, centered composition, square format, game asset style
```

---

### Card 2 — New Machines & Products

**Sujeto principal**: Una placa de circuito (PCB) verde con trazas brillantes, flotando o sobre una superficie metálica. Silhouette completamente distinta — geométrica y tecnológica, no una caja de máquina.

```
a single green circuit board PCB with glowing orange electrical traces, 
resting on a dark oxidized metal workbench with small scattered electronic components, 
close-up detailed view with dramatic amber underlighting making the traces glow, 
dark industrial steampunk aesthetic, oxidized bronze and copper tones, 
warm amber and orange dramatic lighting, painterly detailed illustration, 
dark background, no text, no UI, centered composition, square format, game asset style
```

---

### Card 3 — Market Events

**Sujeto principal**: Una pantalla analógica o tablero de cotizaciones industrial con flechas de precio. Silhouette de pantalla rectangular con datos — diferente a los dos anteriores.

```
a vintage industrial stock ticker board with large green upward arrow and red downward 
arrow displayed, mounted on a dark metal wall panel with analog dials and pressure gauges 
on the sides, paper ticker tape spilling out from the bottom, 
dramatic amber and green colored lighting contrast, 
dark industrial steampunk aesthetic, oxidized bronze and copper tones, 
warm amber and orange dramatic lighting, painterly detailed illustration, 
dark background, no text, no UI, centered composition, square format, game asset style
```

---

### Formato de entrega
- **3 iconos** en total (uno por card)
- Resolución mínima: **512×512px**, preferible **1024×1024px**
- Fondo negro sólido o transparente (ambos válidos)
- Formato: **PNG**
- Generar 2–3 variantes por card y elegir la más legible a tamaño pequeño

---

## Referencias de trailers

Para calibrar el ritmo y tono, ver:
- **Factorio** (trailer de lanzamiento) — ritmo industrial, puro gameplay, cero relleno
- **Shapez 2** — claridad visual de cadenas de producción
- **Dyson Sphere Program** — escala épica con poco texto
