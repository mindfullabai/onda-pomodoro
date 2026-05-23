/**
 * Git Status Banner — adds a status bar item that shows
 *   <branch> ●        (dirty working tree)
 *   <branch> ✓        (clean working tree)
 *
 * Polls every 10s via `git` exec. Shows "no repo" outside git worktrees.
 *
 * Capabilities: statusbar, exec, commands, notifications
 */

const STATUS_ID = 'example.git-status-banner.item';
const POLL_MS = 10_000;

self.__ondaPlugin = {
  async onActivate(onda) {
    await onda.statusBar.addItem({
      id: STATUS_ID,
      text: 'git: …',
      icon: 'git-branch',
      position: 'right',
      tooltip: 'Click to refresh',
      onClick: 'example.git-status-banner.refresh',
    });

    onda.commands.register('example.git-status-banner.refresh', {
      title: 'Git Banner: Refresh',
      category: 'Git',
      handler: () => refresh(onda),
    });

    await refresh(onda);
    setInterval(() => refresh(onda).catch(() => {}), POLL_MS);
  },

  async onDeactivate() {
    // Nothing to clean up — host tears down the Worker and removes status items.
  },
};

async function refresh(onda) {
  try {
    const branch = await onda.exec.run('git rev-parse --abbrev-ref HEAD');
    if (branch.code !== 0) {
      await onda.statusBar.updateItem(STATUS_ID, { text: 'no repo', icon: 'git-branch' });
      return;
    }
    const dirty = await onda.exec.run('git status --porcelain');
    const isDirty = dirty.stdout.trim().length > 0;
    const name = branch.stdout.trim();
    await onda.statusBar.updateItem(STATUS_ID, {
      text: `${name} ${isDirty ? '●' : '✓'}`,
      icon: 'git-branch',
      tooltip: isDirty ? 'Dirty working tree' : 'Clean working tree',
    });
  } catch (err) {
    onda.notifications.show({ type: 'error', message: `git-banner: ${err.message ?? err}` });
  }
}
