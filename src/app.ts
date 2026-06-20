import { loadConfig, saveConfig } from './store/config';
import { upsertServer, setActiveServer, setPageTiles, firstPageWithTiles } from './store/config-ops';
import { StateCache } from './store/state';
import { HaClient } from './ha/client';
import { fetchLovelaceEntityIds } from './ha/lovelace';
import { createStack } from './nav/stack';
import { createDashboard } from './screens/dashboard';
import { createDetail } from './screens/detail';
import { createServerForm } from './screens/server-form';
import { createPicker } from './screens/picker';
import { createSettings } from './screens/settings';
import { ServerConfig } from './store/types';

export function startApp(root: HTMLElement): void {
  let config = loadConfig();
  const stack = createStack(root);

  const activeServer = (): ServerConfig | undefined => config.servers.find((s) => s.id === config.activeServerId);

  const openPicker = (server: ServerConfig) => {
    const page = server.pages[0];
    stack.push(createPicker({
      client: new HaClient({ baseUrl: server.baseUrl, token: server.token }),
      initial: page.tiles,
      fetchLovelace: () => fetchLovelaceEntityIds({ baseUrl: server.baseUrl, token: server.token }),
      onDone: (tiles) => { config = setPageTiles(config, server.id, page.id, tiles); saveConfig(config); showDashboard(); },
      onCancel: () => showDashboard(),
    }));
  };

  const serverFormScreen = (existing: ServerConfig | null) =>
    createServerForm({
      existing,
      onSave: (server) => { config = upsertServer(config, server); saveConfig(config); openPicker(server); },
      onCancel: () => showDashboard(),
    });

  const openServerForm = (existing: ServerConfig | null) => stack.push(serverFormScreen(existing));

  const openSettings = () => {
    stack.push(createSettings({
      config,
      onAddServer: () => openServerForm(null),
      onEditEntities: () => { const s = activeServer(); if (s) openPicker(s); },
      onSetActive: (id) => { config = setActiveServer(config, id); saveConfig(config); showDashboard(); },
      onClose: () => stack.pop(),
    }));
  };

  function showDashboard(): void {
    const found = firstPageWithTiles(config);
    if (found) {
      const cache = new StateCache();
      const client = new HaClient({ baseUrl: found.server.baseUrl, token: found.server.token });
      stack.reset(createDashboard({
        client, cache, page: found.page, serverName: found.server.name, intervalMs: config.settings.pollIntervalMs,
        onOpenDetail: (tile) => stack.push(createDetail({ client, cache, tile })),
        onMenu: openSettings,
      }));
      return;
    }
    const s = activeServer();
    if (s) openPicker(s);
    else stack.reset(serverFormScreen(null));
  }

  showDashboard();
}
