import { Direction, Vec } from './types';

export const GRID_WIDTH = 80;
export const GRID_HEIGHT = 50;
export const TICKS_PER_SECOND = 15;

export const DIRECTION_VECTORS: Record<Direction, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};