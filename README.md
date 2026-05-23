# 🍅 Onda Pomodoro

> Focus timer plugin for [Onda](https://onda.sh) — the AI-first terminal for macOS. 25/5 work-break cycles with a live status-bar countdown and native notifications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Plugin ID](https://img.shields.io/badge/plugin-sh.onda.pomodoro-blue.svg)](https://github.com/mindfullabai/onda-pomodoro)
[![Built from template](https://img.shields.io/badge/built%20from-onda--plugin--template-green.svg)](https://github.com/mindfullabai/onda-plugin-template)

## What it does

Onda Pomodoro brings the classic [Pomodoro Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) directly into your terminal. Start a focus sprint with one keystroke, watch the countdown live in the status bar, and get a gentle nudge when it's time to break — and another when it's time to get back to work.

No window switching. No external timer app. Just focus.

## Features

- 🍅 **25-minute work sprints** + ☕ **5-minute breaks** (both configurable)
- 📊 **Live status-bar countdown** — `MM:SS` with contextual icon (🍅 work / ☕ break / ⏸ paused)
- 🔔 **Native notifications** at every transition
- ⌨️ **Cmd+Shift+P** keybinding to start a sprint (macOS)
- ⏯️ **Pause / Resume / Reset / Skip Break / Stop** commands
- 🖱️ **Smart-toggle status-bar click** — click does the most-obvious action for the current state (idle→start, running→pause, paused→resume, break→skip)
- ⚙️ **Configurable durations** via persistent settings
- 🚫 **Zero dependencies** — single bundled Worker, ~5KB minified

## Install

### From the Onda marketplace _(coming soon)_

1. Open Onda
2. `⌘+Shift+P` → **Plugins: Browse Marketplace**
3. Search for **Pomodoro**, click **Install**

### Manual (developer sideload)

```bash
git clone https://github.com/mindfullabai/onda-pomodoro.git
cd onda-pomodoro
npm install
npm run build
npm run pack          # produces release/sh.onda.pomodoro-1.0.1.zip
```

Then sideload the zip into Onda via **Plugins → Install from file**, or extract it into `~/.config/onda/plugins/sh.onda.pomodoro/`.

## Usage

After installation the plugin auto-activates on Onda startup.

| Command                      | Default Key      | What it does                                  |
| ---------------------------- | ---------------- | --------------------------------------------- |
| `Pomodoro: Start`            | `⌘+Shift+P`      | Begin a 25-minute work sprint                 |
| `Pomodoro: Pause/Resume`     | —                | Freeze / resume the current timer             |
| `Pomodoro: Reset`            | —                | Cancel everything, return to idle             |
| `Pomodoro: Skip Break`       | —                | End the current break immediately             |
| `Pomodoro: Stop`             | —                | Stop the timer and notify (Reset is silent)    |

All commands are also accessible from the Command Palette (`⌘+Shift+P` after typing `Pomodoro:`). The status-bar tomato is **smart-toggle**: clicking it picks the most obvious action for the current state — start when idle, pause when working, resume when paused, skip when on break.

### Status-bar states

```
🍅 --:--      idle (click to start)
🍅 24:32      work in progress
☕ 04:15      on break
🍅 12:08 ⏸    paused
```

## Settings

Configure via Onda settings panel or by writing to the plugin's storage:

| Key                    | Type    | Default | Range  | Description                            |
| ---------------------- | ------- | ------- | ------ | -------------------------------------- |
| `workDuration`         | number  | `25`    | 1–90   | Work session length (minutes)          |
| `breakDuration`        | number  | `5`     | 1–30   | Break length (minutes)                 |
| `enableNotifications`  | boolean | `true`  | —      | Show notifications on session end      |

## Roadmap

Coming next (not in v1):

- 🔄 **Long breaks**: 15-minute break every 4 pomodoros (classic Pomodoro rule)
- 📈 **Daily counter**: persistent "today's pomodoros" badge
- 🔊 **Custom sounds** on session end
- 📊 **History panel**: weekly stats, streaks
- 🌍 **Cross-platform keybindings** (Windows/Linux when Onda ships there)

PRs welcome.

## Contributing

This plugin was built from the official [onda-plugin-template](https://github.com/mindfullabai/onda-plugin-template) — it's also the first dogfooding project for that template, so any rough edges you spot are doubly useful.

```bash
git clone https://github.com/mindfullabai/onda-pomodoro.git
cd onda-pomodoro
npm install
npm run dev    # tsup watch mode
```

Open an issue or PR on [GitHub](https://github.com/mindfullabai/onda-pomodoro).

## Changelog

### v1.0.1 — 2026-05-23
- Smart-toggle on status-bar click (idle→start, running→pause, paused→resume, break→skip)
- New "Pomodoro: Stop" command (Reset is silent, Stop notifies)

## License

[MIT](LICENSE) © Mario Mosca / Mindful Lab AI
