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
  it('moves down a column, clamps when no item below', () => {
    expect(nextIndex(0, 5, 2, 'down')).toBe(2);
    expect(nextIndex(3, 5, 2, 'down')).toBe(3); // index 5 missing
    expect(nextIndex(4, 5, 2, 'down')).toBe(4);
  });
  it('moves up a column, clamps at top', () => {
    expect(nextIndex(2, 5, 2, 'up')).toBe(0);
    expect(nextIndex(1, 5, 2, 'up')).toBe(1);
  });
});
