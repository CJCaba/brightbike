import type { Vec } from '@/engine/types';
import { cellIndex, isCollision } from '@/engine/collision';

/**
 * Number of empty cells reachable from `start` (4-directional), including `start`.
 * Returns 0 if `start` is outside the arena or occupied.
 *
 * Works on flat cell indices with typed arrays (no per-cell object allocation),
 * so it stays fast enough to run several times per tick.
 */
export function floodArea(grid: Uint8Array, width: number, height: number, start: Vec): number {
    if (isCollision(grid, width, height, start)) return 0;

    const size = width * height;
    const visited = new Uint8Array(size);
    const stack = new Int32Array(size);     // each cell is pushed at most once
    let top = 0;
    let count = 0;

    const visit = (j: number) => {
        if (grid[j] === 0 && visited[j] === 0) {
            visited[j] = 1;
            stack[top++] = j;
        }
    };

    visit(cellIndex(width, start));
    while (top > 0) {
        const i = stack[--top];
        count++;
        const x = i % width;
        if (x > 0) visit(i - 1);                // left
        if (x < width - 1) visit(i + 1);        // right
        if (i >= width) visit(i - width);       // up
        if (i < size - width) visit(i + width); // down
    }
    return count;
}
