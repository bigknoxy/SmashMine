# SmashMine

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.1-blue.svg" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="license">
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20PWA-orange.svg" alt="platform">
  <img src="https://wakatime.com/badge/user/e6e9c4aa-0aaf-464e-8b83-c732a932e030/project/7f4b67b6-c164-4d88-8a66-0d83aa931fe8.svg" alt="wakatime">
</p>

<p align="center">
  <strong>SmashMine</strong> — A fast, replayable web-first PWA where you smash blocks, collect loot, and become hilariously OP in 3-5 minutes.
</p>

---

## 🎮 Play Now

**Live at: https://bigknoxy.github.io/SmashMine/**

### Quick Start
1. Click **TAP TO START**
2. Collect **25 Power Shards** by smashing glowing blocks
3. Choose an **upgrade** and play again!

### Controls
| Platform | Movement | Action |
|----------|---------|-------|
| **Desktop** | WASD or Arrow Keys | Space or Click to SMASH |
| **Mobile** | Left joystick zone | Tap SMASH button |

---

## Features

### Core Gameplay
- ⛏️ **Smash blocks** — Break glowing ore blocks to collect loot
- 💎 **Auto-collect** — Loot flies to you automatically (magnet radius)
- 🔄 **Instant replay** — Mission complete → upgrade → play again (30 seconds!)
- 📱 **PWA** — Install as an app, works offline
- 🎯 **No login** — Play immediately

### Juice & Addictiveness (Phase 2)
- 🎬 **Hit-stop** — 50ms freeze on smash for impact feel
- 💬 **Floating text** — Damage numbers and combo indicators pop from blocks
- 🔥 **Combo meter** — Build multipliers with 1.5s window, scales with size
- 📅 **Daily seed** — Same quarry for everyone each day (shared experience)
- 🔥 **Streak counter** — Track consecutive runs on home screen
- ⏰ **Timer tension** — Color shifts yellow→red with pulse animation near time limit

### Meta Progression (Phase 3)
- 🪙 **Token economy** — Earn tokens from completed runs
- ⛰️ **Mine depth** — Deeper levels unlock better ore generation
- ⬆ **Meta upgrades** — Permanent upgrades that persist across runs:
  - Pickaxe Tier (mine faster)
  - Backpack Size (larger magnet radius)
  - Fog Reduction (see further)
  - Token Multiplier (earn more per run)
- 🔄 **Prestige system** — Reset progress but keep meta progression
- 📊 **Statistics tracking** — Total blocks smashed, games completed, best times

### Mobile-First (Phase 1 & 4)
- 📱 **Landscape lock** — Auto-locks to landscape with fullscreen API
- 🎮 **Touch controls** — Virtual joystick + tap to smash
- 📐 **Camera collision** — Raycast push-out prevents wall clipping
- 🎯 **Spawn safety** — Player never spawns inside terrain
- 🔄 **Smooth camera** — Lerp smoothing follows player naturally

### First Mission: Shard Quarry
- **Goal:** Collect 25 Power Shards
- **Time limit:** 4 minutes
- **Environment:** Voxel quarry with ore veins and guaranteed loot blocks

---

## 🚀 Tech Stack

- **Three.js** — 3D WebGL rendering (~120KB gzipped)
- **TypeScript** — Full type safety
- **Vite** — Fast dev server + production builds
- **vite-plugin-pwa** — Service worker + installability
- **Bun** — Runtime and package manager

## 🤖 Automation Skills

This project uses AI automation skills stored in `.opencode/skills/`:

### `/git-workflow` — Git Automation
Auto-invoked after code changes. Automates `git pull --rebase origin main` → `git push origin main`.

### `/pwa-verify` — Verification Suite
Auto-invoked after code changes. Runs 5-step check: tests, TypeScript, build, CI status, deployment health.

### `/mobile-test` — Mobile Testing
Auto-invoked after touch/mobile changes. Tests on mobile viewports with Chromium.

**These skills are invoked AUTOMATICALLY** — no need to manually trigger them.

---

## 🛠️ Development

```bash
# Install
bun install

# Run dev server
bun run dev

# TypeScript check
npx tsc --noEmit

# Run tests
bun test

# Build production
bun run build
```

---

## 📁 Project Structure

```
src/
├── game/         # Core game logic
│   ├── Game.ts          # Main game loop, state machine, mission flow
│   ├── Player.ts       # Physics, movement, smash, gravity
│   ├── SaveSystem.ts   # Persistent save (tokens, upgrades, stats)
│   ├── types.ts        # Type definitions (MetaUpgradeId, GameStatistics)
│   └── world/        # Voxel world generation
│       ├── World.ts        # Block grid (x,y,z)
│       ├── BlockSpawner.ts # Quarry generation (mine depth support)
│       └── ChunkMesher.ts # Greedy meshing for terrain
├── rendering/   # Three.js rendering
│   ├── Renderer.ts       # WebGL setup, camera, resize
│   ├── SceneBuilder.ts  # Terrain + blocks (collision meshes)
│   ├── CameraController.ts # Isometric camera, collision raycast, lerp
│   └── ParticleSystem.ts # Smash particles, hit effects
├── ui/          # DOM UI overlay
│   ├── TitleScreen.ts  # Title, daily seed display
│   ├── HUD.ts          # In-game HUD (tokens, combo, timer)
│   ├── Joystick.ts     # Virtual joystick (WASD + touch)
│   ├── RewardScreen.ts # Mission complete (upgrades, tokens)
│   └── UpgradeScreen.ts # Meta upgrades (pickaxe, backpack, fog)
├── audio/       # Web Audio
│   └── AudioEngine.ts  # Layered sound effects (smash, combo)
└── styles/      # CSS
    └── game.css       # All UI styles (landscape, mobile, HUD)
```

### Project Skills (`.opencode/skills/`)
```
.opencode/skills/
├── git-workflow-automation/   # Auto git pull-rebase-push
├── pwa-verification-suite/   # 5-step verification loop
└── mobile-sandbox-test/       # Mobile PWA testing (no-sandbox)
```

---

## 📊 Telemetry

The game tracks (anonymous):

- `missionStarted` / `missionCompleted` / `replayCount`
- `upgradesPicked` / `lootCollected`
- Time to first reward / time to first replay

---

## 📄 License

**MIT** — See [LICENSE](LICENSE)

---

## 🤝 Contributing

PRs welcome! This is a prototype — help us make it golden.

1. Fork & clone
2. `bun install && bun run dev`
3. Make changes
4. `bun test` — all tests pass
5. Push to `main` — auto-deploys to GitHub Pages