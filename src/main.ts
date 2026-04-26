import './styles/game.css';
import { Game } from './game/Game.js';
import { GameState } from './game/GameState.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas element not found');

const game = new Game(canvas);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pause();
  else game.resume();
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('pointerdown', (e) => {
  game.onCanvasClick(e);
});

game.start();