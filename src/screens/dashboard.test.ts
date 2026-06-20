import { describe, it, expect, vi } from 'vitest';
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

const makeSocket = () => ({
  start: vi.fn(), close: vi.fn(), getStates: vi.fn(), getLovelace: vi.fn(),
  callService: vi.fn().mockResolvedValue(undefined),
  onStatus: vi.fn().mockReturnValue(() => {}),
});
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };

describe('dashboard', () => {
  it('renders a tile per entity and focuses the first', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'switch.b', state: 'on', attributes: {} }]);
    const dash = createDashboard({ socket: makeSocket() as any, cache, page, serverName: 'Cabin', onOpenDetail: vi.fn() });
    const c = mountInto(dash);
    expect(c.querySelectorAll('.tile')).toHaveLength(3);
    expect(c.querySelectorAll('.tile')[0].classList.contains('focus')).toBe(true);
    dash.unmount();
  });

  it('OK on a switch toggles optimistically and calls the service', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'switch.b', state: 'on', attributes: {} }]);
    const socket = makeSocket();
    const dash = createDashboard({ socket: socket as any, cache, page, serverName: 'Cabin', onOpenDetail: vi.fn() });
    mountInto(dash);
    dash.handleKey('ok');
    expect(cache.get('switch.b')?.state).toBe('off');
    expect(socket.callService).toHaveBeenCalledWith({ domain: 'switch', service: 'toggle', data: { entity_id: 'switch.b' } });
    dash.unmount();
  });

  it('OK on a detail-domain (light) opens detail', () => {
    const socket = makeSocket();
    const onOpenDetail = vi.fn();
    const dash = createDashboard({ socket: socket as any, cache: new StateCache(), page, serverName: 'Cabin', onOpenDetail });
    mountInto(dash);
    dash.handleKey('right');
    dash.handleKey('ok');
    expect(onOpenDetail).toHaveBeenCalledWith(page.tiles[1]);
    expect(socket.callService).not.toHaveBeenCalled();
    dash.unmount();
  });

  it('subscribes to status and shows the offline banner when disconnected', () => {
    let statusCb: (c: boolean) => void = () => {};
    const socket = { ...makeSocket(), onStatus: (cb: (c: boolean) => void) => { statusCb = cb; return () => {}; } };
    const dash = createDashboard({ socket: socket as any, cache: new StateCache(), page, serverName: 'Cabin', onOpenDetail: vi.fn() });
    const c = mountInto(dash);
    statusCb(false);
    expect(c.querySelector('.offline-banner')).not.toBeNull();
    statusCb(true);
    expect(c.querySelector('.offline-banner')).toBeNull();
    dash.unmount();
  });
});
