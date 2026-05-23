#!/usr/bin/env node
/**
 * Pack the plugin into a distributable .zip:
 *   <plugin-id>-<version>.zip
 *     ├── manifest.json
 *     ├── dist/main.js
 *     ├── README.md
 *     └── LICENSE
 *
 * Run AFTER `npm run build`. The output zip is what users sideload into
 * `~/.config/onda/plugins/` (after extraction) or what you upload to the
 * Onda plugin registry (see https://onda.sh — registry coming soon).
 */
import { readFileSync, existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));

if (!existsSync(join(root, 'dist', 'main.js'))) {
  console.error('dist/main.js not found. Run `npm run build` first.');
  process.exit(1);
}

const outDir = join(root, 'release');
if (!existsSync(outDir)) mkdirSync(outDir);

const zipName = `${manifest.id}-${manifest.version}.zip`;
const zipPath = join(outDir, zipName);

// Use the system `zip` binary (available on macOS and Linux). On Windows,
// swap this for `tar -a -c -f` or use a Node zip lib.
const args = ['-r', zipPath, 'manifest.json', 'dist/main.js'];
if (existsSync(join(root, 'README.md'))) args.push('README.md');
if (existsSync(join(root, 'LICENSE'))) args.push('LICENSE');

const res = spawnSync('zip', args, { cwd: root, stdio: 'inherit' });
if (res.status !== 0) {
  console.error('zip failed');
  process.exit(res.status ?? 1);
}

console.log(`\nPacked → ${zipPath}`);
