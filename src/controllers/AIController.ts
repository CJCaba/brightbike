import type { Direction, GameState } from '@/engine/types';
import type { Rng } from '@/ai/rng';
import type { Strategy } from '@/ai/strategies';
import type { Controller } from './Controller';

/** Drives a bike with an AI strategy. Plugs into the loop exactly like a keyboard. */
export class AIController implements Controller {
    constructor(
        readonly bikeId: number,
        private readonly strategy: Strategy,
        private readonly rng: Rng,
    ) {}

    getInput(state: Readonly<GameState>): Direction | undefined {
        const bike = state.bikes.find(b => b.id === this.bikeId);
        if (!bike || !bike.alive) return undefined;

        const dir = this.strategy(state, bike, this.rng);
        return dir === bike.dir ? undefined : dir;   // "straight" means no input
    }

    dispose(): void {
        // Nothing to clean up (no listeners or timers), but the interface requires it.
    }
}
