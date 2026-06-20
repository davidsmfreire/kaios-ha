import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast } from './toast';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('showToast', () => {
  it('appends a toast and removes it after the timeout', () => {
    const root = document.createElement('div');
    showToast(root, 'Saved', 2000);
    const toast = root.querySelector('.toast');
    expect(toast).not.toBeNull();
    expect(toast!.textContent).toBe('Saved');
    vi.advanceTimersByTime(2000);
    expect(root.querySelector('.toast')).toBeNull();
  });
});
