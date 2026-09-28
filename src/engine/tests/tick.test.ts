import { describe, it, expect } from 'vitest';
import { tick } from '../tick';
import { makeState } from './testUtils';

describe('tick', () => {
    it('moves a bike one cell forward and leaves a trail', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 5}, dir: 'left' },
        ]});
        const next = tick(s, {});
        expect(next.bikes[0].pos).toEqual({ x: 3, y: 5 });
        expect(next.grid[5 * 10 + 2]).toBe(1);  // old cell still has trail
        expect(next.grid[5 * 10 + 3]).toBe(1);  // new cell has trail
        expect(next.tick).toBe(1);
    });

    it('declares a draw when both bikes enter the same cell', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 3, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 5, y: 5}, dir: 'left' },
        ]});
        // Both bikes target (4, 5) on the same tick
        const next = tick(s, {});
        expect(next.bikes.every(b => !b.alive)).toBe(true);
        expect(next.grid[5 * 10 + 4]).toBe(0);  // neither bike claims the contested cell
        expect(next.status).toBe('game-over');
        expect(next.winner).toBe(null);
    });

    it('applies a valid turn', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 5}, dir: 'left' },
        ]});
        const next = tick(s, { 1: 'up' });
        expect(next.bikes[0].dir).toBe('up');
        expect(next.bikes[0].pos).toEqual({ x: 2, y: 4 });
    });

    it('ignores a 180-degree turn', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 5}, dir: 'left' },
        ]});
        // Bike 1 is facing right, so attempting to turn left should be ignored
        const next = tick(s, { 1: 'left' });
        expect(next.bikes[0].dir).toBe('right');
        expect(next.bikes[0].pos).toEqual({ x: 3, y: 5 });
    });

    it('dies hitting the boundary', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 9, y: 5}, dir: 'right' },
        ]});
        // Bike 2 is at the boundary and will die, Bike 1 will survive
        const next = tick(s, {});
        expect(next.bikes[0].alive).toBe(true);
        expect(next.bikes[1].alive).toBe(false);
        expect(next.status).toBe('game-over');
        expect(next.winner).toBe(1);
    });

    it('dies hitting an opponents trail', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 3, y: 5}, dir: 'up' },
        ]});
        // Bike 1 drives into the cell bike 2 is leaving (now bike 2's trail)
        const next = tick(s, {});
        expect(next.bikes[0].alive).toBe(false);
        expect(next.bikes[1].alive).toBe(true);
        expect(next.status).toBe('game-over');
        expect(next.winner).toBe(2);
    });

    it('dies hitting its own trail', () => {
        // Pre-draw a piece of bike 1's own trail directly in front of it
        const s = makeState({
            bikes: [
                {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
                {id: 2, pos: { x: 7, y: 1}, dir: 'left' },
            ],
            walls: [{ x: 3, y: 5 }],
            wallOwner: 1,
        });
        const next = tick(s, {});
        expect(next.bikes[0].alive).toBe(false);
        expect(next.bikes[1].alive).toBe(true);
        expect(next.winner).toBe(2);
    });

    it('dies hitting its own trail after looping back (multi-tick)', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 1}, dir: 'left' },   // row 1, out of bike 1's way
        ]});
        // tick() returns a new state, so each call must build on the previous result
        let st = s;
        st = tick(st, {});           // (3,5)
        st = tick(st, { 1: 'up' });  // (3,4)
        st = tick(st, { 1: 'left' });// (2,4)
        expect(st.bikes[0].alive).toBe(true);
        st = tick(st, { 1: 'down' });// (2,5) is where bike 1 started → own trail
        expect(st.bikes[0].alive).toBe(false);
        expect(st.bikes[1].alive).toBe(true);
        expect(st.winner).toBe(2);
    });

    it('head swap is a collision', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 4, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 5, y: 5}, dir: 'left' },
        ]});
        // Both bikes are moving towards each other
        // Results in a head-on collision, leading to a draw
        const next = tick(s, {});
        expect(next.bikes[0].alive).toBe(false);
        expect(next.bikes[1].alive).toBe(false);
        expect(next.status).toBe('game-over');
        expect(next.winner).toBe(null);
    });

    it('simultaneous deaths in different places', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 0, y: 5}, dir: 'left' },
            {id: 2, pos: { x: 9, y: 5}, dir: 'right' },
        ]});
        // Both bikes are moving towards different wall boundaries
        // at the same time, resulting in simultaneous deaths
        const next = tick(s, {});
        expect(next.bikes[0].alive).toBe(false);
        expect(next.bikes[1].alive).toBe(false);
        expect(next.status).toBe('game-over');
        expect(next.winner).toBe(null);
    });

    it('dead bikes do not move or leave trails', () => {
        // Start with bike 2 already dead in a RUNNING game, so the
        // status guard can't make this test pass by accident
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 2}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 5}, dir: 'left', alive: false },
        ]});
        const next = tick(s, { 2: 'up' });
        expect(next.bikes[1].pos).toEqual({ x: 7, y: 5 });
        expect(next.bikes[1].dir).toBe('left');
        expect(next.grid[5 * 10 + 7]).toBe(2);  // old trail remains
        expect(next.grid[5 * 10 + 6]).toBe(0);  // (6,5): no trail straight ahead
        expect(next.grid[4 * 10 + 7]).toBe(0);  // (7,4): no trail if 'up' were applied
    });

    it('does nothing unless the game is running', () => {
        for (const status of ['waiting', 'paused'] as const) {
            const s = {
                ...makeState({ bikes: [
                    {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
                    {id: 2, pos: { x: 7, y: 5}, dir: 'left' },
                ]}),
                status,
            };
            expect(tick(s, { 1: 'up' })).toEqual(s);
        }
    });

    it('does not mutate the input state', () => {
        const s = makeState({ bikes: [
            {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
            {id: 2, pos: { x: 7, y: 5}, dir: 'left' },
        ]});
        const gridBefore = s.grid.slice();
        const bikesBefore = s.bikes.map(b => ({ ...b, pos: { ...b.pos } }));

        tick(s, { 1: 'up' });

        expect(s.grid).toEqual(gridBefore);
        expect(s.bikes).toEqual(bikesBefore);
        expect(s.tick).toBe(0);
        expect(s.status).toBe('running');
    });

    it('game over freezes the tick counter', () => {
        const s = {
            ...makeState({ bikes: [
                {id: 1, pos: { x: 2, y: 5}, dir: 'right' },
                {id: 2, pos: { x: 7, y: 5}, dir: 'left', alive: false },
            ]}),
            status: 'game-over' as const,
            winner: 1,
            tick: 7,
        };
        const next = tick(s, {});
        expect(next.tick).toBe(7);
        expect(next.bikes[0].pos).toEqual({ x: 2, y: 5 });
    });
});
