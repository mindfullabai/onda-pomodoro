import { defineConfig } from 'tsup';

/**
 * Onda plugins are loaded by the renderer as a **classic Web Worker** script.
 *
 * That means:
 *   - No ES module imports at runtime (the Worker is loaded as a classic script).
 *   - All code (including any deps) must be inlined into a single `main.js`.
 *   - No DOM, no `window`, no Node APIs. Only the `onda` bridge object passed
 *     to `onActivate(onda)` and standard Worker globals (`self`, `fetch`, etc.).
 */
export default defineConfig({
  entry: { main: 'src/index.ts' },
  outDir: 'dist',
  format: ['iife'],
  platform: 'browser',
  target: 'es2022',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  noExternal: [/.*/], // bundle everything — Worker can't resolve node_modules
  // it: tsup default per IIFE e' `main.global.js`. Onda manifest punta a `main.js`,
  // quindi forziamo l'estensione semplice.
  outExtension() {
    return { js: '.js' };
  },
});
