import { InputQueue } from "./InputQueue";
import { Keymap } from "./keymaps";
import { GameState, Direction } from "@/engine/types";

export class KeyboardController {

    private readonly queue = new InputQueue();

    constructor(readonly bikeId: number, private readonly keymap: Keymap) { 
        window.addEventListener('keydown', this.onKeyDown);
    };

    private onKeyDown = (event: KeyboardEvent): void => {
        const direction = this.keymap[event.code];
        if(!direction) return;
        event.preventDefault();
        if (event.repeat) return;
        this.queue.push(direction);
    };

    getInput(state: Readonly<GameState>): Direction | undefined {
        // Find this controller's bike; undefined if missing or dead
        const bike = state.bikes.find(b => b.id === this.bikeId);
        if (!bike || !bike.alive) {
            return undefined;
        }
        return this.queue.next(bike.dir) || undefined;
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown);
    }
}