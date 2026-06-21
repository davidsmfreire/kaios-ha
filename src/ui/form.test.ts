import { describe, it, expect } from 'vitest';
import { renderField } from './form';

describe('renderField', () => {
  it('builds a labeled input with the initial value', () => {
    const { row, input } = renderField('URL', 'http://x', 'url');
    expect(row.classList.contains('field')).toBe(true);
    expect(row.querySelector('.field-label')!.textContent).toBe('URL');
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('url');
    expect(input.value).toBe('http://x');
    expect(input.tabIndex).toBe(0);
    expect(row.contains(input)).toBe(true);
  });

  it('defaults type to text', () => {
    expect(renderField('Name', '').input.type).toBe('text');
  });
});
