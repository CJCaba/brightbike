import type { Metadata } from 'next';
import Game from '@/components/Game';
import { parseDifficulty, parseFirstTo, parseMode } from '@/game/options';

export const metadata: Metadata = { title: 'Play' };    // → "Play · BrightBike"

// /play?mode=local&firstTo=3                → local 2-player
// /play?mode=ai&difficulty=hard&firstTo=5   → you vs CPU (easy | medium | hard)
// Unknown values fall back to defaults; URL params are user input.
export default async function PlayPage(props: PageProps<'/play'>) {
    const params = await props.searchParams;
    const mode = parseMode(params.mode);
    const difficulty = parseDifficulty(params.difficulty);
    const firstTo = parseFirstTo(params.firstTo);

    return (
        <main className="flex flex-1 items-center justify-center bg-[#05070d]">
            {/* key: a different setup gets a fresh match (scores, rounds), not a reused one */}
            <Game key={`${mode}-${difficulty}-${firstTo}`} mode={mode} difficulty={difficulty} firstTo={firstTo} />
        </main>
    )
}
