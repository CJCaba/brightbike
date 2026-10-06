import { describe, it, expect } from 'vitest';
import type { GameState } from '@/engine/types';
import { GRID_HEIGHT, GRID_WIDTH, TICKS_PER_SECOND } from '@/engine/constants';
import { createGame, startGame } from '@/engine/createGame';
import { tick } from '@/engine/tick';
import { mulberry32 } from '../rng';
import { easy, hard, medium, type Strategy } from '../strategies';

// Whole AI-vs-AI games on the real 80×50 arena, in plain Node.
// Seeds are fixed and the engine is deterministic, so these results are identical on
// every run: this is not a flaky statistical test. The numbers only change when the
// AI changes — and then this tells you whether it got stronger or weaker.

const GAMES = 50;
const MAX_TICKS = 5000;

/** Plays one game; returns the winning bike id or null for a draw. */
function playMatch(p1: Strategy, p2: Strategy, seed: number): number | null {
    let s: GameState = startGame(createGame({ width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND }));
    const rng1 = mulberry32(seed);
    const rng2 = mulberry32(seed * 7919 + 1);

    // Random opening: both bikes play `easy` for 5–24 ticks. Medium and hard are almost
    // deterministic (randomness only breaks exact ties), so without this, different seeds
    // replay the same few games (measured: 8 distinct games in 200 for hard vs medium).
    const openingRng = mulberry32(seed * 104729 + 7);
    const openingTicks = 5 + Math.floor(openingRng() * 20);

    while (s.status === 'running' && s.tick < MAX_TICKS) {
        const [b1, b2] = s.bikes;
        const inOpening = s.tick < openingTicks;
        s = tick(s, inOpening
            ? { 1: easy(s, b1, openingRng), 2: easy(s, b2, openingRng) }
            : { 1: p1(s, b1, rng1), 2: p2(s, b2, rng2) });
    }
    return s.winner;
}

/** Fraction of games `a` wins against `b`, alternating spawn sides each game. */
function winRate(a: Strategy, b: Strategy): number {
    let wins = 0;
    for (let seed = 1; seed <= GAMES; seed++) {
        const aIsP1 = seed % 2 === 1;
        const winner = aIsP1 ? playMatch(a, b, seed) : playMatch(b, a, seed);
        if (winner === (aIsP1 ? 1 : 2)) wins++;
    }
    return wins / GAMES;
}

// Thresholds sit below the measured rates (200 games each, with openings):
// medium–easy 94.5%, hard–easy 100%, hard–medium 96.5%.
describe('AI arena (seeded, deterministic)', () => {
    it('medium beats easy', () => {
        expect(winRate(medium, easy)).toBeGreaterThanOrEqual(0.8);
    }, 60_000);

    it('hard beats easy', () => {
        expect(winRate(hard, easy)).toBeGreaterThanOrEqual(0.9);
    }, 60_000);

    it('hard beats medium', () => {
        expect(winRate(hard, medium)).toBeGreaterThanOrEqual(0.8);
    }, 120_000);
});
