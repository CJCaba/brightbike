import type { Bike, Direction, GameState, Vec } from '@/engine/types';
import { OPPOSITE_DIRECTIONS } from '@/engine/constants';
import { cellIndex, inBounds, isCollision, step } from '@/engine/collision';

const ALL_DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left'];

/** A direction the bike could take, and the cell it would move into. */
export interface Move {
    dir: Direction;
    next: Vec;
}

/** The 3 directions a bike may choose: straight, left, right (never a reversal). */
export function candidateDirs(dir: Direction): Direction[] {
    return ALL_DIRECTIONS.filter(d => d !== OPPOSITE_DIRECTIONS[dir]);
}

/** Candidate moves whose next cell is inside the arena and not occupied. */
export function safeMoves(state: Readonly<GameState>, bike: Bike): Move[] {
    return candidateDirs(bike.dir)
        .map(dir => ({ dir, next: step(bike.pos, dir) }))
        .filter(m => !isCollision(state.grid, state.width, state.height, m.next));
}

/**
 * Cell indices any living opponent could move into next tick.
 * Entering one of these risks a same-cell collision (a draw).
 */
export function dangerCells(state: Readonly<GameState>, bikeId: number): Set<number> {
    const cells = new Set<number>();
    for (const other of state.bikes) {
        if (!other.alive || other.id === bikeId) continue;
        for (const dir of candidateDirs(other.dir)) {
            const p = step(other.pos, dir);
            if (inBounds(state.width, state.height, p)) cells.add(cellIndex(state.width, p));
        }
    }
    return cells;
}

/** Drop moves into danger cells, unless that would leave no moves at all. */
export function avoidDanger(state: Readonly<GameState>, bikeId: number, moves: Move[]): Move[] {
    const danger = dangerCells(state, bikeId);
    const calm = moves.filter(m => !danger.has(cellIndex(state.width, m.next)));
    return calm.length > 0 ? calm : moves;
}
