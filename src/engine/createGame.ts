import type { GameConfig, GameState, Bike } from './types'
import { cellIndex } from './collision'

export function createGame(config: GameConfig): GameState {

    const gameGrid = new Uint8Array(config.width * config.height);

    const {width, height} = config;

    // Bike 1 spawns at (floor(width / 4), floor(height / 2)) facing 'right'
    const bike1: Bike = {
        id: 1,
        pos: { x: Math.floor(width / 4), y: Math.floor(height / 2) },
        dir: 'right',
        alive: true
    };

    // Bike 2 spawns at (width - 1 - floor(width / 4), floor(height / 2)) facing 'left'
    const bike2: Bike = {
        id: 2,
        pos: { x: width - 1 - Math.floor(width / 4), y: Math.floor(height / 2) },
        dir: 'left',
        alive: true
    };

    // Each bike's spawn cell is marked in the grid with its id, making the bike's current position count as part of its trail.
    gameGrid[cellIndex(width, bike1.pos)] = bike1.id;
    gameGrid[cellIndex(width, bike2.pos)] = bike2.id;

    return {
        width,
        height,
        grid: gameGrid,
        bikes: [bike1, bike2],
        tick: 0,
        status: 'waiting',
        winner: null
    };
};

export function startGame(state: GameState): GameState{
    // Returns a copy with status set to 'running'. UI will countdown to begin the game
    return {
        ...state,
        status: 'running'
    };
};
