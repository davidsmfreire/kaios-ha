import { describe, it, expect } from 'vitest';
import { collectLovelaceEntities } from './lovelace';

describe('collectLovelaceEntities', () => {
  it('collects entities in dashboard order with name overrides', () => {
    const config = {
      views: [{
        cards: [
          { type: 'entities', entities: ['light.kitchen', { entity: 'switch.fan', name: 'Fan' }] },
          { type: 'button', entity: 'light.kitchen', name: 'Kitchen Light' }, // dup id, supplies a name
          { type: 'light', entity: 'cover.garage' },
          { type: 'markdown', content: 'hello world' },
        ],
      }],
    };
    const out = collectLovelaceEntities(config);
    expect(out.map((e) => e.id)).toEqual(['light.kitchen', 'switch.fan', 'cover.garage']);
    expect(out.find((e) => e.id === 'switch.fan')!.name).toBe('Fan');
    expect(out.find((e) => e.id === 'light.kitchen')!.name).toBe('Kitchen Light');
    expect(out.find((e) => e.id === 'cover.garage')!.name).toBeUndefined();
  });
});
