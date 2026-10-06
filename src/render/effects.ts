// Purely visual effects (crash particles, screen shake). They run on real time, not game
// ticks, and never affect the simulation — so Math.random is fine here.

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;       // seconds remaining
    maxLife: number;
    size: number;
    color: string;
}

const PARTICLES_PER_BURST = 32;
const DRAG = 2.5;                   // per second; particles slow down as they fly
const SHAKE_PX = 6;
const SHAKE_DECAY = 9;              // per second (exponential)

export class Effects {
    private particles: Particle[] = [];
    private shake = 0;

    /** With reduced motion: no screen shake and a smaller, shorter burst. */
    constructor(private readonly reducedMotion: boolean) {}

    /** Explosion at (x, y) in arena pixels. */
    burst(x: number, y: number, color: string): void {
        const count = this.reducedMotion ? PARTICLES_PER_BURST / 4 : PARTICLES_PER_BURST;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 200;
            const life = 0.45 + Math.random() * 0.6;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life, maxLife: life,
                size: 1.5 + Math.random() * 2,
                color: Math.random() < 0.3 ? '#ffffff' : color,
            });
        }
        if (!this.reducedMotion) this.shake = SHAKE_PX;
    }

    /** Advance by `dt` seconds. */
    update(dt: number): void {
        const drag = Math.exp(-DRAG * dt);
        for (const p of this.particles) {
            p.vx *= drag;
            p.vy *= drag;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
        }
        this.particles = this.particles.filter(p => p.life > 0);
        this.shake = this.shake < 0.1 ? 0 : this.shake * Math.exp(-SHAKE_DECAY * dt);
    }

    /** Current screen-shake offset to translate the whole arena by. */
    shakeOffset(): { x: number; y: number } {
        if (this.shake === 0) return { x: 0, y: 0 };
        return { x: (Math.random() * 2 - 1) * this.shake, y: (Math.random() * 2 - 1) * this.shake };
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.particles.length === 0) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';   // overlapping sparks add up to white-hot
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.restore();
    }

    /** True while anything is still animating (the loop keeps running until it settles). */
    get active(): boolean {
        return this.particles.length > 0 || this.shake > 0;
    }
}
