import { AppConfig, ServerConfig, TileConfig, PageConfig } from './types';

export function upsertServer(config: AppConfig, server: ServerConfig): AppConfig {
  const exists = config.servers.some((s) => s.id === server.id);
  const servers = exists
    ? config.servers.map((s) => (s.id === server.id ? server : s))
    : [...config.servers, server];
  const activeServerId = config.activeServerId ?? server.id;
  return { ...config, servers, activeServerId };
}

export function removeServer(config: AppConfig, id: string): AppConfig {
  const servers = config.servers.filter((s) => s.id !== id);
  const activeServerId = config.activeServerId === id ? (servers[0]?.id ?? null) : config.activeServerId;
  return { ...config, servers, activeServerId };
}

export function setActiveServer(config: AppConfig, id: string): AppConfig {
  return { ...config, activeServerId: id };
}

export function setPageTiles(config: AppConfig, serverId: string, pageId: string, tiles: TileConfig[]): AppConfig {
  const servers = config.servers.map((s) =>
    s.id !== serverId ? s : { ...s, pages: s.pages.map((p) => (p.id === pageId ? { ...p, tiles } : p)) },
  );
  return { ...config, servers };
}

export function firstPageWithTiles(config: AppConfig): { server: ServerConfig; page: PageConfig } | null {
  const server = config.servers.find((s) => s.id === config.activeServerId);
  const page = server?.pages.find((p) => p.tiles.length > 0);
  return server && page ? { server, page } : null;
}
