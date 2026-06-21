import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, saveConfig, DEFAULT_CONFIG, CONFIG_KEY, CONFIG_VERSION } from './config';

describe('config persistence', () => {
  beforeEach(() => localStorage.clear());

  it('returns default config when nothing stored', () => {
    const cfg = loadConfig();
    expect(cfg.version).toBe(CONFIG_VERSION);
    expect(cfg.servers).toEqual([]);
    expect(cfg.activeServerId).toBeNull();
    expect(cfg.settings.theme).toBe('dark');
  });

  it('round-trips a saved config', () => {
    const cfg = { ...DEFAULT_CONFIG, activeServerId: 'srv_1', servers: [
      { id: 'srv_1', name: 'Cabin', baseUrl: 'http://ha.local:8123', token: 't', pages: [] },
    ]};
    saveConfig(cfg);
    expect(loadConfig()).toEqual(cfg);
  });

  it('falls back to default on corrupt JSON', () => {
    localStorage.setItem(CONFIG_KEY, '{not json');
    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('migrates a versionless blob by adding version and settings (add-only)', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ activeServerId: null, servers: [] }));
    const cfg = loadConfig();
    expect(cfg.version).toBe(CONFIG_VERSION);
    expect(cfg.settings.theme).toBe('dark');
    expect(cfg.servers).toEqual([]);
  });

  it('coerces corrupt field types from a tampered blob', () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ activeServerId: 42, servers: 'oops', settings: 'nope' }));
    const cfg = loadConfig();
    expect(cfg.servers).toEqual([]); // non-array coerced
    expect(cfg.activeServerId).toBeNull(); // non-string coerced
    expect(cfg.settings.theme).toBe('dark'); // non-object settings ignored, defaults kept
  });
});
