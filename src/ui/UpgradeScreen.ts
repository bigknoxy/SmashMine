import type { MetaUpgradeId, MetaUpgradeDef } from '../game/types.js';
import { saveSystem } from '../game/SaveSystem.js';

const META_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'pickaxe_tier',
    name: 'Pickaxe Tier',
    icon: '⛏️',
    description: 'Increases smash damage. Each level reduces block HP by 20%.',
    maxLevel: 5,
    costPerLevel: 50,
  },
  {
    id: 'backpack_size',
    name: 'Backpack Size',
    icon: '🎒',
    description: 'Increases loot capacity. Reduces loot despawn rate.',
    maxLevel: 5,
    costPerLevel: 40,
  },
  {
    id: 'fog_reduction',
    name: 'Fog Reduction',
    icon: '🌫️',
    description: 'Clears the fog for better visibility. Each level reduces fog by 25%.',
    maxLevel: 3,
    costPerLevel: 100,
  },
  {
    id: 'token_multiplier',
    name: 'Token Multiplier',
    icon: '🪙',
    description: 'Increases tokens earned per run. Each level adds 25% bonus.',
    maxLevel: 4,
    costPerLevel: 150,
  },
];

const UPGRADE_SCREEN = document.getElementById('upgrade-screen');
const TOKEN_DISPLAY = document.getElementById('upgrade-tokens');
const UPGRADE_LIST = document.getElementById('upgrade-list');
const CLOSE_BTN = document.getElementById('upgrade-close-btn');

let closeCallback: (() => void) | null = null;

export function show(onClose: () => void): void {
  closeCallback = onClose;
  if (UPGRADE_SCREEN) UPGRADE_SCREEN.classList.remove('hidden');
  updateDisplay();
}

export function hide(): void {
  if (UPGRADE_SCREEN) UPGRADE_SCREEN.classList.add('hidden');
}

function updateDisplay(): void {
  if (TOKEN_DISPLAY) {
    TOKEN_DISPLAY.textContent = `Tokens: ${saveSystem.getTokens()}`;
  }

  if (UPGRADE_LIST) {
    let html = '';
    for (const upgrade of META_UPGRADES) {
      const level = saveSystem.getMetaUpgradeLevel(upgrade.id);
      const cost = upgrade.costPerLevel * (level + 1);
      const isMaxed = level >= upgrade.maxLevel;
      const canAfford = saveSystem.getTokens() >= cost && !isMaxed;

      html += `
        <div class="meta-upgrade-card ${isMaxed ? 'maxed' : ''}" data-upgrade="${upgrade.id}">
          <div class="meta-upgrade-icon">${upgrade.icon}</div>
          <div class="meta-upgrade-info">
            <div class="meta-upgrade-name">${upgrade.name} (${level}/${upgrade.maxLevel})</div>
            <div class="meta-upgrade-desc">${upgrade.description}</div>
          </div>
          ${isMaxed 
            ? '<div class="maxed-badge">MAX</div>'
            : `<button class="meta-upgrade-buy ${canAfford ? '' : 'disabled'}" data-upgrade="${upgrade.id}" data-cost="${cost}">
                ${cost} 🪙
              </button>`
          }
        </div>
      `;
    }
    UPGRADE_LIST.innerHTML = html;

    // Add click handlers
    const buttons = UPGRADE_LIST.querySelectorAll('.meta-upgrade-buy');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.upgrade as MetaUpgradeId;
        const cost = parseInt((btn as HTMLElement).dataset.cost || '0');
        purchaseUpgrade(id, cost);
      });
    });
  }
}

function purchaseUpgrade(id: MetaUpgradeId, cost: number): void {
  if (saveSystem.purchaseMetaUpgrade(id, cost)) {
    updateDisplay();
  }
}

// Close button handler
if (CLOSE_BTN) {
  CLOSE_BTN.onclick = () => {
    hide();
    if (closeCallback) closeCallback();
  };
}
