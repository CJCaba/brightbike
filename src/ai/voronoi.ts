import type { Vec } from '@/engine/types';
import { cellIndex, inBounds } from '@/engine/collision';

const ME = 1;
const THEM = 2;
const CONTESTED = 3;

export interface Territory {
    /** Empty cells I reach strictly before any opponent. */
    mine: number;
    /** Empty cells some opponent reaches strictly before me. */
    theirs: number;
    /** Empty cells reached at the same distance by both sides. */
    contested: number;
    /** True if my region and the opponents' regions never touch. */
    separated: boolean;
}

/**
 * Split the empty cells by who can reach them first (a Voronoi partition on the grid).
 *
 * One multi-source BFS: my start cell and every opponent head start at distance 0.
 * BFS visits cells in distance order, so the first side to reach a cell is the closest.
 * Start cells themselves are not counted. Callers should mark `me` as occupied in
 * `grid` first, so the search can't flow back through the cell I'm about to fill.
 */
export function territory(
    grid: Uint8Array,
    width: number,
    height: number,
    me: Vec,
    opponents: readonly Vec[],
): Territory {
    const size = width * height;
    const dist = new Int32Array(size).fill(-1);
    const owner = new Uint8Array(size);
    const queue = new Int32Array(size);     // each cell is enqueued at most once
    let head = 0;
    let tail = 0;

    const seed = (p: Vec, who: number) => {
        if (!inBounds(width, height, p)) return;
        const i = cellIndex(width, p);
        if (dist[i] === 0) {
            if (owner[i] !== who) owner[i] = CONTESTED;
            return;
        }
        dist[i] = 0;
        owner[i] = who;
        queue[tail++] = i;
    };
    seed(me, ME);
    for (const p of opponents) seed(p, THEM);

    let mine = 0;
    let theirs = 0;
    let contested = 0;
    let met = false;

    while (head < tail) {
        const i = queue[head++];
        const who = owner[i];

        if (dist[i] > 0) {
            if (who === ME) mine++;
            else if (who === THEM) theirs++;
            else contested++;
        }
        if (who === CONTESTED) continue;    // a tie claims nothing beyond itself

        const nextDist = dist[i] + 1;
        const expand = (j: number) => {
            if (grid[j] !== 0) return;
            if (dist[j] === -1) {
                dist[j] = nextDist;
                owner[j] = who;
                queue[tail++] = j;
            } else if (owner[j] !== who) {
                met = true;                 // the two waves touch: regions are connected
                if (dist[j] === nextDist) owner[j] = CONTESTED;
            }
        };

        const x = i % width;
        if (x > 0) expand(i - 1);
        if (x < width - 1) expand(i + 1);
        if (i >= width) expand(i - width);
        if (i < size - width) expand(i + width);
    }

    return { mine, theirs, contested, separated: !met };
}
