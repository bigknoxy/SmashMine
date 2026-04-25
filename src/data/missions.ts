import type { MissionDef } from '../game/types.js';

export const MISSIONS: MissionDef[] = [
  {
    id: 'shard_quarry',
    name: 'Shard Quarry',
    goal: 'Collect 25 Power Shards!',
    targetShards: 25,
    timeLimit: 240,
    surpriseAt: 0.6,
    zoneSize: { x: 16, y: 8, z: 16 },
  },
];