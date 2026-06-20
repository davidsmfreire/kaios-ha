import { describe, it, expect } from 'vitest';
import { renderTile } from './tile';
import { EntityState } from '../ha/types';
import { TileConfig } from '../store/types';

const cfg = (entityId: string, name: string | null = null): TileConfig => ({ entityId, name, icon: null });
const st = (entity_id: string, state: string, attributes: Record<string, unknown> = {}): EntityState =>
  ({ entity_id, state, attributes });

describe('renderTile', () => {
  it('renders icon, friendly name and formatted state', () => {
    const node = renderTile(cfg('light.kitchen'), st('light.kitchen', 'on', { friendly_name: 'Kitchen', brightness: 255 }), false);
    expect(node.classList.contains('tile')).toBe(true);
    expect(node.querySelector('.ic')!.textContent).toBe('💡');
    expect(node.querySelector('.nm')!.textContent).toBe('Kitchen');
    expect(node.querySelector('.st')!.textContent).toBe('ON · 100%');
    expect(node.classList.contains('focus')).toBe(false);
  });

  it('uses tile.name override and shows dash when no state yet', () => {
    const node = renderTile(cfg('switch.fan', 'Fan'), undefined, true);
    expect(node.querySelector('.nm')!.textContent).toBe('Fan');
    expect(node.querySelector('.st')!.textContent).toBe('—');
    expect(node.classList.contains('focus')).toBe(true);
  });

  it('falls back to entity id when no name available', () => {
    const node = renderTile(cfg('sensor.temp'), st('sensor.temp', '21', { unit_of_measurement: '°C' }), false);
    expect(node.querySelector('.nm')!.textContent).toBe('sensor.temp');
    expect(node.querySelector('.st')!.textContent).toBe('21 °C');
  });
});
