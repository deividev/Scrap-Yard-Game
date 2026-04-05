# Systems — Scrap Yard Idle

## Índice

1. [Resources](#1-resources)
2. [Machines](#2-machines)
3. [Game Loop](#3-game-loop)
4. [Market](#4-market)
5. [Upgrades](#5-upgrades)
6. [Machine Unlock](#6-machine-unlock)
7. [Scrap Generation](#7-scrap-generation)
8. [Save / Persistence](#8-save--persistence)
9. [Statistics](#9-statistics)
10. [Tutorial First-Run](#10-tutorial-first-run)
11. [Audio](#11-audio)
12. [Notifications](#12-notifications)
13. [Settings / i18n](#13-settings--i18n)
14. [Game State](#14-game-state)

---

## 1. Resources

**Servicio:** `ResourcesService`  
**Config:** `resources.config.ts`

Gestiona el inventario de todos los recursos del juego mediante un signal reactivo.

### Tipos de recursos (`ResourceType`)

| ID | Nombre | Capacidad inicial | Notas |
|---|---|---|---|
| `scrap` | Chatarra | 50 | Principal input del ciclo |
| `metal` | Metal | 40 | Output de Trituradora |
| `plastic` | Plástico | 20 | Output de Separador |
| `components` | Componentes | 10 | Output de Ensambladora |
| `money` | Dinero | ∞ | Moneda del juego |
| `copper` | Cobre | 20 | Output de Fundidora |
| `recycled_plastic` | Plástico Reciclado | 20 | Output de Recicladora |
| `electric_components` | Componentes Eléctricos | 10 | Output de Ensambladora Eléctrica |

### Comportamiento

- Capacidad limitada para todos los recursos excepto `money` (Infinity)
- `add()` respeta la capacidad máxima; exceso se descarta
- `subtract()` falla silenciosamente si no hay suficiente cantidad
- Las capacidades se incrementan mediante upgrades de almacenamiento
- El servicio expone `markDirty()` vía `SaveMarker` para activar auto-guardado

---

## 2. Machines

**Servicio:** `MachinesService`  
**Config:** `machines.config.ts`

Gestiona el estado de todas las máquinas del juego.

### Tipos de máquinas y cadena de producción

```
Chatarra ──► Trituradora ──► Metal ──► Ensambladora ──► Componentes ──► Empaquetadora ──► (venta)
         └──► Separador  ──► Plástico ─►──────────────────────────────────►
                                   └──► Fundidora ──► Cobre ──► (venta)
                                        Metal ──►
                                   └──► Recicladora ──► Plástico Reciclado
                                                        Plástico ──►
                         └──► Ensambladora Eléctrica ──► Componentes Eléctricos
                              Componentes ──►
                 └──► Empaquetadora Eléctrica (requiere Componentes Eléctricos)
```

### Definición de máquinas

| ID | Nombre | Inputs | Output | baseSpeed | Nivel inicial |
|---|---|---|---|---|---|
| `crusher` | Trituradora | 1 Chatarra | 2 Metal | 0.50/s | 1 (desbloqueada) |
| `separator` | Separador | 1 Chatarra | 1 Plástico | 0.50/s | 0 (bloqueada) |
| `smelter` | Fundidora | 4 Metal | 2 Cobre | 0.25/s | 0 (bloqueada) |
| `assembler` | Ensambladora | 1 Metal + 1 Plástico | 1 Componente | 0.22/s | 0 (bloqueada) |
| `packager` | Empaquetadora | 4 Componentes | (venta) | 0.10/s | 0 (bloqueada) |
| `electric_packager` | Empaquetadora Eléctrica | Componentes Eléctricos | (venta) | 0.10/s | 0 (bloqueada) |
| `recycler` | Recicladora | 1 Metal + 1 Plástico | 1 Plástico Reciclado | variable | 0 (bloqueada) |
| `electric_assembler` | Ensambladora Eléctrica | Componentes + Cobre | 1 Comp. Eléctrico | variable | 0 (bloqueada) |

### Estado de una máquina

- `level` — nivel actual (0 = bloqueada, >0 = desbloqueada)
- `isActive` — si está procesando
- `progress` — progreso del ciclo actual (0.0 → 1.0)
- `baseSpeed` — fracción de ciclo completada por tick
- `baseConsumption[]` — inputs por ciclo
- `baseProduction` — output por ciclo

---

## 3. Game Loop

**Servicio:** `GameLoopService`

Motor central del juego. Corre un `setInterval` de 1 segundo y dentro ejecuta el `tick()`.

### Secuencia del tick

1. Incrementa contador de ticks
2. Llama a `ScrapGenerationService.processAutomaticGeneration()`
3. Actualiza `StatisticsService.tick()`
4. Llama a `processProduction()` → itera todas las máquinas activas
5. Llama a `processUpgradeProgress(deltaTime=1)` → avanza upgrades en curso
6. Cada 15 ticks → `SaveService.save()` (auto-save)

### Lógica de producción por máquina

- Si `progress < 0.01` (inicio de ciclo):
  - Verifica que haya inputs suficientes
  - Verifica espacio disponible en el output
  - Si OK → consume inputs, empieza ciclo
- Avanza `progress += baseSpeed * multipliers`
- Si `progress >= 1.0` → produce output, resetea progress a 0

### Multiplicadores

- `consumptionMultiplier` — calculado desde upgrades de la máquina
- `productionMultiplier` — calculado desde upgrades de la máquina

---

## 4. Market

**Servicio:** `MarketService`  
**Config:** `game-balance.config.ts` → `MARKET_CONFIG`

Permite vender recursos manualmente a cambio de dinero.

### Recursos vendibles

| Recurso | Precio base | Bono por lote |
|---|---|---|
| Metal | config | Sí (por cantidad) |
| Plástico | config | Sí |
| Componentes | config | Sí |
| Cobre | config | Sí |

### Bonus de lote

- Cuanto mayor la cantidad vendida de una vez, mayor el multiplicador de precio
- Umbral definido en `MARKET_CONFIG.BATCH_BONUSES`

### Integración

- Los componentes `sell-metal-button`, `sell-components-button` y `sell-resource-button` invocan este servicio
- Registra el dinero ganado en `StatisticsService`
- Eventos de venta de Metal disparan pasos del tutorial

---

## 5. Upgrades

**Servicios:** `UpgradesService`, `UpgradeProgressService`  
**Config:** `upgrade-definitions.config.ts`, `game-balance.config.ts`

Sistema de mejoras permanentes compradas con dinero (y a veces componentes).

### Categorías

#### Almacenamiento (`STORAGE`)

Aumenta la capacidad máxima de un recurso por nivel.

| ID | Recurso objetivo | Incremento/nivel | Coste base |
|---|---|---|---|
| `UPG_STORE_001` | Chatarra | +25 | $20 |
| `UPG_STORE_002` | Metal | +15 | $35 |
| `UPG_STORE_003` | Plástico | +15 | $35 |
| `UPG_STORE_004` | Componentes | +5 | $35 + componentes |
| `UPG_STORE_005` | Plástico Reciclado | +10 | $50 |
| `UPG_STORE_006` | Componentes Eléctricos | +5 | $80 + componentes |
| `UPG_STORE_007` | Cobre | +15 | $40 |

#### Velocidad de máquinas (`MACHINE`)

Aumenta `baseSpeed` de la máquina target.

| ID | Máquina | Coste base |
|---|---|---|
| `UPG_MACH_001` | Trituradora | config |
| `UPG_MACH_002` | Fundidora | config |
| `UPG_MACH_003` | Separador | config |
| `UPG_MACH_004` | Ensambladora | config |
| + más | Resto de máquinas | config |

#### Generación de chatarra (`UPG_SCRAP_002`)

- Aumenta la generación automática de chatarra
- Niveles 0–10, tasas: `[0, 0.12, 0.2, 0.32, 0.48, 0.7, 1.0, 1.45, 2.1, 3.0, 4.2]` scrap/s

### Fórmula de coste

```
cost = ceil(baseCost * multiplier ^ level)
```

- Multiplicador estándar: **1.26**
- Storage: **1.20**
- Scrap auto: **1.35**

### Nivel máximo

- Storage upgrades: **50**
- Machine / Scrap upgrades: según config

### Progreso de upgrades

`UpgradeProgressService` permite upgrades que tardan tiempo en completarse (investigación). Actualmente los upgrades se aplican de forma instantánea en el MVP pero la infraestructura de temporización está lista.

---

## 6. Machine Unlock

**Servicio:** `MachineUnlockService`

Gestiona el desbloqueo progresivo de máquinas. Todas las máquinas excepto `crusher` comienzan en `level = 0` (bloqueadas).

### Árbol de desbloqueo

El desbloqueo se basa en el nivel de upgrades de máquinas previas. Se revisa cada vez que se completa un upgrade de máquina (`UPG_MACH_*`).

### Comportamiento

- `checkAndUnlockMachines()` se llama tras completar cualquier upgrade de máquina
- Itera las máquinas bloqueables y verifica condiciones
- Al desbloquear: sube `machine.level` a 1, dispara notificación y sonido

---

## 7. Scrap Generation

**Servicio:** `ScrapGenerationService`  
**Config:** `SCRAP_GENERATION_CONFIG`

Dos modos de generación de chatarra:

### Manual (click)

- El botón `scrap-button` llama a este servicio
- Genera **6 chatarras** por click
- Tiene un **coste de $1** por click
- Registra el evento en tutorial (primer click)

### Automática

- Genera chatarra cada tick según la tasa configurada
- Tasa en scrap/s: `[0, 0.12, 0.2, ..., 4.2]` según nivel de `UPG_SCRAP_002`
- Respeta la capacidad máxima del almacén

---

## 8. Save / Persistence

**Servicio:** `SaveService`  
**Backend:** Electron `userData` (archivo local del usuario)

Sistema de guardado diseñado para aplicación de escritorio. No usa localStorage.

### Estrategia

| Tipo | Frecuencia | Condición |
|---|---|---|
| Auto-save | Cada 15 ticks (15s) | Solo si `isDirty = true` |
| Save on close | Al cerrar la app | Siempre |

### Dirty flag

Todos los servicios que mutan estado implementan `SaveMarker.markDirty()`. El `SaveService` solo escribe a disco si `isDirty = true`.

### Escritura atómica

1. Escribir en `save.tmp`
2. Reemplazar `save.json` con el fichero temporal

Evita corrupción por cierre inesperado.

### Qué se guarda (`SaveState`)

- Recursos (amount + capacity)
- Máquinas (estado completo)
- Upgrades (niveles de todos los upgrades)
- Generación de chatarra (rate auto, nivel)
- Estadísticas (totales históricos)
- Tutorial first-run (progreso)
- Settings (idioma, audio, etc.)

### Carga

- Al iniciar la app: si existe `save.json` → cargar; si no → estado limpio

---

## 9. Statistics

**Servicio:** `StatisticsService`

Estadísticas de sesión y acumuladas. Se persisten en el save.

| Estadística | Descripción |
|---|---|
| `totalScrapGenerated` | Total de chatarra generada desde el inicio |
| `playTimeSeconds` | Tiempo total jugado en segundos |
| `totalMoneyEarned` | Dinero total ganado (ventas) |
| `activeMachinesCount` | Computed: máquinas activas y desbloqueadas |

---

## 10. Tutorial First-Run

**Servicio:** `FirstRunTutorialService`  
**Config:** `first-run-tutorial.config.ts`  
**Componente:** `first-run-tutorial-overlay`

Tutorial paso a paso que se activa la primera vez que se juega. Se omite si ya fue completado o saltado.

### Estados del tutorial

- `isActive` — tutorial en curso
- `isCompleted` — completado con éxito
- `isSkipped` — saltado por el jugador

### Eventos que avanza el tutorial

- `crusher-activated` — el jugador activa la Trituradora
- `metal-sold` — el jugador vende metal
- Otros eventos configurados en `first-run-tutorial.config.ts`

### Persistencia

El estado del tutorial se guarda en el `SaveState`.

---

## 11. Audio

**Servicio:** `AudioService`

Gestiona efectos de sonido del juego. Integrado en desbloqueos de máquinas y acciones del jugador. Los archivos de audio se encuentran en `src/app/assets/audio/`.

---

## 12. Notifications

**Servicio:** `NotificationService`

Muestra notificaciones en pantalla para eventos importantes:
- Desbloqueo de nuevas máquinas
- Completado de upgrades
- Otros eventos relevantes

---

## 13. Settings / i18n

**Servicios:** `SettingsService`, `TranslationService`  
**Config:** `src/assets/i18n/`

- `SettingsService` — gestiona preferencias del usuario (idioma, volumen, etc.)
- `TranslationService` — carga y sirve cadenas de texto del idioma activo
- El idioma activo se persiste en el `SaveState`

---

## 14. Game State

**Servicio:** `GameStateService`

Controla la vista principal de la aplicación.

| Vista | Descripción |
|---|---|
| `main-menu` | Pantalla inicial (por defecto al arrancar) |
| `game` | Vista de juego principal |
| `options` | Menú de opciones |

Las transiciones son: menú → juego, juego → opciones, opciones → juego/menú.
