import { describe, it, expect } from 'vitest';
import { setOffline } from './banner';

describe('setOffline', () => {
  it('shows, does not duplicate, and hides the banner', () => {
    const root = document.createElement('div');
    setOffline(root, true);
    expect(root.querySelectorAll('.offline-banner')).toHaveLength(1);
    setOffline(root, true); // idempotent
    expect(root.querySelectorAll('.offline-banner')).toHaveLength(1);
    setOffline(root, false);
    expect(root.querySelector('.offline-banner')).toBeNull();
  });

  it('inserts the banner as the first child', () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('span'));
    setOffline(root, true);
    expect((root.firstChild as HTMLElement).className).toBe('offline-banner');
  });
});
