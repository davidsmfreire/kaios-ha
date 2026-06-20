import { describe, it, expect, vi } from 'vitest';
import { createSettings } from './settings';
import { AppConfig } from '../store/types';

const config: AppConfig = {
  version: 1, activeServerId: 's1',
  servers: [
    { id: 's1', name: 'Cabin', baseUrl: 'h', token: 't', pages: [] },
    { id: 's2', name: 'Home', baseUrl: 'h', token: 't', pages: [] },
  ],
  settings: { pollIntervalMs: 5000, theme: 'dark' },
};
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };

describe('settings', () => {
  it('renders a row per server plus add + edit', () => {
    const s = createSettings({ config, onAddServer: vi.fn(), onEditEntities: vi.fn(), onSetActive: vi.fn(), onClose: vi.fn() });
    const c = mountInto(s);
    expect(c.querySelectorAll('.item')).toHaveLength(4); // 2 servers + add + edit
  });

  it('OK on a non-active server calls onSetActive', () => {
    const onSetActive = vi.fn();
    const s = createSettings({ config, onAddServer: vi.fn(), onEditEntities: vi.fn(), onSetActive, onClose: vi.fn() });
    mountInto(s);
    s.handleKey('down'); // focus s2 (index 1)
    s.handleKey('ok');
    expect(onSetActive).toHaveBeenCalledWith('s2');
  });

  it('OK on Add server / Edit entities fires their callbacks; softLeft closes', () => {
    const onAddServer = vi.fn(); const onEditEntities = vi.fn(); const onClose = vi.fn();
    const s = createSettings({ config, onAddServer, onEditEntities, onSetActive: vi.fn(), onClose });
    mountInto(s);
    s.handleKey('down'); s.handleKey('down'); s.handleKey('ok'); // index 2 = Add server
    expect(onAddServer).toHaveBeenCalled();
    s.handleKey('down'); s.handleKey('ok'); // index 3 = Edit entities
    expect(onEditEntities).toHaveBeenCalled();
    s.handleKey('softLeft');
    expect(onClose).toHaveBeenCalled();
  });
});
