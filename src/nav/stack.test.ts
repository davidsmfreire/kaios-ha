import { describe, it, expect, vi } from 'vitest';
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

  it('Back is a no-op with a single screen, and destroy removes the listener', () => {
    const container = document.createElement('div');
    const stack = createStack(container);
    const a = fakeScreen();
    stack.push(a);
    press('Backspace');
    expect(a.unmount).not.toHaveBeenCalled(); // not popped
    stack.destroy();
    expect(a.unmount).toHaveBeenCalledTimes(1); // destroy unmounts top
    press('ArrowUp');
    expect(a.handleKey).not.toHaveBeenCalled(); // listener removed
  });
});
