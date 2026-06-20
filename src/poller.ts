import { HaClient } from './ha/client';
import { StateCache } from './store/state';

export interface Poller {
  start(): void;
  stop(): void;
}

export function createPoller(opts: {
  client: Pick<HaClient, 'getStates'>;
  cache: StateCache;
  intervalMs: number;
  onError?: (e: unknown) => void;
  onOk?: () => void;
}): Poller {
  let timer: ReturnType<typeof setInterval> | null = null;

  const fetch = () => {
    opts.client.getStates().then(
      (states) => {
        opts.cache.setAll(states);
        opts.onOk?.();
      },
      (e) => opts.onError?.(e),
    );
  };

  const schedule = () => {
    if (timer === null) timer = setInterval(fetch, opts.intervalMs);
  };

  const unschedule = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const onVisibility = () => {
    if (document.hidden) {
      unschedule();
    } else {
      fetch();
      schedule();
    }
  };

  return {
    start() {
      fetch();
      schedule();
      document.addEventListener('visibilitychange', onVisibility);
    },
    stop() {
      unschedule();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
