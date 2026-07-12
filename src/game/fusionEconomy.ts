import {
  FUSION_COLORS,
  FUSION_OUTCOMES,
  type FusionColorId,
  type FusionComposition,
} from '../config/fusionSystem';
import type { BattleTower } from '../types/Battle';
import {
  buildFusionStats,
  getActiveFusionAbilities,
  getDominantFusionColor,
  getFusionDescription,
  getFusionName,
  getFusionRarity,
  mixFusionColor,
} from './fusionLogic';

export interface TowerPair {
  source: BattleTower;
  target: BattleTower;
}

const COLOR_IDS: FusionColorId[] = ['red', 'green', 'blue'];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getPrimaryColor(tower: BattleTower): FusionColorId {
  return getDominantFusionColor(tower.composition).colorId;
}

function pickOutcome() {
  const roll = Math.random() * 100;
  let accumulated = 0;

  for (const outcome of FUSION_OUTCOMES) {
    accumulated += outcome.chance;
    if (roll <= accumulated) return outcome;
  }

  return FUSION_OUTCOMES[0];
}

function buildComposition(
  leftColor: FusionColorId,
  rightColor: FusionColorId,
): FusionComposition {
  const outcome = pickOutcome();

  return {
    red: leftColor === 'red'
      ? outcome.leftPower
      : rightColor === 'red'
        ? outcome.rightPower
        : 0,
    green: leftColor === 'green'
      ? outcome.leftPower
      : rightColor === 'green'
        ? outcome.rightPower
        : 0,
    blue: leftColor === 'blue'
      ? outcome.leftPower
      : rightColor === 'blue'
        ? outcome.rightPower
        : 0,
  };
}

function chooseFusionColors(source: BattleTower, target: BattleTower) {
  const sourceColor = getPrimaryColor(source);
  let targetColor = getPrimaryColor(target);

  if (sourceColor === targetColor) {
    targetColor = pickRandom(COLOR_IDS.filter((colorId) => colorId !== sourceColor));
  }

  return [sourceColor, targetColor] as const;
}

function buildLevelStats(composition: FusionComposition, level: number) {
  const base = buildFusionStats(composition, 1);
  const multiplier = 1 + Math.max(0, level - 1) * 0.5;

  return {
    ...base,
    damage: Math.round(base.damage * multiplier),
    range: Number((base.range * multiplier).toFixed(2)),
    cooldown: Math.max(180, Math.round(base.cooldown / multiplier)),
    targetCount: base.targetCount >= 99
      ? base.targetCount
      : Math.max(1, Math.round(base.targetCount * multiplier)),
  };
}

function buildFusionResult(
  source: BattleTower,
  target: BattleTower,
  nextLevel: number,
): BattleTower {
  const [leftColor, rightColor] = chooseFusionColors(source, target);
  const composition = buildComposition(leftColor, rightColor);
  const stats = buildLevelStats(composition, nextLevel);
  const abilities = getActiveFusionAbilities(composition);

  return {
    ...source,
    ...stats,
    level: nextLevel,
    name: getFusionName(composition),
    description: getFusionDescription(composition),
    color: mixFusionColor(composition),
    symbol: nextLevel > 1 ? '🧬' : '✦',
    composition,
    fusionRarity: getFusionRarity(composition),
    activeAbilityIds: abilities.map((ability) => ability.id),
    targetCount: stats.targetCount,
    ignoresRangeEvery: stats.ignoresRangeEvery,
    attackCounter: 0,
    cooldownRemaining: 0,
    investedEnergy: source.investedEnergy + target.investedEnergy,
  };
}

export function getSameLevelPairs(towers: BattleTower[]): TowerPair[] {
  const pairs: TowerPair[] = [];

  for (let left = 0; left < towers.length; left += 1) {
    for (let right = left + 1; right < towers.length; right += 1) {
      if (towers[left].level === towers[right].level) {
        pairs.push({ source: towers[left], target: towers[right] });
      }
    }
  }

  return pairs;
}

export function canSuperFuseTowers(source: BattleTower, target: BattleTower) {
  return source.instanceId !== target.instanceId && source.level === target.level;
}

export function getSuperFusionTargets(source: BattleTower, towers: BattleTower[]) {
  return towers.filter((target) => canSuperFuseTowers(source, target));
}

export function createRandomFusion(towers: BattleTower[]) {
  const pairs = getSameLevelPairs(towers);
  if (pairs.length === 0) return null;

  const pair = pickRandom(pairs);
  return {
    ...pair,
    result: buildFusionResult(pair.source, pair.target, pair.source.level),
  };
}

export function createSuperFusion(source: BattleTower, target: BattleTower) {
  if (!canSuperFuseTowers(source, target)) return null;

  return buildFusionResult(source, target, source.level + 1);
}

export function getLevelBonusLabel(level: number) {
  const bonus = Math.max(0, (level - 1) * 50);
  return bonus === 0 ? 'Базовые характеристики' : `+${bonus}% к базовым характеристикам`;
}

export function getFusionColorLabel(tower: BattleTower) {
  const color = getPrimaryColor(tower);
  return FUSION_COLORS[color].label;
}
