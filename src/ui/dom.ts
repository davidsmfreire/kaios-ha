export function el(tag: string, opts: { class?: string; text?: string; id?: string } = {}): HTMLElement {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.id) node.id = opts.id;
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// Scroll `scroller` so `child` is visible — needed because focus screens
// re-render their list each key press, resetting scrollTop. Uses bounding rects
// (Gecko 48 safe; a no-op without layout, e.g. jsdom).
export function keepInView(scroller: HTMLElement, child: HTMLElement | undefined): void {
  if (!child) return;
  const c = child.getBoundingClientRect();
  const s = scroller.getBoundingClientRect();
  if (c.top < s.top) scroller.scrollTop -= s.top - c.top;
  else if (c.bottom > s.bottom) scroller.scrollTop += c.bottom - s.bottom;
}
