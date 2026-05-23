#!/usr/bin/env node
/**
 * Symlink this plugin into Onda's plugins directory for live development.
 *
 *   ~/.config/onda/plugins/<plugin-id>  →  <this repo>
 *
 * After linking, build once with `npm run build` (or `npm run dev` to watch),
 * then enable the plugin in Onda → Settings → Plugins. Reload the renderer
 * (Cmd+R) after each rebuild to pick up changes.
 */
import { readFileSync, existsSync, symlinkSync, unlinkSync, mkdirSync, lstatSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const target = join(homedir(), '.config', 'onda', 'plugins', manifest.id);

mkdirSync(join(homedir(), '.config', 'onda', 'plugins'), { recursive: true });

if (existsSync(target) || isSymlink(target)) {
  unlinkSync(target);
  console.log(`Removed existing: ${target}`);
}

symlinkSync(root, target, 'dir');
console.log(`Linked ${target} → ${root}`);
console.log('\nNext steps:');
console.log('  1. npm run build      # or `npm run dev` to watch');
console.log('  2. Open Onda → Settings → Plugins → enable your plugin');
console.log('  3. Cmd+R to reload the renderer after rebuilds');

function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}
