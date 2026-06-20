export type Key = 'up' | 'down' | 'left' | 'right' | 'ok' | 'softLeft' | 'softRight' | 'back' | 'other';

const MAP: Record<string, Key> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'ok',
  SoftLeft: 'softLeft',
  SoftRight: 'softRight',
  Backspace: 'back',
};

export function mapKey(e: { key: string }): Key {
  return MAP[e.key] ?? 'other';
}
