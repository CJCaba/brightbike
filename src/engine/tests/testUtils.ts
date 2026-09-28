import type { Bike, Direction, GameState, Vec } from '../types';
import { cellIndex } from '../collision';

export interface BikeSpec { id: number; pos: Vec; dir: Direction; alive?: boolean }

export interface MakeStateOptions {
    width?: number;     // default 10
    height?: number;    // default 10
    bikes?: BikeSpec[];
    walls?: Vec[];      // extra occupied cells (pre-existing trails)
    wallOwner?: number; // which id "owns" those cells, default 9
}

export function makeState({
    width = 10,
    height = 10,
    bikes: specs = [],
    walls = [],
    wallOwner = 9,
}: MakeStateOptions): GameState {
    // Convert specs into full Bikes (alive defaults to true, pos is copied)
    const bikes: Bike[] = specs.map(b => ({
        id: b.id,
        pos: { ...b.pos },
        dir: b.dir,
        alive: b.alive ?? true,
    }));

    const grid = new Uint8Array(width * height);
    // Mark walls first so a bike always owns the cell it sits on
    for (const wall of walls) {
        grid[cellIndex(width, wall)] = wallOwner;
    }
    // Mark each bike's current position with its ID
    for (const bike of bikes) {
        grid[cellIndex(width, bike.pos)] = bike.id;
    }

    return {
        width,
        height,
        grid,
        bikes,
        tick: 0,
        status: 'running',
        winner: null,
    };
}
