import { Key, mapKey } from './keys';

export interface Screen {
  mount(container: HTMLElement): void;
  unmount(): void;
  handleKey(k: Key): void;
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

  const onKeydown = (e: KeyboardEvent) => {
    const k = mapKey(e);
    if (k === 'other') return;
    if (isEditable(document.activeElement) && k !== 'softLeft' && k !== 'softRight') return;
    e.preventDefault();
    if (k === 'back' && screens.length > 1) pop();
    else if (k !== 'back') top()?.handleKey(k);
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
