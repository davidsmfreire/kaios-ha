import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPoller } from './poller';
import { StateCache } from './store/state';

const states = [{ entity_id: 'light.a', state: 'on', attributes: {} }];

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('createPoller', () => {
  it('fetches immediately on start and then every interval', async () => {
    const client = { getStates: vi.fn().mockResolvedValue(states) };
    const cache = new StateCache();
    const poller = createPoller({ client, cache, intervalMs: 1000 });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(client.getStates).toHaveBeenCalledTimes(1);
    expect(cache.get('light.a')?.state).toBe('on');
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.getStates).toHaveBeenCalledTimes(2);
    poller.stop();
    await vi.advanceTimersByTimeAsync(3000);
    expect(client.getStates).toHaveBeenCalledTimes(2); // stopped
  });

  it('reports errors via onError and keeps polling', async () => {
    const client = { getStates: vi.fn().mockRejectedValue(new Error('down')) };
    const onError = vi.fn();
    const poller = createPoller({ client, cache: new StateCache(), intervalMs: 1000, onError });
    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledTimes(1);
    poller.stop();
  });

  it('start() is idempotent — a second start does not double-schedule', async () => {
    const client = { getStates: vi.fn().mockResolvedValue(states) };
    const poller = createPoller({ client, cache: new StateCache(), intervalMs: 1000 });
    poller.start();
    poller.start(); // second start must be a no-op
    await vi.advanceTimersByTimeAsync(0);
    expect(client.getStates).toHaveBeenCalledTimes(1); // only one immediate fetch
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.getStates).toHaveBeenCalledTimes(2); // single interval
    poller.stop();
  });
});
