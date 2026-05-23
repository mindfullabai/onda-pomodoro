/**
 * Onda Plugin — entry point.
 *
 * The host loads this file as a classic Web Worker script. After boot,
 * Onda calls `self.__ondaPlugin.onActivate(onda)` where `onda` is the
 * bridge object documented in `types/onda.d.ts`.
 *
 * Replace this scaffold with your plugin logic. Every capability you use
 * (commands, terminal:read, http, ...) MUST also be declared in
 * `manifest.json` or the bridge will reject the call at runtime.
 */

import type { OndaAPI, OndaPluginEntry } from '../types/onda';

const PLUGIN_ID = 'your-org.your-plugin-id';

const plugin: OndaPluginEntry = {
  async onActivate(onda: OndaAPI) {
    log('Activated');

    // Example: register a command surfaced in the Command Palette.
    onda.commands.register(`${PLUGIN_ID}.hello`, {
      title: 'Say Hello',
      category: 'Your Plugin',
      handler: async () => {
        const name = (await onda.storage.get<string>('name')) ?? 'world';
        onda.notifications.show({
          type: 'success',
          title: 'Hello',
          message: `Hello, ${name}!`,
        });
      },
    });

    // Example hook: react to terminal output. Requires "terminal:subscribe"
    // capability in manifest.json — leave it out if you don't need it.
    //
    // const sub = await onda.terminal.subscribe({ terminalId: 'active' });
    // onda.on('terminal:output', (e) => {
    //   if (e.data.includes('ERROR')) {
    //     onda.notifications.show({ type: 'error', message: 'Error in terminal' });
    //   }
    // });
  },

  async onDeactivate() {
    log('Deactivated');
  },
};

function log(...args: unknown[]) {
  // Prefix logs so they're easy to spot in the Onda DevTools console.
  // eslint-disable-next-line no-console
  console.log(`[${PLUGIN_ID}]`, ...args);
}

// Onda discovers the plugin via this global, NOT via ES module export.
self.__ondaPlugin = plugin;
