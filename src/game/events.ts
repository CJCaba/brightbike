import type { Bike, GameState } from '@/engine/types';

/** What happened between two consecutive game states (drives effects and sound). */
export interface TickEvents {
    /** Bikes that were alive before and are dead now (positions = where they crashed). */
    crashed: Bike[];
    /** Living bikes whose direction changed. */
    turned: Bike[];
    /** Living bikes that moved into a new cell (their `pos` is the new trail cell). */
    moved: Bike[];
}

/** Compare two states from consecutive ticks. Pure: no side effects, inputs untouched. */
export function diffTick(prev: GameState, next: GameState): TickEvents {
    const events: TickEvents = { crashed: [], turned: [], moved: [] };
    for (const after of next.bikes) {
        const before = prev.bikes.find(b => b.id === after.id);
        if (!before || !before.alive) continue;

        if (!after.alive) {
            events.crashed.push(after);
            continue;
        }
        if (after.dir !== before.dir) events.turned.push(after);
        if (after.pos.x !== before.pos.x || after.pos.y !== before.pos.y) events.moved.push(after);
    }
    return events;
}
