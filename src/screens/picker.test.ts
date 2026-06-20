import { describe, it, expect, vi } from 'vitest';
import { createPicker } from './picker';

const states = [
  { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'Lamp' } },
  { entity_id: 'switch.b', state: 'off', attributes: {} },
];
const flush = () => new Promise((r) => setTimeout(r, 0));
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };

describe('picker', () => {
  it('lists discovered entities and returns selected tiles on Done', async () => {
    const client = { getStates: vi.fn().mockResolvedValue(states), callService: vi.fn(), ping: vi.fn() };
    const onDone = vi.fn();
    const picker = createPicker({ client: client as any, initial: [], onDone, onCancel: vi.fn() });
    mountInto(picker);
    await flush();
    picker.handleKey('ok'); // toggle first (light.a) on
    picker.handleKey('softRight'); // done
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'light.a', name: null, icon: null }]);
  });

  it('preselects entities from initial', async () => {
    const client = { getStates: vi.fn().mockResolvedValue(states), callService: vi.fn(), ping: vi.fn() };
    const onDone = vi.fn();
    const picker = createPicker({ client: client as any, initial: [{ entityId: 'switch.b', name: null, icon: null }], onDone, onCancel: vi.fn() });
    mountInto(picker);
    await flush();
    picker.handleKey('softRight');
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'switch.b', name: null, icon: null }]);
  });

  it('lists lovelace entities first but shows all of them', async () => {
    const client = { getStates: vi.fn().mockResolvedValue(states), callService: vi.fn(), ping: vi.fn() };
    const onDone = vi.fn();
    const picker = createPicker({
      client: client as any, initial: [], onDone, onCancel: vi.fn(),
      fetchLovelace: () => Promise.resolve(new Set(['switch.b'])),
    });
    const c = mountInto(picker);
    await flush();
    expect(c.querySelectorAll('.item')).toHaveLength(2); // all entities still shown
    picker.handleKey('ok'); // focus 0 is the lovelace one (switch.b), listed first
    picker.handleKey('softRight');
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'switch.b', name: null, icon: null }]);
  });

  it('cancels on discovery failure', async () => {
    const client = { getStates: vi.fn().mockRejectedValue(new Error('x')), callService: vi.fn(), ping: vi.fn() };
    const onCancel = vi.fn();
    const picker = createPicker({ client: client as any, initial: [], onDone: vi.fn(), onCancel });
    mountInto(picker);
    await flush();
    expect(onCancel).toHaveBeenCalled();
  });
});
