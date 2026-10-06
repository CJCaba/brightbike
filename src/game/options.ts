// Game setup options and URL parsing. Kept free of controller/DOM imports so the
// server-rendered /play page can use it without pulling in browser-only code.

export const GAME_MODES = ['local', 'ai'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_MODE: GameMode = 'local';
export const DEFAULT_DIFFICULTY: Difficulty = 'medium';

type SearchParamValue = string | string[] | undefined;

/** Return `value` if it's one of `allowed`, otherwise `fallback`. Repeated params use the first. */
function oneOf<T extends string>(value: SearchParamValue, allowed: readonly T[], fallback: T): T {
    const v = Array.isArray(value) ? value[0] : value;
    return allowed.find(a => a === v) ?? fallback;
}

export const parseMode = (value: SearchParamValue): GameMode =>
    oneOf(value, GAME_MODES, DEFAULT_MODE);

export const parseDifficulty = (value: SearchParamValue): Difficulty =>
    oneOf(value, DIFFICULTIES, DEFAULT_DIFFICULTY);
