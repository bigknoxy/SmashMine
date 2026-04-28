import { saveSystem } from '../game/SaveSystem.js';
import type { ShopItemId } from '../game/types.js';

const SHOP_SCREEN = document.getElementById('shop-screen');
const SHOP_LIST = document.getElementById('shop-list');
const COIN_COUNT = document.getElementById('shop-coin-count');
const BACK_BTN = document.getElementById('shop-back-btn');

interface ShopItem {
  id: ShopItemId;
  name: string;
  desc: string;
  baseCost: number;
  costMult: number;
}

const ITEMS: ShopItem[] = [
  { id: 'permanent_speed', name: 'Hydraulics', desc: 'Increases movement speed.', baseCost: 50, costMult: 1.5 },
  { id: 'permanent_range', name: 'Scanner Range', desc: 'Increases block targeting range.', baseCost: 75, costMult: 2.0 },
  { id: 'permanent_power', name: 'Mining Power', desc: 'Improves block breaking efficiency.', baseCost: 100, costMult: 1.8 },
];

let backCallback: (() => void) | null = null;

export function show(onBack: () => void): void {
  backCallback = onBack;
  if (SHOP_SCREEN) SHOP_SCREEN.classList.remove('hidden');
  renderShop();

  if (BACK_BTN) {
    BACK_BTN.onclick = () => {
      hide();
      if (backCallback) backCallback();
    };
  }
}

export function hide(): void {
  if (SHOP_SCREEN) SHOP_SCREEN.classList.add('hidden');
}

function renderShop(): void {
  if (!SHOP_LIST || !COIN_COUNT) return;

  const coins = saveSystem.getCoins();
  COIN_COUNT.textContent = coins.toString();

  let html = '';
  ITEMS.forEach(item => {
    const level = saveSystem.getShopLevel(item.id);
    const cost = Math.round(item.baseCost * Math.pow(item.costMult, level));
    const canAfford = coins >= cost;

    html += `
      <div class="shop-card">
        <div class="shop-info">
          <span class="shop-name">${item.name} (Lv. ${level})</span>
          <span class="shop-desc">${item.desc}</span>
        </div>
        <button class="shop-buy-btn" data-id="${item.id}" data-cost="${cost}" ${canAfford ? '' : 'disabled'}>
          ${cost} 💰
        </button>
      </div>
    `;
  });

  SHOP_LIST.innerHTML = html;

  SHOP_LIST.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id as ShopItemId;
      const cost = parseInt((btn as HTMLElement).dataset.cost || '0');
      if (saveSystem.purchaseShopItem(id, cost)) {
        renderShop();
      }
    });
  });
}
