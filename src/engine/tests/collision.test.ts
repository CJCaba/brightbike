import { describe, it, expect } from 'vitest';
import { cellIndex, inBounds, isCollision, step } from '../collision'

describe('collision helpers', () => {
    it('cellIndex maps (x, y) to row-major index', () => {
        expect(cellIndex(10, { x: 3, y: 2 })).toBe(23);
    });

    it('step moves one cell in the given direction', () => {
        expect(step({ x: 3, y: 2 }, 'up')).toEqual({ x: 3, y: 1 });
        expect(step({ x: 3, y: 2 }, 'down')).toEqual({ x: 3, y: 3 });
        expect(step({ x: 3, y: 2 }, 'left')).toEqual({ x: 2, y: 2 });
        expect(step({ x: 3, y: 2 }, 'right')).toEqual({ x: 4, y: 2 });
    });

    it('inBounds rejects every edge', () => {
        expect(inBounds(10, 10, { x: -1, y: 5 })).toBe(false);
        expect(inBounds(10, 10, { x: 10, y: 5 })).toBe(false);
        expect(inBounds(10, 10, { x: 5, y: -1 })).toBe(false);
        expect(inBounds(10, 10, { x: 5, y: 10 })).toBe(false);
    });

    it('isCollision is true off-grid, true on an occupied cell, false on empty cell', () => {
        const grid = new Uint8Array(100);
        grid[23] = 1; // Mark cell (3, 2) as occupied

        expect(isCollision(grid, 10, 10, { x: -1, y: 5 })).toBe(true);
        expect(isCollision(grid, 10, 10, { x: 3, y: 2 })).toBe(true);
        expect(isCollision(grid, 10, 10, { x: 5, y: 5 })).toBe(false);
    });
});