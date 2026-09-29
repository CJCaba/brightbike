'use client';

import { useEffect, useRef } from 'react';
import { createGame, startGame } from '@/engine/createGame';
import type { GameState } from '@/engine/types';
import { GRID_WIDTH, GRID_HEIGHT, TICKS_PER_SECOND } from '@/engine/constants';
import { CELL_SIZE } from '@/render/theme';
import { createGridLayer, drawGame } from '@/render/drawGame';
import { tick } from '@/engine/tick';
import { ARROWS, WASD } from '@/controllers/keymaps';
import { KeyboardController } from '@/controllers/KeyboardController';
import { collectInputs, type Controller } from '@/controllers/Controller';

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Create state once
        stateRef.current ??= startGame(
            createGame({width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND})
        );

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
        const controllers: Controller[] = [
            new KeyboardController(1, WASD),
            new KeyboardController(2, ARROWS)
        ];

        // 5. Fixed-timestep loop
        const STEP_MS = 1000 / TICKS_PER_SECOND;
        const MAX_FRAME_MS = 250;
        let last = performance.now();
        let acc = 0;
        let rafId = 0;

        const frame = (now: number) => {
            acc += Math.min(now - last, MAX_FRAME_MS);
            last = now;

            while (acc >= STEP_MS) {
                // Update game state: one tick per full step of elapsed time
                const current = stateRef.current!;
                stateRef.current = tick(current, collectInputs(controllers, current));
                acc -= STEP_MS;
            }

            // Draw the current state
            const state = stateRef.current!;
            drawGame(ctx, state, gridLayer);

            // Game over -> log the result and stop (no new frame scheduled)
            if (state.status === 'game-over') {
                console.log(state.winner === null ? 'Draw!' : `Bike ${state.winner} wins!`);
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
    }, []);

    return <canvas ref={canvasRef} className="block" />;
}