import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from '../src/world/World.js';
import { Player } from '../src/game/Player.js';
import { generateQuarry } from '../src/world/BlockSpawner.js';

describe('Player collision', () => {
  let world: World;
  let player: Player;

  beforeEach(() => {
    world = new World({ x: 16, y: 8, z: 16 });
    generateQuarry(world, 'test');
    player = new Player(world);
  });

  it('player spawns in clear area', () => {
    const pos = player.getPosition();
    expect(pos.x).toBeGreaterThanOrEqual(6);
    expect(pos.x).toBeLessThanOrEqual(10);
    expect(pos.z).toBeGreaterThanOrEqual(6);
    expect(pos.z).toBeLessThanOrEqual(10);
  });

  it('allows horizontal movement when not blocked by floor', () => {
    player = new Player(world);
    player.update(0.016, { moveX: 1, moveY: 0, smash: false, special: false, jump: false }, world);
    const pos = player.getPosition();
    expect(pos.x).toBeGreaterThan(7);
  });

  it('does not sink into bedrock', () => {
    player = new Player(world);
    for (let i = 0; i < 100; i++) {
      player.update(0.016, { moveX: 0, moveY: 0, smash: false, special: false, jump: false }, world);
    }
    const pos = player.getPosition();
    expect(pos.y).toBeGreaterThan(1);
    expect(pos.y).toBeLessThanOrEqual(3);
  });
});

describe('World', () => {
  let world: World;

  beforeEach(() => {
    world = new World({ x: 16, y: 8, z: 16 });
  });

  it('initializes with air', () => {
    expect(world.getBlock(0, 0, 0)).toBe('air');
    expect(world.getBlock(8, 4, 8)).toBe('air');
  });

  it('setBlock and getBlock work', () => {
    world.setBlock(5, 3, 7, 'stone');
    expect(world.getBlock(5, 3, 7)).toBe('stone');
  });

  it('isInside returns false for out of bounds', () => {
    expect(world.isInside(-1, 0, 0)).toBe(false);
    expect(world.isInside(16, 0, 0)).toBe(false);
    expect(world.isInside(0, -1, 0)).toBe(false);
    expect(world.isInside(0, 8, 0)).toBe(false);
  });

  it('isInside returns true for in bounds', () => {
    expect(world.isInside(0, 0, 0)).toBe(true);
    expect(world.isInside(15, 7, 15)).toBe(true);
  });
});

describe('BlockSpawner', () => {
  it('creates bedrock floor', () => {
    const world = new World({ x: 16, y: 8, z: 16 });
    generateQuarry(world, 'test');
    expect(world.getBlock(8, 0, 8)).toBe('bedrock');
  });

  it('clears spawn area', () => {
    const world = new World({ x: 16, y: 8, z: 16 });
    generateQuarry(world, 'test');
    expect(world.getBlock(8, 1, 8)).toBe('air');
    expect(world.getBlock(7, 1, 8)).toBe('air');
    expect(world.getBlock(9, 1, 8)).toBe('air');
  });

  it('creates walls', () => {
    const world = new World({ x: 16, y: 8, z: 16 });
    generateQuarry(world, 'test');
    expect(world.getBlock(0, 1, 1)).toBe('stone');
    expect(world.getBlock(15, 1, 1)).toBe('stone');
    expect(world.getBlock(1, 1, 0)).toBe('stone');
    expect(world.getBlock(1, 1, 15)).toBe('stone');
  });

  it('places guaranteed ore near spawn', () => {
    const world = new World({ x: 16, y: 8, z: 16 });
    generateQuarry(world, 'test');
    const spawnX = 8;
    const spawnZ = 8;
    const leftOre = world.getBlock(spawnX - 3, 1, spawnZ);
    const rightOre = world.getBlock(spawnX + 3, 1, spawnZ);
    const frontOre = world.getBlock(spawnX, 1, spawnZ - 3);
    const backOre = world.getBlock(spawnX, 1, spawnZ + 3);
    const oreTypes = ['shard_cluster', 'copper_ore', 'blast_crystal'];
    const hasOre = oreTypes.includes(leftOre!) || oreTypes.includes(rightOre!) || 
                  oreTypes.includes(frontOre!) || oreTypes.includes(backOre!);
    expect(hasOre).toBe(true);
  });
});

describe('SaveSystem', () => {
  it('stores and retrieves shards', () => {
    const { SaveSystem } = require('../src/game/SaveSystem.js');
    const save = new SaveSystem();
    save.addShards(10);
    expect(save.getShards()).toBe(10);
    expect(save.getTotalShards()).toBe(10);
  });

  it('stores and retrieves coins', () => {
    const { SaveSystem } = require('../src/game/SaveSystem.js');
    const save = new SaveSystem();
    save.addCoins(50);
    expect(save.getCoins()).toBe(50);
    expect(save.getTotalCoins()).toBe(50);
  });

  it('tracks upgrade levels', () => {
    const { SaveSystem } = require('../src/game/SaveSystem.js');
    const save = new SaveSystem();
    expect(save.getUpgradeLevel('chain_break')).toBe(0);
    save.setUpgradeLevel('chain_break', 2);
    expect(save.getUpgradeLevel('chain_break')).toBe(2);
  });

  it('tracks missions completed', () => {
    const { SaveSystem } = require('../src/game/SaveSystem.js');
    const save = new SaveSystem();
    save.incrementMissions();
    save.incrementMissions();
    expect(save.getMissionsCompleted()).toBe(2);
  });

  it('applies prestige bonus', () => {
    const { SaveSystem } = require('../src/game/SaveSystem.js');
    const save = new SaveSystem();
    save.incrementMissions();
    save.incrementMissions();
    const before = save.getPrestigeBonus();
    save.prestige();
    expect(save.getPrestigeBonus()).toBe(before + 1);
    expect(save.getShards()).toBe(0);
  });
});