# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-04-29

### Added (Phase 3: Meta Progression)
- **Token Economy**: Earn tokens from runs (2 per shard + time bonus).
- **Mine Depth**: Progress deeper with each completed mission (affects ore quality).
- **Meta Upgrades**: Permanent upgrades using tokens:
  - Pickaxe Tier (5 levels): Reduces block HP by 20% per level.
  - Backpack Size (5 levels): Increases loot capacity.
  - Fog Reduction (3 levels): Clears fog for better visibility.
  - Token Multiplier (4 levels): +25% tokens per level.
- **Statistics Tracking**: All-time stats (blocks smashed, best combo, play time, etc.).
- **Enhanced Prestige**: Now keeps tokens, meta upgrades, statistics, and mine depth.
- **Meta Upgrade Screen**: New UI accessible from title screen.
- **Reward Screen**: Now shows tokens earned after mission completion.
- **HUD**: Added token display during gameplay.

### Changed
- Save system updated to version 2 (automatic migration).
- `generateQuarry()` now accepts mine depth for better ore generation at deeper levels.

## [0.2.0] - 2026-04-28

### Added (Phase 2: Smash Juice & Addictiveness)
- **Smash Juice**: Hit-stop effect (50ms freeze) on block smash.
- **Smash Juice**: Floating text (+1, +2, etc.) with fade and scale animation.
- **Smash Juice**: Enhanced particle burst (15 cubes with gravity and lifetime).
- **Smash Juice**: Layered audio on smash (low thud 40-80Hz + high chime 1200Hz).
- **Combo Meter**: Track combo count with 1.5s window, display multiplier (cap x3.0).
- **Timer Tension**: Color shifts (white >1:00, yellow ≤1:00, red ≤0:30, pulse ≤0:10).
- **Timer Tension**: Ticking SFX in last 10 seconds.
- **Timer Tension**: Near-miss messaging on 24/25 shards.
- **Daily Seed**: Today's date as world seed for consistent daily worlds.
- **Daily Seed**: "Today's Quarry" display on title screen.
- **Daily Seed**: Personal best tracking in localStorage.
- **One More Hook**: Streak counter (consecutive runs within 10s).
- **One More Hook**: Auto-focus upgrade screen after mission complete.

### Changed
- Enhanced `AudioEngine.ts` with layered sound effects.
- Updated `ParticleSystem.ts` with gravity and lifetime parameters.
- Added HUD elements for combo display and streak counter.

## [0.1.14] - 2026-04-28

### Added
- Automated versioning in build pipeline.
- Version display (v0.1.14) on the Title Screen.
- "Mission Failed" state and screen when timer reaches 0:00.
- X-Ray silhouette for better player visibility behind walls.
- Emissive glow and increased body thickness for the Mining Bot.

### Fixed
- Critical scoring bug where loot collection double-cleared data.
- Loot spawning position bug in `LootSystem`.
- Mission timer expiring without triggering failure.

### Changed
- Refactored `Renderer.ts` and `Game.ts` for better maintainability.
- Consolidated UI logic and CSS for overlays.
- Dev server now uses `--host` by default for network testing.
