/**
 * Onda Pomodoro — focus timer plugin.
 *
 * 25/5 minute work-break cycles with status-bar countdown and native
 * notifications. State machine is deliberately simple: idle | work | break,
 * with an optional `paused` slot that freezes remainingMs.
 *
 * The host loads this file as a classic Web Worker script. After boot,
 * Onda calls `self.__ondaPlugin.onActivate(onda)`.
 */

import type { OndaAPI, OndaPluginEntry } from '../types/onda';

const PLUGIN_ID = 'sh.onda.pomodoro';
const STATUS_ITEM_ID = `${PLUGIN_ID}.indicator`;

// it: chiavi storage. Le settings sono persistite cosi' che sopravvivano al reload.
const STORAGE_KEYS = {
  workDuration: 'settings.workDuration',
  breakDuration: 'settings.breakDuration',
  enableNotifications: 'settings.enableNotifications',
} as const;

const DEFAULTS = {
  workDuration: 25,
  breakDuration: 5,
  enableNotifications: true,
} as const;

// it: state machine semplice. `endsAt` e' epoch ms; quando paused, ci aggiungiamo
// remainingMs e fermiamo il ticker.
type State =
  | { kind: 'idle' }
  | { kind: 'work'; endsAt: number; paused: { remainingMs: number } | null }
  | { kind: 'break'; endsAt: number; paused: { remainingMs: number } | null };

let state: State = { kind: 'idle' };
let tickerId: ReturnType<typeof setInterval> | null = null;
let ondaRef: OndaAPI | null = null;

let settings: { workDuration: number; breakDuration: number; enableNotifications: boolean } = {
  ...DEFAULTS,
};

const plugin: OndaPluginEntry = {
  async onActivate(onda) {
    ondaRef = onda;
    log('Activated');

    // it: 1. carica settings da storage (fallback ai default)
    await loadSettings(onda);

    // it: 2. registra status-bar item (start vuoto/idle). Il click va al comando
    // toggle che decide cosa fare in base allo state corrente.
    await onda.statusBar.addItem({
      id: STATUS_ITEM_ID,
      text: idleText(),
      tooltip: 'Pomodoro — click to start',
      position: 'right',
      onClick: `${PLUGIN_ID}.toggle`,
    });

    // it: 3. registra i comandi
    onda.commands.register(`${PLUGIN_ID}.start`, {
      title: 'Start',
      category: 'Pomodoro',
      handler: () => cmdStart(),
    });
    onda.commands.register(`${PLUGIN_ID}.pause`, {
      title: 'Pause/Resume',
      category: 'Pomodoro',
      handler: () => cmdPauseResume(),
    });
    onda.commands.register(`${PLUGIN_ID}.reset`, {
      title: 'Reset',
      category: 'Pomodoro',
      handler: () => cmdReset(),
    });
    onda.commands.register(`${PLUGIN_ID}.skipBreak`, {
      title: 'Skip Break',
      category: 'Pomodoro',
      handler: () => cmdSkipBreak(),
    });
    onda.commands.register(`${PLUGIN_ID}.stop`, {
      title: 'Stop',
      category: 'Pomodoro',
      handler: () => cmdStop(),
    });
    // it: comando interno per click su status-bar (smart-toggle)
    onda.commands.register(`${PLUGIN_ID}.toggle`, {
      title: 'Toggle (status-bar click)',
      category: 'Pomodoro',
      handler: () => cmdToggle(),
    });
  },

  async onDeactivate() {
    stopTicker();
    if (ondaRef) {
      try {
        await ondaRef.statusBar.removeItem(STATUS_ITEM_ID);
      } catch {
        // it: best-effort cleanup
      }
    }
    ondaRef = null;
    log('Deactivated');
  },
};

// ============================================================================
// Commands
// ============================================================================

async function cmdStart() {
  // it: se gia' in work/break attivo, no-op. Se idle, parte work.
  if (state.kind !== 'idle') {
    notify('info', 'Pomodoro already running', 'Use Reset to cancel.');
    return;
  }
  startWork();
}

async function cmdPauseResume() {
  if (state.kind === 'idle') {
    notify('info', 'Nothing to pause', 'Start a Pomodoro first.');
    return;
  }
  if (state.paused) {
    // it: resume — ricalcola endsAt da remainingMs
    const remainingMs = state.paused.remainingMs;
    state = { ...state, endsAt: Date.now() + remainingMs, paused: null };
    startTicker();
    render();
  } else {
    // it: pause — congela remainingMs
    const remainingMs = Math.max(0, state.endsAt - Date.now());
    state = { ...state, paused: { remainingMs } };
    stopTicker();
    render();
  }
}

async function cmdReset() {
  stopTicker();
  state = { kind: 'idle' };
  render();
}

async function cmdSkipBreak() {
  if (state.kind !== 'break') {
    notify('info', 'Not on a break', 'Skip Break only works during a break.');
    return;
  }
  stopTicker();
  state = { kind: 'idle' };
  render();
  notify('info', 'Break skipped', 'Ready for another focus sprint?');
}

async function cmdStop() {
  // it: come reset ma con notifica esplicita user-initiated.
  stopTicker();
  state = { kind: 'idle' };
  render();
  notify('info', 'Pomodoro stopped.', 'Timer cleared. Start a new sprint when ready.');
}

async function cmdToggle() {
  // it: smart-toggle invocato dal click sulla status-bar. Sostituisce il
  // comando piu' ovvio per lo state corrente.
  if (state.kind === 'idle') {
    startWork();
    return;
  }
  if (state.paused) {
    // it: paused (work o break) → resume
    await cmdPauseResume();
    return;
  }
  if (state.kind === 'work') {
    // it: work running → pause
    await cmdPauseResume();
    return;
  }
  // it: break running → skip
  await cmdSkipBreak();
}

// ============================================================================
// State transitions
// ============================================================================

function startWork() {
  const durationMs = settings.workDuration * 60 * 1000;
  state = { kind: 'work', endsAt: Date.now() + durationMs, paused: null };
  startTicker();
  render();
}

function startBreak() {
  const durationMs = settings.breakDuration * 60 * 1000;
  state = { kind: 'break', endsAt: Date.now() + durationMs, paused: null };
  startTicker();
  render();
}

function onTick() {
  if (state.kind === 'idle' || state.paused) return;
  const remainingMs = state.endsAt - Date.now();
  if (remainingMs <= 0) {
    // it: transizione: work -> break -> idle
    if (state.kind === 'work') {
      notify('success', 'Work session complete!', 'Take a 5-minute break.');
      startBreak();
    } else {
      notify('success', "Break's over", 'Ready for another focus sprint?');
      stopTicker();
      state = { kind: 'idle' };
      render();
    }
    return;
  }
  render();
}

function startTicker() {
  stopTicker();
  // it: tick ogni secondo. setInterval e' disponibile nel Worker scope.
  tickerId = setInterval(onTick, 1000);
}

function stopTicker() {
  if (tickerId !== null) {
    clearInterval(tickerId);
    tickerId = null;
  }
}

// ============================================================================
// Rendering (status-bar)
// ============================================================================

function render() {
  if (!ondaRef) return;
  const text = computeText();
  const tooltip = computeTooltip();
  ondaRef.statusBar.updateItem(STATUS_ITEM_ID, { text, tooltip }).catch(() => {
    // it: ignora errori di update (status-bar potrebbe non essere pronta)
  });
}

function computeText(): string {
  if (state.kind === 'idle') return idleText();
  const remainingMs = state.paused
    ? state.paused.remainingMs
    : Math.max(0, state.endsAt - Date.now());
  const mmss = formatMMSS(remainingMs);
  const icon = state.kind === 'work' ? '🍅' : '☕';
  const suffix = state.paused ? ' ⏸' : '';
  return `${icon} ${mmss}${suffix}`;
}

function computeTooltip(): string {
  if (state.kind === 'idle') return 'Pomodoro — click to start';
  if (state.paused) return `Pomodoro (paused) — ${state.kind} session`;
  return `Pomodoro — ${state.kind} session in progress`;
}

function idleText(): string {
  return '🍅 --:--';
}

function formatMMSS(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ============================================================================
// Notifications + settings
// ============================================================================

function notify(type: 'success' | 'info' | 'error' | 'warning', title: string, message: string) {
  if (!settings.enableNotifications) return;
  if (!ondaRef) return;
  ondaRef.notifications.show({ type, title, message });
}

async function loadSettings(onda: OndaAPI) {
  // it: leggi da storage con fallback ai default. min/max enforcement.
  const work = await onda.storage.get<number>(STORAGE_KEYS.workDuration);
  const brk = await onda.storage.get<number>(STORAGE_KEYS.breakDuration);
  const notif = await onda.storage.get<boolean>(STORAGE_KEYS.enableNotifications);

  settings.workDuration = clamp(toNumber(work, DEFAULTS.workDuration), 1, 90);
  settings.breakDuration = clamp(toNumber(brk, DEFAULTS.breakDuration), 1, 30);
  settings.enableNotifications = typeof notif === 'boolean' ? notif : DEFAULTS.enableNotifications;
}

function toNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// ============================================================================
// Boot
// ============================================================================

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`[${PLUGIN_ID}]`, ...args);
}

self.__ondaPlugin = plugin;
