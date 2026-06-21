import { describe, it, expect } from 'vitest';
import { upsertServer, removeServer, setActiveServer, setPageTiles, firstPageWithTiles } from './config-ops';
import { AppConfig, ServerConfig } from './types';

const base: AppConfig = { version: 1, activeServerId: null, servers: [], settings: { theme: 'dark' } };
const srv = (id: string): ServerConfig => ({ id, name: id, baseUrl: 'http://h', token: 't', pages: [{ id: 'p1', name: 'Home', tiles: [] }] });

describe('config-ops', () => {
  it('upsertServer appends and makes the first server active', () => {
    const c = upsertServer(base, srv('s1'));
    expect(c.servers).toHaveLength(1);
    expect(c.activeServerId).toBe('s1');
    expect(base.servers).toHaveLength(0); // input untouched
  });

  it('upsertServer replaces an existing server by id without changing active', () => {
    const c1 = upsertServer(base, srv('s1'));
    const c2 = upsertServer(upsertServer(c1, srv('s2')), { ...srv('s1'), name: 'Renamed' });
    expect(c2.servers).toHaveLength(2);
    expect(c2.servers.find((s) => s.id === 's1')!.name).toBe('Renamed');
    expect(c2.activeServerId).toBe('s1');
  });

  it('removeServer drops it and reassigns active', () => {
    const c = upsertServer(upsertServer(base, srv('s1')), srv('s2'));
    const r = removeServer(c, 's1');
    expect(r.servers.map((s) => s.id)).toEqual(['s2']);
    expect(r.activeServerId).toBe('s2');
    expect(removeServer(r, 's2').activeServerId).toBeNull();
  });

  it('setActiveServer switches the active id', () => {
    const c = upsertServer(upsertServer(base, srv('s1')), srv('s2'));
    expect(setActiveServer(c, 's2').activeServerId).toBe('s2');
  });

  it('setPageTiles replaces tiles on the target page', () => {
    const c = upsertServer(base, srv('s1'));
    const tiles = [{ entityId: 'light.a', name: null, icon: null }];
    const r = setPageTiles(c, 's1', 'p1', tiles);
    expect(r.servers[0].pages[0].tiles).toEqual(tiles);
    expect(c.servers[0].pages[0].tiles).toEqual([]); // input untouched
  });

  it('firstPageWithTiles returns the active server page with tiles, else null', () => {
    const empty = upsertServer(base, srv('s1'));
    expect(firstPageWithTiles(empty)).toBeNull();
    const filled = setPageTiles(empty, 's1', 'p1', [{ entityId: 'light.a', name: null, icon: null }]);
    expect(firstPageWithTiles(filled)!.page.id).toBe('p1');
  });
});
