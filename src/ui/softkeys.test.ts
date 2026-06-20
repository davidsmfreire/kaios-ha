import { describe, it, expect } from 'vitest';
import { renderSoftkeys } from './softkeys';

describe('renderSoftkeys', () => {
  it('renders three labels in order', () => {
    const bar = renderSoftkeys('Menu', 'Toggle', 'Page');
    expect(bar.classList.contains('softkeys')).toBe(true);
    const spans = bar.querySelectorAll('span');
    expect(Array.from(spans).map((s) => s.textContent)).toEqual(['Menu', 'Toggle', 'Page']);
  });
});
