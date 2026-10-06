import { PLAYER_NAMES } from '@/render/theme';
import type { GameMode } from './options';

/** Display name for a bike. In AI mode the human is always bike 1. */
export function playerLabel(mode: GameMode, id: number): string {
    if (mode === 'ai') return id === 1 ? 'You' : 'CPU';
    return PLAYER_NAMES[id] ?? `Player ${id}`;
}

/** "Blue wins" / "You win" / "Draw" */
export function winsPhrase(mode: GameMode, winner: number | null): string {
    if (winner === null) return 'Draw';
    const name = playerLabel(mode, winner);
    return name === 'You' ? 'You win' : `${name} wins`;
}
