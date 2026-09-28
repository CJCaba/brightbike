export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Vec {
  x: number;
  y: number;
}

export interface Bike {
    id: number;
    pos: Vec;
    dir: Direction;
    alive: boolean;
}

export type GameStatus = 'waiting' | 'running' | 'paused' | 'game-over';

export interface GameState {
    width: number;
    height: number;
    grid: Uint8Array;
    bikes: Bike[];
    tick: number;
    status: GameStatus;
    winner: number | null;    // null + status 'game-over' = draw
}

export type Inputs = Partial<Record<number, Direction>>;

export interface GameConfig {
    width: number;
    height: number;
    tickRate: number;
}