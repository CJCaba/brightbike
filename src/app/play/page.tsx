import Game from '@/components/Game';
import { parseDifficulty, parseMode } from '@/game/options';

// /play                              → local 2-player
// /play?mode=ai&difficulty=hard      → you vs CPU (easy | medium | hard)
// Unknown values fall back to defaults; URL params are user input.
export default async function PlayPage(props: PageProps<'/play'>) {
    const params = await props.searchParams;
    const mode = parseMode(params.mode);
    const difficulty = parseDifficulty(params.difficulty);

    return (
        <main className="flex flex-1 items-center justify-center bg-[#05070d]">
            <Game mode={mode} difficulty={difficulty} />
        </main>
    )
}
