import './styles/game.css';
import { Game } from './game/Game.js';
import './ui/InstallPrompt.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const game = new Game(canvas);

let orientationLockRequested = false;

function isRunningAsPwa(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (navigator as any).standalone === true;
}

async function requestLandscapeLock(): Promise<void> {
  if (orientationLockRequested) return;
  if (isRunningAsPwa()) {
    orientationLockRequested = true;
    return;
  }

  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    const orientation = screen.orientation as any;
    if (typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
    }
    orientationLockRequested = true;
  } catch {
    console.log('[SmashMine] Landscape lock not supported, showing rotate prompt');
  }
}

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

canvas.addEventListener('pointerdown', (e) => {
  // Check if the click is NOT on the joystick or other UI elements
  const isOnUIElement = e.target !== canvas && (
    e.target instanceof Element && 
    (e.target.closest('#joystick-zone') || 
     e.target.closest('#joystick-base') || 
     e.target.closest('#joystick-knob') ||
     e.target.closest('#smash-btn') ||
     e.target.closest('#special-btn'))
  );
  
  // Only request landscape lock and handle canvas click if not on UI elements
  if (!isOnUIElement) {
    requestLandscapeLock();
    game.onCanvasClick(e);
  }
});

document.addEventListener('click', () => {
  requestLandscapeLock();
}, { once: false });

game.start();