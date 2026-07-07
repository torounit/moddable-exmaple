# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Technical validation of building **M5Stack CoreS3** applications with the **Moddable SDK using TypeScript**. Target platform identifier: `esp32/m5stack_cores3` (ESP32-S3, 320x240 capacitive-touch LCD). The app is a minimal Piu GUI (`main.ts`).

## Commands

npm scripts are the intended entry points — npm puts `node_modules/.bin` on `PATH`, which the Moddable build needs because it invokes `tsc` as a bare command during the build.

- `npm run sim` — build + launch the macOS simulator (with the xsbug debugger). Fast iteration.
- `npm run deploy` — build and flash to a connected CoreS3 (`mcconfig -d -m -p esp32/m5stack_cores3`).
- `npm run typecheck` — `tsc --noEmit` only (editor/CI type check; does not build).

Running `mcconfig` directly only works if `tsc` is already on `PATH` (e.g. `export PATH="$PWD/node_modules/.bin:$PATH"`); otherwise the build fails with `tsc: command not found`.

## Prerequisites

- **Moddable SDK** installed with `$MODDABLE` set. This repo was set up via [`xs-dev`](https://xs-dev.js.org); source its env before building: `source ~/.local/share/xs-dev-export.sh` (sets `MODDABLE`, `IDF_PATH`, and adds the SDK tools to `PATH`).
- **TypeScript ≥ 6** (a devDependency here). The SDK's generated build config targets `lib/target: es2025`, which TypeScript 5.x rejects — TS 6 is required.
- **Device builds** additionally need the ESP-IDF toolchain (`IDF_PATH`); install with `xs-dev setup --device esp32`.

## How the TypeScript + Moddable build fits together

`manifest.json` is the entry point, not `package.json`. Understanding the build requires reading it together with the SDK manifests it includes:

- `modules: { "*": "./main" }` names `main.ts`. Because the file is `.ts`, `mcconfig` runs `tsc` on it (type-check) and then the XS compiler strips types and produces bytecode. xsbug shows the original TypeScript source.
- The `include`d SDK manifests inject capabilities ("build injection"): `manifest_piu.json` (Piu UI framework + display/touch drivers), `manifest_base.json`, and `manifest_typings.json`.
- **Type definitions live in `$MODDABLE/typings`, not npm.** `manifest_typings.json` maps module specifiers (`piu/*`, `embedded:io/*`, …) to those typings for the build. `tsconfig.json` is only for the editor and points at `./node_modules/@moddable/typings` (the same typings published to npm).
- The manifest can override the SDK's generated tsconfig via a `typescript.tsconfig.compilerOptions` block (the SDK `Object.assign`s it over its defaults in `mcmanifest.js`). This repo uses it to add `esnext.disposable` to `lib`, because the SDK typings reference the `Disposable` global which is not in the `es2025` lib.

## Piu app conventions (gotchas that surface as runtime "unhandled exception")

`main.ts` builds the UI at module load and `export default`s the `Application`. When editing it:

- Use `Text` for multi-line/flowing text; its `Style` supports `horizontal`/padding but **not** `vertical` (that belongs to single-line `Label`). Setting `vertical` on a Text style can throw at layout.
- To update a content from a `Behavior`, hold a module-scope reference to it and mutate that (see `countText`), rather than looking it up by name at runtime.
- An `Application` (or any content) only receives touch events when `active: true`.
- Fonts must be bundled as resources in `manifest.json` (`*-alpha` entries) and referenced by their bare resource name in a `Style` (e.g. `"OpenSans-Semibold-28"`).

## Verifying changes without a display

The simulator is a GUI app and cannot be observed from a headless shell. To confirm the app constructs and renders without exceptions, build in log mode and read the traces:

```
export XSBUG_LOGMACHINE=""            # use the default debug machine
mcconfig -dl -m -p sim                # builds, launches sim, streams traces to stdout via xsbug-log
```

Add a `trace("…\n")` in the app (e.g. in a `Behavior.onDisplaying`, which fires once the app is laid out and displayed) and confirm it appears after `[Thread 1] Connected`. Note: traces emitted during module evaluation are lost if that evaluation throws, so a *missing* trace before your marker means an exception occurred earlier in construction.
