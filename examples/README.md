# Examples

Drop-in plugins you can sideload directly (they ship with a pre-bundled `main.js`, no build step required).

| Example | What it shows |
|---|---|
| [`hello-world/`](./hello-world) | The smallest meaningful plugin: one command + one notification |
| [`git-status-banner/`](./git-status-banner) | Status bar item, `exec` capability, periodic polling |

## Try one

```bash
ln -s "$PWD/examples/hello-world" ~/.config/onda/plugins/example.hello-world
# Open Onda → Settings → Plugins → enable "Hello World"
# Open Command Palette (⌘K) → "Hello World: Greet"
```
