import { loadConfig } from './store/config';
import { StateCache } from './store/state';
import { HaClient } from './ha/client';
import { createDashboard } from './screens/dashboard';
import { createStack } from './nav/stack';
import { el } from './ui/dom';

export function startApp(root: HTMLElement): void {
  const config = loadConfig();
  const server = config.servers.find((s) => s.id === config.activeServerId);
  const page = server?.pages.find((p) => p.tiles.length > 0);

  if (!server || !page) {
    root.appendChild(el('div', { class: 'empty', text: 'No dashboard yet — seed config (see README).' }));
    return;
  }

  const client = new HaClient({ baseUrl: server.baseUrl, token: server.token });
  const cache = new StateCache();
  const stack = createStack(root);
  const dashboard = createDashboard({
    client, cache, page, serverName: server.name, intervalMs: config.settings.pollIntervalMs,
    onOpenDetail: () => {},
  });
  stack.push(dashboard);
}
