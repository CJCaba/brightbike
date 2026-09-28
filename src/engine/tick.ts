import type { GameState, Inputs, Vec }  from './types'
import { OPPOSITE_DIRECTIONS } from './constants'
import { cellIndex, isCollision, step, inBounds } from './collision'

export function tick(state: GameState, inputs: Inputs): GameState {
    if (state.status !== 'running') return state;

    // Copy the grid and bikes
    const grid = new Uint8Array(state.grid);
    const bikes = state.bikes.map(bike => ({ ...bike }));
    const width = state.width;
    const height = state.height;

    const nextPositions = new Map<number, Vec>();

    for (const bike of bikes) {
        if (!bike.alive) continue;
        // Phase 1  - apply turns
        const input = inputs[bike.id];
        if (input && input !== OPPOSITE_DIRECTIONS[bike.dir]) {
            bike.dir = input;
        }
        // Phase 2 - compute next positions for alive bikes (don't move them yet)
        const nextStep = step(bike.pos, bike.dir);
        nextPositions.set(bike.id, nextStep);
    }

    // Phase 3a - isCollision(...) against the grid AS IT WAS before any offical movement
    const cellCounts = new Map<number, number>();
    for (const [, vec] of nextPositions.entries()) {
        const idx = cellIndex(width, vec);
        if (inBounds(width, height, vec)) {
            cellCounts.set(idx, (cellCounts.get(idx) ?? 0) + 1);
        }
    }

    for (const bike of bikes) {
        if (!bike.alive) continue;

        const nextPos = nextPositions.get(bike.id);

        if (!nextPos) continue;
        // Phase 3b - two or more alive bikes with the same next cell -> all of them die
        if (isCollision(grid, width, height, nextPos)) {
            bike.alive = false;
        }
        if ((cellCounts.get(cellIndex(width, nextPos)) ?? 0) > 1) {
            bike.alive = false;
        }
    }

    // Phase 4 - Move survivors; update pos, write id into grid at the new cell
    for (const bike of bikes) {
        if (!bike.alive) continue;

        const nextPos = nextPositions.get(bike.id);
        if (!nextPos) continue;

        if (inBounds(width, height, nextPos)) {
            bike.pos = nextPos;
            grid[cellIndex(width, nextPos)] = bike.id;
        }
    }

    // Phase 5 - resolve outcome
    // 0 Alive -> 'game-over', winner null
    // 1 Alive -> 'game-over', winner the remaining bike
    // 2+ -> keep 'running'

    const aliveBikes = bikes.filter(bike => bike.alive);
    
    if (aliveBikes.length === 0) {
        return { ...state, grid, bikes, tick: state.tick + 1, status: 'game-over', winner: null };
    } else if (aliveBikes.length === 1) {
        return { ...state, grid, bikes, tick: state.tick + 1, status: 'game-over', winner: aliveBikes[0].id };
    } else {
        return { ...state, grid, bikes, tick: state.tick + 1, status: 'running' };
    }
}