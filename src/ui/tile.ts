import { EntityState } from '../ha/types';
import { TileConfig } from '../store/types';
import { getDomain } from '../domains/registry';
import { el } from './dom';

export function renderTile(tile: TileConfig, entity: EntityState | undefined, focused: boolean): HTMLElement {
  const domain = getDomain(tile.entityId);
  const node = el('div', { class: focused ? 'tile focus' : 'tile' });

  node.appendChild(el('div', { class: 'ic', text: tile.icon ?? domain.icon }));

  const friendly = entity && typeof entity.attributes.friendly_name === 'string'
    ? (entity.attributes.friendly_name as string)
    : undefined;
  node.appendChild(el('div', { class: 'nm', text: tile.name ?? friendly ?? tile.entityId }));

  node.appendChild(el('div', { class: 'st', text: entity ? domain.formatState(entity) : '—' }));
  return node;
}
