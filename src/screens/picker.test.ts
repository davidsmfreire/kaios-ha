import { describe, it, expect, vi } from 'vitest';
import { createPicker } from './picker';

const states = [
  { entity_id: 'light.a', state: 'on', attributes: { friendly_name: 'Lamp' } },
  { entity_id: 'switch.b', state: 'off', attributes: {} },
];
const flush = () => new Promise((r) => setTimeout(r, 0));
const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); s.mount(c); return c; };
const makeSocket = (over: Partial<{ getStates: any; getLovelace: any }> = {}) => ({
  start: vi.fn(), close: vi.fn(), callService: vi.fn(), onStatus: vi.fn().mockReturnValue(() => {}),
  getStates: over.getStates ?? vi.fn().mockResolvedValue(states),
  getLovelace: over.getLovelace ?? vi.fn().mockResolvedValue({ order: [], names: new Map() }),
});

describe('picker', () => {
  it('lists discovered entities and returns selected tiles on Done', async () => {
    const onDone = vi.fn();
    const picker = createPicker({ socket: makeSocket() as any, initial: [], onDone, onCancel: vi.fn() });
    mountInto(picker);
    await flush();
    picker.handleKey('ok'); // toggle first (light.a) on
    picker.handleKey('softRight'); // done
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'light.a', name: null, icon: null }]);
  });

  it('preselects entities from initial', async () => {
    const onDone = vi.fn();
    const picker = createPicker({ socket: makeSocket() as any, initial: [{ entityId: 'switch.b', name: null, icon: null }], onDone, onCancel: vi.fn() });
    mountInto(picker);
    await flush();
    picker.handleKey('softRight');
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'switch.b', name: null, icon: null }]);
  });

  it('lists lovelace entities first with their dashboard names, showing all', async () => {
    const onDone = vi.fn();
    const picker = createPicker({
      socket: makeSocket({ getLovelace: vi.fn().mockResolvedValue({ order: ['switch.b'], names: new Map([['switch.b', 'My Switch']]) }) }) as any,
      initial: [], onDone, onCancel: vi.fn(),
    });
    const c = mountInto(picker);
    await flush();
    const items = c.querySelectorAll('.item');
    expect(items).toHaveLength(2); // all entities still shown
    expect(items[0].textContent).toContain('My Switch'); // lovelace name, listed first
    picker.handleKey('ok'); // focus 0 is the lovelace one (switch.b)
    picker.handleKey('softRight');
    expect(onDone).toHaveBeenCalledWith([{ entityId: 'switch.b', name: 'My Switch', icon: null }]);
  });

  it('cancels on discovery failure', async () => {
    const onCancel = vi.fn();
    const picker = createPicker({ socket: makeSocket({ getStates: vi.fn().mockRejectedValue(new Error('x')) }) as any, initial: [], onDone: vi.fn(), onCancel });
    mountInto(picker);
    await flush();
    expect(onCancel).toHaveBeenCalled();
  });
});
