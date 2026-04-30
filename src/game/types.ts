export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type BlockType =
  | 'air'
  | 'stone'
  | 'dirt'
  | 'deepstone'
  | 'copper_ore'
  | 'shard_cluster'
  | 'blast_crystal'
  | 'lucky_cube'
  | 'gold_ore'
  | 'op_relic_block'
  | 'bedrock';

export type UpgradeId =
  | 'chain_break'
  | 'magnet_pet'
  | 'mega_swing'
  | 'double_jump'
  | 'treasure_vision'
  | 'op_mode';

export type ShopItemId =
  | 'permanent_speed'
  | 'permanent_range'
  | 'permanent_power';

export type MetaUpgradeId =
  | 'pickaxe_tier'
  | 'backpack_size'
  | 'fog_reduction'
  | 'token_multiplier';

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
  costPerLevel: number;
}

export interface GameStatistics {
  totalBlocksSmashed: number;
  bestCombo: number;
  totalPlayTime: number; // in seconds
  totalTokensEarned: number;
  deepestMineLevel: number;
  missionsCompleted: number;
}

export type LootType =
  | 'coins'
  | 'power_shards'
  | 'blast_crystals'
  | 'pet_eggs'
  | 'lucky_cubes'
  | 'op_relics';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface PlayerState {
  position: Vec3;
  velocity: Vec3;
  onGround: boolean;
  upgrades: Map<UpgradeId, number>;
}

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  icon: string;
  description: string;
  maxLevel: number;
}

export interface LootDrop {
  type: LootType;
  amount: number;
  worldPos: Vec3;
}

export interface BlockDef {
  type: BlockType;
  color: string;
  rarity: Rarity;
  lootTable: { type: LootType; min: number; max: number; weight: number }[];
  hp: number;
}

export interface MissionDef {
  id: string;
  name: string;
  goal: string;
  targetShards: number;
  timeLimit: number;
  surpriseAt: number;
  zoneSize: Vec3;
}

export interface MissionProgress {
  shards: number;
  coins: number;
  loot: Record<LootType, number>;
  elapsed: number;
  surpriseTriggered: boolean;
  completed: boolean;
}

export interface InputState {
  moveX: number;
  moveY: number;
  smash: boolean;
  special: boolean;
  jump: boolean;
}

export interface GameCallbacks {
  onStartMission: () => void;
  onMissionComplete: () => void;
  onUpgradePick: (upgradeId: UpgradeId) => void;
  onReplay: () => void;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#888888',
  uncommon: '#4fc3f7',
  rare: '#00ff88',
  epic: '#ffd700',
  legendary: '#e040fb',
};