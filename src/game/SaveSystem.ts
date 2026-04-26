import type { UpgradeId, LootType } from './types.js';

export interface SaveData {
  version: number;
  shards: number;
  coins: number;
  upgrades: Record<UpgradeId, number>;
  missionsCompleted: number;
  totalShardsCollected: number;
  totalCoinsCollected: number;
  lastPlayed: number;
  hasSeenTutorial: boolean;
  prestigeLevel: number;
}

const STORAGE_KEY = 'smashmine_save';
const CURRENT_VERSION = 1;

const defaultData: SaveData = {
  version: CURRENT_VERSION,
  shards: 0,
  coins: 0,
  upgrades: {
    chain_break: 0,
    magnet_pet: 0,
    mega_swing: 0,
    double_jump: 0,
    treasure_vision: 0,
    op_mode: 0,
  },
  missionsCompleted: 0,
  totalShardsCollected: 0,
  totalCoinsCollected: 0,
  lastPlayed: Date.now(),
  hasSeenTutorial: false,
  prestigeLevel: 0,
};

export class SaveSystem {
  private data: SaveData = { ...defaultData };
  private dirty = false;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SaveData;
        if (parsed.version === CURRENT_VERSION) {
          this.data = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
  }

  save(): void {
    try {
      this.data.lastPlayed = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.dirty = false;
    } catch (e) {
      console.warn('Failed to save:', e);
    }
  }

  markDirty(): void {
    this.dirty = true;
  }

  needsSave(): boolean {
    return this.dirty;
  }

  reset(): void {
    this.data = { ...defaultData, lastPlayed: Date.now() };
    this.save();
  }

  prestige(): void {
    const bonus = Math.floor(this.data.missionsCompleted / 5) + 1;
    this.data.prestigeLevel += 1;
    this.data.shards = 0;
    this.data.coins = 0;
    this.data.lastPlayed = Date.now();
    this.save();
  }

  getPrestigeBonus(): number {
    return this.data.prestigeLevel;
  }

  getShards(): number {
    return this.data.shards;
  }

  getCoins(): number {
    return this.data.coins;
  }

  addShards(amount: number): void {
    this.data.shards += amount;
    this.data.totalShardsCollected += amount;
    this.markDirty();
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.data.totalCoinsCollected += amount;
    this.markDirty();
  }

  getUpgradeLevel(id: UpgradeId): number {
    return this.data.upgrades[id] ?? 0;
  }

  setUpgradeLevel(id: UpgradeId, level: number): void {
    this.data.upgrades[id] = level;
    this.markDirty();
  }

  canUpgrade(id: UpgradeId, maxLevel: number): boolean {
    return (this.data.upgrades[id] ?? 0) < maxLevel;
  }

  purchaseUpgrade(id: UpgradeId, cost: number): boolean {
    if (this.data.coins < cost) return false;
    this.data.coins -= cost;
    this.data.upgrades[id] = (this.data.upgrades[id] ?? 0) + 1;
    this.markDirty();
    return true;
  }

  getMissionsCompleted(): number {
    return this.data.missionsCompleted;
  }

  incrementMissions(): void {
    this.data.missionsCompleted += 1;
    this.markDirty();
  }

  getTotalShards(): number {
    return this.data.totalShardsCollected;
  }

  getTotalCoins(): number {
    return this.data.totalCoinsCollected;
  }

  hasSeenTutorial(): boolean {
    return this.data.hasSeenTutorial;
  }

  setTutorialSeen(): void {
    this.data.hasSeenTutorial = true;
    this.markDirty();
  }

  getData(): SaveData {
    return this.data;
  }
}

export const saveSystem = new SaveSystem();