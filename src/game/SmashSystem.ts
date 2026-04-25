import type { Vec3, BlockType, UpgradeId } from './types.js';
import type { World } from '../world/World.js';
import { NEIGHBORS_6 } from '../world/Coordinate.js';
import type { Player } from './Player.js';

export class SmashSystem {
  smash(world: World, pos: Vec3, player: Player): { pos: Vec3; type: BlockType }[] {
    const x = Math.round(pos.x);
    const y = Math.round(pos.y);
    const z = Math.round(pos.z);

    if (!world.isInside(x, y, z)) return [];
    const blockType = world.getBlock(x, y, z);
    if (blockType === 'air' || blockType === 'bedrock') return [];

    const broken: { pos: Vec3; type: BlockType }[] = [];

    world.removeBlock({ x, y, z });
    broken.push({ pos: { x, y, z }, type: blockType });

    if (player.hasUpgrade('chain_break')) {
      const depth = player.getUpgradeLevel('chain_break');
      this.chainBreak(world, { x, y, z }, blockType, depth, broken);
    }

    if (player.hasUpgrade('mega_swing') && Math.random() < 0.2) {
      this.smashRadius(world, { x, y, z }, 1.5, broken);
    }

    return broken;
  }

  private chainBreak(world: World, center: Vec3, targetType: BlockType, maxDepth: number, broken: { pos: Vec3; type: BlockType }[]): void {
    const visited = new Set<string>();
    const queue: { x: number; y: number; z: number; depth: number }[] = [
      { x: center.x, y: center.y, z: center.z, depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y},${current.z}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (current.depth >= maxDepth) continue;

      for (const neighbor of NEIGHBORS_6) {
        const nx = current.x + neighbor.x;
        const ny = current.y + neighbor.y;
        const nz = current.z + neighbor.z;
        const nkey = `${nx},${ny},${nz}`;
        if (visited.has(nkey)) continue;
        if (!world.isInside(nx, ny, nz)) continue;

        const ntype = world.getBlock(nx, ny, nz);
        if (ntype === 'air' || ntype === 'bedrock') continue;
        if (ntype === targetType) {
          world.removeBlock({ x: nx, y: ny, z: nz });
          broken.push({ pos: { x: nx, y: ny, z: nz }, type: ntype });
          queue.push({ x: nx, y: ny, z: nz, depth: current.depth + 1 });
        }
      }
    }
  }

  private smashRadius(world: World, center: Vec3, radius: number, broken: { pos: Vec3; type: BlockType }[]): void {
    const r = Math.ceil(radius);
    for (let x = -r; x <= r; x++) {
      for (let y = -r; y <= r; y++) {
        for (let z = -r; z <= r; z++) {
          const bx = Math.round(center.x) + x;
          const by = Math.round(center.y) + y;
          const bz = Math.round(center.z) + z;
          if (!world.isInside(bx, by, bz)) continue;
          if (Math.sqrt(x*x + y*y + z*z) > radius) continue;
          const type = world.getBlock(bx, by, bz);
          if (type !== 'air' && type !== 'bedrock') {
            world.removeBlock({ x: bx, y: by, z: bz });
            broken.push({ pos: { x: bx, y: by, z: bz }, type });
          }
        }
      }
    }
  }
}