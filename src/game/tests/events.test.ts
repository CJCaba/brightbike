import { describe, it, expect } from 'vitest';
import { tick } from '@/engine/tick';
import { makeState } from '@/engine/tests/testUtils';
import { diffTick } from '../events';

const ids = (bikes: { id: number }[]) => bikes.map(b => b.id);

describe('diffTick', () => {
    it('reports moves for every living bike, and turns only for bikes that turned', () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 2, y: 5 }, dir: 'right' },
            { id: 2, pos: { x: 7, y: 5 }, dir: 'left' },
        ]});
        const e = diffTick(s, tick(s, { 1: 'up' }));
        expect(ids(e.moved)).toEqual([1, 2]);
        expect(ids(e.turned)).toEqual([1]);
        expect(e.crashed).toEqual([]);
        expect(e.moved[0].pos).toEqual({ x: 2, y: 4 });   // the new trail cell
    });

    it('reports a crash once, at the crash position, with no move', () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 9, y: 5 }, dir: 'right' },  // about to hit the wall
            { id: 2, pos: { x: 2, y: 2 }, dir: 'right' },
        ]});
        const next = tick(s, {});
        const e = diffTick(s, next);
        expect(ids(e.crashed)).toEqual([1]);
        expect(e.crashed[0].pos).toEqual({ x: 9, y: 5 });
        expect(ids(e.moved)).toEqual([2]);

        // Already-dead bikes produce no further events
        expect(diffTick(next, tick(next, {})).crashed).toEqual([]);
    });

    it('reports both bikes in a head-on draw', () => {
        const s = makeState({ bikes: [
            { id: 1, pos: { x: 3, y: 5 }, dir: 'right' },
            { id: 2, pos: { x: 5, y: 5 }, dir: 'left' },
        ]});
        expect(ids(diffTick(s, tick(s, {})).crashed)).toEqual([1, 2]);
    });

    it('reports nothing when the game is not running', () => {
        const s = { ...makeState({ bikes: [{ id: 1, pos: { x: 2, y: 2 }, dir: 'right' }] }), status: 'waiting' as const };
        expect(diffTick(s, tick(s, { 1: 'up' }))).toEqual({ crashed: [], turned: [], moved: [] });
    });
});
