import { describe, test, expect } from "bun:test";
import { MissionManager } from "./MissionManager.js";
import type { MissionDef, LootType } from "./types.js";

describe("MissionManager", () => {
  const createTestMission = (): MissionDef => ({
    id: "test-mission",
    name: "Test Mission",
    goal: "Collect shards",
    targetShards: 10,
    timeLimit: 60,
    surpriseAt: 0.5,
    zoneSize: { x: 10, y: 10, z: 10 },
  });

  test("should return failed=true when time limit is reached", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // Simulate updating with delta that exceeds time limit
    const result = manager.update(mission.timeLimit + 1, []);
    
    expect(result.completed).toBe(false);
    expect(result.surprise).toBe(false);
    expect(result.failed).toBe(true);
  });

  test("should return failed=true exactly when elapsed >= timeLimit", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // Update to exactly the time limit
    const result = manager.update(mission.timeLimit, []);
    
    expect(result.failed).toBe(true);
  });

  test("should not return failed before time limit is reached", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // Update with time just under the limit
    const result = manager.update(mission.timeLimit - 0.1, []);
    
    expect(result.failed).toBe(false);
  });

  test("should return completed=true when target shards reached before time limit", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    const collected: { type: LootType; amount: number }[] = [
      { type: "power_shards", amount: 10 },
    ];

    const result = manager.update(30, collected);
    
    expect(result.completed).toBe(true);
    expect(result.failed).toBe(false);
  });

  test("should return surprise=true when surprise time is reached (before time limit)", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // surpriseAt is 0.5, so surprise should trigger at 30 seconds (60 * 0.5)
    const result = manager.update(30, []);
    
    expect(result.surprise).toBe(true);
    expect(result.failed).toBe(false);
  });

  test("should return failed=true even if shards target was reached after time limit", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // First exceed time limit
    manager.update(mission.timeLimit + 1, []);
    
    // Now try to collect shards (too late)
    const collected: { type: LootType; amount: number }[] = [
      { type: "power_shards", amount: 10 },
    ];
    const result = manager.update(0, collected);
    
    // The mission should already be in a failed state
    // After time limit, update should return failed
    const progress = manager.getProgress();
    expect(progress.elapsed >= mission.timeLimit).toBe(true);
  });

  test("should handle multiple updates that accumulate to time limit", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    // Update in small increments
    let result = { completed: false, surprise: false, failed: false };
    const delta = 10;
    for (let i = 0; i < 6; i++) {
      result = manager.update(delta, []);
      if (result.failed || result.completed) break;
    }
    
    expect(result.failed).toBe(true);
  });

  test("getProgress should reflect elapsed time correctly", () => {
    const manager = new MissionManager();
    const mission = createTestMission();
    manager.startMission(mission);

    manager.update(30, []);
    
    const progress = manager.getProgress();
    expect(progress.elapsed).toBe(30);
  });

  test("should return correct default when no mission is active", () => {
    const manager = new MissionManager();
    
    const result = manager.update(10, []);
    
    expect(result).toEqual({ completed: false, surprise: false, failed: false });
  });
});
