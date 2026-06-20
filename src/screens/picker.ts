import { Key } from '../nav/keys';
import { Screen } from '../nav/stack';
import { el, clear, keepInView } from '../ui/dom';
import { renderSoftkeys } from '../ui/softkeys';
import { showToast } from '../ui/toast';
import { getDomain, domainOf } from '../domains/registry';
import { HaClient } from '../ha/client';
import { EntityState } from '../ha/types';
import { TileConfig } from '../store/types';

export function createPicker(opts: {
  client: HaClient;
  initial: TileConfig[];
  onDone: (tiles: TileConfig[]) => void;
  onCancel: () => void;
  fetchLovelace?: () => Promise<Set<string>>;
}): Screen {
  const { client, initial, onDone, onCancel, fetchLovelace } = opts;
  const selected = new Set(initial.map((t) => t.entityId));
  let container: HTMLElement;
  let entities: EntityState[] = [];
  let focusIndex = 0;

  const render = () => {
    clear(container);
    container.appendChild(el('div', { class: 'ha-header' })).appendChild(el('span', { text: 'Pick entities' }));
    const list = el('div', { class: 'list' });
    entities.forEach((e, i) => {
      const row = el('div', { class: i === focusIndex ? 'item focus' : 'item' });
      const name = typeof e.attributes.friendly_name === 'string' ? (e.attributes.friendly_name as string) : e.entity_id;
      row.appendChild(el('span', { text: `${selected.has(e.entity_id) ? '☑' : '☐'} ${getDomain(e.entity_id).icon} ${name}` }));
      row.appendChild(el('span', { class: 'tag', text: domainOf(e.entity_id) }));
      list.appendChild(row);
    });
    container.appendChild(list);
    container.appendChild(renderSoftkeys('Back', 'Toggle', 'Done'));
    keepInView(list, list.children[focusIndex] as HTMLElement | undefined);
  };

  return {
    mount(c) {
      container = c;
      clear(container);
      container.appendChild(el('div', { class: 'empty', text: 'Discovering…' }));
      Promise.all([client.getStates(), fetchLovelace ? fetchLovelace() : Promise.resolve(new Set<string>())]).then(
        ([s, lovelace]) => {
          // Show all entities, but list the ones on the Lovelace dashboard first.
          entities = lovelace.size
            ? [...s.filter((e) => lovelace.has(e.entity_id)), ...s.filter((e) => !lovelace.has(e.entity_id))]
            : s;
          render();
        },
        () => { showToast(container, 'Discovery failed'); onCancel(); },
      );
    },
    unmount() {},
    handleKey(k: Key) {
      if (k === 'up') { focusIndex = Math.max(0, focusIndex - 1); render(); }
      else if (k === 'down') { focusIndex = Math.min(entities.length - 1, focusIndex + 1); render(); }
      else if (k === 'ok') {
        const e = entities[focusIndex];
        if (!e) return;
        if (selected.has(e.entity_id)) selected.delete(e.entity_id);
        else selected.add(e.entity_id);
        render();
      } else if (k === 'softRight') {
        onDone([...selected].map((entityId) => ({ entityId, name: null, icon: null })));
      } else if (k === 'softLeft') {
        onCancel();
      }
    },
  };
}
