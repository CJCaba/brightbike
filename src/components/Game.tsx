'use client';

import { useEffect, useState } from 'react';
import GameCanvas from './GameCanvas';
import Hud from './Hud'
import Scoreboard from './Scoreboard';
import type { Phase } from '@/game/phase';
import type { Difficulty, FirstTo, GameMode } from '@/game/options';
import { newMatch, recordRound } from '@/game/match';
import { GRID_HEIGHT, GRID_WIDTH } from '@/engine/constants';
import { sound } from '@/audio/sound';

const INITIAL_PHASE: Phase = { kind: "countdown", n: 3 };

// Largest arena that fits the viewport (minus scoreboard and margins), capped at 1200px
const ARENA_WIDTH = `min(calc(100vw - 2rem), calc((100dvh - 7rem) * ${GRID_WIDTH / GRID_HEIGHT}), 1200px)`;

interface Props {
    mode: GameMode;
    difficulty: Difficulty;
    firstTo: FirstTo;
}

export default function Game({ mode, difficulty, firstTo }: Props) {
    const [round, setRound] = useState(0);              // remount key for GameCanvas
    const [phase, setPhase] = useState<Phase>(INITIAL_PHASE);
    const [match, setMatch] = useState(() => newMatch(firstTo));
    const [paused, setPaused] = useState(false);

    // Called by the game loop (via useEffectEvent) on countdown / playing / over
    const handlePhaseChange = (next: Phase) => {
        setPhase(next);
        if (next.kind === 'over') setMatch(m => recordRound(m, next.winner));
    };

    const startRound = () => {
        setPaused(false);
        setPhase(INITIAL_PHASE);
        setRound(r => r + 1);
    };
    const playAgain = () => {
        setMatch(newMatch(firstTo));
        startRound();
    };

    // Pause controls only exist while a round is being played
    const playing = phase.kind === 'playing';
    useEffect(() => {
        if (!playing) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Escape' || e.repeat) return;
            e.preventDefault();
            setPaused(p => !p);
        };
        // Switching tabs/apps pauses automatically
        const onVisibilityChange = () => {
            if (document.hidden) setPaused(true);
        };
        window.addEventListener('keydown', onKeyDown);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [playing]);

    // Sound: browsers only allow audio after a user gesture, so unlock on the first key or
    // click (arriving from the menu already counts). M toggles mute at any time.
    useEffect(() => {
        sound.unlock();
        const onKeyDown = (e: KeyboardEvent) => {
            sound.unlock();
            if (e.code === 'KeyM' && !e.repeat) sound.toggleMuted();
        };
        const onPointerDown = () => sound.unlock();
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('pointerdown', onPointerDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('pointerdown', onPointerDown);
        };
    }, []);

    return (
        <div className="flex flex-col" style={{ width: ARENA_WIDTH }}>
            <Scoreboard mode={mode} match={match} />
            <div className="relative">
                <GameCanvas
                    key={round}
                    mode={mode}
                    difficulty={difficulty}
                    paused={paused}
                    onPhaseChange={handlePhaseChange}
                />
                <Hud
                    phase={phase}
                    paused={paused}
                    mode={mode}
                    difficulty={difficulty}
                    match={match}
                    onResume={() => setPaused(false)}
                    onNextRound={startRound}
                    onPlayAgain={playAgain}
                />
            </div>
        </div>
    )
}
