import { World } from './World.js';
import { vec3, addVec } from './Coordinate.js';
import type { Vec3, BlockType } from '../game/types.js';

function stringHash(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 33;
  }
  return (h ^ h >>> 16) >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateQuarry(world: World, missionId: string): void {
  const size = world.size;
  const rand = mulberry32(stringHash(missionId));

  // Clear everything to air
  for (let y = 0; y < size.y; y++)
    for (let z = 0; z < size.z; z++)
      for (let x = 0; x < size.x; x++)
        world.setBlock(vec3(x, y, z), 'air');

  // Floor = bedrock (y=0)
  for (let z = 0; z < size.z; z++)
    for (let x = 0; x < size.x; x++)
      world.setBlock(vec3(x, 0, z), 'bedrock');

  // Walls along edges (x=0, x=15, z=0, z=15) height 1-5
  for (let y = 1; y < size.y - 1; y++) {
    for (let x = 0; x < size.x; x++) {
      world.setBlock(vec3(x, y, 0), 'stone');
      world.setBlock(vec3(x, y, size.z - 1), 'stone');
    }
    for (let z = 0; z < size.z; z++) {
      world.setBlock(vec3(0, y, z), 'stone');
      world.setBlock(vec3(size.x - 1, y, z), 'stone');
    }
  }

  // Scatter ore veins in walls
  for (let i = 0; i < 30; i++) {
    const wx = rand() < 0.5 ? (rand() < 0.5 ? 1 : size.x - 2) : Math.floor(rand() * size.x);
    const wy = 1 + Math.floor(rand() * (size.y - 2));
    const wz = rand() < 0.5 ? (rand() < 0.5 ? 1 : size.z - 2) : Math.floor(rand() * size.z);
    const oreType = rand();
    const type: BlockType = oreType < 0.35 ? 'copper_ore' : oreType < 0.55 ? 'shard_cluster' : oreType < 0.7 ? 'blast_crystal' : oreType < 0.82 ? 'gold_ore' : oreType < 0.92 ? 'lucky_cube' : 'op_relic_block';
    world.setBlock(vec3(wx, wy, wz), type);
    // Add a couple neighbor blocks too
    const dirs = [vec3(wx+1,wy,wz), vec3(wx-1,wy,wz), vec3(wx,wy,wz+1), vec3(wx,wy,wz-1)];
    for (const d of dirs) {
      if (world.isInside(d) && world.getBlock(d) === 'air' && rand() < 0.4) {
        world.setBlock(d, type);
      }
    }
  }

  // Interior pillars/structures
  for (let i = 0; i < 8; i++) {
    const px = 3 + Math.floor(rand() * (size.x - 6));
    const pz = 3 + Math.floor(rand() * (size.z - 6));
    const height = 2 + Math.floor(rand() * 4);
    for (let y = 1; y <= height; y++) {
      const type: BlockType = rand() < 0.3 ? 'shard_cluster' : rand() < 0.5 ? 'deepstone' : 'stone';
      world.setBlock(vec3(px, y, pz), type);
      if (rand() < 0.4) world.setBlock(vec3(px + 1, y, pz), type);
      if (rand() < 0.4) world.setBlock(vec3(px, y, pz + 1), type);
    }
  }

  // Surprise reward room at y = size.y * 0.6
  // (keep the existing surprise room code — it's good)

  // Make sure player start area at (8, top, 8) is clear - EXPANDED to 5x5 for movement room
  const startX = Math.floor(size.x / 2);
  const startZ = Math.floor(size.z / 2);
  const clearRadius = 2;  // 5x5 area (x: 6-10, z: 6-10)
  for (let dx = -clearRadius; dx <= clearRadius; dx++)
    for (let dz = -clearRadius; dz <= clearRadius; dz++)
      for (let y = 1; y < size.y - 1; y++)
        world.setBlock(vec3(startX + dx, y, startZ + dz), 'air');

  // GUARANTEED smashable blocks at the boundary of the spawn area
  // These areore clusters player can immediately smash to start collecting shards
  const guaranteedOres = [
    vec3(startX - clearRadius - 1, 1, startZ),      // left
    vec3(startX + clearRadius + 1, 1, startZ),     // right
    vec3(startX, 1, startZ - clearRadius - 1),  // front
    vec3(startX, 1, startZ + clearRadius + 1),    // back
    vec3(startX - clearRadius - 1, 2, startZ),      // left higher
    vec3(startX + clearRadius + 1, 2, startZ),  // right higher
    vec3(startX, 2, startZ - clearRadius - 1),   // front higher
    vec3(startX, 2, startZ + clearRadius + 1),    // back higher
  ];
  for (const pos of guaranteedOres) {
    if (world.isInside(pos)) {
      const oreType: BlockType = rand() < 0.5 ? 'shard_cluster' : rand() < 0.6 ? 'copper_ore' : 'blast_crystal';
      world.setBlock(pos, oreType);
    }
  }

  // Top layer: ceiling (optional, partial cover)
  for (let x = 2; x < size.x - 2; x++)
    for (let z = 2; z < size.z - 2; z++)
      if (rand() < 0.3) world.setBlock(vec3(x, size.y - 1, z), 'stone');
}