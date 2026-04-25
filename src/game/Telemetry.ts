export const telemetry = {
  missionStarted: 0,
  missionCompleted: 0,
  replayCount: 0,
  upgradesPicked: 0,
  lootCollected: 0,
  timeToFirstReward: 0,
  timeToFirstReplay: 0,
};

export class Telemetry {
  static increment(key: keyof typeof telemetry): void {
    telemetry[key]++;
  }
  static reset(): void {
    telemetry.missionStarted = 0;
    telemetry.missionCompleted = 0;
    telemetry.replayCount = 0;
    telemetry.upgradesPicked = 0;
    telemetry.lootCollected = 0;
    telemetry.timeToFirstReward = 0;
    telemetry.timeToFirstReplay = 0;
  }
}