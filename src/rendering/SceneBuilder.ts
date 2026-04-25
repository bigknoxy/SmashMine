import { Mesh, MeshLambertMaterial, InstancedMesh, Object3D, BoxGeometry, Color, AmbientLight, DirectionalLight, BufferGeometry, Float32BufferAttribute } from 'three';
import type { Scene } from 'three';
import type { World } from '../world/World.js';
import { BLOCK_DEFS } from '../world/BlockTypes.js';
import { buildMesh } from '../world/ChunkMesher.js';
import type { BlockType, Vec3 } from '../game/types.js';
import { vec3ToString } from '../world/Coordinate.js';

export function buildScene(world: World, scene: Scene): void {
  const terrainGeometry = buildMesh(world);
  const terrainMaterial = new MeshLambertMaterial({ vertexColors: true });
  const terrain = new Mesh(terrainGeometry, terrainMaterial);
  terrain.userData.isTerrain = true;
  scene.add(terrain);

  const groundGeo = new BoxGeometry(world.size.x, 1, world.size.z);
  const groundMat = new MeshLambertMaterial({ color: 0x222233 });
  const ground = new Mesh(groundGeo, groundMat);
  ground.position.set(world.size.x / 2, -0.5, world.size.z / 2);
  ground.userData.isGround = true;
  scene.add(ground);

  const specialTypes: BlockType[] = ['shard_cluster', 'blast_crystal', 'lucky_cube', 'op_relic_block', 'gold_ore', 'copper_ore'];
  const instancesByType: Map<BlockType, Vec3[]> = new Map();

  for (const type of specialTypes) {
    instancesByType.set(type, []);
  }

  for (let y = 0; y < world.size.y; y++) {
    for (let z = 0; z < world.size.z; z++) {
      for (let x = 0; x < world.size.x; x++) {
        const type = world.getBlock({ x, y, z });
        if (instancesByType.has(type) && world.isExposed({ x, y, z })) {
          instancesByType.get(type)!.push({ x, y, z });
        }
      }
    }
  }

  const dummy = new Object3D();
  for (const type of specialTypes) {
    const positions = instancesByType.get(type)!;
    if (positions.length === 0) continue;
    const def = BLOCK_DEFS[type];
    const geo = new BoxGeometry(0.85, 0.85, 0.85);
    const mat = new MeshLambertMaterial({ color: new Color(def.color) });
    const imesh = new InstancedMesh(geo, mat, positions.length);
    imesh.userData.isSpecial = true;
    imesh.userData.blockType = type;

    for (let i = 0; i < positions.length; i++) {
      dummy.position.set(positions[i].x + 0.5, positions[i].y + 0.5, positions[i].z + 0.5);
      dummy.updateMatrix();
      imesh.setMatrixAt(i, dummy.matrix);
    }
    imesh.instanceMatrix.needsUpdate = true;
    scene.add(imesh);
  }
}