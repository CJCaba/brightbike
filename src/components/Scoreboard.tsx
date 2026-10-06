import Link from 'next/link';
import type { GameMode } from '@/game/options';
import type { Match } from '@/game/match';
import { playerLabel } from '@/game/labels';
import { BIKE_COLORS } from '@/render/theme';

interface Props {
    mode: GameMode;
    match: Match;
}

/** Bar above the arena: menu link, live score, and the pause hint. */
export default function Scoreboard({ mode, match }: Props) {
    return (
        <div className="mb-3 grid w-full grid-cols-3 items-center font-mono text-xs uppercase tracking-[0.3em] text-white/50">
            <Link
                href="/"
                className="justify-self-start hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
                ← Menu
            </Link>

            <div className="flex items-center justify-self-center gap-4 whitespace-nowrap" aria-label="Score">
                <Score label={playerLabel(mode, 1)} score={match.scores[1]} color={BIKE_COLORS[1]} />
                <span className="text-white/30">first to {match.firstTo}</span>
                <Score label={playerLabel(mode, 2)} score={match.scores[2]} color={BIKE_COLORS[2]} reverse />
            </div>

            <span className="justify-self-end">Esc pause</span>
        </div>
    );
}

function Score({ label, score, color, reverse }: { label: string; score: number; color: string; reverse?: boolean }) {
    return (
        <span className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`} style={{ color }}>
            {label}
            <span className="text-base font-bold tabular-nums text-white">{score}</span>
        </span>
    );
}
