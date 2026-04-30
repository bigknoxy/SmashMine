import './styles/game.css';
import { Game } from './game/Game.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const game = new Game(canvas);

// Track if we've already successfully requested fullscreen+orientation lock
let orientationLockRequested = false;

/**
 * Request fullscreen and lock orientation to landscape.
 * Must be called from a user gesture (pointerdown/click).
 * Works on Chrome for Android; fails gracefully on iOS Safari.
 */
async function requestLandscapeLock(): Promise<void> {
  if (orientationLockRequested) return;

  try {
    // Fullscreen is required for screen.orientation.lock to work on most browsers
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    // Use type assertion since some TypeScript DOM libs don't include lock()
    const orientation = screen.orientation as any;
    if (typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
    }
    orientationLockRequested = true; // Only set flag on success
  } catch {
    // Graceful fallback: fullscreen/lock not supported (e.g., iOS Safari)
    // Don't set flag - allow retry on next interaction
    console.log('[SmashMine] Landscape lock not supported, showing rotate prompt');
  }
}

// Listen for orientation changes using modern API (window.orientationchange is deprecated)
screen.orientation.addEventListener('change', () => {
  game.onOrientationChange();
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  game.resize(window.innerWidth, window.innerHeight);
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
  else game.resume();
});

document.body.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Request landscape lock on first user interaction (required for the API to work)
canvas.addEventListener('pointerdown', (e) => {
  requestLandscapeLock();
  game.onCanvasClick(e);
});

game.start();