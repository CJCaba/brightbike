export const CELL_SIZE = 10;    // CSS pixels per grid cell -> 80x50 grid = 800x500px

export const COLORS = {
  background: '#05070d',
  gridLine:   'rgba(0, 229, 255, 0.06)',
  border:     'rgba(0, 229, 255, 0.5)',
  accent:     '#00e5ff',    // UI highlight (menus, pause)
  neutral:    '#e6fbff',    // UI text for draws / non-player states
} as const;

export const BIKE_COLORS: Record<number, string> = {
  1: '#448AFF',
  2: '#FF5252',
  3: '#69F0AE',
  4: '#FFD740',
};

export const PLAYER_NAMES: Record<number, string> = {
  1: 'Blue',
  2: 'Red',
  3: 'Green',
  4: 'Yellow'
};

export const FALLBACK_TRAIL_COLOR = '#888'  // Any id without a color (e.g. test walls use id 9)

/** Mix a #rrggbb color toward white by `amount` (0 = unchanged, 1 = white). */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}