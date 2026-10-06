import { describe, it, expect } from 'vitest';
import type { Direction } from '@/engine/types';
import { OPPOSITE_DIRECTIONS } from '@/engine/constants';
import { makeState } from '@/engine/tests/testUtils';
import { avoidDanger, candidateDirs, dangerCells, safeMoves } from '../moves';

describe('candidateDirs', () => {
    it('returns 3 directions and never the reversal', () => {
        for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
            const dirs = candidateDirs(dir);
            expect(dirs).toHaveLength(3);
            expect(dirs).toContain(dir);
            expect(dirs).not.toContain(OPPOSITE_DIRECTIONS[dir]);
        }
    });
});

describe('safeMoves', () => {
    it('excludes moves off the arena', () => {
        const s = makeState({ bikes: [{ id: 1, pos: { x: 0, y: 0 }, dir: 'right' }] });
        expect(safeMoves(s, s.bikes[0]).map(m => m.dir).sort()).toEqual(['down', 'right']);
    });

    it('excludes moves into trails', () => {
        const s = makeState({
            bikes: [{ id: 1, pos: { x: 0, y: 0 }, dir: 'right' }],
            walls: [{ x: 1, y: 0 }],
        });
        const moves = safeMoves(s, s.bikes[0]);
        expect(moves).toEqual([{ dir: 'down', next: { x: 0, y: 1 } }]);
    });

    it('returns nothing when boxed in', () => {
        const s = makeState({
            bikes: [{ id: 1, pos: { x: 0, y: 0 }, dir: 'right' }],
            walls: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
        });
        expect(safeMoves(s, s.bikes[0])).toEqual([]);
    });
});

describe('dangerCells', () => {
    it("contains exactly the opponent's three possible next cells", () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 1, y: 1 }, dir: 'right' },
            { id: 2, pos: { x: 5, y: 5 }, dir: 'left' },
        ]});
        // up (5,4), left (4,5), down (5,6) — not right (6,5), that's a reversal
        expect([...dangerCells(s, 1)].sort((a, b) => a - b)).toEqual([45, 54, 65]);
    });

    it('ignores dead opponents and the bike itself', () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 1, y: 1 }, dir: 'right' },
            { id: 2, pos: { x: 5, y: 5 }, dir: 'left', alive: false },
        ]});
        expect(dangerCells(s, 1).size).toBe(0);
    });
});

describe('avoidDanger', () => {
    it('drops moves next to the opponent head when a calm move exists', () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 2, y: 5 }, dir: 'right' },
            { id: 2, pos: { x: 4, y: 5 }, dir: 'left' },    // could also enter (3,5)
        ]});
        const dirs = avoidDanger(s, 1, safeMoves(s, s.bikes[0])).map(m => m.dir);
        expect(dirs).not.toContain('right');
        expect(dirs.sort()).toEqual(['down', 'up']);
    });

    it('keeps all moves if every one is dangerous', () => {
        // Bike 1 in a corridor: only move is straight into a danger cell
        const s = makeState({
            bikes: [
                { id: 1, pos: { x: 2, y: 5 }, dir: 'right' },
                { id: 2, pos: { x: 4, y: 5 }, dir: 'left' },
            ],
            walls: [{ x: 2, y: 4 }, { x: 2, y: 6 }],
        });
        const moves = safeMoves(s, s.bikes[0]);
        expect(avoidDanger(s, 1, moves)).toEqual(moves);
    });
});
