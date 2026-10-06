# BrightBike — Development Plan

A Tron-style light-cycle game built with Next.js 16, React 19, TypeScript, and Canvas 2D.
Players steer a constantly moving BrightBike that leaves a trail of light. Hitting the
arena boundary or any trail loses; the last bike alive wins.

**Modes:** Single player (vs AI) · Local multiplayer (2 players, one keyboard) · Online (future)

## Status

| Step | State | Commit |
|---|---|---|
| 1–3 · Setup, engine types, `tick()` (TDD) | ✅ Done | `19d61ef`, `104d827` |
| 4 · Static render | ✅ Done | `7c846f8` |
| 5 · Game loop + keyboard | ✅ Done | `87c0a5e` |
| 6 · Local multiplayer (countdown, overlay, rematch) | ✅ Done | `0e48bf3` |
| 7 · AI opponent (easy / medium / hard) | ✅ Done | `8134cf8` |
| 8 · Menu, match scoring, pause | ✅ Done | `2bec539` |
| 9 · Polish (glow, particles, sound, responsive, metadata) | ✅ Done | *(uncommitted)* |
| 8b · Trail length option | ⏳ Planned (after 9) | |
| 10 · Ship · 11 · Online | ⏳ Planned | |

Tests: 75 passing across engine, controllers, AI (incl. seeded AI-vs-AI arena), and game logic.

---

## Guiding principles

1. **The engine is pure TypeScript.** `src/engine/` never imports React, Next.js, or the DOM.
   It exposes `tick(state, inputs) → state` and nothing else changes game state.
2. **Determinism.** Same state + same inputs ⇒ same result. No `Math.random()` or
   `Date.now()` inside the engine (use a seeded PRNG stored in state if randomness is needed).
3. **Serializable state.** `GameState` is plain data so it can be sent over a network later.
4. **Grid + fixed timestep.** The world is a grid of cells; the simulation advances in fixed
   ticks independent of monitor refresh rate.
5. **Controllers produce inputs.** Keyboard, AI, and (future) Remote controllers all implement
   one `Controller` interface. Game modes are just different controller lists.
6. **React only for UI.** Per-frame game state lives in a `useRef`, never `useState`.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│  Next.js / React  (menus, HUD, settings)     │
│   └── <GameCanvas/>  renders + wires input   │
├──────────────────────────────────────────────┤
│  Engine (pure TS)                            │
│   createGame(config) → GameState             │
│   tick(state, inputs) → GameState            │
├──────────────────────────────────────────────┤
│  Controllers: Keyboard | AI | Remote(future) │
└──────────────────────────────────────────────┘
```

## Folder structure (current)

```
brightbike/
  PLAN.md
  vitest.config.ts
  src/
    app/
      layout.tsx
      globals.css
      page.tsx              # Main menu
      play/page.tsx         # Game screen (?mode=local|ai&difficulty=…&firstTo=…)
    components/
      MainMenu.tsx          # Mode / difficulty / match length selection
      Game.tsx              # Owns phase, match score, pause; remounts GameCanvas per round
      GameCanvas.tsx        # Canvas, fixed-timestep loop, controllers
      Hud.tsx               # Countdown, pause, round/match-over overlays
      Scoreboard.tsx        # ← Menu · live score · Esc hint
    engine/                 # ⚠ pure TS — no React/DOM (ESLint-enforced)
      types.ts · constants.ts · createGame.ts · tick.ts · collision.ts
      tests/                # tick, collision, testUtils (makeState)
    ai/                     # ⚠ pure TS — seeded RNG only (ESLint-enforced)
      rng.ts · moves.ts · floodFill.ts · voronoi.ts · strategies.ts
      tests/                # unit tests + seeded AI-vs-AI arena
    controllers/
      Controller.ts · InputQueue.ts · keymaps.ts · KeyboardController.ts · AIController.ts
      tests/
    game/
      options.ts            # modes, difficulties, match length, URL parsing
      modes.ts              # mode → controller list
      match.ts              # round scoring (pure, tested)
      phase.ts · labels.ts
      tests/
    render/
      theme.ts · drawGame.ts
```

---

## Milestones

Each milestone ends with a **checkpoint**: something you can run or see.

### Step 1 — Project setup & structure ✅
- [x] Move `app/` → `src/app/`
- [x] Update `tsconfig.json` path alias `@/*` → `./src/*`
- [x] Add `vitest.config.ts` (node environment, `@` alias)
- [x] Add `test` / `test:watch` scripts to `package.json`
- [x] Add ESLint rule blocking React/Next/DOM imports inside `src/engine/`
      (regex form also catches relative imports and `.tsx`; also bans `Math.random`/`Date.now`)
- [x] Add `"engines": { "node": ">=22.12.0" }`
- [x] `git init` and first commit
- **Checkpoint:** ✅ `npm run dev` shows the starter page; `npm test` runs

### Step 2 — Engine types & constants ✅
- [x] `types.ts`: `Direction`, `Vec`, `Bike`, `GameStatus`, `GameState`, `Inputs`, `GameConfig`
      (`GameStatus` = `waiting` · `running` · `paused` · `game-over`; `winner` is a bike id)
- [x] `constants.ts`: grid size, tick rate, `DIRECTION_VECTORS`, `OPPOSITE_DIRECTIONS`
      (bike colors moved to `render/theme.ts` — rendering concern, not a game rule)
- **Checkpoint:** ✅ `npx tsc --noEmit` passes

### Step 3 — `createGame` + `tick` + collision (TDD) ✅
- [x] `createGame(config)` spawns bikes on opposite sides, marks starting cells in grid; `startGame()`
- [x] `collision.ts`: `inBounds`, `cellIndex`, `step`, `isCollision` (named `isBlocked` in the original plan)
- [x] `tick()` resolution order (returns a new state; never mutates its input):
  1. Apply turn inputs (reject 180° reversals)
  2. Compute next positions
  3. Detect deaths: out of bounds · occupied cell · two bikes entering same cell
  4. Move survivors & write trail cells
  5. Resolve winner / draw → `status = 'game-over'`
- [x] Tests: wall death, trail death, self-trail death (single + multi-tick), reversal ignored,
      same-cell draw, head-swap draw, simultaneous death draw, survivor wins, dead bikes inert,
      no input mutation (in `engine/tests/`; verified against deliberately broken `tick()` versions)
- **Checkpoint:** ✅ all engine tests green

### Step 4 — Static render ✅
- [x] `drawGame(ctx, state, gridLayer)`: background, grid lines (offscreen layer), inset trails, glowing heads
- [x] `GameCanvas.tsx` (`'use client'`) sizes canvas with `devicePixelRatio` (buffer + CSS size, `setTransform`)
- [x] `src/app/play/page.tsx` renders the game (now via `<Game/>`)
- **Checkpoint:** ✅ arena and two bikes visible at `/play` (checked at 1×, 1.25×, 1.5×, 2× DPR)

### Step 5 — Game loop + keyboard ✅
- [x] Fixed-timestep loop with `requestAnimationFrame` + accumulator; state in `useRef`
- [x] Clamp frame delta so a hidden/backgrounded tab doesn't fast-forward the game
- [x] `InputQueue` (pure, unit-tested) + `Controller` interface + `KeyboardController`
      (uses `e.code`, ignores `e.repeat`, 2-deep queue, `preventDefault`, `dispose()` cleanup)
- [x] Loop + listener cleanup safe under React Strict Mode (dev and prod timing match within 2 ms)
- **Checkpoint:** ✅ bikes move, turn, die at walls; game stops on game over

### Step 6 — Local multiplayer ✅
- [x] `game/modes.ts`: `createControllers(mode)` → P1 = WASD, P2 = Arrow keys
- [x] `Game.tsx` owns UI phase (`countdown` → `playing` → `over`) + round number
- [x] `GameCanvas` reports phase changes via `useEffectEvent`; remounted with `key={round}` for Rematch
- [x] Countdown (3-2-1) driven by the loop's clock; arena visible underneath
- [x] `Hud.tsx`: countdown number, winner / draw overlay, Rematch button (Enter works)
- **Checkpoint:** ✅ two people can play a full round and rematch

### Step 7 — AI opponent ✅
- [x] `src/ai/` is pure (no DOM, seeded RNG only) — ESLint purity block extended to cover it
- [x] Helpers: `mulberry32` RNG, `safeMoves`, `dangerCells` / `avoidDanger`
- [x] Easy: avoid immediate collision, mostly straight, occasional random turn
- [x] Medium: flood-fill reachable area, choose move with most space; avoid head-on cells
- [x] Hard: Voronoi territory (cells I reach first − theirs). No separate "survival" switch needed:
      once separated, `mine − theirs` already means "keep the most space for myself"
- [x] `AIController` implements `Controller`; `GameMode = 'local' | 'ai'` + `Difficulty` (`game/options.ts`)
- [x] `/play?mode=ai&difficulty=hard` via `searchParams`, validated with fallbacks
- [x] Unit tests on hand-built grids + seeded AI-vs-AI arena test with random openings
      (without openings, hard-vs-medium replayed only 8 distinct games out of 200 seeds)
- **Checkpoint:** ✅ arena (200 games each): medium–easy 94.5%, hard–easy 100%, hard–medium 96.5%;
  decisions ≈0.05 ms typical, ≈3.4 ms worst case

### Step 8 — Menus & game flow ✅
- [x] Main menu at `/`: Single Player (difficulty) · Local Multiplayer · match length (first to 1/3/5) · Controls
- [x] `game/match.ts` (pure, tested): scores per round, draws score nobody, first to N wins
- [x] Scoreboard bar above the arena (← Menu · live score · Esc hint)
- [x] Round over → "Next round"; match over → "Play again" / Menu
- [x] Pause: Esc toggles during play; auto-pause when the tab is hidden; resume doesn't fast-forward
- [x] Fixed: countdown briefly showed "4" (start time now taken from the first frame's timestamp)
- **Checkpoint:** ✅ full loop from menu → match → rematch/menu, verified in a headless browser

### Step 8b — Game option: trail length (finite / fading trails)
Engine-only addition; the grid stays the single source of truth for collisions.
- [ ] Decide & document rules first (each gets a test):
  - Tail clears **before** collision checks (tail-chasing is allowed, like Snake)
  - Crashed bike's trail: keep · clear instantly · keep expiring (pick one)
  - Head counts toward length, so `trail.length <= trailLength` always holds
- [ ] `types.ts`: `Bike.trail: number[]` (cell indices, oldest first);
      `trailLength: number | null` on `GameConfig` + `GameState` (`null` = classic/permanent)
- [ ] `createGame`: seed each `trail` with the spawn cell; copy `trailLength` from config
- [ ] `tick`: Phase 0 copies each `trail`; expire oldest cells into the **copied** grid
      between phase 2 and 3; phase 3 checks the copied grid (comment why); phase 4 pushes new cell
- [ ] `testUtils`: seed `trail: [spawnIndex]`; note that `walls` never expire
- [ ] Tests: never exceeds limit · oldest cell cleared · `null` = infinite · tail-chase survives ·
      crashed-trail rule · un-expired trail still kills
- [ ] Menu option (e.g. Classic / Short trails); time-based = `seconds × TICKS_PER_SECOND`
- [ ] Optional: renderer fades older cells using their position in `trail`
- **Checkpoint:** existing tests unchanged & green; short-trail mode playable from the menu

### Step 9 — Polish ✅
- [x] Neon glow via persistent trail canvas layer (`render/trailLayer.ts`): ribbons with a bright
      core, only new segments drawn per tick; segment list replayed on resize
- [x] Death particle burst, subtle screen shake (`render/effects.ts`); reduced-motion → no shake,
      smaller burst; loop keeps animating after game over until the explosion settles (~1 s), then stops
- [x] `game/events.ts` (pure, tested): `diffTick(prev, next)` → crashed / turned / moved
- [x] Sound (Web Audio API, synthesized — no files): countdown beeps, "go", engine hum per bike,
      turn blip, crash noise burst, stereo-panned; created only after user activation (no autoplay
      warning); M key / Scoreboard button toggles mute, persisted in localStorage
- [x] Responsive canvas: CSS sizes the arena to fit the viewport (≤1200px); buffer follows
      CSS size × DPR via ResizeObserver + window resize (crisp at any size or zoom)
- [x] "Best on desktop" notice on touch devices (CSS `pointer: coarse`, no JS)
- [x] Metadata: title template, description, theme color, `app/icon.svg`; dropped unused Geist Sans
      and the Create Next App assets; dark-only base styles
- **Checkpoint:** ✅ verified headless at 1280×900, 1920×1080, 1366×768@2×, 390×844@3× (touch)

### Step 10 — Ship
- [ ] `npm run build` and `npm run lint` clean
- [ ] Deploy to Vercel
- [ ] README: description, GIF, controls, tech stack, architecture diagram, how to run/test
- **Checkpoint:** public URL works

### Step 11 — (Future) Online multiplayer
- [ ] Extract engine into a shared package (npm workspaces)
- [ ] Authoritative Node server (Socket.IO / Colyseus / PartyKit) runs `tick()`
- [ ] `RemoteController`; clients send inputs, receive snapshots
- [ ] Lobby / room codes; host server separately from Vercel (Fly.io, Railway, Render)

---

## Controls (default)

| Action | Player 1 | Player 2 |
|---|---|---|
| Up | W | ↑ |
| Down | S | ↓ |
| Left | A | ← |
| Right | D | → |
| Pause | Esc | Esc |

## Known pitfalls checklist
- [x] No per-frame `useState` (game state in a ref; React updates only on phase/score changes)
- [x] Game speed independent of refresh rate (fixed timestep)
- [x] Event listeners removed on unmount (controllers' `dispose()`, effect cleanups)
- [x] Canvas `width`/`height` attributes set (not just CSS) × DPR
- [x] No `window` access during SSR (all browser APIs inside effects)
- [x] No `Math.random()` inside `src/engine/` or `src/ai/` (ESLint-enforced)
- [x] Effect dependencies are primitives (an object dep would restart the game every render)
- [x] Filenames match import casing exactly (Windows ignores case; Vercel's Linux build does not)
