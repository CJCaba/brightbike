'use client';

import { useEffect, useRef } from 'react';
import { createGame, startGame } from '@/engine/createGame';
import type { GameState } from '@/engine/types';
import { GRID_WIDTH, GRID_HEIGHT, TICKS_PER_SECOND } from '@/engine/constants';
import { CELL_SIZE } from '@/render/theme';
import { createGridLayer, drawGame } from '@/render/drawGame';

import { tick } from '@/engine/tick';                          // TEMP (Step 4e)

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Create state once
        // stateRef.current ??= createGame({width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND});
        if (!stateRef.current) {
            let s = startGame(createGame({ width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND }));
            for (let i = 0; i < 8; i++) {
                s = tick(s, i === 4 ? { 1: 'up', 2: 'down' } : {});
            }
            stateRef.current = s;
        }

        // 2. Size the canvas for the sceen's pixel density
        const dpr = window.devicePixelRatio || 1;
        const cssW = GRID_WIDTH * CELL_SIZE;
        const cssH = GRID_HEIGHT * CELL_SIZE;
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        ctx.setTransform(dpr, 0, 0 , dpr, 0, 0);

        // 3. Build the grid layer (uses the SAME dpr)
        const gridLayer = createGridLayer(GRID_WIDTH, GRID_HEIGHT, dpr);

        // 4. Draw the game
        drawGame(ctx, stateRef.current, gridLayer);
    }, []);

    return <canvas ref={canvasRef} className="block" />;
}