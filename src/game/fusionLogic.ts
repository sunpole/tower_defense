import {
  BASE_FUSION_COST,
  BASE_TOWER_COLOR_BY_ID,
  FUSION_ABILITIES,
  FUSION_COLORS,
  FUSION_OUTCOMES,
  FUSION_PAIR_NAMES,
  FUSION_RARITIES,
  FUSION_TOTAL,
} from '../config/fusionSystem';
import type {
  FusionAbility,
  FusionColorId,
  FusionComposition,
  FusionRarityId,
} from '../config/fusionSystem';
import type { ITower } from '../types/Tower';
import type { BattleTower } from '../types/Battle';

const COLOR_ORDER: FusionColorId[] = ['red', 'green', 'blue'];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const raw = hex.replace('#', '');
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

export function createBaseComposition(colorId: FusionColorId): FusionComposition {
  return {
    red: colorId === 'red' ? FUSION_TOTAL : 0,
    green: colorId === 'green' ? FUSION_TOTAL : 0,
    blue: colorId === 'blue' ? FUSION_TOTAL : 0,
  };
}

export function getBaseTowerColorId(towerId: number): FusionColorId {
  return BASE_TOWER_COLOR_BY_ID[towerId] ?? 'red';
}

export function getCompositionEntries(composition: FusionComposition) {
  return COLOR_ORDER
    .map((colorId) => ({ colorId, value: composition[colorId] }))
    .filter((entry) => entry.value > 0);
}

export function getCompositionLabel(composition: FusionComposition) {
  return getCompositionEntries(composition)
    .map((entry) => `${FUSION_COLORS[entry.colorId].label} ${entry.value}`)
    .join(' + ');
}

export function getCompositionSegments(composition: FusionComposition) {
  const segments: FusionColorId[] = [];

  for (const colorId of COLOR_ORDER) {
    for (let index = 0; index < composition[colorId]; index += 1) {
      segments.push(colorId);
    }
  }

  return segments;
}

export function mixFusionColor(composition: FusionComposition) {
  const entries = getCompositionEntries(composition);
  let r = 0;
  let g = 0;
  let b = 0;

  for (const entry of entries) {
    const rgb = hexToRgb(FUSION_COLORS[entry.colorId].hex);
    r += rgb.r * entry.value;
    g += rgb.g * entry.value;
    b += rgb.b * entry.value;
  }

  return `#${toHex(r / FUSION_TOTAL)}${toHex(g / FUSION_TOTAL)}${toHex(b / FUSION_TOTAL)}`;
}

export function getFusionRarity(composition: FusionComposition): FusionRarityId {
  const entries = getCompositionEntries(composition);

  if (entries.length === 1) {
    return 'pure';
  }

  const dominantValue = Math.max(...entries.map((entry) => entry.value));

  if (dominantValue === 5) return 'balanced';
  if (dominantValue === 6) return 'uncommon';
  if (dominantValue === 7) return 'rare';
  if (dominantValue === 8) return 'epic';
  return 'legendary';
}

export function getDominantFusionColor(composition: FusionComposition) {
  const entries = getCompositionEntries(composition);

  return entries.reduce((dominant, entry) =>
    entry.value > dominant.value ? entry : dominant,
  );
}

export function getActiveFusionAbilities(composition: FusionComposition): FusionAbility[] {
  const entries = getCompositionEntries(composition);

  if (entries.length === 1) {
    return [];
  }

  if (entries.length === 2 && entries.every((entry) => entry.value === 5)) {
    return entries.map((entry) => FUSION_ABILITIES[entry.colorId][5]);
  }

  const dominant = getDominantFusionColor(composition);
  return [FUSION_ABILITIES[dominant.colorId][dominant.value]];
}

export function getFusionPairKey(composition: FusionComposition) {
  const entries = getCompositionEntries(composition);

  if (entries.length < 2) {
    return null;
  }

  const sorted = entries
    .map((entry) => entry.colorId)
    .sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));

  return `${sorted[0]}-${sorted[1]}`;
}

export function getFusionName(composition: FusionComposition) {
  const entries = getCompositionEntries(composition);

  if (entries.length === 1) {
    return `${FUSION_COLORS[entries[0].colorId].label} башня`;
  }

  if (entries.length > 2) {
    return 'Трёхцветная башня';
  }

  const pairKey = getFusionPairKey(composition);

  if (!pairKey) {
    return 'Башня';
  }

  const leftColor = pairKey.split('-')[0] as FusionColorId;
  const rightColor = pairKey.split('-')[1] as FusionColorId;
  const ratioKey = `${composition[leftColor]}-${composition[rightColor]}`;

  return FUSION_PAIR_NAMES[pairKey]?.[ratioKey] ?? 'Гибридная башня';
}

export function getFusionDescription(composition: FusionComposition) {
  const abilities = getActiveFusionAbilities(composition);
  const rarity = FUSION_RARITIES[getFusionRarity(composition)];

  if (abilities.length === 0) {
    return 'Чистая башня базового цвета. Используется как основа для цветового слияния.';
  }

  return `${rarity.label} синергия: ${abilities.map((ability) => ability.name).join(' + ')}.`;
}

function getStatPower(composition: FusionComposition, colorId: FusionColorId) {
  return composition[colorId];
}

function getTowerAttackType(composition: FusionComposition): ITower['attackType'] {
  const dominant = getDominantFusionColor(composition);

  if (dominant.colorId === 'green') return 'aura';
  if (dominant.colorId === 'blue') return 'laser';
  return 'projectile';
}

export function buildFusionStats(composition: FusionComposition, rank: number) {
  const redPower = getStatPower(composition, 'red');
  const greenPower = getStatPower(composition, 'green');
  const bluePower = getStatPower(composition, 'blue');
  const abilities = getActiveFusionAbilities(composition);
  const abilityIds = new Set(abilities.map((ability) => ability.id));
  const rarity = getFusionRarity(composition);
  const rankBonus = 1 + (rank - 1) * 0.16;

  let damage = Math.round((9 + redPower * 1.9 + bluePower * 1.15 + greenPower * 0.75) * rankBonus);
  let range = Number((1.25 + redPower * 0.18 + bluePower * 0.09 + greenPower * 0.04).toFixed(2));
  let cooldown = Math.round(1300 - greenPower * 62 - bluePower * 24 + redPower * 12);
  let targetCount = 1;
  let ignoresRangeEvery = 0;

  if (abilityIds.has('red-5-focus')) damage = Math.round(damage * 1.1);
  if (abilityIds.has('red-6-pierce')) targetCount = Math.max(targetCount, 2);
  if (abilityIds.has('red-7-critical')) damage = Math.round(damage * 1.18);
  if (abilityIds.has('red-8-execute')) damage = Math.round(damage * 1.24);
  if (abilityIds.has('red-9-horizon')) ignoresRangeEvery = 4;

  if (abilityIds.has('green-5-double')) targetCount = Math.max(targetCount, 2);
  if (abilityIds.has('green-6-accelerate')) cooldown = Math.round(cooldown * 0.86);
  if (abilityIds.has('green-7-burst')) targetCount = Math.max(targetCount, 3);
  if (abilityIds.has('green-8-reset')) cooldown = Math.round(cooldown * 0.76);
  if (abilityIds.has('green-9-overload')) cooldown = Math.round(cooldown * 0.58);

  if (abilityIds.has('blue-5-seeking')) range = Number((range + 0.2).toFixed(2));
  if (abilityIds.has('blue-6-ricochet')) targetCount = Math.max(targetCount, 2);
  if (abilityIds.has('blue-7-split')) targetCount = Math.max(targetCount, 3);
  if (abilityIds.has('blue-8-chain')) targetCount = Math.max(targetCount, 4);
  if (abilityIds.has('blue-9-network')) targetCount = 99;

  if (rarity === 'legendary') damage = Math.round(damage * 1.1);
  if (rarity === 'epic') damage = Math.round(damage * 1.05);

  return {
    attackType: getTowerAttackType(composition),
    damage,
    range,
    cooldown: Math.max(260, cooldown),
    targetCount,
    ignoresRangeEvery,
  };
}

export function createBaseBattleTower(
  template: ITower,
  instanceId: string,
  x: number,
  y: number,
): BattleTower {
  const colorId = getBaseTowerColorId(template.id);
  const composition = createBaseComposition(colorId);
  const stats = buildFusionStats(composition, 1);
  const color = FUSION_COLORS[colorId].hex;

  return {
    ...template,
    ...stats,
    instanceId,
    x,
    y,
    color,
    symbol: FUSION_COLORS[colorId].symbol,
    name: getFusionName(composition),
    description: getFusionDescription(composition),
    level: 1,
    lastShot: 0,
    buffId: null,
    cooldownRemaining: 0,
    investedEnergy: template.placeCost,
    composition,
    fusionRarity: getFusionRarity(composition),
    activeAbilityIds: [],
    targetCount: stats.targetCount,
    ignoresRangeEvery: stats.ignoresRangeEvery,
    attackCounter: 0,
  };
}

function pickRandomOutcome() {
  const roll = Math.random() * 100;
  let accumulated = 0;

  for (const outcome of FUSION_OUTCOMES) {
    accumulated += outcome.chance;
    if (roll <= accumulated) {
      return outcome;
    }
  }

  return FUSION_OUTCOMES[0];
}

function getPureColor(composition: FusionComposition): FusionColorId | null {
  const entries = getCompositionEntries(composition);
  return entries.length === 1 ? entries[0].colorId : null;
}

function getTwoColorComposition(
  leftColor: FusionColorId,
  rightColor: FusionColorId,
  leftValue: number,
  rightValue: number,
): FusionComposition {
  return {
    red: leftColor === 'red' ? leftValue : rightColor === 'red' ? rightValue : 0,
    green: leftColor === 'green' ? leftValue : rightColor === 'green' ? rightValue : 0,
    blue: leftColor === 'blue' ? leftValue : rightColor === 'blue' ? rightValue : 0,
  };
}

function shiftCompositionToward(
  composition: FusionComposition,
  colorId: FusionColorId,
): FusionComposition | null {
  const entries = getCompositionEntries(composition);

  if (entries.length !== 2 || !entries.some((entry) => entry.colorId === colorId)) {
    return null;
  }

  const other = entries.find((entry) => entry.colorId !== colorId);

  if (!other || composition[colorId] >= 9 || composition[other.colorId] <= 1) {
    return composition;
  }

  return {
    ...composition,
    [colorId]: composition[colorId] + 1,
    [other.colorId]: composition[other.colorId] - 1,
  };
}

export function canFuseTowers(source: BattleTower, target: BattleTower) {
  if (source.instanceId === target.instanceId) {
    return false;
  }

  const sourcePure = getPureColor(source.composition);
  const targetPure = getPureColor(target.composition);
  const sourceEntries = getCompositionEntries(source.composition);
  const targetEntries = getCompositionEntries(target.composition);

  if (sourcePure && targetPure) {
    return sourcePure !== targetPure;
  }

  if (!sourcePure && targetPure && sourceEntries.length === 2) {
    return sourceEntries.some((entry) => entry.colorId === targetPure);
  }

  if (sourcePure && !targetPure && targetEntries.length === 2) {
    return targetEntries.some((entry) => entry.colorId === sourcePure);
  }

  return false;
}

export function getFusionCost(source: BattleTower, target: BattleTower) {
  const rarityMultiplier = Math.max(
    FUSION_RARITIES[source.fusionRarity].nextFusionCostMultiplier,
    FUSION_RARITIES[target.fusionRarity].nextFusionCostMultiplier,
  );
  const rankMultiplier = 1 + (Math.max(source.level, target.level) - 1) * 0.35;

  return Math.round(BASE_FUSION_COST * rarityMultiplier * rankMultiplier);
}

export function fuseTowers(source: BattleTower, target: BattleTower, cost: number): BattleTower | null {
  if (!canFuseTowers(source, target)) {
    return null;
  }

  const sourcePure = getPureColor(source.composition);
  const targetPure = getPureColor(target.composition);
  let composition: FusionComposition | null = null;

  if (sourcePure && targetPure) {
    const outcome = pickRandomOutcome();
    composition = getTwoColorComposition(
      sourcePure,
      targetPure,
      outcome.leftPower,
      outcome.rightPower,
    );
  } else if (!sourcePure && targetPure) {
    composition = shiftCompositionToward(source.composition, targetPure);
  } else if (sourcePure && !targetPure) {
    composition = shiftCompositionToward(target.composition, sourcePure);
  }

  if (!composition) {
    return null;
  }

  const rank = Math.max(source.level, target.level) + 1;
  const stats = buildFusionStats(composition, rank);
  const abilities = getActiveFusionAbilities(composition);
  const color = mixFusionColor(composition);

  return {
    ...source,
    ...stats,
    level: rank,
    name: getFusionName(composition),
    description: getFusionDescription(composition),
    color,
    symbol: '✦',
    composition,
    fusionRarity: getFusionRarity(composition),
    activeAbilityIds: abilities.map((ability) => ability.id),
    targetCount: stats.targetCount,
    ignoresRangeEvery: stats.ignoresRangeEvery,
    attackCounter: 0,
    cooldownRemaining: 0,
    investedEnergy: source.investedEnergy + target.investedEnergy + cost,
  };
}

export function getFusionAtlasRows(leftColor: FusionColorId, rightColor: FusionColorId) {
  return FUSION_OUTCOMES.map((outcome) => {
    const composition = getTwoColorComposition(
      leftColor,
      rightColor,
      outcome.leftPower,
      outcome.rightPower,
    );
    const abilities = getActiveFusionAbilities(composition);
    const rarity = FUSION_RARITIES[getFusionRarity(composition)];

    return {
      composition,
      chance: outcome.chance,
      name: getFusionName(composition),
      rarity,
      abilities,
      label: getCompositionLabel(composition),
    };
  });
}
