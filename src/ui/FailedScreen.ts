import type { MissionProgress } from '../game/types.js';
import { renderLootHTML } from './lootRenderer.js';

const FAILED_SCREEN = document.getElementById('failed-screen');
const FAILED_LOOT_SUMMARY = document.getElementById('failed-loot-summary');
const RETRY_BTN = document.getElementById('retry-btn');

let retryCallback: (() => void) | null = null;

export function show(progress: MissionProgress): void {
  if (FAILED_SCREEN) FAILED_SCREEN.classList.remove('hidden');

  if (FAILED_LOOT_SUMMARY) {
    FAILED_LOOT_SUMMARY.innerHTML = renderLootHTML(progress, 'Loot Collected:');
  }
}

export function hide(): void {
  if (FAILED_SCREEN) FAILED_SCREEN.classList.add('hidden');
}

export function onRetryClick(callback: () => void): void {
  retryCallback = callback;
  if (RETRY_BTN) {
    RETRY_BTN.addEventListener('click', () => {
      if (retryCallback) retryCallback();
    });
  }
}