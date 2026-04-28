# Changelog

All notable changes to this project will be documented in this file.

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
