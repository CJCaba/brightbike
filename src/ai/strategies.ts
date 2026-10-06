import type { Bike, Direction, GameState } from '@/engine/types';
import { cellIndex } from '@/engine/collision';
import type { Rng } from './rng';
import { avoidDanger, safeMoves, type Move } from './moves';
import { floodArea } from './floodFill';
import { territory } from './voronoi';

/** Given the game and the AI's own (alive) bike, choose a direction for this tick. */
export type Strategy = (state: Readonly<GameState>, bike: Bike, rng: Rng) => Direction;

/** Easy keeps going straight this often when straight is safe. */
const EASY_STRAIGHT_CHANCE = 0.9;

/** Territory difference dominates; reachable area only breaks ties (area ≤ 4000 cells). */
const TERRITORY_WEIGHT = 10_000;

/**
 * Highest score wins. Ties prefer going straight, then are broken randomly
 * (so mirrored situations don't always play out identically).
 */
function choose(moves: Move[], current: Direction, score: (m: Move) => number, rng: Rng): Direction {
    let best = -Infinity;
    let ties: Move[] = [];
    for (const m of moves) {
        const s = score(m) * 2 + (m.dir === current ? 1 : 0);
        if (s > best) {
            best = s;
            ties = [m];
        } else if (s === best) {
            ties.push(m);
        }
    }
    return ties[Math.floor(rng() * ties.length)].dir;
}

/** Easy: only looks one cell ahead. Mostly straight, sometimes a random safe turn. */
export const easy: Strategy = (state, bike, rng) => {
    const moves = safeMoves(state, bike);
    if (moves.length === 0) return bike.dir;   // doomed either way

    const straightIsSafe = moves.some(m => m.dir === bike.dir);
    if (straightIsSafe && rng() < EASY_STRAIGHT_CHANCE) return bike.dir;
    return moves[Math.floor(rng() * moves.length)].dir;
};

/** Medium: take the move with the most reachable space; avoid head-on cells. */
export const medium: Strategy = (state, bike, rng) => {
    const moves = avoidDanger(state, bike.id, safeMoves(state, bike));
    if (moves.length === 0) return bike.dir;

    return choose(moves, bike.dir, m => floodArea(state.grid, state.width, state.height, m.next), rng);
};

/**
 * Hard: maximize territory (cells I reach before any opponent − cells they reach first).
 * Once the bikes are walled off from each other, `mine` is simply my chamber's size,
 * so the same score turns into "keep as much space for myself as possible".
 */
export const hard: Strategy = (state, bike, rng) => {
    const moves = avoidDanger(state, bike.id, safeMoves(state, bike));
    if (moves.length === 0) return bike.dir;

    const { width, height } = state;
    const opponents = state.bikes.filter(b => b.alive && b.id !== bike.id).map(b => b.pos);
    const grid = new Uint8Array(state.grid);   // scratch copy: occupy each candidate cell in turn

    return choose(moves, bike.dir, m => {
        const i = cellIndex(width, m.next);
        grid[i] = bike.id;
        const t = territory(grid, width, height, m.next, opponents);
        grid[i] = 0;
        return (t.mine - t.theirs) * TERRITORY_WEIGHT + floodArea(state.grid, width, height, m.next);
    }, rng);
};
