export function customFetch(
  method: string,
  url: string,
  data: unknown,
  headers: Record<string, string> = {},
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // mozSystem bypasses CORS in KaiOS (old Gecko only).
    // @ts-ignore - mozSystem is a non-standard XHR option
    const xhr = new XMLHttpRequest({ mozSystem: true });
    xhr.open(method, url, true);
    Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, headers[k]));
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
      } else {
        reject(new Error(`Request failed: ${xhr.status}`));
      }
    };
    xhr.send(data ? JSON.stringify(data) : undefined);
  });
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastError;
}
