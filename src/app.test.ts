import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startApp } from './app';
import { saveConfig, DEFAULT_CONFIG } from './store/config';

class MockWS { onopen = null; onclose = null; onerror = null; onmessage = null; constructor(public url: string) {} send() {} close() {} }

beforeEach(() => { localStorage.clear(); document.body.innerHTML = ''; vi.stubGlobal('WebSocket', MockWS); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('startApp', () => {
  it('first run with no servers shows the add-server form', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    startApp(root);
    expect(root.querySelector('.field')).not.toBeNull();
    expect(root.textContent).toContain('Add server');
  });

  it('renders the dashboard when a server has a page with tiles', () => {
    saveConfig({
      ...DEFAULT_CONFIG, activeServerId: 's1',
      servers: [{ id: 's1', name: 'Cabin', baseUrl: 'http://ha.local:8123', token: 't',
        pages: [{ id: 'p1', name: 'Home', tiles: [{ entityId: 'light.a', name: null, icon: null }] }] }],
    });
    const root = document.createElement('div');
    document.body.appendChild(root);
    startApp(root);
    expect(root.querySelector('.grid')).not.toBeNull();
    expect(root.querySelectorAll('.tile')).toHaveLength(1);
  });
});
