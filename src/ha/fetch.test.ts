import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { customFetch, withRetry } from './fetch';

class MockXHR {
  static last: MockXHR;
  method = ''; url = ''; body: string | null = null;
  headers: Record<string, string> = {};
  status = 200; responseText = '{"ok":true}'; readyState = 0;
  onreadystatechange: (() => void) | null = null;
  constructor() { MockXHR.last = this; }
  open(method: string, url: string) { this.method = method; this.url = url; }
  setRequestHeader(k: string, v: string) { this.headers[k] = v; }
  send(body?: string) {
    this.body = body ?? null;
    this.readyState = 4;
    this.onreadystatechange?.();
  }
}

beforeEach(() => { (globalThis as any).XMLHttpRequest = MockXHR; (MockXHR as any).DONE = 4; });
afterEach(() => { vi.restoreAllMocks(); });

describe('customFetch', () => {
  it('resolves parsed JSON on 2xx and sets method/url/headers/body', async () => {
    const p = customFetch('POST', 'http://x/api', { a: 1 }, { Authorization: 'Bearer t' });
    const result = await p;
    expect(result).toEqual({ ok: true });
    expect(MockXHR.last.method).toBe('POST');
    expect(MockXHR.last.url).toBe('http://x/api');
    expect(MockXHR.last.headers.Authorization).toBe('Bearer t');
    expect(MockXHR.last.body).toBe('{"a":1}');
  });

  it('rejects on non-2xx status', async () => {
    (globalThis as any).XMLHttpRequest = class extends MockXHR { status = 401; };
    await expect(customFetch('GET', 'http://x/api', null)).rejects.toThrow('401');
  });
});

describe('withRetry', () => {
  it('retries until success', async () => {
    let n = 0;
    const fn = vi.fn(async () => { if (++n < 3) throw new Error('flaky'); return 'ok'; });
    expect(await withRetry(fn, 3, 0)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting attempts', async () => {
    const fn = vi.fn(async () => { throw new Error('down'); });
    await expect(withRetry(fn, 2, 0)).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
