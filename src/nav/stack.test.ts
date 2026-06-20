import { describe, it, expect, vi, afterEach } from 'vitest';
import { createStack, Screen } from './stack';

const fakeScreen = (): Screen & { mount: any; unmount: any; handleKey: any } => ({
  mount: vi.fn(),
  unmount: vi.fn(),
  handleKey: vi.fn(),
});

const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key }));

describe('createStack', () => {
  it('push mounts the new screen and unmounts the previous top', () => {
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = fakeScreen();
    const b = fakeScreen();
    stack.push(a);
    expect(a.mount).toHaveBeenCalledWith(container);
    stack.push(b);
    expect(a.unmount).toHaveBeenCalledTimes(1);
    expect(b.mount).toHaveBeenCalledWith(container);
    stack.destroy();
  });

  it('routes keys to the top screen and Back pops', () => {
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = fakeScreen();
    const b = fakeScreen();
    stack.push(a);
    stack.push(b);
    press('ArrowDown');
    expect(b.handleKey).toHaveBeenCalledWith('down');
    press('Backspace'); // pop b, remount a
    expect(b.unmount).toHaveBeenCalled();
    expect(a.mount).toHaveBeenCalledTimes(2); // initial + remount
    stack.destroy();
  });

  it('Back on the root screen closes the app (no pop), and destroy removes the listener', () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = fakeScreen();
    stack.push(a);
    press('Backspace');
    expect(a.handleKey).toHaveBeenCalledWith('back'); // root screen gets first crack at Back
    expect(a.unmount).not.toHaveBeenCalled(); // not popped at root
    expect(close).toHaveBeenCalledTimes(1); // didn't consume it → exits the app
    stack.destroy();
    expect(a.unmount).toHaveBeenCalledTimes(1); // destroy unmounts top
    a.handleKey.mockClear();
    press('ArrowUp');
    expect(a.handleKey).not.toHaveBeenCalled(); // listener removed
    close.mockRestore();
  });

  it('lets the top screen consume Back (no pop, no close) when handleKey returns true', () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = fakeScreen();
    a.handleKey.mockReturnValue(true); // e.g. a form treating Back as Cancel
    stack.push(a);
    press('Backspace');
    expect(a.handleKey).toHaveBeenCalledWith('back');
    expect(a.unmount).not.toHaveBeenCalled(); // consumed → not popped
    expect(close).not.toHaveBeenCalled(); // consumed → not closed
    stack.destroy();
    close.mockRestore();
  });
});

afterEach(() => { document.body.innerHTML = ''; });

describe('createStack — editable + reset', () => {
  it('yields typing/OK to a focused input but routes field-nav + softkeys', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const stack = createStack(container);
    const screen = { mount: vi.fn(), unmount: vi.fn(), handleKey: vi.fn() };
    stack.push(screen);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(screen.handleKey).not.toHaveBeenCalled(); // OK yielded to input
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(screen.handleKey).toHaveBeenCalledWith('down'); // field-nav routed to form
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'SoftRight' }));
    expect(screen.handleKey).toHaveBeenCalledWith('softRight'); // softkey routed
    stack.destroy();
  });

  it('reset unmounts existing screens and mounts the new one', () => {
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = { mount: vi.fn(), unmount: vi.fn(), handleKey: vi.fn() };
    const b = { mount: vi.fn(), unmount: vi.fn(), handleKey: vi.fn() };
    stack.push(a);
    stack.reset(b);
    expect(a.unmount).toHaveBeenCalledTimes(1);
    expect(b.mount).toHaveBeenCalledWith(container);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(b.handleKey).toHaveBeenCalledWith('up'); // b is now the top
    stack.destroy();
  });
});
