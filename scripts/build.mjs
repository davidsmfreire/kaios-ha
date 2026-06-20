import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const outdir = 'build';

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
};

if (serve) {
  const ctx = await esbuild.context(buildOptions);
  copyStatic();
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: outdir, port: 1234 });
  console.log(`Dev server on http://${host}:${port}`);
} else {
  await esbuild.build(buildOptions);
  copyStatic();
  console.log('Build complete → build/');
}
