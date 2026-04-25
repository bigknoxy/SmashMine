import type { Vec3, LootType, BlockType, LootDrop } from './types.js';
import { rollLoot } from '../data/lootTable.js';
import type { World } from '../world/World.js';

export class LootSystem {
  private drops: { pos: Vec3; type: LootType; amount: number; collected: boolean }[] = [];
  private magnetRadius = 3;
  private pendingCollected: { type: LootType; amount: number }[] = [];

  constructor(private world: World) {}

  createDrop(type: LootType, amount: number, pos: Vec3): void {
    this.drops.push({ pos: { ...pos }, type, amount, collected: false });
  }

  spawnBlockLoot(blockType: BlockType, pos: Vec3): void {
    const drops = rollLoot(blockType);
    for (const drop of drops) {
      this.createDrop(drop.type, drop.amount, { ...drop.worldPos, ...pos });
    }
  }

  update(playerPos: Vec3, delta: number): void {
    for (const drop of this.drops) {
      if (drop.collected) continue;
      const dist = Math.sqrt(
        (drop.pos.x - playerPos.x) ** 2 +
        (drop.pos.y - playerPos.y) ** 2 +
        (drop.pos.z - playerPos.z) ** 2
      );
      if (dist < this.magnetRadius) {
        drop.collected = true;
        this.pendingCollected.push({ type: drop.type, amount: drop.amount });
      } else if (dist < this.magnetRadius * 1.5) {
        const dx = playerPos.x - drop.pos.x;
        const dy = playerPos.y - drop.pos.y;
        const dz = playerPos.z - drop.pos.z;
        const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (mag > 0.01) {
          drop.pos.x += (dx / mag) * delta * 15;
          drop.pos.y += (dy / mag) * delta * 15;
          drop.pos.z += (dz / mag) * delta * 15;
        }
      }
    }
    this.drops = this.drops.filter((d) => !d.collected);
  }

  getAndClearCollected(): { type: LootType; amount: number }[] {
    const result = this.pendingCollected;
    this.pendingCollected = [];
    return result;
  }

  clear(): void {
    this.drops = [];
    this.pendingCollected = [];
  }
}