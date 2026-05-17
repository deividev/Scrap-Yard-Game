# Scrap Yard Idle

Juego idle/management industrial construido con Angular 21 standalone y Electron. El objetivo es llevar una cadena de reciclaje desde chatarra manual hasta productos late game como Desktop PCs, Mining Rigs y Server Racks.

## Estado actual

| Area | Estado actual |
|---|---|
| Core loop, recursos, mercado y upgrades base | Implementado |
| F0 - Rebalanceo Tier 3 | Implementado |
| F1 - Sistema de contratos | Implementado |
| F2 - Cadenas avanzadas T4-T12 | Implementado |
| F3 - Eventos de mercado | Pendiente |
| F4 - Milestones / flavor text | Pendiente |
| Release engineering y Steam | Pendiente |

La estrategia actual del proyecto es simple: completar todo el scope del PRD primero, y recien despues preparar la salida en Steam.

## Quick Start

1. Instalar dependencias.

```bash
pnpm install
```

2. Ejecutar la app web en desarrollo.

```bash
pnpm run start
```

3. Ejecutar el wrapper de Electron con el build actual.

```bash
pnpm run electron:quick
```

4. Validar tests y coverage.

```bash
pnpm run test
pnpm run test:coverage
```

## Scripts principales

| Script | Uso |
|---|---|
| `pnpm run start` | Desarrollo Angular |
| `pnpm run electron:quick` | Abrir Electron contra el build actual |
| `pnpm run build:electron` | Build Angular con `base-href` relativa |
| `pnpm run package:win` | Empaquetado Windows con `electron-builder` |
| `pnpm run test` | Suite unitaria |
| `pnpm run test:coverage` | Suite unitaria con coverage y gate |

## Estructura relevante

| Ruta | Rol |
|---|---|
| `src/app/config` | Balance, maquinas, upgrades, unlocks y flags |
| `src/app/services` | Estado global, loop, save, audio, contratos y tutorial |
| `src/app/components` | UI principal del juego |
| `src/assets/i18n` | Traducciones `es/en` |
| `electron` | Runtime desktop y preload IPC |
| `docs` | Documentacion activa del proyecto |
| `docs-old` | Archivo historico; no usar como fuente de verdad del estado actual |

## Documentacion activa

| Archivo | Uso |
|---|---|
| `docs/project-context.md` | Foto actual del proyecto y del backlog real |
| `docs/PRD.md` | Scope funcional completo y objetivos de producto |
| `docs/FULL_GAME_TASKS.md` | Backlog de implementacion activo |
| `docs/RELEASE_ROADMAP.md` | Camino hasta el launch despues de completar el PRD |
| `docs/systems.md` | Inventario tecnico de sistemas y runtime |
| `docs/todo.md` | Cola corta de trabajo inmediato |

## Notas de release actuales

- El runtime de Electron sale desde `electron/main.js` y `electron/preload.js`.
- El proyecto sigue marcado como beta en `package.json` mediante `releaseLabel`.
- Los artefactos de Windows se generan en `dist_electron/`.
- Antes de una release real hay que completar F3 y F4, validar QA largo y cerrar la deuda de release engineering.

## Licencia

Pendiente definir la licencia comercial o de distribucion del proyecto en este repositorio.
