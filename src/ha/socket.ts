import { EntityState, ServiceCall } from './types';
import { StateCache } from '../store/state';
import { LovelaceInfo, collectLovelaceEntities } from './lovelace';

export interface HaSocket {
  start(): void;
  close(): void;
  getStates(): Promise<EntityState[]>;
  getLovelace(): Promise<LovelaceInfo>;
  callService(call: ServiceCall): Promise<void>;
  onStatus(cb: (connected: boolean) => void): () => void;
}

export function createHaSocket(opts: {
  baseUrl: string;
  token: string;
  cache: StateCache;
  reconnectMs?: number;
}): HaSocket {
  const { baseUrl, token, cache } = opts;
  const baseDelay = opts.reconnectMs ?? 1000;
  // __HA_DEV_PROXY__ is '' in production; in dev it's the local WS proxy origin, and
  // we tunnel the real target through it (see build.mjs / ws-dev-proxy.mjs).
  const real = baseUrl.replace(/\/+$/, '').replace(/^http/, 'ws') + '/api/websocket';
  const url = __HA_DEV_PROXY__ ? `${__HA_DEV_PROXY__}/?target=${encodeURIComponent(real)}` : real;

  let ws: WebSocket | null = null;
  let nextId = 1;
  let stateSubId = 0;
  let attempts = 0;
  let stopped = false;
  let authed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  const queue: Array<{ id: number; type: string; extra: object }> = [];
  const statusSubs = new Set<(connected: boolean) => void>();

  const setStatus = (connected: boolean) => statusSubs.forEach((cb) => cb(connected));

  const failAll = (err: unknown) => {
    pending.forEach((p) => p.reject(err));
    pending.clear();
  };

  const flushQueue = () => {
    queue.forEach((q) => ws!.send(JSON.stringify({ id: q.id, type: q.type, ...q.extra })));
    queue.length = 0;
  };

  const command = <T>(type: string, extra: object = {}): Promise<T> => {
    const id = nextId++;
    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      if (authed && ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ id, type, ...extra }));
      } else {
        queue.push({ id, type, extra });
      }
    });
  };

  const subscribe = () => {
    stateSubId = nextId++;
    pending.set(stateSubId, { resolve: () => {}, reject: () => {} });
    ws!.send(JSON.stringify({ id: stateSubId, type: 'subscribe_events', event_type: 'state_changed' }));
  };

  const onMessage = (raw: string) => {
    let msg: { type?: string; id?: number; success?: boolean; result?: unknown; event?: { data?: { new_state?: EntityState } } };
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'auth_required') { ws!.send(JSON.stringify({ type: 'auth', access_token: token })); return; }
    if (msg.type === 'auth_ok') {
      attempts = 0;
      authed = true;
      setStatus(true);
      flushQueue();
      command<EntityState[]>('get_states').then((s) => cache.setAll(s), () => {});
      subscribe();
      return;
    }
    if (msg.type === 'auth_invalid') { stopped = true; setStatus(false); failAll(new Error('auth_invalid')); queue.length = 0; ws?.close(); return; }
    if (msg.type === 'event' && msg.id === stateSubId) {
      const ns = msg.event?.data?.new_state;
      if (ns) cache.setOne(ns);
      return;
    }
    if (msg.type === 'result' && typeof msg.id === 'number') {
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        if (msg.success) p.resolve(msg.result);
        else p.reject(new Error('command failed'));
      }
    }
  };

  const scheduleReconnect = () => {
    if (stopped) return;
    const delay = Math.min(baseDelay * 2 ** attempts, 30000);
    attempts++;
    timer = setTimeout(connect, delay);
  };

  function connect(): void {
    authed = false;
    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    ws.onmessage = (e) => onMessage(String((e as MessageEvent).data));
    ws.onclose = () => {
      setStatus(false);
      failAll(new Error('closed'));
      queue.length = 0;
      scheduleReconnect();
    };
    ws.onerror = () => { /* onclose follows */ };
  }

  return {
    start() { stopped = false; connect(); },
    close() {
      stopped = true;
      if (timer) { clearTimeout(timer); timer = null; }
      failAll(new Error('closed'));
      queue.length = 0;
      try { ws?.close(); } catch { /* ignore */ }
    },
    getStates() { return command<EntityState[]>('get_states'); },
    callService(call) {
      return command<unknown>('call_service', { domain: call.domain, service: call.service, service_data: call.data }).then(() => undefined);
    },
    getLovelace() {
      return command<unknown>('lovelace/config').then(
        (cfg) => {
          const ents = collectLovelaceEntities(cfg);
          const names = new Map<string, string>();
          ents.forEach((e) => { if (e.name) names.set(e.id, e.name); });
          return { order: ents.map((e) => e.id), names };
        },
        () => ({ order: [], names: new Map<string, string>() }),
      );
    },
    onStatus(cb) { statusSubs.add(cb); return () => statusSubs.delete(cb); },
  };
}
