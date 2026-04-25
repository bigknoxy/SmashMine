import type { LootType, LootDrop } from '../game/types.js';

export interface LootTableEntry {
  type: LootType;
  min: number;
  max: number;
  weight: number;
}

export const LOOT_TABLES: Record<string, LootTableEntry[]> = {
  air: [],
  stone: [{ type: 'coins', min: 1, max: 3, weight: 100 }],
  dirt: [{ type: 'coins', min: 0, max: 1, weight: 100 }],
  deepstone: [{ type: 'coins', min: 1, max: 4, weight: 100 }],
  copper_ore: [{ type: 'coins', min: 2, max: 5, weight: 90 }, { type: 'power_shards', min: 1, max: 1, weight: 10 }],
  shard_cluster: [{ type: 'power_shards', min: 1, max: 3, weight: 80 }, { type: 'coins', min: 1, max: 2, weight: 20 }],
  blast_crystal: [{ type: 'blast_crystals', min: 1, max: 2, weight: 90 }, { type: 'power_shards', min: 1, max: 1, weight: 10 }],
  lucky_cube: [{ type: 'lucky_cubes', min: 1, max: 1, weight: 70 }, { type: 'coins', min: 5, max: 15, weight: 20 }, { type: 'power_shards', min: 2, max: 5, weight: 10 }],
  gold_ore: [{ type: 'coins', min: 5, max: 10, weight: 80 }, { type: 'power_shards', min: 1, max: 2, weight: 20 }],
  op_relic_block: [{ type: 'op_relics', min: 1, max: 1, weight: 60 }, { type: 'power_shards', min: 3, max: 5, weight: 30 }, { type: 'coins', min: 10, max: 20, weight: 10 }],
  bedrock: [],
};

export function rollLoot(blockType: string): LootDrop[] {
  const table = LOOT_TABLES[blockType];
  if (!table || table.length === 0) return [];
  const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) {
      const count = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
      return [{ type: entry.type, amount: count, worldPos: { x: 0, y: 0, z: 0 } }];
    }
  }
  return [];
}