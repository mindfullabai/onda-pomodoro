# Onda Plugin Template

> Official boilerplate for building plugins for [Onda](https://onda.sh) — the AI-first terminal for macOS.

This template gives you a TypeScript-strict scaffold, a typed bridge to the Onda host API, hot-reload via symlink, and a one-command pack-to-zip pipeline.

---

## What is an Onda plugin?

An Onda plugin is a small JavaScript bundle that runs inside Onda in an isolated **Web Worker**. Plugins extend Onda by:

- registering commands in the Command Palette
- adding status bar items and side panels
- subscribing to terminal output in real time
- shelling out, making HTTP calls, reading/writing files (with explicit permission)
- shipping custom themes, keybindings, and context-menu actions

Plugins live at `~/.config/onda/plugins/<plugin-id>/` and consist of a `manifest.json` plus a bundled `main.js`. Onda loads them lazily on activation events you declare in the manifest.

See the canonical capability reference in the Onda repo (`onda-plugins/README.md`) or the inline JSDoc in [`types/onda.d.ts`](./types/onda.d.ts).

---

## Quickstart

### 1. Create your repo from this template

```bash
# Using GitHub CLI
gh repo create my-onda-plugin --template mindfullabai/onda-plugin-template --public --clone
cd my-onda-plugin

# Or clone directly
git clone https://github.com/mindfullabai/onda-plugin-template.git my-onda-plugin
cd my-onda-plugin && rm -rf .git && git init
```

### 2. Personalize

- Rename the plugin in `manifest.json` (`id`, `name`, `description`, `author`).
- Update `package.json` (`name`, `author`, `homepage`).
- Edit `src/index.ts` to do whatever your plugin should do.

The plugin **`id`** in `manifest.json` should be globally unique. Reverse-DNS (`com.acme.git-status`) or namespaced (`acme.git-status`) are both fine. It becomes the directory name on the user's disk.

### 3. Install dependencies and build

```bash
npm install
npm run build
```

This produces `dist/main.js` (a single bundled IIFE Worker script).

### 4. Sideload into Onda for local development

```bash
npm run link:local
```

This creates a symlink at `~/.config/onda/plugins/<your-plugin-id>` pointing to this repo. Open **Onda → Settings (⌘,) → Plugins**, enable your plugin, then **⌘R** to reload after each rebuild.

For watch mode:

```bash
npm run dev
```

### 5. Pack a release `.zip`

```bash
npm run pack
# → release/<plugin-id>-<version>.zip
```

The zip contains `manifest.json`, `dist/main.js`, `README.md`, and `LICENSE`. Users can extract it into `~/.config/onda/plugins/`, or you can submit it to the Onda plugin registry (see [Publishing](#publishing)).

---

## Project structure

```
.
├── manifest.json              # Plugin metadata, capabilities, contributions
├── package.json
├── tsconfig.json              # strict TS, ES2022, WebWorker lib
├── tsup.config.ts             # IIFE bundle, browser target, single file
├── src/
│   └── index.ts               # Plugin entry — assigns self.__ondaPlugin
├── types/
│   └── onda.d.ts              # Hand-written types for the onda.* bridge
├── scripts/
│   ├── link-local.mjs         # Symlink into ~/.config/onda/plugins
│   └── pack.mjs               # Build zip artifact for distribution
├── examples/
│   ├── hello-world/           # Minimal command + notification
│   └── git-status-banner/     # Statusbar item, exec, periodic poll
└── .github/workflows/build.yml
```

---

## The plugin contract

Onda discovers your plugin via a global assignment, **not** an ES module export:

```ts
self.__ondaPlugin = {
  async onActivate(onda) {
    // onda.* is the bridge — see types/onda.d.ts
  },
  async onDeactivate() { /* optional cleanup */ }
};
```

The bundler (`tsup`) is configured to emit a single classic-script IIFE because Onda loads `main.js` as a **classic Worker**, not an ES module Worker. Don't switch to `format: 'esm'` unless you know the host build has been updated to use `new Worker(url, { type: 'module' })`.

### Capabilities are an allow-list

Every `onda.foo.bar()` call you make is gated by the `capabilities` array in `manifest.json`. Calling `onda.exec.run(...)` without `"exec"` in the capability list throws at the bridge level. Add capabilities as you need them and document _why_ in the manifest so users can grant trust intentionally.

| Capability             | What it unlocks                                      |
|------------------------|------------------------------------------------------|
| `commands`             | Command Palette entries                              |
| `keybindings`          | Global / focus-gated keyboard shortcuts              |
| `statusbar`            | Status bar items (left/right)                        |
| `panel`                | Side panels with HTML content                        |
| `notifications`        | Toast notifications                                  |
| `contextmenu`          | File panel / terminal right-click items              |
| `storage`              | Persistent key-value store, namespaced per plugin    |
| `themes`               | Register custom color themes                         |
| `terminal:read`        | Read full terminal buffer                            |
| `terminal:write`       | Inject keystrokes into terminals                     |
| `terminal:subscribe`   | Real-time output events with optional regex filters  |
| `dialog`               | Modal dialogs with input fields                      |
| `clipboard`            | Read/write system clipboard                          |
| `filesystem:read`      | Read files                                           |
| `filesystem:write`     | Write files                                          |
| `http`                 | Outbound HTTP (use `httpDomains` to scope)           |
| `exec`                 | Run shell commands (use `execPatterns` to scope)     |

### Activation events

```jsonc
{
  "activationEvents": [
    "onStartup",                    // lazy boot after UI mount (default)
    "onCommand:my-plugin.do-thing", // only when user runs the command
    "onView:my-plugin.panel",       // only when panel becomes visible
    "*"                             // eager boot — use sparingly
  ]
}
```

---

## Hook reference (quick examples)

### Command

```ts
onda.commands.register('acme.hello', {
  title: 'Say Hello',
  category: 'Acme',
  handler: async () => {
    onda.notifications.show({ type: 'success', message: 'Hello!' });
  },
});
```

### Terminal output subscription

```ts
// manifest.json: capabilities += ["terminal:subscribe"]
const sub = await onda.terminal.subscribe({
  terminalId: 'active',
  patterns: ['ERROR', 'WARN'],
});
onda.on('terminal:output', (e) => {
  if (e.data.includes('ERROR')) {
    onda.notifications.show({ type: 'error', message: 'Build error detected' });
  }
});
```

### Status bar + panel

```ts
await onda.statusBar.addItem({
  id: 'acme-status',
  text: 'Acme',
  icon: 'wrench',
  position: 'right',
  onClick: 'acme.toggle-panel',
});

await onda.panel.register({
  id: 'acme-panel',
  title: 'Acme',
  position: 'right',
  width: 320,
});
await onda.panel.setContent('acme-panel', '<div style="padding:16px;color:#eee">Hello</div>');

onda.commands.register('acme.toggle-panel', {
  title: 'Toggle Acme Panel',
  handler: () => onda.panel.toggle('acme-panel'),
});
```

### Shell exec

```ts
// manifest.json: capabilities += ["exec"]
const { stdout, code } = await onda.exec.run('git status --porcelain');
if (code === 0 && stdout.trim() === '') {
  onda.notifications.show({ message: 'Working tree clean' });
}
```

See the [`examples/`](./examples) directory for full plugins you can copy.

---

## Publishing

The Onda plugin registry at <https://onda.sh/publish> is **coming soon** (tracked in Onda's roadmap as P4.11). Until then:

1. Run `npm run pack` to produce `release/<id>-<version>.zip`.
2. Distribute via GitHub Releases — the workflow in [`.github/workflows/build.yml`](.github/workflows/build.yml) builds and attaches the zip automatically on every push and tag.
3. Users install by extracting the zip into `~/.config/onda/plugins/`.

When the registry launches, you'll submit by signing in with GitHub and pointing at a release tag — no rebuild required.

---

## TypeScript notes

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` are all on.
- The `types/onda.d.ts` file is hand-maintained against the Onda 1.x bridge. If your build of Onda exposes new APIs, extend the file locally and consider opening a PR upstream.
- Don't import from `'../types/onda'` at runtime — they're type-only. Use `import type`.

## Troubleshooting

- **"Plugin failed to activate"**: open Onda DevTools (⌘⌥I) and check the Console — Worker errors include stack traces, prefixed with `[PluginWorker]`.
- **"Capability denied"**: add the capability to `manifest.json` and reload.
- **Changes don't show up**: did you `npm run build`? did you ⌘R the renderer? did you restart Onda after editing `manifest.json` (manifest changes require a full restart, code changes don't).
- **`self is not defined` in tests**: tests run in Node, not a Worker. Mock `self.__ondaPlugin` or run unit tests against pure functions extracted from the entry.

## License

MIT — see [LICENSE](./LICENSE).
