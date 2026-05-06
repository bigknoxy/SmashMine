import { describe, expect, test, beforeEach } from 'vitest';
import { SaveSystem, calculateTokens } from './SaveSystem.js';
import type { SaveData } from './SaveSystem.js';

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Create a fresh SaveSystem for each test
    saveSystem = new SaveSystem();
    // Reset to clean state
    saveSystem['data'] = {
      version: 2,
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
      bestShardCount: 0,
      bestCompletionTime: 0,
      lastPlayedDate: '',
      streak: 0,
      streakEnd: 0,
      tokens: 0,
      mineDepth: 1,
      metaUpgrades: {
        fog_reduction: 0,
        token_multiplier: 0,
      },
      statistics: {
        totalBlocksSmashed: 0,
        bestCombo: 0,
        totalPlayTime: 0,
        totalTokensEarned: 0,
        deepestMineLevel: 1,
      },
    };
  });

  describe('addCoins', () => {
    test('should add coins without prestige multiplier', () => {
      saveSystem.addCoins(100);
      expect(saveSystem.getCoins()).toBe(100);
      expect(saveSystem.getData().totalCoinsCollected).toBe(100);
    });

    test('should accumulate coins correctly', () => {
      saveSystem.addCoins(50);
      saveSystem.addCoins(75);
      expect(saveSystem.getCoins()).toBe(125);
      expect(saveSystem.getData().totalCoinsCollected).toBe(125);
    });
  });

  describe('addTokens', () => {
    test('should add tokens with no multiplier at level 0', () => {
      saveSystem.addTokens(100);
      expect(saveSystem.getTokens()).toBe(100);
      expect(saveSystem.getData().statistics.totalTokensEarned).toBe(100);
    });

    test('should apply token_multiplier correctly at level 1', () => {
      // Set token_multiplier to level 1 (25% bonus)
      saveSystem['data'].metaUpgrades.token_multiplier = 1;
      saveSystem.addTokens(100);
      // 100 * 1.25 = 125
      expect(saveSystem.getTokens()).toBe(125);
      expect(saveSystem.getData().statistics.totalTokensEarned).toBe(125);
    });

    test('should apply token_multiplier correctly at level 2', () => {
      // Set token_multiplier to level 2 (50% bonus)
      saveSystem['data'].metaUpgrades.token_multiplier = 2;
      saveSystem.addTokens(100);
      // 100 * 1.5 = 150
      expect(saveSystem.getTokens()).toBe(150);
      expect(saveSystem.getData().statistics.totalTokensEarned).toBe(150);
    });

    test('should apply token_multiplier correctly at max level 4', () => {
      // Set token_multiplier to level 4 (100% bonus)
      saveSystem['data'].metaUpgrades.token_multiplier = 4;
      saveSystem.addTokens(100);
      // 100 * 2.0 = 200
      expect(saveSystem.getTokens()).toBe(200);
      expect(saveSystem.getData().statistics.totalTokensEarned).toBe(200);
    });

    test('should accumulate tokens with multiplier', () => {
      saveSystem['data'].metaUpgrades.token_multiplier = 1;
      saveSystem.addTokens(100);
      saveSystem.addTokens(100);
      // 125 + 125 = 250
      expect(saveSystem.getTokens()).toBe(250);
      expect(saveSystem.getData().statistics.totalTokensEarned).toBe(250);
    });
  });

  describe('meta upgrades', () => {
    test('should get meta upgrade level', () => {
      expect(saveSystem.getMetaUpgradeLevel('fog_reduction')).toBe(0);
      expect(saveSystem.getMetaUpgradeLevel('token_multiplier')).toBe(0);
    });

    test('should purchase meta upgrade when affordable', () => {
      saveSystem['data'].tokens = 100;
      const result = saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      expect(result).toBe(true);
      expect(saveSystem.getTokens()).toBe(0);
      expect(saveSystem.getMetaUpgradeLevel('fog_reduction')).toBe(1);
    });

    test('should not purchase meta upgrade when not affordable', () => {
      saveSystem['data'].tokens = 50;
      const result = saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      expect(result).toBe(false);
      expect(saveSystem.getTokens()).toBe(50);
      expect(saveSystem.getMetaUpgradeLevel('fog_reduction')).toBe(0);
    });

    test('should not purchase meta upgrade when max level reached', () => {
      saveSystem['data'].tokens = 1000;
      // Set fog_reduction to max level (3)
      saveSystem['data'].metaUpgrades.fog_reduction = 3;
      const result = saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      expect(result).toBe(false);
      expect(saveSystem.getTokens()).toBe(1000);
      expect(saveSystem.getMetaUpgradeLevel('fog_reduction')).toBe(3);
    });

    test('should respect max levels for each upgrade', () => {
      saveSystem['data'].tokens = 1000;
      // fog_reduction max is 3
      saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      saveSystem.purchaseMetaUpgrade('fog_reduction', 100);
      expect(saveSystem.getMetaUpgradeLevel('fog_reduction')).toBe(3);
      // Should not be able to purchase a 4th level
      expect(saveSystem.purchaseMetaUpgrade('fog_reduction', 100)).toBe(false);

      // token_multiplier max is 4
      saveSystem.purchaseMetaUpgrade('token_multiplier', 150);
      saveSystem.purchaseMetaUpgrade('token_multiplier', 150);
      saveSystem.purchaseMetaUpgrade('token_multiplier', 150);
      saveSystem.purchaseMetaUpgrade('token_multiplier', 150);
      expect(saveSystem.getMetaUpgradeLevel('token_multiplier')).toBe(4);
      // Should not be able to purchase a 5th level
      expect(saveSystem.purchaseMetaUpgrade('token_multiplier', 150)).toBe(false);
    });
  });

  describe('mine depth', () => {
    test('should get and set mine depth', () => {
      expect(saveSystem.getMineDepth()).toBe(1);
      saveSystem.setMineDepth(2);
      expect(saveSystem.getMineDepth()).toBe(2);
    });

    test('should not decrease mine depth', () => {
      saveSystem.setMineDepth(3);
      saveSystem.setMineDepth(2);
      expect(saveSystem.getMineDepth()).toBe(3);
    });

    test('should update deepest mine level statistic', () => {
      expect(saveSystem.getData().statistics.deepestMineLevel).toBe(1);
      saveSystem.setMineDepth(5);
      expect(saveSystem.getData().statistics.deepestMineLevel).toBe(5);
      saveSystem.setMineDepth(3);
      expect(saveSystem.getData().statistics.deepestMineLevel).toBe(5); // Should not decrease
    });
  });

  describe('default data integrity', () => {
    test('should have correct default values', () => {
      const defaultData = saveSystem.getData();
      expect(defaultData.version).toBe(2);
      expect(defaultData.tokens).toBe(0);
      expect(defaultData.mineDepth).toBe(1);
      expect(defaultData.metaUpgrades).toEqual({
        fog_reduction: 0,
        token_multiplier: 0,
      });
      expect(defaultData.statistics).toEqual({
        totalBlocksSmashed: 0,
        bestCombo: 0,
        totalPlayTime: 0,
        totalTokensEarned: 0,
        deepestMineLevel: 1,
      });
    });

    test('should not have prestigeLevel field', () => {
      const defaultData = saveSystem.getData();
      // @ts-ignore - checking for non-existent field
      expect(defaultData.prestigeLevel).toBeUndefined();
    });

    test('should not have pickaxe_tier or backpack_size meta upgrades', () => {
      const defaultData = saveSystem.getData();
      // @ts-ignore - checking for removed fields
      expect(defaultData.metaUpgrades.pickaxe_tier).toBeUndefined();
      // @ts-ignore - checking for removed fields
      expect(defaultData.metaUpgrades.backpack_size).toBeUndefined();
    });
  });
});

describe('calculateTokens', () => {
  test('should calculate base tokens correctly', () => {
    const tokens = calculateTokens(5, 60, 60); // elapsed = timeLimit, so no time bonus
    expect(tokens).toBe(50); // 5 shards * 10 = 50
  });

  test('should calculate time bonus correctly', () => {
    const tokens = calculateTokens(5, 30, 60);
    // 5 * 10 = 50 base
    // (60 - 30) * 2 = 60 time bonus
    // Total = 110
    expect(tokens).toBe(110);
  });

  test('should cap time bonus at 100', () => {
    const tokens = calculateTokens(5, 10, 60);
    // 5 * 10 = 50 base
    // (60 - 10) * 2 = 100 time bonus (capped)
    // Total = 150
    expect(tokens).toBe(150);
  });

  test('should not give negative time bonus', () => {
    const tokens = calculateTokens(5, 70, 60);
    // 5 * 10 = 50 base
    // Negative time, so time bonus = 0
    // Total = 50
    expect(tokens).toBe(50);
  });

  test('should handle zero shards', () => {
    const tokens = calculateTokens(0, 30, 60);
    expect(tokens).toBe(60); // Only time bonus
  });

  test('should handle edge case of zero time limit', () => {
    const tokens = calculateTokens(10, 0, 0);
    expect(tokens).toBe(100); // 10 * 10 = 100, no time bonus
  });
});