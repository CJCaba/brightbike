import { describe, it, expect } from 'vitest';
import { matchWinner, newMatch, recordRound } from '../match';

describe('match', () => {
    it('starts at 0–0 with no winner', () => {
        const m = newMatch(3);
        expect(m.scores).toEqual({ 1: 0, 2: 0 });
        expect(m.roundsPlayed).toBe(0);
        expect(matchWinner(m)).toBeNull();
    });

    it('a round win scores a point for the winner only', () => {
        const m = recordRound(newMatch(3), 2);
        expect(m.scores).toEqual({ 1: 0, 2: 1 });
        expect(m.roundsPlayed).toBe(1);
    });

    it('a draw scores nobody but still counts as a round played', () => {
        const m = recordRound(newMatch(3), null);
        expect(m.scores).toEqual({ 1: 0, 2: 0 });
        expect(m.roundsPlayed).toBe(1);
    });

    it('the first player to reach firstTo wins the match', () => {
        let m = newMatch(3);
        for (const w of [1, 2, 1, null, 2, 1]) m = recordRound(m, w);
        expect(m.scores).toEqual({ 1: 3, 2: 2 });
        expect(matchWinner(m)).toBe(1);
    });

    it('first to 1 is decided by a single round', () => {
        expect(matchWinner(recordRound(newMatch(1), 2))).toBe(2);
    });

    it('ignores rounds after the match is decided', () => {
        const decided = recordRound(newMatch(1), 1);
        expect(recordRound(decided, 2)).toBe(decided);
    });

    it('does not mutate the previous match (safe for React state updaters)', () => {
        const before = newMatch(3);
        recordRound(before, 1);
        expect(before.scores).toEqual({ 1: 0, 2: 0 });
        expect(before.roundsPlayed).toBe(0);
    });
});
