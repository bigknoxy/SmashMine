import type { MissionProgress, LootType } from '../game/types.js';

const LOOT_ICONS: Record<LootType, string> = {
  power_shards: '💎',
  coins: '💰',
  blast_crystals: '✨',
  lucky_cubes: '🎲',
  op_relics: '⚡',
  pet_eggs: '🥚',
};

const LOOT_ORDER: LootType[] = [
  'power_shards', 'coins', 'blast_crystals',
  'lucky_cubes', 'op_relics', 'pet_eggs',
];

/**
 * Render loot items as HTML for an overlay summary.
 * If `title` is provided, it's shown as a header above the items.
 * If no loot was collected, an "empty" message is shown.
 */
export function renderLootHTML(progress: MissionProgress, title?: string): string {
  let html = '';
  if (title) {
    html += `<div class="loot-title">${title}</div>`;
  }

  let hasLoot = false;
  for (const type of LOOT_ORDER) {
    const amount = progress.loot[type];
    if (amount > 0) {
      html += `<div class="loot-item">${LOOT_ICONS[type]} ${amount}</div>`;
      hasLoot = true;
    }
  }

  if (!hasLoot) {
    html += '<div class="loot-item empty">No loot collected</div>';
  }

  return html;
}