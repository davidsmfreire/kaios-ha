const ENTITY_RE = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;

// Walk an arbitrary Lovelace config and collect every entity-id-shaped string,
// regardless of card structure (entity, entities, nested cards, …).
export function collectEntityIds(config: unknown): string[] {
  const acc = new Set<string>();
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      if (ENTITY_RE.test(node)) acc.add(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  };
  walk(config);
  return [...acc];
}

// Fetch the entity ids referenced by the server's stored Lovelace dashboard over
// the HA WebSocket API. Resolves to an empty set on any failure (no stored
// dashboard, auth error, timeout) so callers can fall back to showing all.
export function fetchLovelaceEntityIds(target: { baseUrl: string; token: string }): Promise<Set<string>> {
  return new Promise((resolve) => {
    const url = target.baseUrl.replace(/^http/, 'ws') + '/api/websocket';
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      resolve(new Set());
      return;
    }
    const finish = (ids: string[]) => {
      clearTimeout(timer);
      try { ws.close(); } catch { /* already closing */ }
      resolve(new Set(ids));
    };
    const timer = setTimeout(() => finish([]), 8000);
    ws.onerror = () => finish([]);
    ws.onmessage = (ev) => {
      let msg: { type?: string; id?: number; success?: boolean; result?: unknown };
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (msg.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: target.token }));
      else if (msg.type === 'auth_ok') ws.send(JSON.stringify({ id: 1, type: 'lovelace/config' }));
      else if (msg.type === 'auth_invalid') finish([]);
      else if (msg.type === 'result' && msg.id === 1) finish(msg.success ? collectEntityIds(msg.result) : []);
    };
  });
}
