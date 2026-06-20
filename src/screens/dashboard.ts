import { Key } from '../nav/keys';
import { nextIndex } from '../nav/grid-focus';
import { renderTile } from '../ui/tile';
import { renderSoftkeys } from '../ui/softkeys';
import { setOffline } from '../ui/banner';
import { el, clear, keepInView } from '../ui/dom';
import { getDomain } from '../domains/registry';
import { StateCache } from '../store/state';
import { HaSocket } from '../ha/socket';
import { PageConfig, TileConfig } from '../store/types';
import { Screen } from '../nav/stack';

const COLS = 2;

export function createDashboard(opts: {
  socket: HaSocket;
  cache: StateCache;
  page: PageConfig;
  serverName: string;
  onOpenDetail: (tile: TileConfig) => void;
  onMenu?: () => void;
}): Screen {
  const { socket, cache, page, serverName, onOpenDetail, onMenu } = opts;
  let focusIndex = 0;
  let container: HTMLElement;
  let grid: HTMLElement;
  let unsubCache: (() => void) | null = null;
  let unsubStatus: (() => void) | null = null;

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
    socket.callService(call).catch(() => renderGrid());
  };

  return {
    mount(c: HTMLElement) {
      container = c;
      renderAll();
      unsubCache = cache.subscribe(renderGrid);
      unsubStatus = socket.onStatus((connected) => setOffline(container, !connected));
    },
    unmount() {
      unsubCache?.();
      unsubStatus?.();
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
