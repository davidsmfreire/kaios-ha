import { Key } from '../nav/keys';
import { Screen } from '../nav/stack';
import { el, clear } from '../ui/dom';
import { renderSoftkeys } from '../ui/softkeys';
import { showToast } from '../ui/toast';
import { getDomain, domainOf } from '../domains/registry';
import { StateCache } from '../store/state';
import { HaClient } from '../ha/client';
import { TileConfig } from '../store/types';

const CLIMATE_MODES = ['off', 'heat', 'cool', 'auto'];

export function createDetail(opts: { client: HaClient; cache: StateCache; tile: TileConfig; onBack: () => void }): Screen {
  const { client, cache, tile, onBack } = opts;
  const id = tile.entityId;
  const serviceDomain = domainOf(id);
  const domain = getDomain(id);
  const entity = cache.get(id);
  let container: HTMLElement;

  let temp = typeof entity?.attributes.temperature === 'number' ? (entity.attributes.temperature as number) : 20;
  let bright = entity && typeof entity.attributes.brightness === 'number'
    ? Math.round(((entity.attributes.brightness as number) / 255) * 100) : 100;
  let modeIndex = entity ? Math.max(0, CLIMATE_MODES.indexOf(entity.state)) : 0;

  const name = tile.name
    ?? (entity && typeof entity.attributes.friendly_name === 'string' ? (entity.attributes.friendly_name as string) : id);

  const call = (service: string, data: Record<string, unknown>, toast: string) => {
    client.callService({ domain: serviceDomain, service, data: { entity_id: id, ...data } })
      .then(() => showToast(container, toast))
      .catch(() => showToast(container, 'Failed'));
  };

  const render = () => {
    clear(container);
    const header = el('div', { class: 'ha-header' });
    header.appendChild(el('span', { text: name }));
    header.appendChild(el('span', { class: 'dots', text: '✕' }));
    container.appendChild(header);

    const body = el('div', { class: 'detail' });
    body.appendChild(el('div', { class: 'bigic', text: tile.icon ?? domain.icon }));

    if (domain.detail === 'cover') {
      body.appendChild(el('div', { class: 'ctlbtn', text: '▲ Open' }));
      body.appendChild(el('div', { class: 'ctlbtn', text: '■ Stop (OK)' }));
      body.appendChild(el('div', { class: 'ctlbtn', text: '▼ Close' }));
      container.appendChild(body);
      container.appendChild(renderSoftkeys('Back', 'Stop', ''));
    } else if (domain.detail === 'climate') {
      body.appendChild(el('div', { class: 'arrow', text: '▲' }));
      body.appendChild(el('div', { class: 'bigval', text: `${temp}°` }));
      body.appendChild(el('div', { class: 'arrow', text: '▼' }));
      body.appendChild(el('div', { class: 'mode', text: CLIMATE_MODES[modeIndex] }));
      container.appendChild(body);
      container.appendChild(renderSoftkeys('Back', '± temp', 'Mode'));
    } else {
      body.appendChild(el('div', { class: 'bigval', text: `${bright}%` }));
      body.appendChild(el('div', { class: 'arrow', text: '◀  brightness  ▶' }));
      container.appendChild(body);
      container.appendChild(renderSoftkeys('Back', 'Toggle', ''));
    }
  };

  return {
    mount(c: HTMLElement) {
      container = c;
      render();
    },
    unmount() {},
    handleKey(k: Key) {
      if (k === 'softLeft') { onBack(); return; }
      if (domain.detail === 'cover') {
        if (k === 'up') call('open_cover', {}, 'Opening');
        else if (k === 'ok') call('stop_cover', {}, 'Stopping');
        else if (k === 'down') call('close_cover', {}, 'Closing');
      } else if (domain.detail === 'climate') {
        if (k === 'up' || k === 'down') {
          temp += k === 'up' ? 1 : -1;
          render();
          call('set_temperature', { temperature: temp }, `${temp}°`);
        } else if (k === 'softRight') {
          modeIndex = (modeIndex + 1) % CLIMATE_MODES.length;
          render();
          call('set_hvac_mode', { hvac_mode: CLIMATE_MODES[modeIndex] }, CLIMATE_MODES[modeIndex]);
        }
      } else {
        if (k === 'left' || k === 'right') {
          bright = k === 'right' ? Math.min(100, bright + 10) : Math.max(0, bright - 10);
          render();
          call('turn_on', { brightness_pct: bright }, `${bright}%`);
        } else if (k === 'ok') {
          call('toggle', {}, 'Toggled');
        }
      }
    },
  };
}
