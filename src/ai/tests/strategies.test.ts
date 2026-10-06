import { describe, it, expect } from 'vitest';
import type { Vec } from '@/engine/types';
import { makeState, type BikeSpec } from '@/engine/tests/testUtils';
import { mulberry32 } from '../rng';
import { easy, hard, medium, type Strategy } from '../strategies';

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

/** Every decision `strategy` makes for bike 1 across many seeds. */
function choices(strategy: Strategy, bikes: BikeSpec[], walls: Vec[] = [], width = 10, height = 10) {
    const s = makeState({ width, height, bikes, walls });
    return new Set(SEEDS.map(seed => strategy(s, s.bikes[0], mulberry32(seed))));
}

// Bike at (4,4) facing up; straight ahead is a sealed 3-cell pocket at x = 4, y = 1..3
const POCKET_WALLS: Vec[] = [
    { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 },
    { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
    { x: 4, y: 0 },
];
const INTO_POCKET: BikeSpec[] = [{ id: 1, pos: { x: 4, y: 4 }, dir: 'up' }];

describe('easy', () => {
    it('never picks a blocked move when a safe one exists', () => {
        // At (0,0) facing right with a wall ahead: only 'down' is safe
        expect(choices(easy, [{ id: 1, pos: { x: 0, y: 0 }, dir: 'right' }], [{ x: 1, y: 0 }]))
            .toEqual(new Set(['down']));
    });

    it('keeps its direction when there is no safe move', () => {
        const walls = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
        expect(choices(easy, [{ id: 1, pos: { x: 0, y: 0 }, dir: 'right' }], walls))
            .toEqual(new Set(['right']));
    });

    it('only looks one cell ahead, so it usually drives into the pocket', () => {
        expect(choices(easy, INTO_POCKET, POCKET_WALLS)).toContain('up');
    });
});

describe('medium', () => {
    it('avoids the dead-end pocket', () => {
        const picks = choices(medium, INTO_POCKET, POCKET_WALLS);
        expect(picks).not.toContain('up');
    });

    it('avoids stepping next to the opponent head when another move exists', () => {
        const picks = choices(medium, [
            { id: 1, pos: { x: 2, y: 5 }, dir: 'right' },
            { id: 2, pos: { x: 4, y: 5 }, dir: 'left' },
        ]);
        expect(picks).not.toContain('right');
    });

    it('prefers going straight when all moves are equally good', () => {
        expect(choices(medium, [{ id: 1, pos: { x: 5, y: 5 }, dir: 'left' }])).toEqual(new Set(['left']));
    });
});

describe('hard', () => {
    // 11×7 arena split by a wall at x = 5 (y = 0..5); the only gap is (5, 6).
    // Bike 1 at (4,5) facing left; the opponent is far away on the other side.
    const GAP_WALL: Vec[] = Array.from({ length: 6 }, (_, y) => ({ x: 5, y }));
    const NEAR_GAP: BikeSpec[] = [
        { id: 1, pos: { x: 4, y: 5 }, dir: 'left' },
        { id: 2, pos: { x: 8, y: 1 }, dir: 'down' },
    ];

    it('moves toward the gap to claim the most territory', () => {
        expect(choices(hard, NEAR_GAP, GAP_WALL, 11, 7)).toEqual(new Set(['down']));
    });

    it('…where medium just keeps going straight (equal flood areas)', () => {
        expect(choices(medium, NEAR_GAP, GAP_WALL, 11, 7)).toEqual(new Set(['left']));
    });

    it('also avoids the dead-end pocket', () => {
        expect(choices(hard, INTO_POCKET, POCKET_WALLS)).not.toContain('up');
    });
});

describe('determinism', () => {
    it('same seed → same sequence of decisions', () => {
        const s = makeState({ bikes: [{ id: 1, pos: { x: 5, y: 5 }, dir: 'right' }] });
        const run = () => {
            const rng = mulberry32(42);
            return Array.from({ length: 20 }, () => easy(s, s.bikes[0], rng));
        };
        expect(run()).toEqual(run());
    });
});
