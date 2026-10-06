// Game setup options and URL parsing. Kept free of controller/DOM imports so the
// server-rendered /play page can use it without pulling in browser-only code.

export const GAME_MODES = ['local', 'ai'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Match length: first player to win this many rounds wins the match. */
export const FIRST_TO_OPTIONS = [1, 3, 5] as const;
export type FirstTo = (typeof FIRST_TO_OPTIONS)[number];

export const DEFAULT_MODE: GameMode = 'local';
export const DEFAULT_DIFFICULTY: Difficulty = 'medium';
export const DEFAULT_FIRST_TO: FirstTo = 3;

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

export function parseFirstTo(value: SearchParamValue): FirstTo {
    const v = Number(Array.isArray(value) ? value[0] : value);
    return FIRST_TO_OPTIONS.find(n => n === v) ?? DEFAULT_FIRST_TO;
}

/** The /play URL for a game setup (the menu builds links with this). */
export function playHref(mode: GameMode, difficulty: Difficulty, firstTo: FirstTo): string {
    const params = new URLSearchParams({ mode, firstTo: String(firstTo) });
    if (mode === 'ai') params.set('difficulty', difficulty);
    return `/play?${params}`;
}
