import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const outdir = 'build';

// Dev-only: when HA_DEV_TARGET is set, route the app's WebSocket through the
// local proxy (see ws-dev-proxy.mjs) without touching the saved server config —
// the existing server's token is still used, only the socket URL is overridden.
const proxyPort = Number(process.env.HA_DEV_PROXY_PORT) || 8765;
const devWsUrl = serve && process.env.HA_DEV_TARGET ? `ws://localhost:${proxyPort}/api/websocket` : '';

rmSync(outdir, { recursive: true, force: true });
mkdirSync(`${outdir}/css`, { recursive: true });

const copyStatic = () => {
  cpSync('index.html', `${outdir}/index.html`);
  cpSync('manifest.webapp', `${outdir}/manifest.webapp`);
  cpSync('assets', `${outdir}/assets`, { recursive: true });
  cpSync('src/css', `${outdir}/css`, { recursive: true });
};

// esbuild's object-spread helper (for `{...x, prop}`) calls
// Object.getOwnPropertyDescriptors, which is ES2017 / Firefox 50 — missing on
// Gecko 48 (KaiOS 2.5). Define it before the bundle's helpers capture it.
const GECKO48_POLYFILL = `if(typeof Object.getOwnPropertyDescriptors!=="function"){Object.getOwnPropertyDescriptors=function(o){var d={};Object.getOwnPropertyNames(o).forEach(function(k){d[k]=Object.getOwnPropertyDescriptor(o,k)});if(Object.getOwnPropertySymbols)Object.getOwnPropertySymbols(o).forEach(function(s){d[s]=Object.getOwnPropertyDescriptor(o,s)});return d}}`;

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  // ES2015 baseline: Gecko 48 (KaiOS 2.5) supports const/let/classes natively;
  // esbuild lowers async/await to generators, which Gecko 48 also supports.
  target: ['es2015'],
  banner: { js: GECKO48_POLYFILL },
  outfile: `${outdir}/index.js`,
  minify: !serve,
  sourcemap: serve,
  define: { __DEV__: String(serve), __HA_DEV_WS__: JSON.stringify(devWsUrl) },
};

if (serve) {
  const ctx = await esbuild.context(buildOptions);
  copyStatic();
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: outdir, port: 1234 });
  console.log(`Dev server on http://${host}:${port}`);
  // Remote HTTPS HA: a desktop browser enforces cert-trust and Origin on wss://
  // that the KaiOS device doesn't. Set HA_DEV_TARGET to relay through a local
  // ws:// the browser will accept (then point the server URL at the proxy).
  if (process.env.HA_DEV_TARGET) {
    const { startWsDevProxy } = await import('./ws-dev-proxy.mjs');
    startWsDevProxy(process.env.HA_DEV_TARGET, proxyPort);
  }
} else {
  await esbuild.build(buildOptions);
  copyStatic();
  console.log('Build complete → build/');
}
