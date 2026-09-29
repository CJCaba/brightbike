import type { CSSProperties } from 'react';
import type { Phase } from '@/game/phase';
import { BIKE_COLORS, COLORS, FALLBACK_TRAIL_COLOR, PLAYER_NAMES } from '@/render/theme';

interface Props {
    phase: Phase;
    onRematch: () => void;
}

const DRAW_COLOR = '#e6fbff';

// Controls shown under the countdown (local mode: P1 = WASD, P2 = arrows)
const CONTROLS = [
    { id: 1, keys: 'W A S D' },
    { id: 2, keys: '↑ ← ↓ →' },
];

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

export default function Hud({ phase, onRematch }: Props) {
    if (phase.kind === 'playing') return null;

    return (
        <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-mono">
            <style href="brightbike-hud" precedence="default">{ANIMATIONS}</style>
            {phase.kind === 'countdown'
                ? <Countdown n={phase.n} />
                : <GameOver winner={phase.winner} onRematch={onRematch} />}
        </div>
    );
}

function Countdown({ n }: { n: number }) {
    return (
        <div className="flex flex-col items-center gap-5">
            <p className="text-xs uppercase tracking-[0.6em] text-white/60">Get ready</p>

            {/* key={n} remounts the number each second, which restarts the pop animation */}
            <p
                key={n}
                className="text-9xl font-bold tabular-nums text-white motion-safe:animate-[hud-pop_1s_ease-out_both]"
                style={{ textShadow: glow(COLORS.border) }}
            >
                {n}
            </p>

            <div className="flex gap-8 text-xs uppercase tracking-[0.3em]">
                {CONTROLS.map(({ id, keys }) => (
                    <span key={id} style={{ color: BIKE_COLORS[id] }}>
                        {PLAYER_NAMES[id]} <span className="text-white/70">{keys}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function GameOver({ winner, onRematch }: { winner: number | null; onRematch: () => void }) {
    const isDraw = winner === null;
    const color = isDraw ? DRAW_COLOR : (BIKE_COLORS[winner] ?? FALLBACK_TRAIL_COLOR);
    const title = isDraw ? 'Draw' : `${PLAYER_NAMES[winner] ?? `Player ${winner}`} wins`;
    const subtitle = isDraw ? 'Both riders derezzed' : 'Last rider on the grid';

    // One CSS variable drives the border, text, hover and focus colors, so Tailwind
    // classes can use it (inline `color` would override the hover/focus classes).
    const accent = { '--accent': color } as CSSProperties;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px] motion-safe:animate-[hud-rise_300ms_ease-out_both]">
            <div
                className="flex flex-col items-center gap-5 border border-[var(--accent)] bg-[#05070d]/85 px-14 py-10"
                style={{ ...accent, boxShadow: `0 0 28px -6px ${color}, inset 0 0 28px -14px ${color}` }}
            >
                <p
                    role="status"
                    className="text-5xl font-bold uppercase tracking-[0.25em] text-[var(--accent)]"
                    style={{ textShadow: glow(color) }}
                >
                    {title}
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">{subtitle}</p>

                <button
                    type="button"
                    autoFocus
                    onClick={onRematch}
                    className="pointer-events-auto mt-3 border border-[var(--accent)] px-10 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-[var(--accent)] transition-colors duration-150 hover:bg-[var(--accent)] hover:text-[#05070d] focus-visible:bg-[var(--accent)] focus-visible:text-[#05070d] focus-visible:outline-none"
                >
                    Rematch
                </button>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/40">Press Enter</p>
            </div>
        </div>
    );
}
