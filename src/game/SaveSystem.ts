import type { UpgradeId, LootType, ShopItemId } from './types.js';

export interface SaveData {
  version: number;
  shards: number;
  coins: number;
  upgrades: Record<UpgradeId, number>;
  shopItems: Record<ShopItemId, number>;
  missionsCompleted: number;
  totalShardsCollected: number;
  totalCoinsCollected: number;
  lastPlayed: number;
  hasSeenTutorial: boolean;
  prestigeLevel: number;
  // Phase 2: Daily seed and streak tracking
  bestShardCount: number;
  bestCompletionTime: number;
  lastPlayedDate: string;
  streak: number;
  streakEnd: number; // Timestamp when streak resets
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
  shopItems: {
    permanent_speed: 0,
    permanent_range: 0,
    permanent_power: 0,
  },
  missionsCompleted: 0,
  totalShardsCollected: 0,
  totalCoinsCollected: 0,
  lastPlayed: Date.now(),
  hasSeenTutorial: false,
  prestigeLevel: 0,
  bestShardCount: 0,
  bestCompletionTime: 0,
  lastPlayedDate: '',
  streak: 0,
  streakEnd: 0,
};

export class SaveSystem {
  private data: SaveData = { ...defaultData };
  private dirty = false;

  constructor() {
    this.load();
    // Initialize streak if not set
    if (!this.data.streakEnd) {
      this.data.streakEnd = 0;
      this.markDirty();
    }
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SaveData;
        if (parsed.version === CURRENT_VERSION) {
          // Merge with defaults to handle new fields
          this.data = {
            ...defaultData,
            ...parsed,
            upgrades: { ...defaultData.upgrades, ...parsed.upgrades },
            shopItems: { ...defaultData.shopItems, ...parsed.shopItems },
          };
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
    // Reset mission progress but KEEP shopItems and prestige bonuses
    this.data.missionsCompleted = 0;
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
    const prestigeMult = 1 + (this.data.prestigeLevel * 0.2);
    const finalAmount = Math.round(amount * prestigeMult);
    this.data.coins += finalAmount;
    this.data.totalCoinsCollected += finalAmount;
    this.markDirty();
  }

  getUpgradeLevel(id: UpgradeId): number {
    return this.data.upgrades[id] ?? 0;
  }

  setUpgradeLevel(id: UpgradeId, level: number): void {
    this.data.upgrades[id] = level;
    this.markDirty();
  }

  getShopLevel(id: ShopItemId): number {
    return this.data.shopItems[id] ?? 0;
  }

  purchaseShopItem(id: ShopItemId, cost: number): boolean {
    if (this.data.coins < cost) return false;
    this.data.coins -= cost;
    this.data.shopItems[id] = (this.data.shopItems[id] ?? 0) + 1;
    this.markDirty();
    this.save();
    return true;
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
  
  // Phase 2: Daily seed - Get today's date string (YYYY-MM-DD)
  getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  // Phase 2: Daily seed - Update saved date if it's a new day
  updatePlayedDate(): boolean {
    const today = this.getTodayDateString();
    if (this.data.lastPlayedDate !== today) {
      // New day - check if streak continues
      this.checkStreak(today);
      this.data.lastPlayedDate = today;
      this.markDirty();
      return true;
    }
    return false;
  }
  
  // Phase 2: Streak - Check if yesterday's run counts
  private checkStreak(today: string): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Count days since last played
    const daysSince = Math.floor((now - this.data.lastPlayed) / dayMs);
    
    if (daysSince === 1) {
      // Consecutive day - extend streak
      this.data.streak += 1;
    } else if (daysSince === 0) {
      // Same day - streak unchanged
    } else {
      // Gap - reset streak
      this.data.streak = 0;
    }
    
    this.data.streakEnd = now + dayMs; // Reset streak at end of this day
    this.markDirty();
  }
  
  // Phase 2: Streak - Check if replay within 10s for streak counter
  updateStreakOnReplay(): boolean {
    const now = Date.now();
    if (now - this.data.lastPlayed <= 10000) { // 10 seconds
      this.data.streak += 1;
      this.markDirty();
      return true;
    }
    return false;
  }
  
  // Phase 2: Streak - Get streak count (0-3+)
  getStreak(): number {
    return this.data.streak;
  }
  
  // Phase 2: Daily seed - Track personal best
  recordBest(shardCount: number, completionTime: number): void {
    if (shardCount > this.data.bestShardCount) {
      this.data.bestShardCount = shardCount;
    }
    if (completionTime > 0 && (this.data.bestCompletionTime === 0 || completionTime < this.data.bestCompletionTime)) {
      this.data.bestCompletionTime = completionTime;
    }
    this.markDirty();
  }
}

export const saveSystem = new SaveSystem();