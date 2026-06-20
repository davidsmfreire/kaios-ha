const FRAME_CSS = `
html { background: #2c2c2c; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
body { width: 240px; height: 320px; overflow: hidden; border: 1px solid #555; flex-shrink: 0; }
`;

const KEY_REMAP: Record<string, string> = {
  '[': 'SoftLeft',
  ']': 'SoftRight',
};

function dispatch(key: string): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

export function installDevEmulator(): void {
  const frame = document.createElement('style');
  frame.textContent = FRAME_CSS;
  document.head.appendChild(frame);

  const cursor = document.createElement('style');
  cursor.textContent = '.softkeys span { cursor: pointer; }';
  document.head.appendChild(cursor);

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!e.isTrusted) return;
    const mapped = KEY_REMAP[e.key];
    if (!mapped) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    dispatch(mapped);
  }, true);

  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const bar = target.closest('.softkeys');
    if (!bar) return;
    const spans = bar.querySelectorAll('span');
    if (spans[0] && (target === spans[0] || spans[0].contains(target))) { dispatch('SoftLeft'); return; }
    if (spans[2] && (target === spans[2] || spans[2].contains(target))) { dispatch('SoftRight'); return; }
    if (spans[1] && (target === spans[1] || spans[1].contains(target))) { dispatch('Enter'); }
  });
}
