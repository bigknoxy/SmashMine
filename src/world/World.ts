import type { Vec3, BlockType } from '../game/types.js';
import { NEIGHBORS_6, addVec, cloneVec } from './Coordinate.js';

const BLOCK_TYPE_NUMBERS: Map<BlockType, number> = new Map([
  ['air', 0],
  ['stone', 1],
  ['dirt', 2],
  ['deepstone', 3],
  ['copper_ore', 4],
  ['shard_cluster', 5],
  ['blast_crystal', 6],
  ['lucky_cube', 7],
  ['gold_ore', 8],
  ['op_relic_block', 9],
  ['bedrock', 10],
]);

const NUMBER_TO_BLOCK_TYPE: Map<number, BlockType> = new Map(
  Array.from(BLOCK_TYPE_NUMBERS.entries()).map(([type, num]) => [num, type])
);

export class World {
  size: Vec3;
  blocks: Uint8Array;
  sizeX: number;
  sizeZ: number;
  sizeXY: number;

  constructor(size: Vec3 = { x: 16, y: 8, z: 16 }) {
    this.size = cloneVec(size);
    this.sizeX = size.x;
    this.sizeZ = size.z;
    this.sizeXY = size.x * size.z;
    this.blocks = new Uint8Array(size.x * size.y * size.z).fill(0);
  }

  getBlock(pos: Vec3): BlockType;
  getBlock(x: number, y: number, z: number): BlockType;
  getBlock(arg1: Vec3 | number, arg2?: number, arg3?: number): BlockType {
    let x: number, y: number, z: number;
    if (typeof arg1 === 'object') {
      x = arg1.x; y = arg1.y; z = arg1.z;
    } else {
      x = arg1; y = arg2!; z = arg3!;
    }
    if (!this.isInside(x, y, z)) return 'air';
    const num = this.blocks[this.index({ x, y, z })];
    return NUMBER_TO_BLOCK_TYPE.get(num) ?? 'air';
  }

  setBlock(pos: Vec3, type: BlockType): void;
  setBlock(x: number, y: number, z: number, type: BlockType): void;
  setBlock(arg1: Vec3 | number, arg2: BlockType | number, arg3?: number, arg4?: BlockType): void {
    let x: number, y: number, z: number, type: BlockType;
    if (typeof arg1 === 'object') {
      x = arg1.x; y = arg1.y; z = arg1.z; type = arg2 as BlockType;
    } else {
      x = arg1; y = arg2 as number; z = arg3!; type = arg4!;
    }
    const num = BLOCK_TYPE_NUMBERS.get(type) ?? 0;
    this.blocks[this.index({ x, y, z })] = num;
  }

  removeBlock(pos: Vec3): BlockType;
  removeBlock(x: number, y: number, z: number): BlockType;
  removeBlock(arg1: Vec3 | number, arg2?: number, arg3?: number): BlockType {
    let x: number, y: number, z: number;
    if (typeof arg1 === 'object') {
      x = arg1.x; y = arg1.y; z = arg1.z;
    } else {
      x = arg1; y = arg2!; z = arg3!;
    }
    const oldType = this.getBlock({ x, y, z });
    this.blocks[this.index({ x, y, z })] = 0;
    return oldType;
  }

  isInside(pos: Vec3): boolean;
  isInside(x: number, y: number, z: number): boolean;
  isInside(arg1: Vec3 | number, arg2?: number, arg3?: number): boolean {
    let x: number, y: number, z: number;
    if (typeof arg1 === 'object') {
      x = arg1.x; y = arg1.y; z = arg1.z;
    } else {
      x = arg1; y = arg2!; z = arg3!;
    }
    return (
      x >= 0 && x < this.size.x &&
      y >= 0 && y < this.size.y &&
      z >= 0 && z < this.size.z
    );
  }

  isExposed(pos: Vec3): boolean {
    if (!this.isInside(pos)) return false;
    if (this.getBlock(pos) === 'air') return false;
    for (const neighbor of NEIGHBORS_6) {
      const pos2 = addVec(pos, neighbor);
      if (!this.isInside(pos2) || this.getBlock(pos2) === 'air') {
        return true;
      }
    }
    return false;
  }

  getBreakableNeighbors(pos: Vec3, maxRange: number = 2): Vec3[] {
    const result: Vec3[] = [];
    const blockType = this.getBlock(pos);
    if (blockType === 'air' || blockType === 'bedrock') return result;

    const minX = Math.floor(pos.x - maxRange);
    const maxX = Math.floor(pos.x + maxRange);
    const minY = Math.floor(pos.y - maxRange);
    const maxY = Math.floor(pos.y + maxRange);
    const minZ = Math.floor(pos.z - maxRange);
    const maxZ = Math.floor(pos.z + maxRange);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (!this.isInside({ x, y, z })) continue;
          if (x === Math.round(pos.x) && y === Math.round(pos.y) && z === Math.round(pos.z)) continue;
          const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2 + (z - pos.z) ** 2);
          if (dist <= maxRange) {
            const neighborType = this.getBlock({ x, y, z });
            if (neighborType !== 'air' && neighborType !== 'bedrock') {
              result.push({ x, y, z });
            }
          }
        }
      }
    }
    return result;
  }

  clear(): void {
    this.blocks.fill(0);
  }

  private index(pos: Vec3): number {
    return pos.x + pos.z * this.sizeX + pos.y * this.sizeXY;
  }
}