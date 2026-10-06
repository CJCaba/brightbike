import { describe, it, expect } from 'vitest';
import type { Vec } from '@/engine/types';
import { makeState } from '@/engine/tests/testUtils';
import { floodArea } from '../floodFill';

/** A full-height vertical wall at column x. */
const column = (x: number, height = 10): Vec[] => Array.from({ length: height }, (_, y) => ({ x, y }));

describe('floodArea', () => {
    it('counts every cell of an empty arena', () => {
        const s = makeState({});
        expect(floodArea(s.grid, 10, 10, { x: 0, y: 0 })).toBe(100);
    });

    it('counts only the side of a wall it starts on', () => {
        const s = makeState({ walls: column(4) });
        expect(floodArea(s.grid, 10, 10, { x: 0, y: 0 })).toBe(40);    // x = 0..3
        expect(floodArea(s.grid, 10, 10, { x: 9, y: 9 })).toBe(50);    // x = 5..9
    });

    it('does not wrap around the left/right edges', () => {
        // Wall at x = 1: the cell (0, y) column must not leak into x = 9 via index ±1
        const s = makeState({ walls: column(1) });
        expect(floodArea(s.grid, 10, 10, { x: 0, y: 0 })).toBe(10);
    });

    it('returns 0 for an occupied or off-grid start', () => {
        const s = makeState({ walls: [{ x: 3, y: 3 }] });
        expect(floodArea(s.grid, 10, 10, { x: 3, y: 3 })).toBe(0);
        expect(floodArea(s.grid, 10, 10, { x: -1, y: 0 })).toBe(0);
        expect(floodArea(s.grid, 10, 10, { x: 0, y: 10 })).toBe(0);
    });

    it('counts a sealed one-cell pocket as 1', () => {
        const s = makeState({ walls: [{ x: 1, y: 0 }, { x: 0, y: 1 }] });
        expect(floodArea(s.grid, 10, 10, { x: 0, y: 0 })).toBe(1);
    });
});
