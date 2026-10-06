// Match scoring across rounds. Pure functions: React calls state updaters twice in
// Strict Mode, so recording a round must not have side effects.

export interface Match {
    /** Rounds needed to win the match. */
    firstTo: number;
    /** Round wins per bike id. Draws score for nobody. */
    scores: Record<number, number>;
    /** Rounds finished so far, including draws. */
    roundsPlayed: number;
}

export function newMatch(firstTo: number, playerIds: readonly number[] = [1, 2]): Match {
    return {
        firstTo,
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        roundsPlayed: 0,
    };
}

/** The match winner's id, or null while the match is still going. */
export function matchWinner(match: Match): number | null {
    for (const [id, score] of Object.entries(match.scores)) {
        if (score >= match.firstTo) return Number(id);
    }
    return null;
}

/** Record one round's result (`null` = draw). Ignored once the match is decided. */
export function recordRound(match: Match, winner: number | null): Match {
    if (matchWinner(match) !== null) return match;
    return {
        ...match,
        roundsPlayed: match.roundsPlayed + 1,
        scores: winner === null
            ? match.scores
            : { ...match.scores, [winner]: (match.scores[winner] ?? 0) + 1 },
    };
}
