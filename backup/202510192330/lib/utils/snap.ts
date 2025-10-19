/**
 * Snap a value to the nearest grid point
 */
export function snapToGrid(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap coordinates to grid
 */
export function snapCoordinates(
  x: number,
  y: number,
  gridSize: number,
  enabled: boolean
): { x: number; y: number } {
  return {
    x: snapToGrid(x, gridSize, enabled),
    y: snapToGrid(y, gridSize, enabled),
  };
}
