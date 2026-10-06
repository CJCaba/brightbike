// Synthesized sound effects with the Web Audio API (no audio files to load).
//
// Browsers only allow audio after a user gesture. The AudioContext is created lazily,
// and only once the page has had user activation, so no autoplay warning is logged.

const VOLUME = 0.5;
const MUTED_KEY = 'brightbike:muted';

type Listener = () => void;

class Sound {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private hum: { osc: OscillatorNode; gain: GainNode }[] = [];
    private mutedValue = false;
    private loaded = false;
    private readonly listeners = new Set<Listener>();

    // ── Mute (persisted; exposed in a useSyncExternalStore-friendly shape) ──

    get muted(): boolean {
        if (!this.loaded && typeof window !== 'undefined') {
            this.loaded = true;
            try { this.mutedValue = localStorage.getItem(MUTED_KEY) === '1'; } catch { /* storage blocked */ }
        }
        return this.mutedValue;
    }

    toggleMuted(): void {
        this.mutedValue = !this.muted;
        try { localStorage.setItem(MUTED_KEY, this.mutedValue ? '1' : '0'); } catch { /* storage blocked */ }
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.mutedValue ? 0 : VOLUME, this.ctx.currentTime, 0.02);
        this.listeners.forEach(l => l());
    }

    subscribe = (listener: Listener): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    // ── Context ──

    /** Create/resume the AudioContext. Call from user-gesture handlers (key, click). */
    unlock(): void {
        const ctx = this.context();
        if (ctx?.state === 'suspended') void ctx.resume();
    }

    private context(): AudioContext | null {
        if (this.ctx) return this.ctx;
        if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
        // Before any user activation the context would start suspended and log a warning
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : VOLUME;
        this.master.connect(this.ctx.destination);
        return this.ctx;
    }

    // ── Effects ──

    countdown(n: number): void {
        this.blip(n === 1 ? 523 : 440, 0.12, 'square', 0.12);
    }

    go(): void {
        this.blip(880, 0.3, 'square', 0.14);
    }

    /** `pan` from -1 (left) to 1 (right) */
    turn(pan: number): void {
        this.blip(1320, 0.05, 'triangle', 0.08, pan);
    }

    crash(pan: number): void {
        const ctx = this.context();
        if (!ctx || !this.master) return;
        const t = ctx.currentTime;

        // Burst of noise through a closing low-pass filter: the "derez" crunch
        const length = Math.floor(ctx.sampleRate * 0.6);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 0.6);
        const gain = this.envelope(t, 0.35, 0.6);
        noise.connect(filter).connect(gain).connect(this.panner(pan));
        noise.start(t);
        noise.stop(t + 0.6);

        // Low thump underneath
        this.blip(70, 0.35, 'sine', 0.4, pan, 40);
    }

    /**
     * Low engine drone, one voice per bike, while a round is being played.
     * Returns false if audio isn't available yet (no user gesture), so callers can retry.
     */
    startHum(bikeCount: number): boolean {
        const ctx = this.context();
        if (!ctx || !this.master) return false;
        if (this.hum.length > 0) return true;
        for (let i = 0; i < bikeCount; i++) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 55 * (1 + i * 0.5);   // bikes a fifth apart
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 260;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);
            osc.connect(filter).connect(gain).connect(this.master);
            osc.start();
            this.hum.push({ osc, gain });
        }
        return true;
    }

    stopHum(): void {
        const ctx = this.ctx;
        if (!ctx) return;
        for (const { osc, gain } of this.hum) {
            gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
            osc.stop(ctx.currentTime + 0.3);
        }
        this.hum = [];
    }

    // ── Building blocks ──

    private blip(freq: number, duration: number, type: OscillatorType, volume: number, pan = 0, endFreq?: number): void {
        const ctx = this.context();
        if (!ctx || !this.master) return;
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
        osc.connect(this.envelope(t, volume, duration)).connect(this.panner(pan));
        osc.start(t);
        osc.stop(t + duration);
    }

    /** Gain node with a fast attack and exponential decay. */
    private envelope(t: number, volume: number, duration: number): GainNode {
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        return gain;
    }

    private panner(pan: number): AudioNode {
        const p = this.ctx!.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(this.master!);
        return p;
    }
}

/** App-wide singleton: one AudioContext per page. Safe to import on the server (inert there). */
export const sound = new Sound();
