import { el } from './dom';

export function renderSoftkeys(left: string, center: string, right: string): HTMLElement {
  const bar = el('div', { class: 'softkeys' });
  bar.appendChild(el('span', { text: left }));
  const c = el('span', { text: center });
  c.style.fontWeight = '700';
  bar.appendChild(c);
  bar.appendChild(el('span', { text: right }));
  return bar;
}
