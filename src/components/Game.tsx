'use client';

import { useState } from 'react';
import GameCanvas from './GameCanvas';
import Hud from './Hud'
import type { Phase } from '@/game/phase';

const INITIAL_PHASE: Phase = { kind: "countdown", n: 3 };

export default function Game() {
    const [round, setRound] = useState(0);
    const [phase, setPhase] = useState<Phase>(INITIAL_PHASE);

    const rematch = () => {
        setPhase(INITIAL_PHASE);
        setRound(r => r + 1);
    };

    return (
        <div className="relative">
            <GameCanvas key={round} mode="local" onPhaseChange={setPhase} />
            <Hud phase={phase} onRematch={rematch} />
        </div>
    )
}