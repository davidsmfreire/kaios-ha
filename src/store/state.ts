import { EntityState } from '../ha/types';

export class StateCache {
  private states = new Map<string, EntityState>();
  private subscribers = new Set<() => void>();

  setAll(states: EntityState[]): void {
    this.states = new Map(states.map((s) => [s.entity_id, s]));
    this.notify();
  }

  setOne(entity: EntityState): void {
    this.states.set(entity.entity_id, entity);
    this.notify();
  }

  get(entityId: string): EntityState | undefined {
    return this.states.get(entityId);
  }

  all(): EntityState[] {
    return [...this.states.values()];
  }

  applyOptimistic(entityId: string, state: string): void {
    const existing = this.states.get(entityId);
    this.states.set(entityId, existing ? { ...existing, state } : { entity_id: entityId, state, attributes: {} });
    this.notify();
  }

  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private notify(): void {
    [...this.subscribers].forEach((fn) => fn());
  }
}
