import { AppConfig } from './types';

export const CONFIG_KEY = 'kaios-ha.config';
export const CONFIG_VERSION = 1;

export const DEFAULT_CONFIG: AppConfig = {
  version: CONFIG_VERSION,
  activeServerId: null,
  servers: [],
  settings: { theme: 'dark' },
};

export function migrate(raw: unknown): AppConfig {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_CONFIG };
  const r = raw as Partial<AppConfig>;
  // localStorage is untrusted (corruptible / hand-editable) — coerce field types
  // so later code can safely assume servers.map(...), activeServerId as string|null.
  return {
    version: CONFIG_VERSION,
    activeServerId: typeof r.activeServerId === 'string' ? r.activeServerId : null,
    servers: Array.isArray(r.servers) ? r.servers : [],
    settings: { ...DEFAULT_CONFIG.settings, ...(r.settings && typeof r.settings === 'object' ? r.settings : {}) },
  };
}

export function loadConfig(): AppConfig {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (raw === null) return { ...DEFAULT_CONFIG };
  try {
    return migrate(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
