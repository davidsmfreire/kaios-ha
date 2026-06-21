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
