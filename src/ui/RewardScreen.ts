import type { MissionProgress, UpgradeId } from '../game/types.js';
import { UPGRADES } from '../data/upgrades.js';
import { renderLootHTML } from './lootRenderer.js';

const REWARD_SCREEN = document.getElementById('reward-screen');
const LOOT_SUMMARY = document.getElementById('loot-summary');
const UPGRADE_CARDS = document.getElementById('upgrade-cards');
const REPLAY_BTN = document.getElementById('replay-btn');

let upgradeCallback: ((upgradeId: UpgradeId) => void) | null = null;
let replayCallback: (() => void) | null = null;

export function show(progress: MissionProgress, onUpgrade: (id: UpgradeId) => void): void {
  upgradeCallback = onUpgrade;
  if (REWARD_SCREEN) REWARD_SCREEN.classList.remove('hidden');

  if (LOOT_SUMMARY) {
    LOOT_SUMMARY.innerHTML = renderLootHTML(progress);
  }

  if (UPGRADE_CARDS) {
    const choices = getRandomUpgrades();
    let cardsHTML = '';
    for (const u of choices) {
      cardsHTML += `<div class="upgrade-card" data-upgrade="${u.id}">
        <div class="upgrade-icon">${u.icon}</div>
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-desc">${u.description}</div>
      </div>`;
    }
    UPGRADE_CARDS.innerHTML = cardsHTML;

    UPGRADE_CARDS.querySelectorAll('.upgrade-card').forEach(card => {
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
    REPLAY_BTN.addEventListener('click', () => {
      if (replayCallback) replayCallback();
    });
  }
}

function getRandomUpgrades() {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}