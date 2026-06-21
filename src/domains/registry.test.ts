import { describe, it, expect } from 'vitest';
import { domainOf, getDomain } from './registry';
import { EntityState } from '../ha/types';

const st = (id: string, state: string, attributes: Record<string, unknown> = {}): EntityState =>
  ({ entity_id: id, state, attributes });

describe('domainOf', () => {
  it('extracts the domain prefix', () => {
    expect(domainOf('light.kitchen')).toBe('light');
    expect(domainOf('binary_sensor.door')).toBe('binary_sensor');
  });
  it('returns the whole id when there is no dot (no dropped char)', () => {
    expect(domainOf('weird')).toBe('weird');
  });
});

describe('getDomain', () => {
  it('light toggles and formats brightness percentage', () => {
    const def = getDomain('light.kitchen');
    expect(def.formatState(st('light.kitchen', 'on', { brightness: 128 }))).toBe('ON · 50%');
    expect(def.formatState(st('light.kitchen', 'off'))).toBe('OFF');
    expect(def.primaryAction!(st('light.kitchen', 'on'))).toEqual({ domain: 'light', service: 'toggle', data: { entity_id: 'light.kitchen' } });
    expect(def.detail).toBe('light');
  });

  it('switch toggles, no detail', () => {
    const def = getDomain('switch.fan');
    expect(def.primaryAction!(st('switch.fan', 'off'))).toEqual({ domain: 'switch', service: 'toggle', data: { entity_id: 'switch.fan' } });
    expect(def.detail).toBeNull();
  });

  it('script runs via turn_on', () => {
    const def = getDomain('script.garage');
    expect(def.primaryAction!(st('script.garage', 'off'))).toEqual({ domain: 'script', service: 'turn_on', data: { entity_id: 'script.garage' } });
  });

  it('cover opens a detail screen and has no primary action', () => {
    const def = getDomain('cover.garage_door');
    expect(def.primaryAction).toBeNull();
    expect(def.detail).toBe('cover');
    expect(def.formatState(st('cover.garage_door', 'open'))).toBe('OPEN');
  });

  it('sensor is read-only and shows value with unit', () => {
    const def = getDomain('sensor.temp');
    expect(def.primaryAction).toBeNull();
    expect(def.formatState(st('sensor.temp', '21', { unit_of_measurement: '°C' }))).toBe('21 °C');
  });

  it('unknown domain falls back to read-only', () => {
    const def = getDomain('weather.home');
    expect(def.primaryAction).toBeNull();
    expect(def.detail).toBeNull();
    expect(def.formatState(st('weather.home', 'sunny'))).toBe('sunny');
  });
});
