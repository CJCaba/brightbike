'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import type { Phase } from '@/game/phase';
import { createControllers } from '@/game/modes';
import type { Difficulty, GameMode } from '@/game/options';
import { createGame, startGame } from '@/engine/createGame';
import type { GameState } from '@/engine/types';
import { GRID_WIDTH, GRID_HEIGHT, TICKS_PER_SECOND } from '@/engine/constants';
import { CELL_SIZE } from '@/render/theme';
import { createGridLayer, drawGame } from '@/render/drawGame';
import { tick } from '@/engine/tick';
import { collectInputs } from '@/controllers/Controller';

interface Props {
    mode: GameMode;
    difficulty: Difficulty;
    onPhaseChange: (phase: Phase) => void;
}

export default function GameCanvas({ mode, difficulty, onPhaseChange }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);
    const emit = useEffectEvent((phase: Phase) => {
        onPhaseChange(phase);
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Create state once
        stateRef.current ??= createGame({width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND});

        // 2. Size the canvas for the sceen's pixel density
        const dpr = window.devicePixelRatio || 1;
        const cssW = GRID_WIDTH * CELL_SIZE;
        const cssH = GRID_HEIGHT * CELL_SIZE;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        ctx.setTransform(dpr, 0, 0 , dpr, 0, 0);

        // 3. Build the grid layer (uses the SAME dpr)
        const gridLayer = createGridLayer(GRID_WIDTH, GRID_HEIGHT, dpr);

        // 4. Controllers - created INSIDE the effect so cleanup can dispose exactly these
        const controllers = createControllers(mode, difficulty);

        // 5. Fixed-timestep loop
        const STEP_MS = 1000 / TICKS_PER_SECOND;
        const COUNTDOWN_MS = 3000;
        const startAt = performance.now() + COUNTDOWN_MS;
        const MAX_FRAME_MS = 250;
        let shownCount = 0;                                 // Last countdown number sent to the UI
        let last = performance.now();
        let acc = 0;
        let rafId = 0;

        const frame = (now: number) => {
            const current = stateRef.current!;
            if (current.status === 'waiting') {
                // Countdown: no ticks, just time
                const remaining = Math.ceil((startAt - now) / 1000);
                if (remaining <= 0) {
                    stateRef.current = startGame(current);
                    emit({ kind: 'playing'});
                } else if (remaining !== shownCount) {
                    shownCount = remaining;
                    emit({ kind: 'countdown', n: remaining });
                }
                last = now;
            } else {
                // Playing: advance the simulation
                acc += Math.min(now - last, MAX_FRAME_MS);
                last = now;

                while (acc >= STEP_MS) {
                    // Update game state: one tick per full step of elapsed time
                    const prev = stateRef.current!;
                    stateRef.current = tick(prev, collectInputs(controllers, prev));
                    acc -= STEP_MS;
                }
            }

            // Draw the state AFTER this frame's updates (re-read the ref, not `current`)
            const state = stateRef.current!;
            drawGame(ctx, state, gridLayer);

            // Game over -> tell the UI and stop (no new frame scheduled)
            if (state.status === 'game-over') {
                emit({ kind: 'over', winner: state.winner });
                return;
            }

            rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);

        // 6. Cleanup
        return () => {
            cancelAnimationFrame(rafId);
            controllers.forEach((ctrl) => ctrl.dispose());
        }
    }, [mode, difficulty]);     // primitives only: an object here would restart the game every render

    return <canvas ref={canvasRef} className="block" />;
}