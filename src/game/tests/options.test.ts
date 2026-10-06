import { describe, it, expect } from 'vitest';
import { parseDifficulty, parseFirstTo, parseMode, playHref } from '../options';

describe('URL option parsing', () => {
    it('accepts known values', () => {
        expect(parseMode('ai')).toBe('ai');
        expect(parseDifficulty('hard')).toBe('hard');
        expect(parseFirstTo('5')).toBe(5);
    });

    it('falls back to defaults for missing or unknown values', () => {
        expect(parseMode(undefined)).toBe('local');
        expect(parseMode('banana')).toBe('local');
        expect(parseDifficulty('impossible')).toBe('medium');
        expect(parseFirstTo('4')).toBe(3);
        expect(parseFirstTo('abc')).toBe(3);
        expect(parseFirstTo(undefined)).toBe(3);
    });

    it('uses the first value when a param is repeated', () => {
        expect(parseMode(['ai', 'local'])).toBe('ai');
        expect(parseFirstTo(['1', '5'])).toBe(1);
    });
});

describe('playHref', () => {
    it('round-trips through the parsers', () => {
        const params = new URL(playHref('ai', 'hard', 5), 'http://x').searchParams;
        expect(parseMode(params.get('mode') ?? undefined)).toBe('ai');
        expect(parseDifficulty(params.get('difficulty') ?? undefined)).toBe('hard');
        expect(parseFirstTo(params.get('firstTo') ?? undefined)).toBe(5);
    });

    it('omits difficulty for local games', () => {
        expect(playHref('local', 'hard', 3)).toBe('/play?mode=local&firstTo=3');
    });
});
