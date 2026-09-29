import type { Controller } from '@/controllers/Controller';
import { KeyboardController } from '@/controllers/KeyboardController';
import { ARROWS, WASD } from '@/controllers/keymaps'

export type GameMode = 'local' | 'online' | 'ai';
export function createControllers(mode: GameMode): Controller[] {
    switch (mode) {
        case 'local':
            return [new KeyboardController(1, WASD), new KeyboardController(2, ARROWS)];
        case 'online':
            // Implementation for online mode
            return [];
        case 'ai':
            // Implementation for AI mode
            return [];
    }
}