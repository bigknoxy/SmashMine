import { InstancedMesh, Object3D, BoxGeometry, MeshLambertMaterial, Color } from 'three';
import type { Scene } from 'three';
import type { World } from '../world/World.js';
import { BLOCK_DEFS } from '../world/BlockTypes.js';
import { vec3ToString } from '../world/Coordinate.js';
import type { Vec3, BlockType } from '../game/types.js';

const SPECIAL_TYPES: BlockType[] = ['shard_cluster', 'blast_crystal', 'lucky_cube', 'op_relic_block', 'gold_ore', 'copper_ore'];

export class InstancedBlockManager {
  private positionMap: Map<string, { type: BlockType; x: number; y: number; z: number }> = new Map();
  private world: World;
  private dummy = new Object3D();

  constructor(world: World) {
    this.world = world;
  }

  rebuild(world: World): void {
    this.world = world;
    this.positionMap.clear();
    for (let y = 0; y < world.size.y; y++) {
      for (let z = 0; z < world.size.z; z++) {
        for (let x = 0; x < world.size.x; x++) {
          const type = world.getBlock({ x, y, z });
          if (SPECIAL_TYPES.includes(type) && world.isExposed({ x, y, z })) {
            this.positionMap.set(`${x},${y},${z}`, { type, x, y, z });
          }
        }
      }
    }
  }

  removeBlock(pos: Vec3): void {
    this.positionMap.delete(`${pos.x},${pos.y},${pos.z}`);
  }

  getInstanceCount(): number {
    return this.positionMap.size;
  }

  getPositions(): IterableIterator<{ type: BlockType; x: number; y: number; z: number }> {
    return this.positionMap.values();
  }

  addToScene(scene: Scene): InstancedMesh[] {
    const meshes: InstancedMesh[] = [];
    const byType: Map<BlockType, { x: number; y: number; z: number }[]> = new Map();
    for (const type of SPECIAL_TYPES) byType.set(type, []);

    for (const entry of this.positionMap.values()) {
      byType.get(entry.type)?.push({ x: entry.x, y: entry.y, z: entry.z });
    }

    for (const type of SPECIAL_TYPES) {
      const positions = byType.get(type)!;
      if (positions.length === 0) continue;
      const def = BLOCK_DEFS[type];
      const geo = new BoxGeometry(0.85, 0.85, 0.85);
      const mat = new MeshLambertMaterial({ color: new Color(def.color) });
      const imesh = new InstancedMesh(geo, mat, positions.length);
      imesh.userData.isSpecial = true;
      imesh.userData.blockType = type;

      for (let i = 0; i < positions.length; i++) {
        this.dummy.position.set(positions[i].x + 0.5, positions[i].y + 0.5, positions[i].z + 0.5);
        this.dummy.updateMatrix();
        imesh.setMatrixAt(i, this.dummy.matrix);
      }
      imesh.instanceMatrix.needsUpdate = true;
      scene.add(imesh);
      meshes.push(imesh);
    }
    return meshes;
  }
}

export function createSpecialBlocks(world: World): InstancedBlockManager {
  const mgr = new InstancedBlockManager(world);
  mgr.rebuild(world);
  return mgr;
}