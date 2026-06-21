import { describe, it, expect } from 'vitest';
import { mapKey } from './keys';

describe('mapKey', () => {
  it('maps arrows, enter, softkeys and back', () => {
    expect(mapKey({ key: 'ArrowUp' })).toBe('up');
    expect(mapKey({ key: 'ArrowDown' })).toBe('down');
    expect(mapKey({ key: 'ArrowLeft' })).toBe('left');
    expect(mapKey({ key: 'ArrowRight' })).toBe('right');
    expect(mapKey({ key: 'Enter' })).toBe('ok');
    expect(mapKey({ key: 'SoftLeft' })).toBe('softLeft');
    expect(mapKey({ key: 'SoftRight' })).toBe('softRight');
    expect(mapKey({ key: 'Backspace' })).toBe('back');
    expect(mapKey({ key: 'a' })).toBe('other');
  });
});
