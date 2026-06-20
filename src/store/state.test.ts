import { describe, it, expect, vi } from 'vitest';
import { StateCache } from './state';
import { EntityState } from '../ha/types';

const st = (id: string, state: string): EntityState => ({ entity_id: id, state, attributes: {} });

describe('StateCache', () => {
  it('stores and retrieves states by id', () => {
    const cache = new StateCache();
    cache.setAll([st('light.a', 'on'), st('switch.b', 'off')]);
    expect(cache.get('light.a')?.state).toBe('on');
    expect(cache.get('missing')).toBeUndefined();
    expect(cache.all()).toHaveLength(2);
  });

  it('notifies subscribers on setAll and applyOptimistic', () => {
    const cache = new StateCache();
    const fn = vi.fn();
    cache.subscribe(fn);
    cache.setAll([st('light.a', 'off')]);
    cache.applyOptimistic('light.a', 'on');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(cache.get('light.a')?.state).toBe('on');
  });

  it('optimistic update on unknown entity creates a minimal entry', () => {
    const cache = new StateCache();
    cache.applyOptimistic('light.x', 'on');
    expect(cache.get('light.x')).toEqual({ entity_id: 'light.x', state: 'on', attributes: {} });
  });

  it('unsubscribe stops notifications', () => {
    const cache = new StateCache();
    const fn = vi.fn();
    const off = cache.subscribe(fn);
    off();
    cache.setAll([]);
    expect(fn).not.toHaveBeenCalled();
  });
});
