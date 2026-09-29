import type { Direction } from '@/engine/types';
import { OPPOSITE_DIRECTIONS } from '@/engine/constants';

export class InputQueue { 
    private queue: Direction[] = [];

    constructor(private readonly maxSize = 2) {}

    push(direction: Direction) {
        // Ignore if same as last queued entry
        if (this.queue.length > 0 && this.queue[this.queue.length - 1] === direction) return;
        // Ignore if queue is full
        if (this.queue.length >= this.maxSize) return;
        this.queue.push(direction);
    }

    /** Next USEFUL turn for a bike currently facing `current`, or undefined. */
    next(current: Direction): Direction | undefined {
        // Shift entries off the front, DISCARDING any that are 
        // === current (no-op) or === OPPOSITE_DIRECTIONS[current] (would be rejected)
        // return the first one that's a real turn
        while (this.queue.length > 0) {
            const direction = this.queue[0];
            if (direction === current) {
                this.queue.shift();
                continue;
            }
            if (direction === OPPOSITE_DIRECTIONS[current]) {
                this.queue.shift();
                continue;
            }
            return this.queue.shift();
            
        }
        return undefined;
    }

    clear(): void { this.queue = []; }
}