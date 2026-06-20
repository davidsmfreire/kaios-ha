import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDashboard } from './dashboard';
import { StateCache } from '../store/state';
import { PageConfig } from '../store/types';

const page: PageConfig = {
  id: 'p1', name: 'Home', tiles: [
    { entityId: 'switch.b', name: null, icon: null },
    { entityId: 'light.a', name: null, icon: null },
    { entityId: 'script.c', name: null, icon: null },
  ],
};

const makeClient = () => ({ getStates: vi.fn().mockResolvedValue([]), callService: vi.fn().mockResolvedValue(undefined), ping: vi.fn() });
const mountInto = (dash: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); dash.mount(c); return c; };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('dashboard', () => {
  it('renders a tile per entity and focuses the first', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'switch.b', state: 'on', attributes: {} }]);
    const dash = createDashboard({ client: makeClient() as any, cache, page, serverName: 'Cabin', intervalMs: 1000, onOpenDetail: vi.fn() });
    const c = mountInto(dash);
    expect(c.querySelectorAll('.tile')).toHaveLength(3);
    expect(c.querySelectorAll('.tile')[0].classList.contains('focus')).toBe(true);
    dash.unmount();
  });

  it('OK on a switch toggles optimistically and calls the service', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'switch.b', state: 'on', attributes: {} }]);
    const client = makeClient();
    const dash = createDashboard({ client: client as any, cache, page, serverName: 'Cabin', intervalMs: 1000, onOpenDetail: vi.fn() });
    mountInto(dash);
    dash.handleKey('ok'); // focus on switch.b
    expect(cache.get('switch.b')?.state).toBe('off');
    expect(client.callService).toHaveBeenCalledWith({ domain: 'switch', service: 'toggle', data: { entity_id: 'switch.b' } });
    dash.unmount();
  });

  it('OK on a detail-domain (light) opens detail instead of acting', () => {
    const client = makeClient();
    const onOpenDetail = vi.fn();
    const dash = createDashboard({ client: client as any, cache: new StateCache(), page, serverName: 'Cabin', intervalMs: 1000, onOpenDetail });
    mountInto(dash);
    dash.handleKey('right'); // 0 -> 1 (light.a)
    dash.handleKey('ok');
    expect(onOpenDetail).toHaveBeenCalledWith(page.tiles[1]);
    expect(client.callService).not.toHaveBeenCalled();
    dash.unmount();
  });

  it('OK on a script runs it without changing cached state', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'script.c', state: 'off', attributes: {} }]);
    const client = makeClient();
    const dash = createDashboard({ client: client as any, cache, page, serverName: 'Cabin', intervalMs: 1000, onOpenDetail: vi.fn() });
    mountInto(dash);
    dash.handleKey('down'); dash.handleKey('down'); // 0 -> 2 (script.c)
    dash.handleKey('ok');
    expect(client.callService).toHaveBeenCalledWith({ domain: 'script', service: 'turn_on', data: { entity_id: 'script.c' } });
    expect(cache.get('script.c')?.state).toBe('off');
    dash.unmount();
  });
});
