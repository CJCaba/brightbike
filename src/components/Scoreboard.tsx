import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import type { GameMode } from '@/game/options';
import type { Match } from '@/game/match';
import { playerLabel } from '@/game/labels';
import { BIKE_COLORS } from '@/render/theme';
import { sound } from '@/audio/sound';

interface Props {
    mode: GameMode;
    match: Match;
}

/** Bar above the arena: menu link, live score, sound toggle and the pause hint. */
export default function Scoreboard({ mode, match }: Props) {
    // Mute lives in the sound module (persisted in localStorage). The server snapshot is
    // `false`; React switches to the stored value right after hydration without a mismatch.
    const muted = useSyncExternalStore(sound.subscribe, () => sound.muted, () => false);

    return (
        <div className="mb-3 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 sm:text-xs sm:tracking-[0.3em]">
            <Link
                href="/"
                className="justify-self-start hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
                ← Menu
            </Link>

            <div className="flex items-center gap-3 whitespace-nowrap sm:gap-4" aria-label="Score">
                <Score label={playerLabel(mode, 1)} score={match.scores[1]} color={BIKE_COLORS[1]} />
                <span className="text-white/30">first to {match.firstTo}</span>
                <Score label={playerLabel(mode, 2)} score={match.scores[2]} color={BIKE_COLORS[2]} reverse />
            </div>

            <div className="flex items-center gap-4 justify-self-end">
                <button
                    type="button"
                    onClick={() => sound.toggleMuted()}
                    aria-pressed={!muted}
                    aria-label={muted ? 'Sound off (M)' : 'Sound on (M)'}
                    title="Toggle sound (M)"
                    className="whitespace-nowrap uppercase tracking-[inherit] hover:text-white focus-visible:text-white focus-visible:outline-none"
                >
                    {muted ? 'Sound off' : 'Sound on'}
                </button>
                <span className="hidden md:inline">Esc pause</span>
            </div>
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
