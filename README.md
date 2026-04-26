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

- ⛏️ **Smash blocks** — Break glowing ore blocks to collect loot
- 💎 **Auto-collect** — Loot flies to you automatically (magnet radius)
- ⚡ **6 Upgrades** — Chain Break, Magnet Pet, Mega Swing, Double Jump, Treasure Vision, OP Mode
- 🔄 **Instant replay** — Mission complete → upgrade → play again (30 seconds!)
- 📱 **PWA** — Install as an app, works offline
- 🎯 **No login** — Play immediately

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
│   ├── Game.ts          # Main game loop, state machine
│   ├── Player.ts       # Physics, movement, upgrades
│   ├── SmashSystem.ts  # Block breaking, chain breaks
│   ├── LootSystem.ts  # Drops, auto-collect
│   └── MissionManager.ts
├── world/        # Voxel world generation
│   ├── World.ts        # Block grid
│   ├── BlockSpawner.ts # Quarry generation
│   └── ChunkMesher.ts # Greedy meshing
├── rendering/   # Three.js rendering
│   ├── Renderer.ts       # WebGL setup
│   ├── SceneBuilder.ts  # Terrain + blocks
│   ├── CameraController.ts
│   └── ParticleSystem.ts
├── ui/          # DOM UI overlay
│   ├── TitleScreen.ts
│   ├── HUD.ts
│   ├── Joystick.ts
│   └── RewardScreen.ts
├── audio/       # Web Audio
├── data/        # Missions, upgrades, loot tables
└── styles/      # CSS
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