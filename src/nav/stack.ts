import { Key, mapKey } from './keys';

export interface Screen {
  mount(container: HTMLElement): void;
  unmount(): void;
  // Return true to consume the key. Only consulted for 'back': a screen can
  // treat Back as its own Cancel instead of letting the stack pop/close.
  handleKey(k: Key): void | boolean;
}

export interface Stack {
  push(screen: Screen): void;
  pop(): void;
  reset(screen: Screen): void;
  destroy(): void;
}

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

export function createStack(container: HTMLElement): Stack {
  const screens: Screen[] = [];
  const top = () => screens[screens.length - 1] as Screen | undefined;

  const push = (screen: Screen) => {
    top()?.unmount();
    screens.push(screen);
    screen.mount(container);
  };

  const pop = () => {
    if (screens.length <= 1) return;
    screens.pop()!.unmount();
    top()!.mount(container);
  };

  const reset = (screen: Screen) => {
    while (screens.length) screens.pop()!.unmount();
    screens.push(screen);
    screen.mount(container);
  };

  // Keys the app still drives while a text input is focused: field navigation
  // (up/down) and softkeys (Save/Cancel). Everything else — typing, OK, cursor
  // left/right, Backspace-delete — yields to the input for native text entry.
  const ROUTED_WHILE_EDITING = new Set<Key>(['up', 'down', 'softLeft', 'softRight']);

  const onKeydown = (e: KeyboardEvent) => {
    const k = mapKey(e);
    if (k === 'other') return;
    if (isEditable(document.activeElement) && !ROUTED_WHILE_EDITING.has(k)) return;
    e.preventDefault();
    if (k === 'back') {
      if (top()?.handleKey(k)) return; // screen consumed Back (e.g. the form treats it as Cancel)
      if (screens.length > 1) pop();
      else window.close(); // root screen: exit the app (KaiOS back-to-close)
    } else {
      top()?.handleKey(k);
    }
  };

  document.addEventListener('keydown', onKeydown);

  return {
    push,
    pop,
    reset,
    destroy() {
      while (screens.length) screens.pop()!.unmount();
      document.removeEventListener('keydown', onKeydown);
    },
  };
}
