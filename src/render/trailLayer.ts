import { BIKE_COLORS, CELL_SIZE, FALLBACK_TRAIL_COLOR, lighten } from './theme';

const RIBBON_WIDTH = CELL_SIZE * 0.5;   // glowing body of the light trail
const CORE_WIDTH = CELL_SIZE * 0.16;    // bright center line
const GLOW_BLUR = 10;

/** One piece of trail: from one cell center to an adjacent one (from === to: a single dot). */
interface Segment {
    owner: number;
    from: number;
    to: number;
}

/**
 * Persistent offscreen canvas holding every trail drawn so far.
 *
 * Trails only grow, so each tick draws just the new segments (with an expensive glow)
 * instead of redrawing the whole arena every frame. The segment list is kept so the
 * layer can be redrawn when the canvas is resized.
 */
export class TrailLayer {
    readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly segments: Segment[] = [];
    private readonly heads = new Map<number, number>();   // owner → last cell added

    constructor(private readonly width: number, private readonly height: number, scale: number) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.resize(scale);
    }

    /**
     * Seed from an existing grid (e.g. after a hot reload mid-round): every occupied cell
     * becomes a dot, and each bike's head becomes the point new segments connect from.
     */
    seed(grid: Uint8Array, bikes: readonly { id: number; pos: { x: number; y: number } }[]): void {
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] !== 0) this.addSegment({ owner: grid[i], from: i, to: i });
        }
        for (const b of bikes) this.heads.set(b.id, b.pos.y * this.width + b.pos.x);
    }

    /** A bike moved into (x, y): extend its ribbon from its previous cell. */
    add(owner: number, x: number, y: number): void {
        const to = y * this.width + x;
        const prev = this.heads.get(owner);
        const from = prev !== undefined && this.adjacent(prev, to) ? prev : to;
        this.heads.set(owner, to);
        this.addSegment({ owner, from, to });
    }

    /** Resize the backing canvas (scale = CSS→device pixels × display scale) and redraw. */
    resize(scale: number): void {
        this.canvas.width = Math.round(this.width * CELL_SIZE * scale);
        this.canvas.height = Math.round(this.height * CELL_SIZE * scale);
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);    // resizing reset the transform
        for (const s of this.segments) this.drawSegment(s);
    }

    private addSegment(s: Segment): void {
        this.segments.push(s);
        this.drawSegment(s);
    }

    private adjacent(a: number, b: number): boolean {
        const ax = a % this.width, ay = (a / this.width) | 0;
        const bx = b % this.width, by = (b / this.width) | 0;
        return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
    }

    private center(i: number): [number, number] {
        return [(i % this.width + 0.5) * CELL_SIZE, (((i / this.width) | 0) + 0.5) * CELL_SIZE];
    }

    private drawSegment({ owner, from, to }: Segment): void {
        const ctx = this.ctx;
        const color = BIKE_COLORS[owner] ?? FALLBACK_TRAIL_COLOR;
        const [x1, y1] = this.center(from);
        const [x2, y2] = this.center(to);

        ctx.save();
        ctx.lineCap = 'square';     // square caps fill the corners where segments meet

        // Glowing body
        ctx.shadowColor = color;
        ctx.shadowBlur = GLOW_BLUR;
        ctx.strokeStyle = color;
        ctx.lineWidth = RIBBON_WIDTH;
        this.line(x1, y1, x2, y2);

        // Bright core, no glow
        ctx.shadowBlur = 0;
        ctx.strokeStyle = lighten(color, 0.6);
        ctx.lineWidth = CORE_WIDTH;
        this.line(x1, y1, x2, y2);
        ctx.restore();
    }

    private line(x1: number, y1: number, x2: number, y2: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        // A zero-length line with square caps still draws a square: that's the single-dot case
        this.ctx.lineTo(x2 === x1 && y2 === y1 ? x2 + 0.01 : x2, y2);
        this.ctx.stroke();
    }
}
