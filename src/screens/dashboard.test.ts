import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDashboard } from './dashboard';
import { StateCache } from '../store/state';
import { PageConfig } from '../store/types';

const page: PageConfig = {
  id: 'p1', name: 'Home', tiles: [
    { entityId: 'light.a', name: null, icon: null },
    { entityId: 'switch.b', name: null, icon: null },
    { entityId: 'script.c', name: null, icon: null },
  ],
};

const makeClient = () => ({ getStates: vi.fn().mockResolvedValue([]), callService: vi.fn().mockResolvedValue(undefined), ping: vi.fn() });

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('dashboard', () => {
  it('renders a tile per configured entity and focuses the first', () => {
    const root = document.createElement('div');
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'light.a', state: 'on', attributes: {} }]);
    const dash = createDashboard({ root, client: makeClient() as any, cache, page, serverName: 'Cabin', intervalMs: 1000 });
    dash.mount();
    const tiles = root.querySelectorAll('.tile');
    expect(tiles).toHaveLength(3);
    expect(tiles[0].classList.contains('focus')).toBe(true);
    dash.unmount();
  });

  it('moves focus with arrow keys (2-col grid)', () => {
    const root = document.createElement('div');
    const dash = createDashboard({ root, client: makeClient() as any, cache: new StateCache(), page, serverName: 'Cabin', intervalMs: 1000 });
    dash.mount();
    dash.handleKey('right');
    expect(root.querySelectorAll('.tile')[1].classList.contains('focus')).toBe(true);
    dash.handleKey('down'); // from index 1, +2 = 3 (missing) -> clamp to 1
    expect(root.querySelectorAll('.tile')[1].classList.contains('focus')).toBe(true);
    dash.unmount();
  });

  it('OK on a light toggles optimistically and calls the service', () => {
    const root = document.createElement('div');
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'light.a', state: 'on', attributes: {} }]);
    const client = makeClient();
    const dash = createDashboard({ root, client: client as any, cache, page, serverName: 'Cabin', intervalMs: 1000 });
    dash.mount();
    dash.handleKey('ok'); // focus is light.a
    expect(cache.get('light.a')?.state).toBe('off'); // optimistic flip
    expect(client.callService).toHaveBeenCalledWith({ domain: 'light', service: 'toggle', data: { entity_id: 'light.a' } });
    dash.unmount();
  });

  it('OK on a script runs it without changing cached state', () => {
    const root = document.createElement('div');
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'script.c', state: 'off', attributes: {} }]);
    const client = makeClient();
    const dash = createDashboard({ root, client: client as any, cache, page, serverName: 'Cabin', intervalMs: 1000 });
    dash.mount();
    dash.handleKey('down'); dash.handleKey('down'); // 0 -> 2 (script.c)
    dash.handleKey('ok');
    expect(client.callService).toHaveBeenCalledWith({ domain: 'script', service: 'turn_on', data: { entity_id: 'script.c' } });
    expect(cache.get('script.c')?.state).toBe('off'); // unchanged
    dash.unmount();
  });
});
