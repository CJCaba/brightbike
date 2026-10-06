import type { GameState } from '@/engine/types';
import { BIKE_COLORS, CELL_SIZE, COLORS, FALLBACK_TRAIL_COLOR } from './theme';
import type { TrailLayer } from './trailLayer';
import type { Effects } from './effects';

const HEAD_GLOW_BLUR = 14;  // glow radius around each bike head (arena px)
const HEAD_CORE_INSET = 2;  // white core is inset this much inside the head cell

/**
 * Draw the static background grid ONCE into its own canvas (it never changes).
 * `scale` = device pixels per arena pixel (devicePixelRatio × display scale).
 */
export function createGridLayer(width: number, height: number, scale: number): HTMLCanvasElement {
    const cssWidth = width * CELL_SIZE;
    const cssHeight = height * CELL_SIZE;

    const canvas = document.createElement('canvas');
    // Round: fractional scales (e.g. 1.25 DPR on many Windows laptops) would otherwise be truncated
    canvas.width = Math.round(cssWidth * scale);
    canvas.height = Math.round(cssHeight * scale);

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

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

export interface Layers {
    grid: HTMLCanvasElement;
    trails: TrailLayer;
}

/**
 * Draw one frame. Reads state, writes pixels, changes nothing else.
 * Coordinates are arena pixels; the caller's transform maps them to the canvas.
 */
export function drawGame(
    ctx: CanvasRenderingContext2D,
    gameState: GameState,
    layers: Layers,
    effects: Effects,
    shake: { x: number; y: number },
) {
    const w = gameState.width * CELL_SIZE;
    const h = gameState.height * CELL_SIZE;

    // Background first, so screen shake never reveals stale pixels at the edges
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(shake.x, shake.y);

    // Grid and trails: prebuilt layers (destination size in arena px)
    ctx.drawImage(layers.grid, 0, 0, w, h);
    ctx.drawImage(layers.trails.canvas, 0, 0, w, h);

    // Bikes: a glowing full-cell head with a white core on each ALIVE bike's pos
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

    effects.draw(ctx);
    ctx.restore();
}
