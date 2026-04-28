import type { MissionDef, MissionProgress, LootType } from './types.js';
import type { World } from '../world/World.js';

export class MissionManager {
  private mission: MissionDef | null = null;
  private progress: MissionProgress = this.emptyProgress();

  private emptyProgress(): MissionProgress {
    return {
      shards: 0,
      coins: 0,
      loot: { coins: 0, power_shards: 0, blast_crystals: 0, pet_eggs: 0, lucky_cubes: 0, op_relics: 0 },
      elapsed: 0,
      surpriseTriggered: false,
      completed: false,
    };
  }

  startMission(mission: MissionDef): void {
    this.mission = mission;
    this.progress = this.emptyProgress();
  }

  update(delta: number, collected: { type: LootType; amount: number }[]): { completed: boolean; surprise: boolean; failed: boolean } {
    if (!this.mission) return { completed: false, surprise: false, failed: false };

    this.progress.elapsed += delta;

    // Check time limit first - if time's up, mission failed
    if (this.progress.elapsed >= this.mission.timeLimit) {
      return { completed: false, surprise: false, failed: true };
    }

    for (const entry of collected) {
      this.progress.loot[entry.type] += entry.amount;
      if (entry.type === 'power_shards') this.progress.shards += entry.amount;
      if (entry.type === 'coins') this.progress.coins += entry.amount;
    }

    if (this.progress.shards >= this.mission.targetShards) {
      this.progress.completed = true;
      return { completed: true, surprise: false, failed: false };
    }

    if (!this.progress.surpriseTriggered && this.mission.surpriseAt > 0) {
      if (this.progress.elapsed >= this.mission.timeLimit * this.mission.surpriseAt) {
        this.progress.surpriseTriggered = true;
        return { completed: false, surprise: true, failed: false };
      }
    }

    return { completed: false, surprise: false, failed: false };
  }

  getProgress(): MissionProgress { return this.progress; }
  getTargetShards(): number { return this.mission?.targetShards ?? 0; }
  getTimeLimit(): number { return this.mission?.timeLimit ?? 240; }
  isCompleted(): boolean { return this.progress.shards >= this.getTargetShards(); }
}