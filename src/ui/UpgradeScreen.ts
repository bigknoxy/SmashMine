import type { UpgradeId } from '../game/types.js';
import { UPGRADES } from '../data/upgrades.js';

export class UpgradeScreen {
  private element: HTMLElement;
  private cardContainer: HTMLElement;
  private onPickCallback: ((upgradeId: UpgradeId) => void) | null = null;
  private shown = false;

  constructor() {
    this.element = document.getElementById('reward-screen') as HTMLElement;
    this.cardContainer = document.getElementById('upgrade-cards') as HTMLElement;
  }

  show(): void {
    const choices = getRandomUpgrades();
    this.renderCards(choices);
    this.element.classList.remove('hidden');
    this.shown = true;
  }

  hide(): void {
    this.element.classList.add('hidden');
    this.shown = false;
  }

  onPick(callback: (upgradeId: UpgradeId) => void): void {
    this.onPickCallback = callback;
  }

  private renderCards(upgrades: typeof UPGRADES): void {
    if (!this.cardContainer) return;
    this.cardContainer.innerHTML = '';
    for (const u of upgrades) {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.dataset.upgrade = u.id;
      card.innerHTML = `<div class="upgrade-icon">${u.icon}</div><div class="upgrade-name">${u.name}</div><div class="upgrade-desc">${u.description}</div>`;
      card.addEventListener('click', () => {
        if (this.onPickCallback) this.onPickCallback(u.id);
      });
      this.cardContainer.appendChild(card);
    }
  }
}

function getRandomUpgrades() {
  return [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
}