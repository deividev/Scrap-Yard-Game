# Project Context — Scrap Yard Idle

## Resumen ejecutivo

`Scrap Yard Idle` ya tiene implementado el core jugable completo hasta T12, incluyendo contratos. El estado real del proyecto en mayo de 2026 es:

- F0 completada.
- F1 completada.
- F2 completada.
- F3 completada.
- F4 diferida a revisión post-release.
- QA largo, hardening de release y salida en Steam pendientes.

La estrategia actual del proyecto es cerrar QA/hardening del core pre-release antes de preparar Steam. F4 no bloquea release salvo que los playtests demuestren que falta feedback de progresión.

## Qué es el juego

Es un idle/management de escritorio donde el jugador transforma chatarra en una cadena industrial cada vez mas compleja. Empieza recolectando scrap de forma manual y termina ensamblando hardware de alto nivel como Desktop PCs, Mining Rigs y Server Racks.

## Stack real

| Area | Tecnologia |
|---|---|
| Frontend | Angular 21 standalone |
| Estado reactivo | Signals + `inject()` |
| Desktop wrapper | Electron |
| Lenguaje | TypeScript strict |
| Testing | `ng test` + coverage gate |
| i18n | JSON `es/en` |
| Build Windows | `electron-builder` |

## Objetivo del jugador

1. Generar chatarra.
2. Procesarla en maquinas industriales.
3. Vender recursos y productos.
4. Comprar upgrades.
5. Desbloquear tiers superiores.
6. Optimizar la cadena completa para sostener contratos y produccion late game.

## Estado por fases

| Fase | Estado | Nota |
|---|---|---|
| F0 - Rebalanceo Tier 3 | Implementada | La Fundidora ya consume Scrap directo y el balance fue ajustado |
| F1 - Contratos | Implementada | Servicio, UI, persistencia, intro modal y tick integrados |
| F2 - Cadenas T4-T12 | Implementada | Recursos, maquinas, upgrades y mercado avanzado presentes en codigo |
| F3 - Eventos de mercado | Implementada | Pool actual de 8 eventos, banner en upgrades, audio por signo y gating por recursos desbloqueados |
| F4 - Milestones / flavor text | Diferida post-release | Solo hay placeholder de persistencia; no forma parte del core pre-release actual |
| Release engineering | Pendiente | Falta QA largo, build final y limpieza de deuda de release |
| Steam launch | Pendiente | Se hara despues de QA/hardening y validacion del build |

## Sistemas implementados

| Sistema | Estado | Evidencia |
|---|---|---|
| Game loop global 1s | Implementado | `GameLoopService` |
| Recursos T1-T12 | Implementado | `resources.config.ts` |
| Maquinas T1-T12 | Implementado | `machines.config.ts` |
| Mercado y venta manual | Implementado | `MarketService` + botones UI |
| Eventos de mercado | Implementado | `MarketEventService` + `EventBannerComponent` + multiplicadores runtime |
| Upgrades de storage, scrap y maquinas | Implementado | `upgrade-definitions.config.ts` |
| Unlock progresivo | Implementado | `MachineUnlockService` |
| Contratos | Implementado | `ContractService` + tab de contratos |
| Persistencia local | Implementado | `SaveService` + Electron `userData` |
| Tutorial first-run | Implementado | `FirstRunTutorialService` |
| Audio y notificaciones | Implementado | `AudioService` + `NotificationService` |
| Estadisticas | Implementado | `StatisticsService` |
| i18n es/en | Implementado | `src/assets/i18n/*.json` |

## Gaps reales del proyecto

### Producto

- QA manual completa del loop T1-T12.
- Balance final del late game y decision sobre D1/D2 segun findings de QA.
- F4 - Milestones con flavor text y feedback de progresion solo si el juego demuestra necesitarlo post-release.
- D1 - Refactor del header de recursos para soportar mejor el late game.
- D2 - Tabs o filtros de maquinas para bajar densidad visual.

### Release engineering

- Validar build Windows end-to-end con `package:win`.
- QA completo de progresion T1-T12 sin cheats.
- Revisar leftovers de beta/demo antes de una release real.
- Preparar assets, store page, pipeline de subida y checklist de Steam.

### Deuda tecnica relevante

- El runtime desktop real usa `electron/main.js` y `electron/preload.js`; los `.ts` equivalentes no estan perfectamente alineados y no deben tomarse como unica fuente de verdad de release.
- Parte de la documentacion estaba describiendo F1 y F2 como pendientes cuando ya estaban implementadas.

## Prioridad recomendada

1. Ejecutar QA largo y save/load con la checklist manual actual.
2. Corregir bugs y rebalancear lo que salga de esa pasada.
3. Resolver D1 y D2 solo si QA confirma que siguen siendo dolor real.
4. Cerrar release engineering.
5. Preparar y lanzar en Steam.
6. Revisar F4 post-release si sigue haciendo falta.
