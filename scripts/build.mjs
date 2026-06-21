import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const outdir = 'build';

// Dev-only: route the app's WebSocket through a local proxy (see
// ws-dev-proxy.mjs) so a desktop browser can reach a remote HTTPS HA whose
// cert/Origin it would otherwise reject. The app keeps its configured server
// URL + token; socket.ts just tunnels through this origin (?target=<real url>).
const proxyPort = Number(process.env.HA_DEV_PROXY_PORT) || 8765;
const devProxyOrigin = serve ? `ws://localhost:${proxyPort}` : '';

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
  define: { __DEV__: String(serve), __HA_DEV_PROXY__: JSON.stringify(devProxyOrigin) },
};

if (serve) {
  const ctx = await esbuild.context(buildOptions);
  copyStatic();
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: outdir, port: 1234 });
  console.log(`Dev server on http://${host}:${port}`);
  const { startWsDevProxy } = await import('./ws-dev-proxy.mjs');
  startWsDevProxy(proxyPort);
} else {
  await esbuild.build(buildOptions);
  copyStatic();
  console.log('Build complete → build/');
}
