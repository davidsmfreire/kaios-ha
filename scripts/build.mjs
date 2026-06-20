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

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  // ES2015 baseline: Gecko 48 (KaiOS 2.5) supports const/let/classes natively;
  // esbuild lowers async/await to generators, which Gecko 48 also supports.
  target: ['es2015'],
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
