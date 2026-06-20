import { describe, it, expect, afterEach, vi } from 'vitest';
import { collectLovelaceEntities, fetchLovelace } from './lovelace';

describe('collectLovelaceEntities', () => {
  it('collects entities in dashboard order with name overrides', () => {
    const config = {
      views: [{
        cards: [
          { type: 'entities', entities: ['light.kitchen', { entity: 'switch.fan', name: 'Fan' }] },
          { type: 'button', entity: 'light.kitchen', name: 'Kitchen Light' }, // dup id, supplies a name
          { type: 'light', entity: 'cover.garage' },
          { type: 'markdown', content: 'hello world' },
        ],
      }],
    };
    const out = collectLovelaceEntities(config);
    expect(out.map((e) => e.id)).toEqual(['light.kitchen', 'switch.fan', 'cover.garage']);
    expect(out.find((e) => e.id === 'switch.fan')!.name).toBe('Fan');
    expect(out.find((e) => e.id === 'light.kitchen')!.name).toBe('Kitchen Light');
    expect(out.find((e) => e.id === 'cover.garage')!.name).toBeUndefined();
  });
});

class MockWS {
  static last: MockWS;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  sent: string[] = [];
  constructor(public url: string) { MockWS.last = this; }
  private emit(obj: unknown) { this.onmessage?.({ data: JSON.stringify(obj) }); }
  send(data: string) {
    this.sent.push(data);
    const m = JSON.parse(data);
    if (m.type === 'auth') this.emit({ type: 'auth_ok' });
    else if (m.type === 'lovelace/config') {
      this.emit({ id: m.id, type: 'result', success: true, result: { views: [{ cards: [{ entity: 'light.a', name: 'Lamp' }, { entity: 'switch.b' }] }] } });
    }
  }
  close() {}
  start() { this.emit({ type: 'auth_required' }); }
}

describe('fetchLovelace', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns dashboard order and name overrides', async () => {
    vi.stubGlobal('WebSocket', MockWS);
    const p = fetchLovelace({ baseUrl: 'http://h:8123', token: 'tok' });
    MockWS.last.start();
    const { order, names } = await p;
    expect(order).toEqual(['light.a', 'switch.b']);
    expect(names.get('light.a')).toBe('Lamp');
    expect(names.has('switch.b')).toBe(false);
    expect(JSON.parse(MockWS.last.sent[0])).toEqual({ type: 'auth', access_token: 'tok' });
  });
});
