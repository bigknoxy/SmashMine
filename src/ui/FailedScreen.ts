import type { MissionProgress } from '../game/types.js';
import { renderLootHTML } from './lootRenderer.js';

const FAILED_SCREEN = document.getElementById('failed-screen');
const FAILED_LOOT_SUMMARY = document.getElementById('failed-loot-summary');
const RETRY_BTN = document.getElementById('retry-btn');
const HOME_BTN = document.getElementById('home-btn-failed');

let retryCallback: (() => void) | null = null;
let homeCallback: (() => void) | null = null;

export function show(progress: MissionProgress): void {
  if (FAILED_SCREEN) FAILED_SCREEN.classList.remove('hidden');

  if (FAILED_LOOT_SUMMARY) {
    FAILED_LOOT_SUMMARY.innerHTML = renderLootHTML(progress, 'Loot Collected:');
  }
  
  // Set up buttons when the screen is shown
  if (RETRY_BTN && retryCallback) {
    RETRY_BTN.onclick = () => {
      if (retryCallback) retryCallback();
    };
  }
  
  if (HOME_BTN && homeCallback) {
    HOME_BTN.onclick = () => {
      if (homeCallback) homeCallback();
    };
  }
}

export function hide(): void {
  if (FAILED_SCREEN) FAILED_SCREEN.classList.add('hidden');
}

export function onRetryClick(callback: () => void): void {
  retryCallback = callback;
  if (RETRY_BTN) {
    RETRY_BTN.onclick = () => {
      if (retryCallback) retryCallback();
    };
  }
}

export function onHomeClick(callback: () => void): void {
  homeCallback = callback;
  if (HOME_BTN) {
    HOME_BTN.onclick = () => {
      if (homeCallback) homeCallback();
    };
  }
}