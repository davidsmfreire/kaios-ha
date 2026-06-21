import { el } from './dom';

export function renderField(label: string, value: string, type = 'text'): { row: HTMLElement; input: HTMLInputElement } {
  const row = el('div', { class: 'field' });
  row.appendChild(el('div', { class: 'field-label', text: label }));
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.tabIndex = 0;
  row.appendChild(input);
  return { row, input };
}
