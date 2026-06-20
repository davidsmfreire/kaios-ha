import { describe, it, expect, vi } from 'vitest';
import { createServerForm } from './server-form';

const mountInto = (s: { mount: (c: HTMLElement) => void }) => { const c = document.createElement('div'); document.body.appendChild(c); s.mount(c); return c; };

describe('server form', () => {
  it('up/down move focus between fields without losing typed values', () => {
    const form = createServerForm({ existing: null, onSave: vi.fn(), onCancel: vi.fn() });
    const c = mountInto(form);
    const inputs = c.querySelectorAll('input');
    (inputs[0] as HTMLInputElement).value = 'Cabin';
    form.handleKey('down');
    expect(document.activeElement).toBe(inputs[1]);
    form.handleKey('down');
    expect(document.activeElement).toBe(inputs[2]);
    form.handleKey('down'); // clamp at last
    expect(document.activeElement).toBe(inputs[2]);
    form.handleKey('up');
    expect(document.activeElement).toBe(inputs[1]);
    expect((inputs[0] as HTMLInputElement).value).toBe('Cabin'); // not lost to a re-render
  });

  it('saves a new server built from the field values', () => {
    const onSave = vi.fn();
    const form = createServerForm({ existing: null, onSave, onCancel: vi.fn() });
    const c = mountInto(form);
    const inputs = c.querySelectorAll('input');
    (inputs[0] as HTMLInputElement).value = 'Cabin';
    (inputs[1] as HTMLInputElement).value = 'http://ha.local:8123';
    (inputs[2] as HTMLInputElement).value = 'tok';
    form.handleKey('softRight');
    expect(onSave).toHaveBeenCalledTimes(1);
    const server = onSave.mock.calls[0][0];
    expect(server.name).toBe('Cabin');
    expect(server.baseUrl).toBe('http://ha.local:8123');
    expect(server.token).toBe('tok');
    expect(server.pages).toHaveLength(1);
    expect(server.id).toBeTruthy();
  });

  it('does not save when a field is empty', () => {
    const onSave = vi.fn();
    const form = createServerForm({ existing: null, onSave, onCancel: vi.fn() });
    mountInto(form);
    form.handleKey('softRight');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('cancel calls onCancel', () => {
    const onCancel = vi.fn();
    const form = createServerForm({ existing: null, onSave: vi.fn(), onCancel });
    mountInto(form);
    form.handleKey('softLeft');
    expect(onCancel).toHaveBeenCalled();
  });

  it('editing preserves id and pages', () => {
    const existing = { id: 's1', name: 'Old', baseUrl: 'http://o', token: 'x', pages: [{ id: 'p1', name: 'Home', tiles: [{ entityId: 'light.a', name: null, icon: null }] }] };
    const onSave = vi.fn();
    const form = createServerForm({ existing, onSave, onCancel: vi.fn() });
    const c = mountInto(form);
    (c.querySelectorAll('input')[0] as HTMLInputElement).value = 'New';
    form.handleKey('softRight');
    const server = onSave.mock.calls[0][0];
    expect(server.id).toBe('s1');
    expect(server.pages[0].tiles).toHaveLength(1);
    expect(server.name).toBe('New');
  });
});
