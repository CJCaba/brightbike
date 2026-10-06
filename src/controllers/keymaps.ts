import type { Direction } from '@/engine/types'

export type Keymap = Readonly<Record<string, Direction>>;

export const WASD: Keymap = {KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right'};
export const ARROWS: Keymap = {ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right'};

/** Single player: either key set steers the human's bike. */
export const SOLO: Keymap = { ...WASD, ...ARROWS };