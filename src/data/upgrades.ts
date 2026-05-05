import type { UpgradeDef, UpgradeId } from '../game/types.js';

export const UPGRADES: UpgradeDef[] = [
  { id: 'chain_break', name: 'Chain Break', icon: '⛓️', description: 'Smash breaks nearby same-type blocks', maxLevel: 3 },
  { id: 'magnet_pet', name: 'Magnet Pet', icon: '🧲', description: 'Vacuum nearby loot automatically', maxLevel: 3 },
  { id: 'mega_swing', name: 'Mega Swing', icon: '💥', description: 'Periodic shockwave smash', maxLevel: 3 },
  { id: 'double_jump', name: 'Double Jump', icon: '👢', description: 'Jump again mid-air', maxLevel: 2 },
];

export function getUpgradeDef(id: UpgradeId): UpgradeDef {
  return UPGRADES.find((u) => u.id === id)!;
}