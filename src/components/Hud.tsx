import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Phase } from '@/game/phase';
import type { Difficulty, GameMode } from '@/game/options';
import { matchWinner, type Match } from '@/game/match';
import { playerLabel, winsPhrase } from '@/game/labels';
import { BIKE_COLORS, COLORS, FALLBACK_TRAIL_COLOR } from '@/render/theme';

interface Props {
    phase: Phase;
    paused: boolean;
    mode: GameMode;
    difficulty: Difficulty;
    match: Match;
    onResume: () => void;
    onNextRound: () => void;
    onPlayAgain: () => void;
}

// Keyframes for the Tailwind arbitrary animations below. React 19 hoists this
// <style> into <head> and de-duplicates it by `href`, so it's only added once.
const ANIMATIONS = `
@keyframes hud-pop {
    0%   { opacity: 0; transform: scale(1.8); }
    25%  { opacity: 1; transform: scale(1); }
    80%  { opacity: 1; }
    100% { opacity: 0; transform: scale(0.92); }
}
@keyframes hud-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
}
`;

/** Layered neon text glow in the given color */
const glow = (color: string) => `0 0 6px ${color}, 0 0 20px ${color}, 0 0 44px ${color}`;

const colorOf = (id: number | null) => (id === null ? COLORS.neutral : (BIKE_COLORS[id] ?? FALLBACK_TRAIL_COLOR));

/** Per-player label + controls hint shown under the countdown. */
function controlsFor(mode: GameMode, difficulty: Difficulty) {
    switch (mode) {
        case 'local':
            return [
                { id: 1, label: playerLabel(mode, 1), keys: 'W A S D' },
                { id: 2, label: playerLabel(mode, 2), keys: '↑ ← ↓ →' },
            ];
        case 'ai':
            return [
                { id: 1, label: playerLabel(mode, 1), keys: 'WASD / ↑←↓→' },
                { id: 2, label: playerLabel(mode, 2), keys: difficulty },
            ];
    }
}

/** "Blue 2 – 1 Red" */
function scoreline(mode: GameMode, match: Match) {
    return `${playerLabel(mode, 1)} ${match.scores[1]} – ${match.scores[2]} ${playerLabel(mode, 2)}`;
}

export default function Hud(props: Props) {
    const { phase, paused, mode, difficulty, match } = props;
    if (phase.kind === 'playing' && !paused) return null;

    let content;
    if (phase.kind === 'playing') {
        content = (
            <Panel
                eyebrow={`Round ${match.roundsPlayed + 1}`}
                title="Paused"
                subtitle="Esc to resume"
                color={COLORS.accent}
                action={{ label: 'Resume', onClick: props.onResume }}
            />
        );
    } else if (phase.kind === 'countdown') {
        content = <Countdown n={phase.n} round={match.roundsPlayed + 1} mode={mode} difficulty={difficulty} />;
    } else {
        // Game's match state already includes this round's result
        const champion = matchWinner(match);
        content = champion === null ? (
            <Panel
                eyebrow={`Round ${match.roundsPlayed}`}
                title={winsPhrase(mode, phase.winner)}
                subtitle={phase.winner === null ? 'Both riders derezzed · ' + scoreline(mode, match) : scoreline(mode, match)}
                color={colorOf(phase.winner)}
                action={{ label: 'Next round', onClick: props.onNextRound }}
            />
        ) : (
            <Panel
                eyebrow="Match over"
                title={winsPhrase(mode, champion)}
                subtitle={scoreline(mode, match)}
                color={colorOf(champion)}
                action={{ label: 'Play again', onClick: props.onPlayAgain }}
            />
        );
    }

    return (
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-mono">
            <style href="brightbike-hud" precedence="default">{ANIMATIONS}</style>
            {content}
        </div>
    );
}

function Countdown({ n, round, mode, difficulty }: { n: number; round: number; mode: GameMode; difficulty: Difficulty }) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 text-center sm:gap-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 sm:text-xs sm:tracking-[0.6em]">
                {mode === 'ai' ? `Vs CPU · ${difficulty}` : 'Get ready'} · Round {round}
            </p>

            {/* key={n} remounts the number each second, which restarts the pop animation */}
            <p
                key={n}
                className="text-7xl font-bold tabular-nums text-white motion-safe:animate-[hud-pop_1s_ease-out_both] sm:text-9xl"
                style={{ textShadow: glow(COLORS.border) }}
            >
                {n}
            </p>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-1 text-[10px] uppercase tracking-[0.3em] sm:text-xs">
                {controlsFor(mode, difficulty).map(({ id, label, keys }) => (
                    <span key={id} style={{ color: BIKE_COLORS[id] }}>
                        {label} <span className="text-white/70">{keys}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

interface PanelProps {
    eyebrow: string;
    title: string;
    subtitle: string;
    color: string;
    action: { label: string; onClick: () => void };
}

/** Dimmed backdrop + neon panel with a primary action (Enter) and a Menu link. */
function Panel({ eyebrow, title, subtitle, color, action }: PanelProps) {
    // One CSS variable drives the border, text, hover and focus colors, so Tailwind
    // classes can use it (inline `color` would override the hover/focus classes).
    const accent = { '--accent': color } as CSSProperties;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px] motion-safe:animate-[hud-rise_300ms_ease-out_both]">
            <div
                className="flex w-[min(460px,90%)] flex-col items-center gap-3 border border-[var(--accent)] bg-[#05070d]/85 px-6 py-6 text-center sm:gap-4 sm:px-12 sm:py-9"
                style={{ ...accent, boxShadow: `0 0 28px -6px ${color}, inset 0 0 28px -14px ${color}` }}
            >
                <p className="text-[11px] uppercase tracking-[0.5em] text-white/50">{eyebrow}</p>
                <p
                    role="status"
                    className="text-3xl font-bold uppercase tracking-[0.25em] text-[var(--accent)] sm:text-5xl"
                    style={{ textShadow: glow(color) }}
                >
                    {title}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{subtitle}</p>

                <button
                    type="button"
                    autoFocus
                    onClick={action.onClick}
                    className="pointer-events-auto mt-3 border border-[var(--accent)] px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-[#05070d] focus-visible:bg-[var(--accent)] focus-visible:text-[#05070d] focus-visible:outline-none"
                >
                    {action.label}
                </button>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.35em] text-white/40">
                    <span>Press Enter</span>
                    <span aria-hidden>·</span>
                    <Link
                        href="/"
                        className="pointer-events-auto text-white/60 underline-offset-4 hover:text-white hover:underline focus-visible:text-white focus-visible:underline focus-visible:outline-none"
                    >
                        Menu
                    </Link>
                </div>
            </div>
        </div>
    );
}
