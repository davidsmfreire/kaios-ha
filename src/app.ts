import { loadConfig, saveConfig } from './store/config';
import { upsertServer, setActiveServer, setPageTiles, firstPageWithTiles } from './store/config-ops';
import { StateCache } from './store/state';
import { createHaSocket, HaSocket } from './ha/socket';
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
  let cache = new StateCache();
  let socket: HaSocket | null = null;
  let socketServerId: string | null = null;

  const useServer = (server: ServerConfig): HaSocket => {
    if (socket && socketServerId === server.id) return socket;
    socket?.close();
    cache = new StateCache();
    socket = createHaSocket({ baseUrl: server.baseUrl, token: server.token, cache });
    socket.start();
    socketServerId = server.id;
    return socket;
  };

  const activeServer = () => config.servers.find((s) => s.id === config.activeServerId);

  const openPicker = (server: ServerConfig) => {
    const s = useServer(server);
    const page = server.pages[0];
    stack.push(createPicker({
      socket: s,
      initial: page.tiles,
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
      const s = useServer(found.server);
      stack.reset(createDashboard({
        socket: s, cache, page: found.page, serverName: found.server.name,
        onOpenDetail: (tile) => stack.push(createDetail({ socket: s, cache, tile, onBack: () => stack.pop() })),
        onMenu: openSettings,
      }));
      return;
    }
    const sv = activeServer();
    if (sv) openPicker(sv);
    else stack.reset(serverFormScreen(null));
  }

  showDashboard();
}
