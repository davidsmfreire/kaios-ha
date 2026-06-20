import { el } from './dom';

export function showToast(container: HTMLElement, message: string, ms = 2000): void {
  const toast = el('div', { class: 'toast', text: message });
  container.appendChild(toast);
  setTimeout(() => toast.remove(), ms);
}
