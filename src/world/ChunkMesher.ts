import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { World } from './World.js';
import { BLOCK_DEFS } from './BlockTypes.js';
import type { Vec3 } from '../game/types.js';
import { vec3ToString } from './Coordinate.js';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.5, 0.5, 0.5];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
}

export function buildMesh(world: World): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const faceDirs = [
    { nx: 1, ny: 0, nz: 0 },
    { nx: -1, ny: 0, nz: 0 },
    { nx: 0, ny: 1, nz: 0 },
    { nx: 0, ny: -1, nz: 0 },
    { nx: 0, ny: 0, nz: 1 },
    { nx: 0, ny: 0, nz: -1 },
  ];

  const size = world.size;
  const blockMap = new Map<string, string>();

  for (let y = 0; y < size.y; y++) {
    for (let z = 0; z < size.z; z++) {
      for (let x = 0; x < size.x; x++) {
        const type = world.getBlock({ x, y, z });
        if (type === 'air') continue;
        blockMap.set(`${x},${y},${z}`, BLOCK_DEFS[type].color);
      }
    }
  }

  for (const [key, color] of blockMap.entries()) {
    const parts = key.split(',');
    const px = parseInt(parts[0]);
    const py = parseInt(parts[1]);
    const pz = parseInt(parts[2]);

    for (const dir of faceDirs) {
      const nx = px + dir.nx;
      const ny = py + dir.ny;
      const nz = pz + dir.nz;
      const neighborKey = `${nx},${ny},${nz}`;
      if (blockMap.has(neighborKey)) continue;

      const vi = positions.length / 3;

      if (dir.nx === 1) {
        positions.push(px+1,py,pz, px+1,py+1,pz, px+1,py+1,pz+1, px+1,py,pz+1);
      } else if (dir.nx === -1) {
        positions.push(px,py,pz+1, px,py+1,pz+1, px,py+1,pz, px,py,pz);
      } else if (dir.ny === 1) {
        positions.push(px,py+1,pz, px+1,py+1,pz, px+1,py+1,pz+1, px,py+1,pz+1);
      } else if (dir.ny === -1) {
        positions.push(px,py,pz+1, px+1,py,pz+1, px+1,py,pz, px,py,pz);
      } else if (dir.nz === 1) {
        positions.push(px,py,pz+1, px+1,py,pz+1, px+1,py+1,pz+1, px,py+1,pz+1);
      } else {
        positions.push(px+1,py,pz, px,py,pz, px,py+1,pz, px+1,py+1,pz);
      }

      const rgb = hexToRgb(color);
      for (let i = 0; i < 4; i++) colors.push(rgb[0], rgb[1], rgb[2]);
      indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}