import { Key } from '../nav/keys';
import { Screen } from '../nav/stack';
import { el, clear } from '../ui/dom';
import { renderField } from '../ui/form';
import { renderSoftkeys } from '../ui/softkeys';
import { showToast } from '../ui/toast';
import { ServerConfig } from '../store/types';

export function createServerForm(opts: {
  existing: ServerConfig | null;
  onSave: (server: ServerConfig) => void;
  onCancel: () => void;
}): Screen {
  const { existing, onSave, onCancel } = opts;
  let container: HTMLElement;
  let nameI: HTMLInputElement;
  let urlI: HTMLInputElement;
  let tokenI: HTMLInputElement;
  let inputs: HTMLInputElement[];
  let focusIndex = 0;

  const render = () => {
    clear(container);
    container.appendChild(el('div', { class: 'ha-header' })).appendChild(el('span', { text: existing ? 'Edit server' : 'Add server' }));
    const name = renderField('Name', existing?.name ?? '');
    const url = renderField('URL', existing?.baseUrl ?? '', 'url');
    const token = renderField('Token', existing?.token ?? '', 'password');
    nameI = name.input; urlI = url.input; tokenI = token.input;
    inputs = [nameI, urlI, tokenI];
    const body = el('div', { class: 'list' });
    [name.row, url.row, token.row].forEach((r) => body.appendChild(r));
    container.appendChild(body);
    container.appendChild(renderSoftkeys('Cancel', '', 'Save'));
    inputs[focusIndex].focus();
  };

  const save = () => {
    if (!nameI.value || !urlI.value || !tokenI.value) {
      showToast(container, 'Fill all fields');
      return;
    }
    const server: ServerConfig = existing
      ? { ...existing, name: nameI.value, baseUrl: urlI.value, token: tokenI.value }
      : {
          id: 'srv_' + Date.now(),
          name: nameI.value,
          baseUrl: urlI.value,
          token: tokenI.value,
          pages: [{ id: 'pg_' + Date.now(), name: 'Home', tiles: [] }],
        };
    onSave(server);
  };

  return {
    mount(c) { container = c; render(); },
    unmount() {},
    handleKey(k: Key) {
      if (k === 'up' || k === 'down') {
        focusIndex = k === 'up' ? Math.max(0, focusIndex - 1) : Math.min(inputs.length - 1, focusIndex + 1);
        inputs[focusIndex].focus();
      } else if (k === 'softRight') save();
      else if (k === 'softLeft') onCancel();
    },
  };
}
