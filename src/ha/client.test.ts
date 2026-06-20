import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HaClient } from './client';
import * as fetchMod from './fetch';

const target = { baseUrl: 'http://ha.local:8123', token: 'tok' };

beforeEach(() => { vi.restoreAllMocks(); });

describe('HaClient', () => {
  it('getStates GETs /api/states with auth and returns the array', async () => {
    const spy = vi.spyOn(fetchMod, 'customFetch').mockResolvedValue([{ entity_id: 'light.a', state: 'on', attributes: {} }]);
    const client = new HaClient(target);
    const states = await client.getStates();
    expect(states).toHaveLength(1);
    expect(spy).toHaveBeenCalledWith('GET', 'http://ha.local:8123/api/states', null, {
      Authorization: 'Bearer tok',
      'Content-Type': 'application/json',
    });
  });

  it('callService POSTs to the right service URL with the data body', async () => {
    const spy = vi.spyOn(fetchMod, 'customFetch').mockResolvedValue(null);
    const client = new HaClient(target);
    await client.callService({ domain: 'light', service: 'toggle', data: { entity_id: 'light.a' } });
    expect(spy).toHaveBeenCalledWith('POST', 'http://ha.local:8123/api/services/light/toggle',
      { entity_id: 'light.a' }, { Authorization: 'Bearer tok', 'Content-Type': 'application/json' });
  });

  it('ping returns true on success and false on failure', async () => {
    const spy = vi.spyOn(fetchMod, 'customFetch');
    spy.mockResolvedValueOnce({ message: 'API running.' });
    expect(await new HaClient(target).ping()).toBe(true);
    spy.mockRejectedValue(new Error('down'));
    expect(await new HaClient(target).ping()).toBe(false);
  });

  it('prepends proxyPrefix to the URL when provided', async () => {
    const spy = vi.spyOn(fetchMod, 'customFetch').mockResolvedValue([]);
    await new HaClient({ ...target, proxyPrefix: 'http://localhost:5000/' }).getStates();
    expect(spy).toHaveBeenCalledWith('GET', 'http://localhost:5000/http://ha.local:8123/api/states', null, expect.anything());
  });
});
