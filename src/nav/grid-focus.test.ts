import { describe, it, expect } from 'vitest';
import { nextIndex } from './grid-focus';

// 5 items, 2 columns:  [0 1 / 2 3 / 4]
describe('nextIndex (2-col grid)', () => {
  it('moves right within a row, clamps at row end', () => {
    expect(nextIndex(0, 5, 2, 'right')).toBe(1);
    expect(nextIndex(1, 5, 2, 'right')).toBe(1); // end of row
  });
  it('moves left within a row, clamps at row start', () => {
    expect(nextIndex(1, 5, 2, 'left')).toBe(0);
    expect(nextIndex(0, 5, 2, 'left')).toBe(0);
  });
  it('moves down a column', () => {
    expect(nextIndex(0, 5, 2, 'down')).toBe(2);
    expect(nextIndex(2, 5, 2, 'down')).toBe(4);
  });
  it('falls to the last tile when the cell strictly below is missing but a shorter last row exists', () => {
    expect(nextIndex(3, 5, 2, 'down')).toBe(4); // [0 1 / 2 3 / 4] — no 5, drop to 4
    expect(nextIndex(5, 7, 2, 'down')).toBe(6); // [0 1 / 2 3 / 4 5 / 6] — no 7, drop to 6
  });
  it('stays put on the last row (nothing below)', () => {
    expect(nextIndex(4, 5, 2, 'down')).toBe(4);
    expect(nextIndex(4, 6, 2, 'down')).toBe(4); // full last row, even count unaffected
    expect(nextIndex(5, 6, 2, 'down')).toBe(5);
  });
  it('moves up a column, clamps at top', () => {
    expect(nextIndex(2, 5, 2, 'up')).toBe(0);
    expect(nextIndex(1, 5, 2, 'up')).toBe(1);
  });
});
