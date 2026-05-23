/**
 * Ambient typings for the `onda` bridge object that the Onda host injects
 * into your plugin Worker via `onActivate(onda)`.
 *
 * These types are hand-written against the Onda 1.x plugin API (see
 * onda-plugins/README.md in the Onda repo). They are intentionally
 * permissive where the host runtime accepts loose shapes — open a PR
 * against this template if your Onda build exposes more.
 */

declare global {
  // The Worker entry point that Onda will look for after loading main.js.
  // Onda calls `self.__ondaPlugin.onActivate(onda)` after the Worker boots.
  // eslint-disable-next-line no-var
  var __ondaPlugin: OndaPluginEntry | undefined;
}

export {};

export interface OndaPluginEntry {
  onActivate: (onda: OndaAPI) => void | Promise<void>;
  onDeactivate?: () => void | Promise<void>;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface OndaCommands {
  register(
    id: string,
    options: {
      title: string;
      category?: string;
      handler: (args?: unknown) => unknown | Promise<unknown>;
    }
  ): void;
  execute(id: string, args?: unknown[]): Promise<unknown>;
}

export interface OndaNotifications {
  show(opts: { type?: NotificationType; title?: string; message: string }): void;
}

export interface OndaStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface OndaTerminal {
  write(data: string | { terminalId: string; data: string }): Promise<void>;
  read(opts?: { terminalId?: string }): Promise<{ content: string }>;
  getLastLines(n: number, opts?: { terminalId?: string }): Promise<{ content: string }>;
  subscribe(opts: {
    terminalId?: 'active' | string;
    patterns?: string[];
  }): Promise<{ subscriptionId: string }>;
  unsubscribe(opts: { subscriptionId: string }): Promise<void>;
}

export interface OndaExec {
  run(cmd: string, cwd?: string): Promise<{ stdout: string; stderr: string; code: number }>;
}

export interface OndaHttp {
  fetch(
    url: string,
    init?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<{ status: number; data: unknown; headers: Record<string, string> }>;
}

export interface OndaFilesystem {
  readFile(path: string): Promise<{ content: string; error?: string }>;
  writeFile(path: string, content: string): Promise<{ error?: string }>;
  readDir(
    path: string
  ): Promise<{ entries: Array<{ name: string; path: string; is_dir: boolean; is_hidden: boolean }> }>;
}

export interface OndaClipboard {
  read(): Promise<{ text: string }>;
  write(text: string): Promise<void>;
}

export interface OndaStatusBar {
  addItem(item: {
    id: string;
    text: string;
    icon?: string;
    tooltip?: string;
    position?: 'left' | 'right';
    onClick?: string; // command id
  }): Promise<void>;
  updateItem(id: string, patch: Partial<{ text: string; icon: string; tooltip: string }>): Promise<void>;
  removeItem(id: string): Promise<void>;
}

export interface OndaPanel {
  register(opts: {
    id: string;
    title: string;
    icon?: string;
    position?: 'left' | 'right';
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    resizable?: boolean;
  }): Promise<void>;
  setContent(id: string, html: string): Promise<void>;
  show(id: string): Promise<void>;
  hide(id: string): Promise<void>;
  toggle(id: string): Promise<void>;
}

export interface OndaDialog {
  show(opts: {
    title?: string;
    message?: string;
    fields?: Array<{
      id: string;
      label: string;
      type: 'text' | 'password' | 'textarea' | 'number' | 'checkbox';
      defaultValue?: string | number | boolean;
      required?: boolean;
    }>;
    buttons?: Array<{ id: string; label: string; variant?: 'primary' | 'secondary' | 'danger' }>;
  }): Promise<{ cancelled: boolean; buttonId?: string; values?: Record<string, unknown> }>;
  alert(opts: { title?: string; message: string }): Promise<void>;
  confirm(opts: { title?: string; message: string }): Promise<{ confirmed: boolean }>;
}

export interface OndaContextMenu {
  register(
    context: 'file-panel' | 'terminal',
    item: { id: string; label: string; icon?: string; command: string }
  ): Promise<void>;
  unregister(id: string): Promise<void>;
}

export interface OndaAPI {
  commands: OndaCommands;
  notifications: OndaNotifications;
  storage: OndaStorage;
  terminal: OndaTerminal;
  exec: OndaExec;
  http: OndaHttp;
  filesystem: OndaFilesystem;
  clipboard: OndaClipboard;
  statusBar: OndaStatusBar;
  panel: OndaPanel;
  dialog: OndaDialog;
  contextMenu: OndaContextMenu;
  on(event: 'terminal:output', handler: (e: TerminalOutputEvent) => void): void;
  on(event: string, handler: (e: unknown) => void): void;
  off(event: string, handler: (e: unknown) => void): void;
}

export interface TerminalOutputEvent {
  terminalId: string;
  data: string;
  timestamp: number;
}
