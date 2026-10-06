/**
 * Shown only on touch-first devices (CSS `pointer: coarse`), where there's no keyboard
 * to steer with. Pure CSS — no JS detection, so there is nothing to hydrate or flash.
 */
export default function TouchNotice() {
    return (
        <p
            role="note"
            className="hidden border-b border-[#00e5ff]/40 bg-[#00e5ff]/10 px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-[#e6fbff] pointer-coarse:block"
        >
            BrightBike is played with a keyboard — best on desktop
        </p>
    );
}
