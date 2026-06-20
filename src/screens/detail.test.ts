import { describe, it, expect, vi } from 'vitest';
import { createDetail } from './detail';
import { StateCache } from '../store/state';
import { TileConfig } from '../store/types';

const tile = (entityId: string): TileConfig => ({ entityId, name: null, icon: null });
const makeClient = () => ({ getStates: vi.fn(), callService: vi.fn().mockResolvedValue(undefined), ping: vi.fn() });
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };

describe('detail (cover)', () => {
  it('maps up/ok/down to open/stop/close', () => {
    const client = makeClient();
    const d = createDetail({ client: client as any, cache: new StateCache(), tile: tile('cover.garage'), onBack: vi.fn() });
    mountInto(d);
    d.handleKey('up');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'cover', service: 'open_cover', data: { entity_id: 'cover.garage' } });
    d.handleKey('ok');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'cover', service: 'stop_cover', data: { entity_id: 'cover.garage' } });
    d.handleKey('down');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'cover', service: 'close_cover', data: { entity_id: 'cover.garage' } });
  });
});

describe('detail (climate)', () => {
  it('up raises target temperature from the entity attribute', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'climate.t', state: 'heat', attributes: { temperature: 21 } }]);
    const client = makeClient();
    const d = createDetail({ client: client as any, cache, tile: tile('climate.t'), onBack: vi.fn() });
    const c = mountInto(d);
    d.handleKey('up');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'climate', service: 'set_temperature', data: { entity_id: 'climate.t', temperature: 22 } });
    expect(c.querySelector('.bigval')!.textContent).toBe('22°');
  });
});

describe('detail (back)', () => {
  it('softLeft calls onBack', () => {
    const onBack = vi.fn();
    const d = createDetail({ client: makeClient() as any, cache: new StateCache(), tile: tile('cover.garage'), onBack });
    mountInto(d);
    d.handleKey('softLeft');
    expect(onBack).toHaveBeenCalled();
  });
});

describe('detail (light)', () => {
  it('right raises brightness and ok toggles', () => {
    const cache = new StateCache();
    cache.setAll([{ entity_id: 'light.a', state: 'on', attributes: { brightness: 128 } }]); // ~50%
    const client = makeClient();
    const d = createDetail({ client: client as any, cache, tile: tile('light.a'), onBack: vi.fn() });
    mountInto(d);
    d.handleKey('right');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'light', service: 'turn_on', data: { entity_id: 'light.a', brightness_pct: 60 } });
    d.handleKey('ok');
    expect(client.callService).toHaveBeenLastCalledWith({ domain: 'light', service: 'toggle', data: { entity_id: 'light.a' } });
  });
});
