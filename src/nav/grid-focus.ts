export function nextIndex(
  current: number,
  count: number,
  cols: number,
  dir: 'up' | 'down' | 'left' | 'right',
): number {
  const col = current % cols;
  if (dir === 'right') return col < cols - 1 && current + 1 < count ? current + 1 : current;
  if (dir === 'left') return col > 0 ? current - 1 : current;
  if (dir === 'down') {
    if (current + cols < count) return current + cols;
    // No tile strictly below. If a shorter last row exists, fall to its last tile.
    const lastRowStart = count - ((count - 1) % cols + 1);
    return current < lastRowStart ? count - 1 : current;
  }
  return current - cols >= 0 ? current - cols : current;
}
