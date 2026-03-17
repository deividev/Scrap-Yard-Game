# Scrap Yard Idle

Juego idle/management construido con Angular standalone + Electron.
El objetivo del jugador es convertir chatarra en recursos de mayor valor, optimizar maquinas y escalar su negocio industrial.

## Stack

- Angular 21 (standalone + signals)
- TypeScript strict
- Electron (main/preload + IPC)
- i18n con archivos JSON (es/en)

## Quick Start

1. Instalar dependencias:

```bash
pnpm install
```

2. Ejecutar en desarrollo web:

```bash
pnpm run start
```

3. Ejecutar en desarrollo con Electron:

```bash
pnpm run electron:dev
```

## Scripts Principales

- `pnpm run start`: desarrollo Angular
- `pnpm run test`: tests unitarios
- `pnpm run dist`: build web de produccion
- `pnpm run build:electron`: build Angular + paquete Electron
- `pnpm run package:win`: instalador Windows con electron-builder

## Estructura Relevante

- `src/app/config`: balance y configuracion del juego
- `src/app/services`: estado global, game loop, guardado y audio
- `src/app/components`: UI y pantallas del juego
- `src/assets/i18n`: traducciones (`es.json`, `en.json`)
- `electron`: proceso principal y preload IPC
- `docs`: guias de direccion visual, audio, balance y roadmap

## Notas de Release

- Asegurar icono de instalador en `build_resources/icon.ico`
- Ejecutar `pnpm run test` y `pnpm run build:electron` antes de empaquetar
- Revisar logs de depuracion antes de release final

## Licencia

Definir la licencia comercial o de distribucion del proyecto en este repositorio.
