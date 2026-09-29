import type { Direction, GameState, Inputs } from '@/engine/types';

export interface Controller {
    readonly bikeId: number;
    /** Called once per tick. Return a turn, or undefined to keep going straight */
    getInput(state: Readonly<GameState>): Direction | undefined;

    /** Remove listeners / timers. Called on unmount. */
    dispose(): void;
}

/** Ask every controller for its turn this tick and build the Inputs map for tick(). */
export function collectInputs(controllers: Controller[], state: GameState): Inputs {
    const inputs: Inputs = {};
    for (const controller of controllers) {
        const input = controller.getInput(state);
        if (input !== undefined) {
            inputs[controller.bikeId] = input;
        }
    }
    return inputs;
}