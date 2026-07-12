import type { BattleTower } from '../types/Battle';

export const MAX_TOWER_LEVEL = 5;
export const SELL_REFUND_RATE = 0.6;

export function getTowerUpgradeCost(tower: BattleTower): number | null {
  if (tower.level >= MAX_TOWER_LEVEL) {
    return null;
  }

  return tower.placeCost + tower.level * 25;
}

export function getTowerSellRefund(tower: BattleTower): number {
  return Math.floor(tower.investedEnergy * SELL_REFUND_RATE);
}

export function upgradeTower(tower: BattleTower, cost: number): BattleTower {
  return {
    ...tower,
    level: tower.level + 1,
    damage: Math.round(tower.damage * 1.35),
    range: Number((tower.range + 0.25).toFixed(2)),
    cooldown: Math.max(250, Math.round(tower.cooldown * 0.9)),
    investedEnergy: tower.investedEnergy + cost,
  };
}
