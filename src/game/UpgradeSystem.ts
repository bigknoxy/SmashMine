import type { UpgradeDef, UpgradeId } from './types.js';
import { UPGRADES } from '../data/upgrades.js';
import type { Player } from './Player.js';

export class UpgradeSystem {
  static getUpgradeChoices(): UpgradeDef[] {
    return [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  applyUpgrade(upgradeId: UpgradeId, player: Player): void {
    player.applyUpgrade(upgradeId);
  }
}