# Last Admin Online — Angular + Electron Game Template

Plantilla base para crear juegos con Angular (standalone + Signals) y empaquetarlos con Electron.

Quick start

- Instalar dependencias:
  ```bash
  pnpm install
  ```
- Ejecutar en desarrollo (Angular + Electron):
  ```bash
  pnpm run electron:dev
  ```
- Generar build web:
  ```bash
  pnpm run dist
  ```
- Empaquetar Windows (crea output con timestamp):
  ```bash
  pnpm run package:win
  ```

Estructura y convenciones

- `src/app/config` — todos los valores de juego, UI y audio deben vivir aquí.
- `src/app/services` — servicios basados en Signals para estado y tick.
- `electron/` — `main.js` y `preload.js` para la integración Electron.
- `scripts/pack.js` — helper que genera `dist` y llama a `electron-builder` en un directorio único.

Notas para publicar

- Añade `build_resources/icon.ico` para personalizar el icono del instalador.
- Para firmas de código en release, configura certificados (`CSC_*` env vars).
- Integra Steam (e.g. `greenworks`) si vas a usar Steamworks.

Git

- Los artefactos de build y documentos internos están ignorados en `.gitignore`.

Licencia

Coloca aquí la licencia del repositorio si procede.
# LastAdminOnline

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

Electron dev:

```bash
pnpm run electron:dev
```
