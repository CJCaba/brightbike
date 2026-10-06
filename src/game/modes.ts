import type { Controller } from '@/controllers/Controller';
import { KeyboardController } from '@/controllers/KeyboardController';
import { AIController } from '@/controllers/AIController';
import { ARROWS, SOLO, WASD } from '@/controllers/keymaps';
import { easy, hard, medium, type Strategy } from '@/ai/strategies';
import { mulberry32 } from '@/ai/rng';
import type { Difficulty, GameMode } from './options';

const STRATEGIES: Record<Difficulty, Strategy> = { easy, medium, hard };

/** Build the controller list for a game. Player 1 is always a human. */
export function createControllers(mode: GameMode, difficulty: Difficulty, seed = Date.now()): Controller[] {
    switch (mode) {
        case 'local':
            return [new KeyboardController(1, WASD), new KeyboardController(2, ARROWS)];
        case 'ai':
            return [
                new KeyboardController(1, SOLO),    // solo: WASD or arrows both work
                new AIController(2, STRATEGIES[difficulty], mulberry32(seed)),
            ];
    }
}
