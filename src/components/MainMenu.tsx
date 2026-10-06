'use client';

import Link from 'next/link';
import { useState, type CSSProperties, type ReactNode } from 'react';
import {
    DEFAULT_DIFFICULTY,
    DEFAULT_FIRST_TO,
    DIFFICULTIES,
    FIRST_TO_OPTIONS,
    playHref,
    type FirstTo,
} from '@/game/options';
import { BIKE_COLORS, COLORS } from '@/render/theme';

const glow = (color: string) => `0 0 8px ${color}, 0 0 24px ${color}, 0 0 56px ${color}`;
const accentVar = (color: string) => ({ '--accent': color }) as CSSProperties;

// Shared neon button look; `--accent` sets the color
const NEON =
    'border border-[var(--accent)] text-[var(--accent)] uppercase tracking-[0.3em] transition-colors duration-150 ' +
    'hover:bg-[var(--accent)] hover:text-[#05070d] focus-visible:bg-[var(--accent)] focus-visible:text-[#05070d] focus-visible:outline-none';

export default function MainMenu() {
    const [firstTo, setFirstTo] = useState<FirstTo>(DEFAULT_FIRST_TO);

    return (
        <div className="flex w-full max-w-3xl flex-col items-center gap-10 px-6 py-10 font-mono">
            <header className="flex flex-col items-center gap-3 text-center">
                <h1
                    className="text-5xl font-bold uppercase tracking-[0.3em] text-white sm:text-6xl"
                    style={{ textShadow: glow(COLORS.accent) }}
                >
                    BrightBike
                </h1>
                <p className="text-xs uppercase tracking-[0.5em] text-white/50">Last rider on the grid wins</p>
            </header>

            <div className="grid w-full gap-6 sm:grid-cols-2">
                <Card title="Single player" subtitle="You vs CPU" color={BIKE_COLORS[1]}>
                    <div className="flex flex-col gap-3">
                        {DIFFICULTIES.map(d => (
                            <Link
                                key={d}
                                href={playHref('ai', d, firstTo)}
                                autoFocus={d === DEFAULT_DIFFICULTY}
                                className={`${NEON} py-3 text-center text-sm`}
                            >
                                {d}
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card title="Local multiplayer" subtitle="2 players · 1 keyboard" color={BIKE_COLORS[2]}>
                    <div className="flex flex-1 flex-col justify-between gap-3">
                        <ul className="flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-white/60">
                            <li><span style={{ color: BIKE_COLORS[1] }}>Blue</span> · W A S D</li>
                            <li><span style={{ color: BIKE_COLORS[2] }}>Red</span> · ↑ ← ↓ →</li>
                        </ul>
                        <Link
                            href={playHref('local', DEFAULT_DIFFICULTY, firstTo)}
                            className={`${NEON} py-3 text-center text-sm`}
                        >
                            Play
                        </Link>
                    </div>
                </Card>
            </div>

            <fieldset className="flex flex-col items-center gap-3" style={accentVar(COLORS.accent)}>
                <legend className="mb-3 text-center text-[11px] uppercase tracking-[0.5em] text-white/50">
                    Match length · first to
                </legend>
                <div className="flex gap-3">
                    {FIRST_TO_OPTIONS.map(n => (
                        <button
                            key={n}
                            type="button"
                            aria-pressed={firstTo === n}
                            onClick={() => setFirstTo(n)}
                            // Two complete class sets (not NEON + overrides): Tailwind resolves
                            // conflicting utilities by stylesheet order, not className order.
                            className={`h-11 w-14 border text-base transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070d] ${
                                firstTo === n
                                    ? 'border-[var(--accent)] bg-[var(--accent)] font-bold text-[#05070d]'
                                    : 'border-white/25 text-white/60 hover:border-[var(--accent)] hover:text-[var(--accent)]'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </fieldset>

            <section className="flex flex-col items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-white/40">
                <h2 className="tracking-[0.5em] text-white/50">Controls</h2>
                <p>Steer · W A S D / Arrow keys</p>
                <p>Pause · Esc &nbsp;&nbsp; Confirm · Enter</p>
                <p className="normal-case tracking-[0.15em]">Hit a wall or any trail and you&apos;re out.</p>
            </section>
        </div>
    );
}

function Card({ title, subtitle, color, children }: { title: string; subtitle: string; color: string; children: ReactNode }) {
    return (
        <section
            className="flex flex-col gap-5 border border-[var(--accent)]/60 bg-[#05070d]/80 p-6"
            style={{ ...accentVar(color), boxShadow: `0 0 24px -10px ${color}, inset 0 0 24px -16px ${color}` }}
        >
            <div>
                <h2 className="text-lg font-bold uppercase tracking-[0.3em] text-[var(--accent)]" style={{ textShadow: glow(color) }}>
                    {title}
                </h2>
                <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-white/50">{subtitle}</p>
            </div>
            {children}
        </section>
    );
}
