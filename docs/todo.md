# TODO — Scrap Yard Idle

> Última actualización: Abril 4, 2026

---

## 🗓️ Plan de Lanzamiento

### Objetivo
Lanzar la demo en Steam con su página antes del **Steam Next Fest (junio 2026)** para maximizar wishlists. El juego completo sale en **julio-agosto 2026**.

### Fases en orden

```
AHORA — Preparación del trailer y Steam pages
  ✅ TRAILER_BRIEFING.md entregado al publisher
  ⬜ Publisher produce el trailer (45-50s) siguiendo el brief
  ⬜ Trailer subido a la Steam page del juego completo (ya creada)
  ⬜ Steam page de la DEMO creada y configurada
    ↓
ANTES DE NEXT FEST — Demo lista para lanzar
  ⬜ Demo cap implementado (máquinas bloqueadas post-Empaquetadora)
  ⬜ demo-end-overlay apunta a la URL real de la Steam page del juego completo
  ⬜ Build de producción verificado (.exe sin errores)
  ⬜ Balance y QA — sesión completa sin softlocks
  ⬜ Lanzamiento: Steam page demo + demo disponible para descarga
    ↓
STEAM NEXT FEST — Junio 2026
  ⬜ Demo expuesta en Next Fest → wishlists del juego completo
    ↓
IMPLEMENTACIÓN JUEGO COMPLETO — Mayo → Julio 2026
  (~3 meses con diseño ya cerrado y sin cambios de scope)
  ⬜ T3: Recicladora → Ensambladora Eléctrica → Empaquetadora Eléctrica
  ⬜ Contratos
  ⬜ Tier 4: PCB Printer → Circuit Board
  ⬜ Tier 5: HDD Assembler + Screen Fabricator
  ⬜ Eventos de mercado
  ⬜ Tier 6: GPU Fab + Smartphone + Laptop + PC Builder
  ⬜ Tier 7: Data Center Assembly + Mining Rig Assembly
  ⬜ Narrativa / Flavor text en milestones
    ↓
LANZAMIENTO JUEGO COMPLETO — Julio-Agosto 2026
```

### Documentos clave
| Documento | Propósito |
|---|---|
| `docs/TRAILER_BRIEFING.md` | Guía completa para el publisher — storyboard, audio, prompts de iconos |
| `docs/FULL_GAME_EXPANSION_ROADMAP.md` | Diseño del juego completo — tiers, máquinas, orden de implementación |
| `docs/todo.md` (este archivo) | Tareas técnicas pendientes |

---

## Estado general

El núcleo jugable del MVP está **implementado y funcional**. El juego compila y corre como aplicación Electron. Los sistemas de recursos, máquinas, upgrades, mercado, persistencia y tutorial están completos.

La carpeta `/docs` estaba vacía; este archivo y los demás de esta carpeta son la documentación recién generada.

---

## Tareas actuales

### 🔴 Crítico — bloquea el lanzamiento de la demo

- [ ] **Demo cap no implementado** — `MachineUnlockService.checkAndUnlockMachines()` incluye `SMELTER`, `RECYCLER`, `ELECTRIC_ASSEMBLER`, `ELECTRIC_PACKAGER` en la lista de desbloqueables. Si el jugador sube niveles suficientes, esas máquinas se desbloquean. No existe ninguna constante `DEMO_MACHINE_CAP` ni guard que lo impida.
  - Añadir `DEMO_MACHINE_CAP` en `dev-flags.config.ts` con la lista de máquinas bloqueadas en demo
  - `checkAndUnlockMachines()` salta las máquinas del cap en modo demo
  - `getUnlockInfo()` devuelve un estado `demo-locked` diferenciado para esas máquinas

- [ ] **Modal demo usa `forceShow()` en lugar de `triggerIfNeeded()`** — En `machine-unlock.service.ts` hay un `TODO: REVERT` pendiente. Con `forceShow()` el modal aparece cada vez, ignorando el flag `demoEndSeen` persistido en `SaveState`. Cambiar a `triggerIfNeeded()` antes de publicar.

- [ ] **URL del modal demo sin configurar** — El botón de Steam Wishlist del `demo-end-overlay` necesita apuntar a la URL real de la Steam page del juego completo. Pendiente hasta que la página esté publicada.

- [ ] **Estado visual "demo-locked" en MachineCard** — Las máquinas del cap deben mostrar un estado visual diferente al "bloqueada por requisitos". El jugador tiene que entender que no es cuestión de subir más niveles sino de que es contenido del juego completo.

- [ ] **Build de producción verificado** — Confirmar que `electron-builder` genera el `.exe` sin errores y con todos los assets empaquetados correctamente.

### 🟡 Importante

- [ ] **Balance validado en sesión larga** — Jugar una run completa hasta la Empaquetadora verificando:
  - No hay softlock económico (el jugador siempre puede generar dinero para el siguiente upgrade)
  - Las máquinas avanzadas tienen suficiente input de las anteriores para no bloquearse
  - Los precios de venta vs coste de upgrades son sostenibles

- [ ] **Flags de dev desactivados en build** — Verificar antes del build que `debug-machines-panel` y `debug-controls` no son visibles en producción. `DEV_CALIBRATION_ENABLED = false` ya está correcto.

- [ ] **Venta de Cobre y Plástico Reciclado en UI** — Verificar que tienen botón de venta expuesto. Si el inventario se llena sin poder venderlos, la producción se bloquea.

- [ ] **Panel de estadísticas** — Verificar que `statistics-panel` muestra correctamente `totalScrapGenerated`, `playTimeFormatted`, `totalMoneyEarned` y `activeMachinesCount`.

### 🟢 Post-lanzamiento demo / juego completo

---

## Completado

- [x] Sistema de recursos (8 tipos, capacidades, dirty flag)
- [x] UI base de recursos (header, panel)
- [x] Sistema de máquinas (8 máquinas, producción, consumo)
- [x] Cadena de producción completa (Crusher → ... → Electric Packager)
- [x] Game Loop global (tick 1s, sin timers adicionales)
- [x] Mercado (venta manual con bonus de lote)
- [x] Upgrades de almacenamiento (7 recursos, hasta nivel 50)
- [x] Upgrades de velocidad de máquinas
- [x] Upgrade de generación automática de chatarra (niveles 0–10)
- [x] Desbloqueo progresivo de máquinas (árbol de requisitos)
- [x] Persistencia local Electron userData (auto-save 15s, save on close, escritura atómica)
- [x] Tutorial first-run paso a paso (event-driven, persistido)
- [x] Estadísticas (scrap total, play time, dinero ganado)
- [x] Audio (efectos en desbloqueos y acciones)
- [x] Notificaciones (desbloqueos, upgrades)
- [x] **Save versioning** — `SAVE_VERSION = 1`, campo `version` en `SaveState`, migración progresiva `migrateSave()` en vez de rechazo. Alerta en JSON corrupto
- [x] **DevTools bloqueados en producción** — F12/Ctrl+Shift+I deshabilitados cuando `app.isPackaged` en `electron/main.js`
- [x] **End-game demo — modal de fin de demo** — Implementado. Se muestra 1 minuto después de desbloquear la Empaquetadora. Modal con diseño industrial (Cinzel/Oswald, tema oscuro naranja), botón de Steam Wishlist y "Seguir jugando". Flag `demoEndSeen` persistido en `SaveState`. Componente: `demo-end-overlay`.
- [x] i18n / Traducción
- [x] Settings (idioma, audio)
- [x] Menú principal y opciones
- [x] Generación manual de chatarra (6 scrap/click, coste $1)
- [x] Generación automática de chatarra (hasta 4.2 scrap/s en nivel 10)
- [x] Debug controls y debug machines panel (solo desarrollo)
- [x] Progression hint component
- [x] Machine card v2 con estados visuales (OK / falta input / output lleno / parada / bloqueada)
- [x] UI ajustable (paneles minimizables)
