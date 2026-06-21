import { el } from './dom';

export function setOffline(container: HTMLElement, offline: boolean): void {
  const existing = container.querySelector('.offline-banner');
  if (offline && !existing) {
    container.insertBefore(el('div', { class: 'offline-banner', text: 'Offline — reconnecting…' }), container.firstChild);
  } else if (!offline && existing) {
    existing.remove();
  }
}
