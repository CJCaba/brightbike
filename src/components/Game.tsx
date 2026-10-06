'use client';

import { useState } from 'react';
import GameCanvas from './GameCanvas';
import Hud from './Hud'
import type { Phase } from '@/game/phase';
import type { Difficulty, GameMode } from '@/game/options';

const INITIAL_PHASE: Phase = { kind: "countdown", n: 3 };

interface Props {
    mode: GameMode;
    difficulty: Difficulty;
}

export default function Game({ mode, difficulty }: Props) {
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<Phase>(INITIAL_PHASE);

    const rematch = () => {
        setPhase(INITIAL_PHASE);
        setRound(r => r + 1);
    };

    return (
        <div className="relative">
            <GameCanvas key={round} mode={mode} difficulty={difficulty} onPhaseChange={setPhase} />
            <Hud phase={phase} mode={mode} difficulty={difficulty} onRematch={rematch} />
        </div>
    )
}
