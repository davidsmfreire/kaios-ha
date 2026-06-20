import { Key } from '../nav/keys';
import { nextIndex } from '../nav/grid-focus';
import { renderTile } from '../ui/tile';
import { renderSoftkeys } from '../ui/softkeys';
import { setOffline } from '../ui/banner';
import { el, clear, keepInView } from '../ui/dom';
import { createPoller, Poller } from '../poller';
import { getDomain } from '../domains/registry';
import { StateCache } from '../store/state';
import { HaClient } from '../ha/client';
import { PageConfig, TileConfig } from '../store/types';
import { Screen } from '../nav/stack';

const COLS = 2;

export function createDashboard(opts: {
  client: HaClient;
  cache: StateCache;
  page: PageConfig;
  serverName: string;
  intervalMs: number;
  onOpenDetail: (tile: TileConfig) => void;
  onMenu?: () => void;
}): Screen {
  const { client, cache, page, serverName, intervalMs, onOpenDetail, onMenu } = opts;
  let focusIndex = 0;
  let container: HTMLElement;
  let grid: HTMLElement;
  let unsubscribe: (() => void) | null = null;
  let poller: Poller | null = null;

  const renderGrid = () => {
    clear(grid);
    page.tiles.forEach((tile, i) => grid.appendChild(renderTile(tile, cache.get(tile.entityId), i === focusIndex)));
    keepInView(grid, grid.children[focusIndex] as HTMLElement | undefined);
  };

  const renderAll = () => {
    clear(container);
    const header = el('div', { class: 'ha-header' });
    header.appendChild(el('span', { text: page.name }));
    header.appendChild(el('span', { class: 'dots', text: serverName }));
    container.appendChild(header);
    grid = el('div', { class: 'grid' });
    container.appendChild(grid);
    renderGrid();
    container.appendChild(renderSoftkeys('Menu', 'OK', ''));
  };

  const act = () => {
    const tile = page.tiles[focusIndex];
    if (!tile) return;
    const domain = getDomain(tile.entityId);
    if (domain.detail) { onOpenDetail(tile); return; }
    if (!domain.primaryAction) return;
    const entity = cache.get(tile.entityId) ?? { entity_id: tile.entityId, state: 'off', attributes: {} };
    const call = domain.primaryAction(entity);
    if (call.service === 'toggle') cache.applyOptimistic(tile.entityId, entity.state === 'on' ? 'off' : 'on');
    client.callService(call).catch(() => renderGrid());
  };

  return {
    mount(c: HTMLElement) {
      container = c;
      renderAll();
      unsubscribe = cache.subscribe(renderGrid);
      poller = createPoller({
        client, cache, intervalMs,
        onError: () => setOffline(container, true),
        onOk: () => setOffline(container, false),
      });
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
      } else if (k === 'softLeft') {
        onMenu?.();
      }
    },
  };
}
