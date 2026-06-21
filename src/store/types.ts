export interface TileConfig {
  entityId: string;
  name: string | null;
  icon: string | null;
}

export interface PageConfig {
  id: string;
  name: string;
  tiles: TileConfig[];
}

export interface ServerConfig {
  id: string;
  name: string;
  baseUrl: string;
  token: string;
  pages: PageConfig[];
}

export interface AppSettings {
  theme: string;
}

export interface AppConfig {
  version: number;
  activeServerId: string | null;
  servers: ServerConfig[];
  settings: AppSettings;
}
