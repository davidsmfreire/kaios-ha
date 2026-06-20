const ENTITY_RE = /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/;

export interface LovelaceEntity {
  id: string;
  name?: string;
}

// Walk a Lovelace config and collect each referenced entity in dashboard order,
// capturing any per-card `name:` override (e.g. {entity: light.x, name: "LED"}).
export function collectLovelaceEntities(config: unknown): LovelaceEntity[] {
  const out: LovelaceEntity[] = [];
  const seen = new Set<string>();
  const add = (id: string, name?: string) => {
    if (!ENTITY_RE.test(id)) return;
    if (seen.has(id)) {
      if (name) {
        const existing = out.find((e) => e.id === id);
        if (existing && !existing.name) existing.name = name;
      }
      return;
    }
    seen.add(id);
    out.push(name ? { id, name } : { id });
  };
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      add(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      const o = node as Record<string, unknown>;
      if (typeof o.entity === 'string') add(o.entity, typeof o.name === 'string' ? o.name : undefined);
      Object.values(o).forEach(walk);
    }
  };
  walk(config);
  return out;
}

export interface LovelaceInfo {
  order: string[];
  names: Map<string, string>;
}

// Fetch the server's stored Lovelace dashboard over the HA WebSocket API and
// return entity order + name overrides. Resolves empty on any failure.
export function fetchLovelace(target: { baseUrl: string; token: string }): Promise<LovelaceInfo> {
  return new Promise((resolve) => {
    const finish = (entities: LovelaceEntity[]) => {
      clearTimeout(timer);
      try { ws.close(); } catch { /* already closing */ }
      const names = new Map<string, string>();
      entities.forEach((e) => { if (e.name) names.set(e.id, e.name); });
      resolve({ order: entities.map((e) => e.id), names });
    };
    let ws: WebSocket;
    try {
      ws = new WebSocket(target.baseUrl.replace(/^http/, 'ws') + '/api/websocket');
    } catch {
      resolve({ order: [], names: new Map() });
      return;
    }
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
      else if (msg.type === 'result' && msg.id === 1) finish(msg.success ? collectLovelaceEntities(msg.result) : []);
    };
  });
}
