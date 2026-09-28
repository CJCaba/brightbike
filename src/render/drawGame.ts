import type { GameState } from '@/engine/types';
import { cellIndex } from '@/engine/collision'
import { BIKE_COLORS, CELL_SIZE, COLORS, FALLBACK_TRAIL_COLOR } from './theme';

const HEAD_GLOW_BLUR = 12;  // glow radius around each bike head (CSS px)
const HEAD_CORE_INSET = 2;  // white core is inset this much inside the head cell
const TRAIL_INSET = 1;      // trails are drawn 1px smaller per side so the grid shows between cells

/** Draw the static background grid ONCE into its own canvas (it never changes) */
export function createGridLayer(width: number, height: number, dpr: number): HTMLCanvasElement {
    const cssWidth = width * CELL_SIZE;
    const cssHeight = height * CELL_SIZE;

    const canvas = document.createElement('canvas');
    // Round: fractional DPRs (1.25, 1.5 on many Windows laptops) would otherwise be truncated
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Inner grid lines as 1px fillRects (crisper than stroke(), which straddles pixel boundaries)
    ctx.fillStyle = COLORS.gridLine;
    for (let x = 1; x < width; x++) {
        ctx.fillRect(x * CELL_SIZE, 0, 1, cssHeight);
    }
    for (let y = 1; y < height; y++) {
        ctx.fillRect(0, y * CELL_SIZE, cssWidth, 1);
    }

    // Border: four 1px edges drawn just inside the canvas
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(0, 0, cssWidth, 1);                // top
    ctx.fillRect(0, cssHeight - 1, cssWidth, 1);    // bottom
    ctx.fillRect(0, 0, 1, cssHeight);               // left
    ctx.fillRect(cssWidth - 1, 0, 1, cssHeight);    // right

    return canvas;
}

/** Draw one frame. Pure: reads state, writes pixels, changes nothing else. */
export function drawGame(ctx: CanvasRenderingContext2D, gameState: GameState, gridLayer: HTMLCanvasElement) {
    // Draw Background (destination size in CSS px; ctx is already scaled by dpr)
    ctx.drawImage(gridLayer, 0, 0, gameState.width * CELL_SIZE, gameState.height * CELL_SIZE);

    // Draw Trails: every non-zero grid cell -> colored square, inset so the grid shows through
    for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
            const owner = gameState.grid[cellIndex(gameState.width, {x, y})];
            if (owner === 0) continue;
            ctx.fillStyle = BIKE_COLORS[owner] ?? FALLBACK_TRAIL_COLOR;
            ctx.fillRect(
                x * CELL_SIZE + TRAIL_INSET,
                y * CELL_SIZE + TRAIL_INSET,
                CELL_SIZE - TRAIL_INSET * 2,
                CELL_SIZE - TRAIL_INSET * 2,
            );
        }
    }

    // Draw Bikes: a glowing full-cell head with a white core on each ALIVE bike's pos
    for (const bike of gameState.bikes) {
        if (!bike.alive) continue;

        const color = BIKE_COLORS[bike.id] ?? FALLBACK_TRAIL_COLOR;
        const px = bike.pos.x * CELL_SIZE;
        const py = bike.pos.y * CELL_SIZE;

        ctx.save();     // keep shadow settings from leaking into later draws / frames
        ctx.shadowColor = color;
        ctx.shadowBlur = HEAD_GLOW_BLUR;
        ctx.fillStyle = color;
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            px + HEAD_CORE_INSET,
            py + HEAD_CORE_INSET,
            CELL_SIZE - HEAD_CORE_INSET * 2,
            CELL_SIZE - HEAD_CORE_INSET * 2,
        );
    }
}
