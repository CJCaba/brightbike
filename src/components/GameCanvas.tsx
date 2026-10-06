'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import type { Phase } from '@/game/phase';
import { createControllers } from '@/game/modes';
import type { Difficulty, GameMode } from '@/game/options';
import { diffTick } from '@/game/events';
import { createGame, startGame } from '@/engine/createGame';
import type { GameState } from '@/engine/types';
import { GRID_WIDTH, GRID_HEIGHT, TICKS_PER_SECOND } from '@/engine/constants';
import { BIKE_COLORS, CELL_SIZE, FALLBACK_TRAIL_COLOR } from '@/render/theme';
import { createGridLayer, drawGame } from '@/render/drawGame';
import { TrailLayer } from '@/render/trailLayer';
import { Effects } from '@/render/effects';
import { tick } from '@/engine/tick';
import { collectInputs } from '@/controllers/Controller';
import { sound } from '@/audio/sound';

const ARENA_W = GRID_WIDTH * CELL_SIZE;     // arena size in "arena pixels"
const ARENA_H = GRID_HEIGHT * CELL_SIZE;

interface Props {
    mode: GameMode;
    difficulty: Difficulty;
    paused: boolean;
    onPhaseChange: (phase: Phase) => void;
}

export default function GameCanvas({ mode, difficulty, paused, onPhaseChange }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<GameState | null>(null);
    const emit = useEffectEvent((phase: Phase) => {
        onPhaseChange(phase);
    });
    // Read the latest `paused` prop from inside the loop without restarting the effect
    const isPaused = useEffectEvent(() => paused);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Create state once
        stateRef.current ??= createGame({width: GRID_WIDTH, height: GRID_HEIGHT, tickRate: TICKS_PER_SECOND});

        // 2. Layers + effects. The trail layer is seeded from the current grid, so a
        //    re-run of this effect (Strict Mode, hot reload) still shows existing trails.
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const effects = new Effects(reducedMotion);
        let gridLayer = createGridLayer(GRID_WIDTH, GRID_HEIGHT, 1);   // resized by applySize below
        const trails = new TrailLayer(GRID_WIDTH, GRID_HEIGHT, 1);
        trails.seed(stateRef.current.grid, stateRef.current.bikes);

        const render = () => drawGame(ctx, stateRef.current!, { grid: gridLayer, trails }, effects, effects.shakeOffset());

        // 3. Responsive sizing: CSS decides the canvas's on-screen size; the drawing buffer
        //    follows it (× devicePixelRatio) so the arena stays crisp at any size or zoom.
        let sizedFor = '';
        const applySize = () => {
            const cssWidth = canvas.clientWidth || ARENA_W;
            const dpr = window.devicePixelRatio || 1;
            if (`${cssWidth}@${dpr}` === sizedFor) return;
            sizedFor = `${cssWidth}@${dpr}`;

            const scale = (cssWidth / ARENA_W) * dpr;       // device px per arena px
            canvas.width = Math.round(ARENA_W * scale);
            canvas.height = Math.round(ARENA_H * scale);
            ctx.setTransform(scale, 0, 0, scale, 0, 0);     // resizing reset the transform
            gridLayer = createGridLayer(GRID_WIDTH, GRID_HEIGHT, scale);
            trails.resize(scale);
            render();   // resizing cleared the canvas; redraw even if the loop has stopped
        };
        applySize();
        const resizeObserver = new ResizeObserver(applySize);   // layout size changes
        resizeObserver.observe(canvas);
        window.addEventListener('resize', applySize);           // DPR-only changes (zoom, other monitor)

        // 4. Controllers - created INSIDE the effect so cleanup can dispose exactly these
        const controllers = createControllers(mode, difficulty);

        // 5. Fixed-timestep loop
        const STEP_MS = 1000 / TICKS_PER_SECOND;
        const COUNTDOWN_MS = 3000;
        // Set from the FIRST frame's timestamp, not performance.now() here: rAF timestamps
        // can be earlier than "now" in this effect, which made the countdown briefly show 4.
        let startAt = -1;
        const MAX_FRAME_MS = 250;
        let shownCount = 0;                                 // Last countdown number sent to the UI
        let last = performance.now();
        let lastEffects = last;                             // effects run on real time, not ticks
        let acc = 0;
        let rafId = 0;
        let humming = false;
        let overSent = false;

        const pan = (x: number) => (x / (GRID_WIDTH - 1)) * 2 - 1;

        const frame = (now: number) => {
            // Paused: no ticks, keep the clocks current so resuming doesn't fast-forward.
            // The canvas keeps showing the last frame drawn.
            if (isPaused()) {
                if (humming) { sound.stopHum(); humming = false; }
                last = now;
                lastEffects = now;
                rafId = requestAnimationFrame(frame);
                return;
            }

            const current = stateRef.current!;
            if (current.status === 'waiting') {
                // Countdown: no ticks, just time
                if (startAt < 0) startAt = now + COUNTDOWN_MS;
                const remaining = Math.ceil((startAt - now) / 1000);
                if (remaining <= 0) {
                    stateRef.current = startGame(current);
                    emit({ kind: 'playing'});
                    sound.go();
                } else if (remaining !== shownCount) {
                    shownCount = remaining;
                    emit({ kind: 'countdown', n: remaining });
                    sound.countdown(remaining);
                }
                last = now;
            } else if (current.status === 'running') {
                // Retries every frame until audio is unlocked (first key press mid-round)
                if (!humming) humming = sound.startHum(current.bikes.length);

                // Playing: advance the simulation
                acc += Math.min(now - last, MAX_FRAME_MS);
                last = now;

                while (acc >= STEP_MS) {
                    // Update game state: one tick per full step of elapsed time
                    const prev = stateRef.current!;
                    const next = tick(prev, collectInputs(controllers, prev));
                    stateRef.current = next;
                    acc -= STEP_MS;

                    // Presentation side effects for what just happened
                    const events = diffTick(prev, next);
                    for (const b of events.moved) trails.add(b.id, b.pos.x, b.pos.y);
                    for (const b of events.turned) sound.turn(pan(b.pos.x));
                    for (const b of events.crashed) {
                        const color = BIKE_COLORS[b.id] ?? FALLBACK_TRAIL_COLOR;
                        effects.burst((b.pos.x + 0.5) * CELL_SIZE, (b.pos.y + 0.5) * CELL_SIZE, color);
                        sound.crash(pan(b.pos.x));
                    }
                }
            }

            // Effects animate on real time (clamped, like the simulation)
            effects.update(Math.min(now - lastEffects, MAX_FRAME_MS) / 1000);
            lastEffects = now;

            // Draw the state AFTER this frame's updates
            render();

            // Game over -> tell the UI once; keep animating until the explosion settles
            const state = stateRef.current!;
            if (state.status === 'game-over') {
                if (!overSent) {
                    overSent = true;
                    if (humming) { sound.stopHum(); humming = false; }
                    emit({ kind: 'over', winner: state.winner });
                }
                if (!effects.active) return;    // nothing left to animate: stop the loop
            }

            rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);

        // 6. Cleanup
        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            window.removeEventListener('resize', applySize);
            controllers.forEach((ctrl) => ctrl.dispose());
            if (humming) sound.stopHum();
        }
    }, [mode, difficulty]);     // primitives only: an object here would restart the game every render

    return (
        <canvas
            ref={canvasRef}
            className="block h-auto w-full"
            style={{ aspectRatio: `${GRID_WIDTH} / ${GRID_HEIGHT}` }}
        />
    );
}
