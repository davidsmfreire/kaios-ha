import { customFetch, withRetry } from './fetch';
import { EntityState, ServiceCall } from './types';

export interface HaTarget {
  baseUrl: string;
  token: string;
  proxyPrefix?: string;
}

export class HaClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;

  constructor(target: HaTarget) {
    this.base = `${target.proxyPrefix ?? ''}${target.baseUrl}`;
    this.headers = { Authorization: `Bearer ${target.token}`, 'Content-Type': 'application/json' };
  }

  getStates(): Promise<EntityState[]> {
    return withRetry(() => customFetch('GET', `${this.base}/api/states`, null, this.headers)) as Promise<EntityState[]>;
  }

  async callService(call: ServiceCall): Promise<void> {
    await customFetch('POST', `${this.base}/api/services/${call.domain}/${call.service}`, call.data, this.headers);
  }

  async ping(): Promise<boolean> {
    try {
      await withRetry(() => customFetch('GET', `${this.base}/api/`, null, this.headers), 2, 300);
      return true;
    } catch {
      return false;
    }
  }
}
