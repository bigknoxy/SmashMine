# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Run/Test Commands

```bash
bun install                        # Install dependencies
bun run dev                        # Dev server (Vite, HMR, port 5173)
bun run build                      # Production build (Vite)
bun run test                       # Run all tests (vitest run)
bun run test -- --reporter=verbose # Tests with detailed output
npx tsc --noEmit                   # TypeScript type-check only
```

## Project Context

SmashMine is a **mobile-first PWA game** — a single-page TypeScript app using Three.js for 3D rendering. No backend; deployed to GitHub Pages at `/SmashMine/`. Uses Vite + vite-plugin-pwa for build and service worker. Bun as package manager/runtime, but the build toolchain is Vite/Vitest (not Bun's bundler).

## Architecture: State Machine

Everything is driven by `GameState` (defined in `src/game/GameState.ts`):

```
TITLE → MISSION_INTRO → PLAYING → MISSION_COMPLETE → UPGRADE_PICK → (loop back to PLAYING)
                               ↘ MISSION_FAILED → (retry or TITLE)
```

- `Game.update(delta)` switches on `gameState` — only `PLAYING` runs game logic.
- `applyStateToUI(state)` is the single place that maps state to UI visibility. It hides all overlays, then shows only what's relevant for the current state. Gameplay UI (HUD, joystick, smash button) is only visible during `PLAYING` and `MISSION_INTRO`.
- `Game.startMission()` resets the world, player, loot system, and renders fresh terrain. It's called for both new missions and replays.
- `Game.goToHome()` resets state to `TITLE`; the title screen's "TAP TO START" button calls `showMissionSelect()`.

## Core Systems (all instantiated in Game constructor)

**World** (`src/world/World.ts`) — A flat `Uint8Array` of block type numbers (0-10). Indexed by `x + z*sizeX + y*sizeXY`. Block types map via `BLOCK_TYPE_NUMBERS` / `NUMBER_TO_BLOCK_TYPE`. Air is 0. Bedrock is 10 (indestructible floor at y=0).

**BlockSpawner** (`src/world/BlockSpawner.ts`) — `generateQuarry()` builds voxel terrain deterministically using a mulberry32 PRNG seeded with `hash(missionId + mineDepth)`. Daily seed mode uses the date string as part of the seed. Guarantees ore veins near spawn point.

**ChunkMesher** (`src/world/ChunkMesher.ts`) — Greedy meshing: merges adjacent same-type blocks into larger box geometries rather than one per block.

**Renderer** (`src/rendering/Renderer.ts`) — Owns the Three.js scene, camera, and player mesh. Terrain management uses `userData` tags (`isTerrain`, `isGround`, `isSpecial`) to identify terrain meshes for selective removal on `rebuildTerrain()`. `initWorld()` clears old terrain, generates new world, builds scene, then updates `CameraController` collidables.

**CameraController** (`src/rendering/CameraController.ts`) — Isometric-ish perspective camera with lerp smoothing following the player. Raycast-based collision push-out prevents wall clipping. Collidables are re-registered after each terrain rebuild.

**SaveSystem** (`src/game/SaveSystem.ts`) — Singleton (`saveSystem`), localStorage-backed. Dirty-flag pattern: mark dirty on writes, call `save()` explicitly. Versioned (`CURRENT_VERSION = 2`) with default-merging on load (new fields get defaults). Tracks shards, coins, tokens, mine depth, meta upgrades, stats, daily streak.

**MissionManager** (`src/game/MissionManager.ts`) — Tracks shard/coin counts, timer, and completion/fail conditions per mission. `update()` returns `{ completed, failed, surprise }`.

**Player** (`src/game/Player.ts`) — Physics (gravity, ground detection), movement from `InputState`, smash targeting. Position is center of entity; feet are at `pos.y - 0.9`.

## UI Layer

All UI is DOM overlay (HTML in `index.html`, styled by `src/styles/game.css`). No React or framework — direct DOM manipulation from TypeScript modules. Each UI module (`TitleScreen`, `HUD`, `RewardScreen`, `FailedScreen`, `MissionSelect`, etc.) is a plain TS file that shows/hides elements and wires callbacks.

## Mobile-Specific

- Landscape lock requested via Fullscreen API + Screen Orientation API. Portrait shows a `#rotate-prompt` overlay.
- Touch controls: left-side `#joystick-zone` (virtual joystick) + right-side `#smash-btn`. Touch targets are 44x44px minimum.
- `viewport-fit=cover` for notched devices. User-scalable disabled, no text selection, context menu prevented.
- PWA manifest sets `display: fullscreen` and `orientation: landscape`.

## Key Data Files

- `src/data/missions.ts` — 12 mission definitions (id, targetShards, timeLimit, zoneSize, surpriseAt)
- `src/data/lootTable.ts` — Loot tables keyed by block type
- `src/data/upgrades.ts` — Run-time upgrade definitions

## Deploy

GitHub Pages at `https://bigknoxy.github.io/SmashMine/`. Vite `base` is `/SmashMine/`. Auto-deploys on push to main.

---

## Skill Routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Project-Specific Skill Automation

### Auto-Invoke Rules for Project Skills

**1. `/git-workflow` — ALWAYS use after making code changes**
- Trigger: After ANY commit to main branch (Phase 1-4 patterns)
- Trigger: After implementing a feature or bug fix
- What it does: Automates `git pull --rebase origin main` → `git push origin main`

**2. `/pwa-verify` — ALWAYS use after code changes + before declaring done**
- Trigger: After ANY implementation phase completes
- Trigger: After modifying: `src/**/*.ts`, `index.html`, `vite.config.ts`, `*.css`
- What it does: Runs 5-step verification (tests, typescript, build, CI, deployment)

**3. `/mobile-test` — Use when testing touch/mobile features**
- Trigger: After modifying `src/ui/Joystick.ts`, `src/game/Player.ts`, `src/rendering/CameraController.ts`
- Trigger: When user says "test on mobile" or "verify touch"
- What it does: Launches Chromium with `--no-sandbox`, tests mobile viewports

---

## Auto-Invoke Rules for Agents

**HashPilot Agent — Use for ALL file edits**
- Trigger: When editing ANY `.ts`, `.tsx` file
- Trigger: When multiple file edits are needed
- What it does: Hash-anchored editing, AST-aware edits, batched operations

**perf-bug-hunter Agent — Use when debugging performance/mobile issues**
- Trigger: User reports "FPS drop", "laggy", "slow"
- Trigger: Mobile performance issues on real devices

**pwa-game-builder Agent — Use for implementation tasks**
- Trigger: Implementing new game features
- Trigger: Modifying: `src/game/*.ts`, `src/rendering/*.ts`, `src/world/*.ts`

**code-simplifier Agent — Use after large implementations**
- Trigger: After completing a Phase (1-4 pattern)
- Trigger: When code feels verbose or overly complex
