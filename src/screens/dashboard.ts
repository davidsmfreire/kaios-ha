import { Key } from '../nav/keys';
import { nextIndex } from '../nav/grid-focus';
import { renderTile } from '../ui/tile';
import { renderSoftkeys } from '../ui/softkeys';
import { el, clear } from '../ui/dom';
import { createPoller, Poller } from '../poller';
import { getDomain } from '../domains/registry';
import { StateCache } from '../store/state';
import { HaClient } from '../ha/client';
import { PageConfig } from '../store/types';

const COLS = 2;

export interface Dashboard {
  mount(): void;
  unmount(): void;
  handleKey(k: Key): void;
}

export function createDashboard(opts: {
  root: HTMLElement;
  client: HaClient;
  cache: StateCache;
  page: PageConfig;
  serverName: string;
  intervalMs: number;
}): Dashboard {
  const { root, client, cache, page, serverName, intervalMs } = opts;
  let focusIndex = 0;
  let grid: HTMLElement;
  let unsubscribe: (() => void) | null = null;
  let poller: Poller | null = null;

  const renderGrid = () => {
    clear(grid);
    page.tiles.forEach((tile, i) => {
      grid.appendChild(renderTile(tile, cache.get(tile.entityId), i === focusIndex));
    });
  };

  const renderAll = () => {
    clear(root);
    const header = el('div', { class: 'ha-header' });
    header.appendChild(el('span', { text: page.name }));
    header.appendChild(el('span', { class: 'dots', text: serverName }));
    root.appendChild(header);
    grid = el('div', { class: 'grid' });
    root.appendChild(grid);
    renderGrid();
    root.appendChild(renderSoftkeys('Menu', 'Toggle', ''));
  };

  const act = () => {
    const tile = page.tiles[focusIndex];
    if (!tile) return;
    const domain = getDomain(tile.entityId);
    if (!domain.primaryAction) return;
    const entity = cache.get(tile.entityId) ?? { entity_id: tile.entityId, state: 'off', attributes: {} };
    const call = domain.primaryAction(entity);
    if (call.service === 'toggle') {
      cache.applyOptimistic(tile.entityId, entity.state === 'on' ? 'off' : 'on');
    }
    client.callService(call).catch(() => renderGrid());
  };

  return {
    mount() {
      renderAll();
      unsubscribe = cache.subscribe(renderGrid);
      poller = createPoller({ client, cache, intervalMs });
      poller.start();
    },
    unmount() {
      poller?.stop();
      unsubscribe?.();
    },
    handleKey(k: Key) {
      if (k === 'up' || k === 'down' || k === 'left' || k === 'right') {
        focusIndex = nextIndex(focusIndex, page.tiles.length, COLS, k);
        renderGrid();
      } else if (k === 'ok') {
        act();
      }
    },
  };
}
