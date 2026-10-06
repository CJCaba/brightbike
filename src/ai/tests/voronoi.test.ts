import { describe, it, expect } from 'vitest';
import type { Vec } from '@/engine/types';
import { makeState } from '@/engine/tests/testUtils';
import { territory } from '../voronoi';

// 9×5 arena; both start cells are occupied, as they are in a real game
const W = 9;
const H = 5;
const grid = (extraWalls: Vec[], ...heads: Vec[]) =>
    makeState({ width: W, height: H, walls: [...heads, ...extraWalls] }).grid;

describe('territory', () => {
    it('splits a mirrored board evenly, with the middle column contested', () => {
        const me = { x: 0, y: 2 };
        const them = { x: 8, y: 2 };
        const t = territory(grid([], me, them), W, H, me, [them]);
        expect(t.mine).toBe(t.theirs);
        expect(t.contested).toBe(5);                           // x = 4, every row
        expect(t.mine + t.theirs + t.contested).toBe(W * H - 2);
        expect(t.separated).toBe(false);
    });

    it('gives more territory to the side that is closer to the middle', () => {
        const me = { x: 3, y: 2 };
        const them = { x: 8, y: 2 };
        const t = territory(grid([], me, them), W, H, me, [them]);
        expect(t.mine).toBeGreaterThan(t.theirs);
    });

    it('detects separation and counts each chamber fully', () => {
        const me = { x: 0, y: 2 };
        const them = { x: 8, y: 2 };
        const wall = Array.from({ length: H }, (_, y) => ({ x: 4, y }));
        const t = territory(grid(wall, me, them), W, H, me, [them]);
        expect(t.separated).toBe(true);
        expect(t.mine).toBe(4 * H - 1);                        // x = 0..3, minus my start
        expect(t.theirs).toBe(4 * H - 1);
        expect(t.contested).toBe(0);
    });

    it('with no opponents, every reachable cell is mine and it counts as separated', () => {
        const me = { x: 0, y: 0 };
        const t = territory(grid([], me), W, H, me, []);
        expect(t.mine).toBe(W * H - 1);
        expect(t.theirs).toBe(0);
        expect(t.separated).toBe(true);
    });
});
