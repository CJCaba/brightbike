import type { Direction, Vec } from './types'
import { DIRECTION_VECTORS} from './constants'

/** Convert (x, y) to an index in the flat grid array */
export function cellIndex(width: number, p: Vec) {
    return p.y * width + p.x;
}

/** Is p inside the grid bounds? */
export function inBounds(width: number, height: number, p: Vec) {
    return p.x >= 0 && p.x < width && p.y >= 0 && p.y < height;
}

/** Position one cell ahead of p in direction dir */
export function step(p: Vec, dir: Direction): Vec {
    const delta = DIRECTION_VECTORS[dir];
    return { x: p.x + delta.x, y: p.y + delta.y };
}

/** True if p is outside the arena OR already occupied by any trail. */
export function isCollision(grid: Uint8Array, width: number, height: number, p: Vec): boolean {
    if (!inBounds(width, height, p)) {
        return true;
    }
    return grid[cellIndex(width, p)] !== 0;
}