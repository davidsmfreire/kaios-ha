export function nextIndex(
  current: number,
  count: number,
  cols: number,
  dir: 'up' | 'down' | 'left' | 'right',
): number {
  const col = current % cols;
  if (dir === 'right') return col < cols - 1 && current + 1 < count ? current + 1 : current;
  if (dir === 'left') return col > 0 ? current - 1 : current;
  if (dir === 'down') return current + cols < count ? current + cols : current;
  return current - cols >= 0 ? current - cols : current;
}
