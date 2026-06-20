# KaiOS Home Assistant

A [Home Assistant](https://www.home-assistant.io/) remote for KaiOS feature phones —
control your lights, switches, scripts, covers and more from the keypad.

![screenshot](./docs/screenshot.png)

> _Screenshot is of the original prototype. The app is being redesigned (multi-server, a
> custom grid dashboard with D-pad navigation, per-domain detail screens). See **Roadmap**._

## Status

Mid-redesign. The **foundation** has landed: a modern build pipeline plus the UI-free core
(runtime config, entity-state cache, HA REST client, per-domain registry). The new dashboard UI
is in progress.

## Architecture

Vanilla TypeScript, no UI framework (the target engine is old and bundle size / battery matter).
Bundled with [esbuild](https://esbuild.github.io/), tested with [Vitest](https://vitest.dev/).

| Module | Responsibility |
|---|---|
| `src/store/` | Config persisted to `localStorage` (servers, pages, settings) + a live entity-state cache. |
| `src/ha/` | Home Assistant REST client over mozSystem `XMLHttpRequest` (`getStates`, `callService`, `ping`). |
| `src/domains/` | Per-domain registry: icon, state formatting, primary action, detail controls. |

The HA client is UI-free and transport-isolated, so a future WebSocket transport can replace it
without touching the rest of the app.

## Getting started

Requires **Node 20+**.

```sh
npm install
npm run dev      # esbuild dev server on http://localhost:1234 (+ starts the CORS proxy)
```

### Scripts

| Script | Does |
|---|---|
| `npm run dev` | Start the CORS proxy and an esbuild watch + serve dev server. |
| `npm run build` | Production bundle into `build/` (target `es2015` for Gecko 48, IIFE). |
| `npm run package` | `build` + zip `build/` into `application.zip` (ready to flash). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run the Vitest suite. |

## Configuration

There is **no `env.js` file** anymore. Servers (URL + long-lived token) are configured at runtime
and stored in the device's `localStorage` — nothing secret lives in the source or the build
artifact. (The in-app settings UI lands with the dashboard; see Roadmap.)

### CORS during development

On a real device, KaiOS's `mozSystem` XHR bypasses CORS, so no proxy is needed. On the desktop
dev server it is, so `npm run dev` starts the small Flask proxy in `docker/`. See
[`docker/README.md`](./docker/README.md).

## Deploying to a device (no old Firefox needed)

WebIDE (the classic install GUI) requires an old Firefox / Waterfox. You can skip it entirely —
installation goes over the **KaiOS remote debugging protocol** via ADB, which CLI tools speak
directly.

1. Build the package: `npm run package` → produces `application.zip` (with `manifest.webapp` at
   the zip root).
2. On the phone, enable debugging: dial `*#*#33284#*#*` to toggle ADB + DevTools.
3. Confirm the connection with Android platform-tools: `adb devices`.
4. Push `application.zip` with a CLI installer:
   - [**gdeploy**](https://sites.google.com/view/bananahackers/development/webide) — a Node.js
     KaiOS app manager (no Firefox, no XPCShell).
   - [**make-kaios-install**](https://github.com/sunsetsonwheels/make-kaios-install) — Makefile +
     XPCShell + ADB.

No PC at all? [**OmniSD**](https://wiki.bananahackers.net/development/webide) installs packaged
zips straight from the phone's storage.

The app's manifest is `privileged`, which installs fine as a sideloaded debug app (no store
signing required).

## Debugging (no old Firefox needed)

Modern Firefox can't debug Gecko 48 either, so use:

- **`adb logcat`** — `console.log`, JS exceptions and Gecko errors stream here:
  ```sh
  adb logcat | grep -iE "Gecko|Console|JavaScript"
  ```
- **On-screen console** — an in-page DevTools overlay like
  [Eruda](https://github.com/liriliri/eruda) or [vConsole](https://github.com/Tencent/vConsole)
  renders a console / network / DOM inspector on the device itself (pick a version compatible with
  Gecko 48).

## Roadmap

- [x] Foundation — esbuild + Vitest, config store, HA REST client, domain registry
- [ ] Navigation framework + grid dashboard (D-pad, softkeys, live polling)
- [ ] Per-domain detail screens (covers, climate, dimmable lights)
- [ ] Settings + multi-server management + quick-switch
- [ ] Entity discovery + in-app picker + page management
- [ ] Polish — toasts, icons, i18n, docs

## Credits

Originally based on [kaiostech/sample-vanilla](https://github.com/kaiostech/sample-vanilla).
PRs welcome.
