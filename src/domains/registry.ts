import { EntityState, ServiceCall } from '../ha/types';

export interface DomainDef {
  icon: string;
  formatState(s: EntityState): string;
  primaryAction: ((s: EntityState) => ServiceCall) | null;
  detail: 'cover' | 'climate' | 'light' | null;
}

export function domainOf(entityId: string): string {
  return entityId.slice(0, entityId.indexOf('.'));
}

const onOff = (s: EntityState) => (s.state === 'on' ? 'ON' : 'OFF');
const toggle = (domain: string) => (s: EntityState): ServiceCall =>
  ({ domain, service: 'toggle', data: { entity_id: s.entity_id } });
const run = (domain: string) => (s: EntityState): ServiceCall =>
  ({ domain, service: 'turn_on', data: { entity_id: s.entity_id } });

export const DOMAINS: Record<string, DomainDef> = {
  light: {
    icon: '💡',
    formatState: (s) => {
      if (s.state !== 'on') return 'OFF';
      const b = s.attributes.brightness;
      return typeof b === 'number' ? `ON · ${Math.round((b / 255) * 100)}%` : 'ON';
    },
    primaryAction: toggle('light'),
    detail: 'light',
  },
  switch: { icon: '🔌', formatState: onOff, primaryAction: toggle('switch'), detail: null },
  script: { icon: '▶️', formatState: (s) => (s.state === 'on' ? 'RUNNING' : 'RUN'), primaryAction: run('script'), detail: null },
  scene: { icon: '🎬', formatState: () => 'ACTIVATE', primaryAction: run('scene'), detail: null },
  cover: { icon: '🚪', formatState: (s) => s.state.toUpperCase(), primaryAction: null, detail: 'cover' },
  climate: {
    icon: '🌡️',
    formatState: (s) => {
      const t = s.attributes.current_temperature;
      return typeof t === 'number' ? `${s.state} · ${t}°` : s.state;
    },
    primaryAction: null,
    detail: 'climate',
  },
  sensor: {
    icon: '📈',
    formatState: (s) => {
      const unit = s.attributes.unit_of_measurement;
      return typeof unit === 'string' ? `${s.state} ${unit}` : s.state;
    },
    primaryAction: null,
    detail: null,
  },
  binary_sensor: { icon: '⚪', formatState: onOff, primaryAction: null, detail: null },
};

const FALLBACK: DomainDef = { icon: '❔', formatState: (s) => s.state, primaryAction: null, detail: null };

export function getDomain(entityId: string): DomainDef {
  return DOMAINS[domainOf(entityId)] ?? FALLBACK;
}
