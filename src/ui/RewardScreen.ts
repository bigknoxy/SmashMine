import type { MissionProgress, UpgradeId } from '../game/types.js';
import { UPGRADES } from '../data/upgrades.js';
import { renderLootHTML } from './lootRenderer.js';
import { saveSystem } from '../game/SaveSystem.js';

const REWARD_SCREEN = document.getElementById('reward-screen');
const LOOT_SUMMARY = document.getElementById('loot-summary');
const UPGRADE_CARDS = document.getElementById('upgrade-cards');
const REPLAY_BTN = document.getElementById('replay-btn');
const HOME_BTN = document.getElementById('home-btn-success');
const STREAK_DISPLAY = document.getElementById('streak-display');

let upgradeCallback: ((upgradeId: UpgradeId) => void) | null = null;
let replayCallback: (() => void) | null = null;
let homeCallback: (() => void) | null = null;

export function show(progress: MissionProgress, onUpgrade: (id: UpgradeId) => void): void {
  upgradeCallback = onUpgrade;
  if (REWARD_SCREEN) REWARD_SCREEN.classList.remove('hidden');

  if (LOOT_SUMMARY) {
    LOOT_SUMMARY.innerHTML = renderLootHTML(progress);
  }

  // Phase 2: Streak - Show streak counter
  const streak = saveSystem.getStreak();
  if (STREAK_DISPLAY) {
    if (streak >= 2) {
      STREAK_DISPLAY.textContent = `🔥 ${streak} runs in a row!`;
      STREAK_DISPLAY.classList.remove('hidden');
    } else {
      STREAK_DISPLAY.classList.add('hidden');
    }
  }

  if (UPGRADE_CARDS) {
    const choices = getRandomUpgrades();
    let cardsHTML = '';
    for (const u of choices) {
      cardsHTML += `<div class="upgrade-card" data-upgrade="${u.id}">
        <div class="icon">${u.icon}</div>
        <div class="name">${u.name}</div>
        <div class="desc">${u.description}</div>
      </div>`;
    }
    UPGRADE_CARDS.innerHTML = cardsHTML;

    // Phase 2: One More Hooks - Auto-focus upgrade screen
    const cards = UPGRADE_CARDS.querySelectorAll('.upgrade-card');
    if (cards.length > 0) {
      (cards[0] as HTMLElement).focus();
    }
    
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.upgrade as UpgradeId;
        if (id && upgradeCallback) upgradeCallback(id);
      });
    });
  }
}

export function hide(): void {
  if (REWARD_SCREEN) REWARD_SCREEN.classList.add('hidden');
}

export function onReplayClick(callback: () => void): void {
  replayCallback = callback;
  if (REPLAY_BTN) {
    REPLAY_BTN.onclick = () => {
      if (replayCallback) replayCallback();
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

function getRandomUpgrades() {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}