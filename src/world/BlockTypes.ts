import type { BlockType, Rarity, BlockDef } from '../game/types.js';

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  air: { type: 'air', color: '#000000', rarity: 'common', lootTable: [], hp: 0 },
  stone: { type: 'stone', color: '#808080', rarity: 'common', lootTable: [], hp: 1 },
  dirt: { type: 'dirt', color: '#8B6914', rarity: 'common', lootTable: [], hp: 1 },
  deepstone: { type: 'deepstone', color: '#505050', rarity: 'uncommon', lootTable: [], hp: 2 },
  copper_ore: { type: 'copper_ore', color: '#CD7F32', rarity: 'uncommon', lootTable: [{ type: 'coins', min: 2, max: 8, weight: 1 }], hp: 1 },
  shard_cluster: { type: 'shard_cluster', color: '#00ff88', rarity: 'rare', lootTable: [{ type: 'power_shards', min: 1, max: 3, weight: 1 }], hp: 1 },
  blast_crystal: { type: 'blast_crystal', color: '#00ffff', rarity: 'uncommon', lootTable: [{ type: 'blast_crystals', min: 1, max: 2, weight: 1 }], hp: 1 },
  lucky_cube: { type: 'lucky_cube', color: '#ffd700', rarity: 'epic', lootTable: [{ type: 'lucky_cubes', min: 1, max: 1, weight: 1 }], hp: 3 },
  gold_ore: { type: 'gold_ore', color: '#FFD700', rarity: 'rare', lootTable: [{ type: 'coins', min: 5, max: 12, weight: 1 }], hp: 2 },
  op_relic_block: { type: 'op_relic_block', color: '#e040fb', rarity: 'legendary', lootTable: [{ type: 'op_relics', min: 1, max: 1, weight: 1 }], hp: 4 },
  bedrock: { type: 'bedrock', color: '#1a1a2e', rarity: 'common', lootTable: [], hp: 999 },
};

export function isBreakable(type: BlockType): boolean {
  return type !== 'air' && type !== 'bedrock';
}