# Dev Emulator

Adds a KaiOS device frame and softkey simulation to the `npm run dev` browser experience.

## What was added

| File | Change |
|------|--------|
| `scripts/build.mjs` | Added `define: { __DEV__: String(serve) }` to `buildOptions` so esbuild injects `true` in dev and `false` in production. |
| `src/globals.d.ts` | `declare const __DEV__: boolean` — picked up by TypeScript via `"include": ["src"]`. |
| `src/dev/emulator.ts` | `installDevEmulator()` — injects the frame CSS, wires softkey clicks, and maps `[`/`]` to `SoftLeft`/`SoftRight`. |
| `src/index.ts` | `if (__DEV__) installDevEmulator();` at the top of the entry point. |

## How to use

```
npm run dev
```

Open http://localhost:1234. The app is constrained to 240×320 px, centred on a dark page background.

**Keyboard shortcuts (desktop)**

| Key | KaiOS action |
|-----|-------------|
| `[` | SoftLeft |
| `]` | SoftRight |
| `Enter` | OK / centre softkey |
| Arrow keys | D-pad |
| `Backspace` | Back |

**Mouse**: click any softkey label in the on-screen bar to trigger the corresponding key event.

## Production build verification

`npm run build` then:

```
grep -Ec "2c2c2c|isTrusted|KEY_REMAP|cursor: pointer|240px|320px|softkeys span" build/index.js
```

Result: **0** — esbuild's dead-code elimination removes the entire `if (false) { … }` branch, so none of the dev frame or shim strings appear in the production bundle.
