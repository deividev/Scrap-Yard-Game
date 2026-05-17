# Project Context — Scrap Yard Idle

## Resumen ejecutivo

`Scrap Yard Idle` ya tiene implementado el core jugable completo hasta T12, incluyendo contratos. El estado real del proyecto en mayo de 2026 es:

- F0 completada.
- F1 completada.
- F2 completada.
- F3 pendiente.
- F4 pendiente.
- QA largo, hardening de release y salida en Steam pendientes.

La estrategia actual del proyecto es terminar todo el PRD antes de preparar el launch en Steam.

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
| F3 - Eventos de mercado | Pendiente | No existe aun un sistema real de eventos sobre el mercado |
| F4 - Milestones / flavor text | Pendiente | Solo hay placeholder de persistencia, no sistema jugable |
| Release engineering | Pendiente | Falta QA largo, build final y limpieza de deuda de release |
| Steam launch | Pendiente | Se hara despues de cerrar todo el PRD |

## Sistemas implementados

| Sistema | Estado | Evidencia |
|---|---|---|
| Game loop global 1s | Implementado | `GameLoopService` |
| Recursos T1-T12 | Implementado | `resources.config.ts` |
| Maquinas T1-T12 | Implementado | `machines.config.ts` |
| Mercado y venta manual | Implementado | `MarketService` + botones UI |
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

- F3 - Eventos de mercado.
- F4 - Milestones con flavor text y feedback de progresion.
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

1. Implementar F3.
2. Implementar F4.
3. Resolver D1 y D2.
4. Ejecutar QA largo y balance.
5. Cerrar release engineering.
6. Preparar y lanzar en Steam.
