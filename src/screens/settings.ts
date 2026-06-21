import { Key } from '../nav/keys';
import { Screen } from '../nav/stack';
import { el, clear, keepInView } from '../ui/dom';
import { renderSoftkeys } from '../ui/softkeys';
import { AppConfig } from '../store/types';

export function createSettings(opts: {
  config: AppConfig;
  onAddServer: () => void;
  onEditServer: () => void;
  onEditEntities: () => void;
  onSetActive: (serverId: string) => void;
  onClose: () => void;
}): Screen {
  const { config, onAddServer, onEditServer, onEditEntities, onSetActive, onClose } = opts;
  const actions: Array<() => void> = [
    ...config.servers.map((s) => () => onSetActive(s.id)),
    onAddServer,
    onEditServer,
    onEditEntities,
  ];
  const labels = [
    ...config.servers.map((s) => `${s.name}${s.id === config.activeServerId ? ' ●' : ''}`),
    '+ Add server',
    'Edit server',
    'Edit entities',
  ];
  let container: HTMLElement;
  let focusIndex = 0;

  const render = () => {
    clear(container);
    container.appendChild(el('div', { class: 'ha-header' })).appendChild(el('span', { text: 'Settings' }));
    const list = el('div', { class: 'list' });
    labels.forEach((label, i) => list.appendChild(el('div', { class: i === focusIndex ? 'item focus' : 'item', text: label })));
    container.appendChild(list);
    container.appendChild(renderSoftkeys('Back', 'Select', ''));
    keepInView(list, list.children[focusIndex] as HTMLElement | undefined);
  };

  return {
    mount(c) { container = c; render(); },
    unmount() {},
    handleKey(k: Key) {
      if (k === 'up') { focusIndex = Math.max(0, focusIndex - 1); render(); }
      else if (k === 'down') { focusIndex = Math.min(actions.length - 1, focusIndex + 1); render(); }
      else if (k === 'ok') { actions[focusIndex](); }
      else if (k === 'softLeft') { onClose(); }
    },
  };
}
