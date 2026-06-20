// src/ha/socket.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHaSocket } from './socket';
import { StateCache } from '../store/state';

class MockWS {
  static last: MockWS;
  static instances = 0;
  readyState = 0; // CONNECTING
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  sent: any[] = [];
  constructor(public url: string) { MockWS.last = this; MockWS.instances++; }
  emit(obj: unknown) { this.onmessage?.({ data: JSON.stringify(obj) }); }
  send(data: string) { this.sent.push(JSON.parse(data)); }
  close() { this.readyState = 3; this.onclose?.(); }
  // test helper: drive open + auth handshake
  open() { this.readyState = 1; this.emit({ type: 'auth_required' }); }
}

beforeEach(() => { MockWS.instances = 0; vi.stubGlobal('WebSocket', MockWS); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const lastSent = (type: string) => MockWS.last.sent.find((m) => m.type === type);

describe('createHaSocket', () => {
  it('auths with the token, then seeds states and subscribes on auth_ok', () => {
    const cache = new StateCache();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 'tok', cache });
    sock.start();
    MockWS.last.open();
    expect(lastSent('auth')).toEqual({ type: 'auth', access_token: 'tok' });
    MockWS.last.emit({ type: 'auth_ok' });
    expect(MockWS.last.sent.some((m) => m.type === 'get_states')).toBe(true);
    expect(MockWS.last.sent.some((m) => m.type === 'subscribe_events' && m.event_type === 'state_changed')).toBe(true);
  });

  it('applies state_changed events to the cache', () => {
    const cache = new StateCache();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache });
    sock.start();
    MockWS.last.open();
    MockWS.last.emit({ type: 'auth_ok' });
    const subId = MockWS.last.sent.find((m) => m.type === 'subscribe_events').id;
    MockWS.last.emit({ type: 'event', id: subId, event: { data: { new_state: { entity_id: 'light.a', state: 'on', attributes: {} } } } });
    expect(cache.get('light.a')?.state).toBe('on');
  });

  it('getStates resolves with the result of the matching command', async () => {
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache: new StateCache() });
    sock.start();
    MockWS.last.open();
    MockWS.last.emit({ type: 'auth_ok' });
    const p = sock.getStates();
    const id = MockWS.last.sent.filter((m) => m.type === 'get_states').slice(-1)[0].id;
    MockWS.last.emit({ type: 'result', id, success: true, result: [{ entity_id: 'light.a', state: 'on', attributes: {} }] });
    expect(await p).toHaveLength(1);
  });

  it('callService sends call_service and resolves on success', async () => {
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache: new StateCache() });
    sock.start();
    MockWS.last.open();
    MockWS.last.emit({ type: 'auth_ok' });
    const p = sock.callService({ domain: 'light', service: 'toggle', data: { entity_id: 'light.a' } });
    const msg = MockWS.last.sent.filter((m) => m.type === 'call_service').slice(-1)[0];
    expect(msg).toMatchObject({ type: 'call_service', domain: 'light', service: 'toggle', service_data: { entity_id: 'light.a' } });
    MockWS.last.emit({ type: 'result', id: msg.id, success: true, result: {} });
    await expect(p).resolves.toBeUndefined();
  });

  it('getLovelace resolves entity order + names, empty on failure', async () => {
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache: new StateCache() });
    sock.start();
    MockWS.last.open();
    MockWS.last.emit({ type: 'auth_ok' });
    const p = sock.getLovelace();
    const id = MockWS.last.sent.filter((m) => m.type === 'lovelace/config').slice(-1)[0].id;
    MockWS.last.emit({ type: 'result', id, success: true, result: { views: [{ cards: [{ entity: 'light.a', name: 'Lamp' }] }] } });
    const info = await p;
    expect(info.order).toEqual(['light.a']);
    expect(info.names.get('light.a')).toBe('Lamp');
  });

  it('notifies status on connect and reconnects after close', () => {
    vi.useFakeTimers();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache: new StateCache(), reconnectMs: 100 });
    const states: boolean[] = [];
    sock.onStatus((c) => states.push(c));
    sock.start();
    MockWS.last.open();
    MockWS.last.emit({ type: 'auth_ok' });
    expect(states).toContain(true);
    MockWS.last.close(); // drop
    expect(states).toContain(false);
    vi.advanceTimersByTime(100);
    expect(MockWS.instances).toBe(2); // reconnected
    sock.close();
  });

  it('queues commands issued before auth_ok and resolves them after', async () => {
    const cache = new StateCache();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache });
    sock.start();
    // socket is CONNECTING (readyState=0) — command should NOT reject synchronously
    const p = sock.getStates();
    let rejected = false;
    p.catch(() => { rejected = true; });
    // flush microtasks — still pending, not rejected
    await Promise.resolve();
    expect(rejected).toBe(false);
    // drive auth handshake
    MockWS.last.open(); // emits auth_required → sends auth
    MockWS.last.emit({ type: 'auth_ok' });
    // after auth_ok: flushQueue sends the queued get_states first, then seed get_states
    const allGetStates = MockWS.last.sent.filter((m) => m.type === 'get_states');
    // the first get_states is the queued one
    const queuedId = allGetStates[0].id;
    MockWS.last.emit({ type: 'result', id: queuedId, success: true, result: [{ entity_id: 'light.x', state: 'on', attributes: {} }] });
    const result = await p;
    expect(result).toHaveLength(1);
    expect((result as Array<{ entity_id: string }>)[0].entity_id).toBe('light.x');
  });

  it('auth_invalid notifies status false', () => {
    const cache = new StateCache();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 'bad', cache });
    const statuses: boolean[] = [];
    sock.onStatus((c) => statuses.push(c));
    sock.start();
    MockWS.last.open(); // auth_required → sends auth
    MockWS.last.emit({ type: 'auth_invalid' });
    expect(statuses).toContain(false);
  });

  it('close() stops reconnect', () => {
    vi.useFakeTimers();
    const sock = createHaSocket({ baseUrl: 'http://h:8123', token: 't', cache: new StateCache(), reconnectMs: 100 });
    sock.start();
    MockWS.last.open();
    sock.close();
    MockWS.last.close();
    vi.advanceTimersByTime(1000);
    expect(MockWS.instances).toBe(1); // no reconnect after close
  });
});
