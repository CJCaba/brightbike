import { describe, it, expect } from 'vitest';
import { InputQueue } from '../InputQueue';

describe('InputQueue', () => {
    it('Return undefined when the queue is empty', () => {
        const queue = new InputQueue();
        expect(queue.next('right')).toBeUndefined();
    });

    it('Single Turn', () => {
        const queue = new InputQueue();
        queue.push('up');
        expect(queue.next('right')).toBe('up');
    });

    it('U-turn across two ticks', () => {
        const queue = new InputQueue();
        queue.push('up');
        queue.push('left');
        expect(queue.next('right')).toBe('up');
        expect(queue.next('up')).toBe('left');
    });

    it('Skips no-op inputs', () => {
        const queue = new InputQueue();
        queue.push('right');
        queue.push('up');
        expect(queue.next('right')).toBe('up');
    });

    it('Skips reversal', () => {
        const queue = new InputQueue();
        queue.push('left');
        queue.push('up');
        expect(queue.next('right')).toBe('up');
    });

    it('Only useless entries', () => {
        const queue = new InputQueue();
        queue.push('left');
        expect(queue.next('right')).toBeUndefined();
    });

    it('Duplicate press ignored', () => {
        const queue = new InputQueue();
        queue.push('up');
        queue.push('up');
        queue.push('left');
        expect(queue.next('right')).toBe('up');
        expect(queue.next('up')).toBe('left');
    });

    it('Max size respected', () => {
        const queue = new InputQueue(2);
        queue.push('up');
        queue.push('left');
        queue.push('down');
        expect(queue.next('right')).toBe('up');
        expect(queue.next('up')).toBe('left');
        expect(queue.next('left')).toBeUndefined();
    });

    it('Returned turn is consumed', () => {
        const queue = new InputQueue();
        queue.push('up');
        expect(queue.next('right')).toBe('up');
        expect(queue.next('right')).toBeUndefined();
    });

    it('Consumed turn frees capacity', () => {
        const queue = new InputQueue(2);
        queue.push('up');
        expect(queue.next('right')).toBe('up');
        queue.push('left');
        queue.push('down');
        expect(queue.next('up')).toBe('left');
        expect(queue.next('left')).toBe('down');
    });

    it('Clear', () => {
        const queue = new InputQueue();
        queue.push('up');
        queue.clear();
        expect(queue.next('right')).toBeUndefined();
    });
});