import { describe, it, expect, afterEach, vi } from 'vitest';
import { collectEntityIds, fetchLovelaceEntityIds } from './lovelace';

describe('collectEntityIds', () => {
  it('collects entity ids from nested cards, ignoring non-entity strings', () => {
    const config = {
      title: 'Home',
      views: [{
        path: 'default_view',
        cards: [
          { type: 'entities', entities: ['light.kitchen', { entity: 'switch.fan' }] },
          { type: 'vertical-stack', cards: [{ type: 'button', entity: 'cover.garage' }] },
          { type: 'markdown', content: 'hello world' },
        ],
      }],
    };
    expect(collectEntityIds(config).sort()).toEqual(['cover.garage', 'light.kitchen', 'switch.fan']);
  });

  it('ignores strings that are not entity-id shaped', () => {
    expect(collectEntityIds({ theme: 'default', icon: 'mdi:home', name: 'Not.AnEntity' })).toEqual([]);
  });
});

class MockWS {
  static last: MockWS;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  sent: string[] = [];
  result: unknown;
  authReply: string;
  constructor(public url: string) {
    MockWS.last = this;
    // captured per-test via the factory below
    this.result = (MockWS as any)._result;
    this.authReply = (MockWS as any)._authReply;
  }
  private emit(obj: unknown) { this.onmessage?.({ data: JSON.stringify(obj) }); }
  send(data: string) {
    this.sent.push(data);
    const m = JSON.parse(data);
    if (m.type === 'auth') this.emit({ type: this.authReply });
    else if (m.type === 'lovelace/config') this.emit({ id: m.id, type: 'result', success: true, result: this.result });
  }
  close() {}
  start() { this.emit({ type: 'auth_required' }); }
}

const useMockWS = (result: unknown, authReply = 'auth_ok') => {
  (MockWS as any)._result = result;
  (MockWS as any)._authReply = authReply;
  vi.stubGlobal('WebSocket', MockWS);
};

describe('fetchLovelaceEntityIds', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('authenticates with the token and returns the config entity ids', async () => {
    useMockWS({ views: [{ cards: [{ entity: 'light.a' }, { entities: ['switch.b'] }] }] });
    const p = fetchLovelaceEntityIds({ baseUrl: 'http://h:8123', token: 'tok' });
    MockWS.last.start();
    const ids = await p;
    expect([...ids].sort()).toEqual(['light.a', 'switch.b']);
    expect(JSON.parse(MockWS.last.sent[0])).toEqual({ type: 'auth', access_token: 'tok' });
  });

  it('resolves to an empty set when auth is rejected', async () => {
    useMockWS({}, 'auth_invalid');
    const p = fetchLovelaceEntityIds({ baseUrl: 'http://h:8123', token: 'bad' });
    MockWS.last.start();
    expect([...(await p)]).toEqual([]);
  });
});
