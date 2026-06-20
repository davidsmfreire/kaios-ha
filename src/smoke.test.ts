import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest in jsdom with localStorage available', () => {
    localStorage.setItem('k', 'v');
    expect(localStorage.getItem('k')).toBe('v');
  });
});
