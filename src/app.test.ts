import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startApp } from './app';
import { saveConfig, DEFAULT_CONFIG } from './store/config';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('startApp', () => {
  it('shows an empty state when no server is configured', () => {
    const root = document.createElement('div');
    startApp(root);
    expect(root.querySelector('.empty')).not.toBeNull();
    expect(root.querySelector('.grid')).toBeNull();
  });

  it('renders the dashboard for the active server first page', () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      activeServerId: 's1',
      servers: [{
        id: 's1', name: 'Cabin', baseUrl: 'http://ha.local:8123', token: 't',
        pages: [{ id: 'p1', name: 'Home', tiles: [{ entityId: 'light.a', name: null, icon: null }] }],
      }],
    });
    const root = document.createElement('div');
    startApp(root);
    expect(root.querySelector('.grid')).not.toBeNull();
    expect(root.querySelectorAll('.tile')).toHaveLength(1);
  });
});
