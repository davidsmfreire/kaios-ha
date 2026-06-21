import { describe, it, expect, vi } from 'vitest';
import { createSettings } from './settings';
import { AppConfig } from '../store/types';

const config: AppConfig = {
  version: 1, activeServerId: 's1',
  servers: [
    { id: 's1', name: 'Cabin', baseUrl: 'h', token: 't', pages: [] },
    { id: 's2', name: 'Home', baseUrl: 'h', token: 't', pages: [] },
  ],
  settings: { theme: 'dark' },
};
const opts = (over = {}) => ({
  config, onAddServer: vi.fn(), onEditServer: vi.fn(), onEditEntities: vi.fn(), onSetActive: vi.fn(), onClose: vi.fn(), ...over,
});
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };

describe('settings', () => {
  it('renders a row per server plus add server, edit server, edit entities', () => {
    const c = mountInto(createSettings(opts()));
    expect(c.querySelectorAll('.item')).toHaveLength(5); // 2 servers + add + edit server + edit entities
  });

  it('OK on a non-active server calls onSetActive', () => {
    const onSetActive = vi.fn();
    const s = createSettings(opts({ onSetActive }));
    mountInto(s);
    s.handleKey('down'); // focus s2 (index 1)
    s.handleKey('ok');
    expect(onSetActive).toHaveBeenCalledWith('s2');
  });

  it('OK on Add server / Edit server / Edit entities fires their callbacks; softLeft closes', () => {
    const onAddServer = vi.fn(); const onEditServer = vi.fn(); const onEditEntities = vi.fn(); const onClose = vi.fn();
    const s = createSettings(opts({ onAddServer, onEditServer, onEditEntities, onClose }));
    mountInto(s);
    s.handleKey('down'); s.handleKey('down'); s.handleKey('ok'); // index 2 = Add server
    expect(onAddServer).toHaveBeenCalled();
    s.handleKey('down'); s.handleKey('ok'); // index 3 = Edit server
    expect(onEditServer).toHaveBeenCalled();
    s.handleKey('down'); s.handleKey('ok'); // index 4 = Edit entities
    expect(onEditEntities).toHaveBeenCalled();
    s.handleKey('softLeft');
    expect(onClose).toHaveBeenCalled();
  });
});
