#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="/c/!CODE_CLUB/new 2026/tower_defense"
PATCH_BRANCH="agent/color-fusion-system"
BASE_REF="v0.4.0-tower-management"

cd "$PROJECT_DIR"

echo "== v0.5.0 Цветовой Завет =="
echo "Проект: $(pwd)"

git fetch origin --tags

if git rev-parse --verify "$PATCH_BRANCH" >/dev/null 2>&1; then
  git switch "$PATCH_BRANCH"
else
  git switch -c "$PATCH_BRANCH" "$BASE_REF"
fi

mkdir -p src/config src/game src/components src/types docs PATCH_NOTES

cat > src/config/fusionSystem.ts <<'EOF'
export type FusionColorId = 'red' | 'green' | 'blue';

export type FusionRarityId =
  | 'pure'
  | 'balanced'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface FusionColorDefinition {
  id: FusionColorId;
  label: string;
  shortLabel: string;
  hex: string;
  symbol: string;
  primaryStatLabel: string;
  primaryStatDescription: string;
  role: string;
}

export interface FusionComposition {
  red: number;
  green: number;
  blue: number;
}

export interface FusionAbility {
  id: string;
  colorId: FusionColorId;
  power: number;
  name: string;
  shortDescription: string;
  fullDescription: string;
}

export interface FusionRarityDefinition {
  id: FusionRarityId;
  label: string;
  cssClass: string;
  nextFusionCostMultiplier: number;
}

export interface FusionOutcomeTemplate {
  leftPower: number;
  rightPower: number;
  chance: number;
}

export const FUSION_TOTAL = 10;
export const BASE_FUSION_COST = 90;

export const FUSION_COLORS: Record<FusionColorId, FusionColorDefinition> = {
  red: {
    id: 'red',
    label: 'Красный',
    shortLabel: 'Кр.',
    hex: '#ff3f55',
    symbol: '🔴',
    primaryStatLabel: 'Радиус',
    primaryStatDescription: 'Дальность и фокус атаки.',
    role: 'дальнобойный фокус и добивание сильных врагов',
  },
  green: {
    id: 'green',
    label: 'Зелёный',
    shortLabel: 'Зел.',
    hex: '#31dc4f',
    symbol: '🟢',
    primaryStatLabel: 'Перезарядка',
    primaryStatDescription: 'Темп атаки и повторные удары.',
    role: 'скорость, серии и повторные атаки',
  },
  blue: {
    id: 'blue',
    label: 'Синий',
    shortLabel: 'Син.',
    hex: '#2b94ff',
    symbol: '🔵',
    primaryStatLabel: 'Распространение',
    primaryStatDescription: 'Скорость снаряда, рикошет и цепи.',
    role: 'переход атаки между несколькими целями',
  },
};

export const BASE_TOWER_COLOR_BY_ID: Record<number, FusionColorId> = {
  1: 'red',
  2: 'blue',
  3: 'green',
};

export const FUSION_RARITIES: Record<FusionRarityId, FusionRarityDefinition> = {
  pure: {
    id: 'pure',
    label: 'Чистая',
    cssClass: 'fusion-rarity--pure',
    nextFusionCostMultiplier: 1,
  },
  balanced: {
    id: 'balanced',
    label: 'Равновесная',
    cssClass: 'fusion-rarity--balanced',
    nextFusionCostMultiplier: 1,
  },
  uncommon: {
    id: 'uncommon',
    label: 'Необычная',
    cssClass: 'fusion-rarity--uncommon',
    nextFusionCostMultiplier: 1.25,
  },
  rare: {
    id: 'rare',
    label: 'Редкая',
    cssClass: 'fusion-rarity--rare',
    nextFusionCostMultiplier: 1.6,
  },
  epic: {
    id: 'epic',
    label: 'Эпическая',
    cssClass: 'fusion-rarity--epic',
    nextFusionCostMultiplier: 2.2,
  },
  legendary: {
    id: 'legendary',
    label: 'Легендарная',
    cssClass: 'fusion-rarity--legendary',
    nextFusionCostMultiplier: 3,
  },
};

export const FUSION_OUTCOMES: FusionOutcomeTemplate[] = [
  { leftPower: 5, rightPower: 5, chance: 70 },
  { leftPower: 6, rightPower: 4, chance: 7.5 },
  { leftPower: 4, rightPower: 6, chance: 7.5 },
  { leftPower: 7, rightPower: 3, chance: 5 },
  { leftPower: 3, rightPower: 7, chance: 5 },
  { leftPower: 8, rightPower: 2, chance: 2 },
  { leftPower: 2, rightPower: 8, chance: 2 },
  { leftPower: 9, rightPower: 1, chance: 0.5 },
  { leftPower: 1, rightPower: 9, chance: 0.5 },
];

export const FUSION_ABILITIES: Record<FusionColorId, Record<number, FusionAbility>> = {
  red: {
    5: {
      id: 'red-5-focus',
      colorId: 'red',
      power: 5,
      name: 'Пристрелка',
      shortDescription: 'Фокус по важной цели.',
      fullDescription: 'Башня получает усиленный урон по ведущей цели в радиусе.',
    },
    6: {
      id: 'red-6-pierce',
      colorId: 'red',
      power: 6,
      name: 'Пробой',
      shortDescription: 'Вторая цель получает часть урона.',
      fullDescription: 'Атака пробивает первую цель и задевает следующего врага.',
    },
    7: {
      id: 'red-7-critical',
      colorId: 'red',
      power: 7,
      name: 'Критический фокус',
      shortDescription: 'Каждая четвёртая атака сильнее.',
      fullDescription: 'Периодически башня наносит критический удар.',
    },
    8: {
      id: 'red-8-execute',
      colorId: 'red',
      power: 8,
      name: 'Казнь',
      shortDescription: 'Сильнее добивает раненых врагов.',
      fullDescription: 'Враги с низким здоровьем получают заметно больше урона.',
    },
    9: {
      id: 'red-9-horizon',
      colorId: 'red',
      power: 9,
      name: 'Выстрел за горизонт',
      shortDescription: 'Иногда игнорирует обычный радиус.',
      fullDescription: 'Редкая красная специализация позволяет атаковать ведущую цель на всей дороге.',
    },
  },
  green: {
    5: {
      id: 'green-5-double',
      colorId: 'green',
      power: 5,
      name: 'Двойной такт',
      shortDescription: 'Каждая пятая атака повторяется.',
      fullDescription: 'Башня периодически наносит дополнительный повторный удар.',
    },
    6: {
      id: 'green-6-accelerate',
      colorId: 'green',
      power: 6,
      name: 'Разгон',
      shortDescription: 'Сокращает перезарядку.',
      fullDescription: 'Доминирующий зелёный цвет даёт ускоренный темп атаки.',
    },
    7: {
      id: 'green-7-burst',
      colorId: 'green',
      power: 7,
      name: 'Очередь',
      shortDescription: 'Периодическая серия ударов.',
      fullDescription: 'Башня иногда выпускает серию быстрых атак.',
    },
    8: {
      id: 'green-8-reset',
      colorId: 'green',
      power: 8,
      name: 'Сброс цикла',
      shortDescription: 'Иногда почти сбрасывает перезарядку.',
      fullDescription: 'После атаки есть шанс быстро подготовить следующий удар.',
    },
    9: {
      id: 'green-9-overload',
      colorId: 'green',
      power: 9,
      name: 'Перегрузка',
      shortDescription: 'Предельная скорость атаки.',
      fullDescription: 'Легендарная зелёная специализация резко повышает темп боя.',
    },
  },
  blue: {
    5: {
      id: 'blue-5-seeking',
      colorId: 'blue',
      power: 5,
      name: 'Наведение',
      shortDescription: 'Надёжнее достаёт цель.',
      fullDescription: 'Синее влияние улучшает переход атаки к подходящему врагу.',
    },
    6: {
      id: 'blue-6-ricochet',
      colorId: 'blue',
      power: 6,
      name: 'Рикошет',
      shortDescription: 'Задевает дополнительную цель.',
      fullDescription: 'Атака перескакивает на соседнего врага с частью урона.',
    },
    7: {
      id: 'blue-7-split',
      colorId: 'blue',
      power: 7,
      name: 'Расщепление',
      shortDescription: 'Поражает несколько целей.',
      fullDescription: 'Башня получает дополнительное количество целей.',
    },
    8: {
      id: 'blue-8-chain',
      colorId: 'blue',
      power: 8,
      name: 'Цепная волна',
      shortDescription: 'Атака проходит цепочкой.',
      fullDescription: 'Эффект проходит через серию врагов с затухающим уроном.',
    },
    9: {
      id: 'blue-9-network',
      colorId: 'blue',
      power: 9,
      name: 'Синяя сеть',
      shortDescription: 'Связывает всех доступных врагов.',
      fullDescription: 'Легендарная синяя специализация превращает атаку в сетевой удар по группе.',
    },
  },
};

export const FUSION_PAIR_NAMES: Record<string, Record<string, string>> = {
  'red-green': {
    '5-5': 'Плавильная башня',
    '6-4': 'Термитовый дозор',
    '4-6': 'Горящие споры',
    '7-3': 'Кузня пробоя',
    '3-7': 'Ядовитый жар',
    '8-2': 'Пепельная казнь',
    '2-8': 'Дикий пожар',
    '9-1': 'Белое пламя',
    '1-9': 'Зелёное пекло',
  },
  'red-blue': {
    '5-5': 'Плазменная башня',
    '6-4': 'Рельсовый фокус',
    '4-6': 'Импульсный лазер',
    '7-3': 'Плазменное копьё',
    '3-7': 'Перегретый луч',
    '8-2': 'Алый разряд',
    '2-8': 'Синяя дуга',
    '9-1': 'Выстрел за горизонт',
    '1-9': 'Синяя сеть',
  },
  'green-blue': {
    '5-5': 'Криояд',
    '6-4': 'Токсичный темп',
    '4-6': 'Ледяная дуга',
    '7-3': 'Токсичный туман',
    '3-7': 'Цепной холод',
    '8-2': 'Цветение спор',
    '2-8': 'Северный разлом',
    '9-1': 'Дикое цветение',
    '1-9': 'Абсолютный холод',
  },
};
EOF

cat > src/game/fusionLogic.ts <<'EOF'
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
EOF

cat > src/types/Battle.ts <<'EOF'
import type { Dispatch } from 'react';
import type { FusionAbility, FusionComposition, FusionRarityId } from '../config/fusionSystem';
import type { IEnemy } from './Enemy';
import type { IPlacedTower } from './Tower';

export interface BattleEnemy extends IEnemy {
  instanceId: string;
  maxHp: number;
  progress: number;
}

export interface BattleTower extends IPlacedTower {
  instanceId: string;
  cooldownRemaining: number;
  investedEnergy: number;
  composition: FusionComposition;
  fusionRarity: FusionRarityId;
  activeAbilityIds: string[];
  targetCount: number;
  ignoresRangeEvery: number;
  attackCounter: number;
}

export type BattleStatus = 'idle' | 'running' | 'victory' | 'defeat';

export interface BattleState {
  selectedTowerId: number;
  placingTowerId: number | null;
  selectedPlacedTowerId: string | null;
  fusionSourceTowerId: string | null;
  showFusionAtlas: boolean;
  towers: BattleTower[];
  enemies: BattleEnemy[];
  energy: number;
  baseHealth: number;
  wave: number;
  status: BattleStatus;
  spawnRemaining: number;
  spawnCooldown: number;
  kills: number;
  message: string;
}

export type BattleAction =
  | { type: 'SELECT_TOWER'; towerId: number }
  | { type: 'SELECT_PLACED_TOWER'; instanceId: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PLACE_TOWER'; x: number; y: number }
  | { type: 'START_FUSION' }
  | { type: 'CANCEL_FUSION' }
  | { type: 'FUSE_WITH_TOWER'; instanceId: string }
  | { type: 'SELL_SELECTED_TOWER' }
  | { type: 'TOGGLE_FUSION_ATLAS' }
  | { type: 'START_WAVE' }
  | { type: 'TICK'; delta: number }
  | { type: 'RESET' };

export interface TowerInspectionData {
  tower: BattleTower;
  abilities: FusionAbility[];
  canStartFusion: boolean;
  isFusionSource: boolean;
}

export type BattleDispatch = Dispatch<BattleAction>;
EOF

cat > src/game/battleReducer.ts <<'EOF'
import {
  BATTLE_PATH,
  SPAWN_INTERVAL_MS,
  STARTING_BASE_HEALTH,
  STARTING_ENERGY,
  TOTAL_WAVES,
} from '../config/gameSettings';
import { TOWERS } from '../config/towers';
import type {
  BattleAction,
  BattleEnemy,
  BattleState,
  BattleTower,
} from '../types/Battle';
import { getDistance, PATH_CELL_KEYS } from './battleGeometry';
import { createEnemy } from './createEnemy';
import {
  canFuseTowers,
  createBaseBattleTower,
  fuseTowers,
  getFusionCost,
} from './fusionLogic';

let towerSequence = 0;

export function createInitialBattleState(
  selectedTowerId = TOWERS[0]?.id ?? 1,
): BattleState {
  return {
    selectedTowerId,
    placingTowerId: null,
    selectedPlacedTowerId: null,
    fusionSourceTowerId: null,
    showFusionAtlas: false,
    towers: [],
    enemies: [],
    energy: STARTING_ENERGY,
    baseHealth: STARTING_BASE_HEALTH,
    wave: 0,
    status: 'idle',
    spawnRemaining: 0,
    spawnCooldown: 0,
    kills: 0,
    message: 'Нажмите на тип башни, затем на свободную клетку. Башни развиваются через слияние цветов.',
  };
}

function getSelectedTower(state: BattleState) {
  return state.towers.find((tower) => tower.instanceId === state.selectedPlacedTowerId) ?? null;
}

function applyDamage(target: BattleEnemy, damage: number) {
  target.hp -= damage;
}

function getTowerTargets(tower: BattleTower, enemies: BattleEnemy[]) {
  const canIgnoreRange =
    tower.ignoresRangeEvery > 0 &&
    tower.attackCounter > 0 &&
    tower.attackCounter % tower.ignoresRangeEvery === 0;

  const possibleTargets = enemies.filter((enemy) =>
    enemy.hp > 0 && (canIgnoreRange || getDistance(tower, enemy) <= tower.range),
  );

  return possibleTargets.sort((left, right) => right.progress - left.progress);
}

function attackWithTower(tower: BattleTower, enemies: BattleEnemy[]) {
  const targets = getTowerTargets(tower, enemies);

  if (targets.length === 0) {
    return tower;
  }

  const nextTower: BattleTower = {
    ...tower,
    attackCounter: tower.attackCounter + 1,
  };
  const abilityIds = new Set(nextTower.activeAbilityIds);
  const isAreaAttack = nextTower.attackType === 'aura' || abilityIds.has('blue-9-network');
  const targetLimit = isAreaAttack ? targets.length : Math.min(nextTower.targetCount, targets.length);
  const selectedTargets = targets.slice(0, targetLimit);

  selectedTargets.forEach((target, index) => {
    let damage = nextTower.damage;

    if (index > 0) {
      damage *= abilityIds.has('blue-8-chain') ? 0.55 : 0.42;
    }

    if (abilityIds.has('red-8-execute') && target.hp / target.maxHp <= 0.35) {
      damage *= 1.75;
    }

    if (abilityIds.has('red-7-critical') && nextTower.attackCounter % 4 === 0) {
      damage *= 2;
    }

    applyDamage(target, Math.round(damage));
  });

  if (abilityIds.has('green-5-double') && nextTower.attackCounter % 5 === 0 && selectedTargets[0]) {
    applyDamage(selectedTargets[0], Math.round(nextTower.damage * 0.55));
  }

  if (abilityIds.has('green-7-burst') && nextTower.attackCounter % 6 === 0) {
    selectedTargets.slice(0, 3).forEach((target) => applyDamage(target, Math.round(nextTower.damage * 0.45)));
  }

  const resetChance = abilityIds.has('green-8-reset') ? 0.22 : 0;
  const isReset = resetChance > 0 && Math.random() < resetChance;

  return {
    ...nextTower,
    cooldownRemaining: isReset ? Math.round(nextTower.cooldown * 0.22) : nextTower.cooldown,
  };
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  switch (action.type) {
    case 'SELECT_TOWER': {
      const isSameTower = state.placingTowerId === action.towerId;

      return {
        ...state,
        selectedTowerId: action.towerId,
        placingTowerId: isSameTower ? null : action.towerId,
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        message: isSameTower
          ? 'Режим установки выключен.'
          : 'Режим установки включён. Нажмите на свободную клетку.',
      };
    }

    case 'SELECT_PLACED_TOWER': {
      const tower = state.towers.find(
        (candidate) => candidate.instanceId === action.instanceId,
      );

      if (!tower) {
        return state;
      }

      return {
        ...state,
        placingTowerId: null,
        selectedPlacedTowerId: tower.instanceId,
        message: `${tower.name}. Вы можете начать слияние или продать башню.`,
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        placingTowerId: null,
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        message: 'Выделение снято.',
      };

    case 'PLACE_TOWER': {
      if (state.status === 'victory' || state.status === 'defeat') {
        return state;
      }

      const occupiedTower = state.towers.find((tower) => tower.x === action.x && tower.y === action.y);

      if (occupiedTower) {
        return battleReducer(state, {
          type: state.fusionSourceTowerId && state.fusionSourceTowerId !== occupiedTower.instanceId
            ? 'FUSE_WITH_TOWER'
            : 'SELECT_PLACED_TOWER',
          instanceId: occupiedTower.instanceId,
        } as BattleAction);
      }

      if (!state.placingTowerId) {
        return {
          ...state,
          selectedPlacedTowerId: null,
          fusionSourceTowerId: null,
          message: 'Пустая клетка. Чтобы поставить башню, сначала выберите цвет в арсенале.',
        };
      }

      if (PATH_CELL_KEYS.has(`${action.x}:${action.y}`)) {
        return { ...state, message: 'На дороге башню ставить нельзя.' };
      }

      const towerTemplate = TOWERS.find(
        (tower) => tower.id === state.placingTowerId,
      );

      if (!towerTemplate) {
        return { ...state, message: 'Не удалось найти выбранную башню.' };
      }

      if (state.energy < towerTemplate.placeCost) {
        return { ...state, message: 'Недостаточно энергии для установки башни.' };
      }

      towerSequence += 1;
      const instanceId = `tower-${towerSequence}`;
      const tower = createBaseBattleTower(towerTemplate, instanceId, action.x, action.y);

      return {
        ...state,
        towers: [...state.towers, tower],
        selectedPlacedTowerId: instanceId,
        fusionSourceTowerId: null,
        placingTowerId: null,
        energy: state.energy - towerTemplate.placeCost,
        message: `${tower.name} установлена. Режим установки выключен.`,
      };
    }

    case 'START_FUSION': {
      const selectedTower = getSelectedTower(state);

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      return {
        ...state,
        placingTowerId: null,
        fusionSourceTowerId: selectedTower.instanceId,
        message: 'Выберите вторую совместимую башню для слияния.',
      };
    }

    case 'CANCEL_FUSION':
      return {
        ...state,
        fusionSourceTowerId: null,
        message: 'Слияние отменено.',
      };

    case 'FUSE_WITH_TOWER': {
      const source = state.towers.find((tower) => tower.instanceId === state.fusionSourceTowerId);
      const target = state.towers.find((tower) => tower.instanceId === action.instanceId);

      if (!source || !target) {
        return { ...state, message: 'Для слияния нужны две выбранные башни.' };
      }

      if (!canFuseTowers(source, target)) {
        return {
          ...state,
          selectedPlacedTowerId: target.instanceId,
          message: 'Эти башни пока нельзя соединить. В v0.5.0 работают чистые пары и усиление гибрида чистым цветом.',
        };
      }

      const fusionCost = getFusionCost(source, target);

      if (state.energy < fusionCost) {
        return {
          ...state,
          selectedPlacedTowerId: source.instanceId,
          message: `Для слияния требуется ${fusionCost} энергии.`,
        };
      }

      const fusedTower = fuseTowers(source, target, fusionCost);

      if (!fusedTower) {
        return { ...state, message: 'Слияние не удалось.' };
      }

      return {
        ...state,
        towers: state.towers
          .filter((tower) => tower.instanceId !== source.instanceId && tower.instanceId !== target.instanceId)
          .concat(fusedTower),
        selectedPlacedTowerId: fusedTower.instanceId,
        fusionSourceTowerId: null,
        energy: state.energy - fusionCost,
        message: `Слияние завершено: ${fusedTower.name}.`,
      };
    }

    case 'SELL_SELECTED_TOWER': {
      const selectedTower = getSelectedTower(state);

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      const refund = Math.floor(selectedTower.investedEnergy * 0.6);

      return {
        ...state,
        towers: state.towers.filter((tower) => tower.instanceId !== selectedTower.instanceId),
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        energy: state.energy + refund,
        message: `${selectedTower.name} продана. Возвращено ${refund} энергии.`,
      };
    }

    case 'TOGGLE_FUSION_ATLAS':
      return {
        ...state,
        showFusionAtlas: !state.showFusionAtlas,
      };

    case 'START_WAVE': {
      if (state.status === 'running' || state.wave >= TOTAL_WAVES) {
        return state;
      }

      const nextWave = state.wave + 1;
      const enemyCount = 5 + (nextWave - 1) * 2;

      return {
        ...state,
        wave: nextWave,
        status: 'running',
        spawnRemaining: enemyCount,
        spawnCooldown: 0,
        message: `Волна ${nextWave} началась: врагов ${enemyCount}.`,
      };
    }

    case 'TICK': {
      if (state.status !== 'running') {
        return state;
      }

      let spawnRemaining = state.spawnRemaining;
      let spawnCooldown = state.spawnCooldown - action.delta;
      let enemies = state.enemies.map((enemy) => ({ ...enemy }));

      if (spawnRemaining > 0 && spawnCooldown <= 0) {
        enemies.push(createEnemy(state.wave));
        spawnRemaining -= 1;
        spawnCooldown += SPAWN_INTERVAL_MS;
      }

      let escapedEnemies = 0;

      enemies = enemies
        .map((enemy) => ({
          ...enemy,
          progress: enemy.progress + enemy.speed * (action.delta / 1000),
        }))
        .filter((enemy) => {
          const escaped = enemy.progress >= BATTLE_PATH.length - 1;
          if (escaped) {
            escapedEnemies += 1;
          }
          return !escaped;
        });

      const baseHealth = Math.max(0, state.baseHealth - escapedEnemies);

      if (baseHealth === 0) {
        return {
          ...state,
          enemies,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          status: 'defeat',
          message: 'Поражение: враги разрушили базу.',
        };
      }

      const towers = state.towers.map((tower) => ({
        ...tower,
        cooldownRemaining: Math.max(0, tower.cooldownRemaining - action.delta),
      }));

      const attackedTowers = towers.map((tower) =>
        tower.cooldownRemaining > 0 ? tower : attackWithTower(tower, enemies),
      );

      let energy = state.energy;
      let kills = state.kills;
      const survivors: BattleEnemy[] = [];

      for (const enemy of enemies) {
        if (enemy.hp <= 0) {
          energy += enemy.rewardEnergy;
          kills += 1;
        } else {
          survivors.push(enemy);
        }
      }

      if (spawnRemaining === 0 && survivors.length === 0) {
        if (state.wave >= TOTAL_WAVES) {
          return {
            ...state,
            towers: attackedTowers,
            enemies: [],
            energy,
            baseHealth,
            spawnRemaining,
            spawnCooldown,
            kills,
            status: 'victory',
            message: `Победа! Пройдено волн: ${TOTAL_WAVES}.`,
          };
        }

        return {
          ...state,
          towers: attackedTowers,
          enemies: [],
          energy: energy + 25,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          kills,
          status: 'idle',
          message: `Волна ${state.wave} завершена. Бонус: 25 энергии.`,
        };
      }

      return {
        ...state,
        towers: attackedTowers,
        enemies: survivors,
        energy,
        baseHealth,
        spawnRemaining,
        spawnCooldown,
        kills,
      };
    }

    case 'RESET':
      return createInitialBattleState(state.selectedTowerId);

    default:
      return state;
  }
}
EOF

cat > src/components/BattleBoard.tsx <<'EOF'
import type { CSSProperties } from 'react';
import { BOARD_COLUMNS, BOARD_ROWS } from '../config/gameSettings';
import {
  getEntityPosition,
  getPathPosition,
  PATH_CELL_KEYS,
} from '../game/battleGeometry';
import { canFuseTowers } from '../game/fusionLogic';
import { getCompositionSegments } from '../game/fusionLogic';
import { FUSION_COLORS } from '../config/fusionSystem';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface BattleBoardProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function BattleBoard({ state, dispatch }: BattleBoardProps) {
  const boardStyle = {
    '--board-columns': BOARD_COLUMNS,
    '--board-rows': BOARD_ROWS,
  } as CSSProperties;
  const selectedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  );
  const fusionSourceTower = state.towers.find(
    (tower) => tower.instanceId === state.fusionSourceTowerId,
  );

  return (
    <div className="battle-board" style={boardStyle}>
      {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => {
        const x = index % BOARD_COLUMNS;
        const y = Math.floor(index / BOARD_COLUMNS);
        const isPathCell = PATH_CELL_KEYS.has(`${x}:${y}`);
        const occupiedTower = state.towers.find((tower) => tower.x === x && tower.y === y);
        const isFusionTarget = Boolean(
          fusionSourceTower &&
          occupiedTower &&
          fusionSourceTower.instanceId !== occupiedTower.instanceId &&
          canFuseTowers(fusionSourceTower, occupiedTower),
        );

        return (
          <button
            className={`board-cell${isPathCell ? ' board-cell--path' : ''}${occupiedTower ? ' board-cell--occupied' : ''}${isFusionTarget ? ' board-cell--fusion-target' : ''}`}
            disabled={isPathCell || state.status === 'victory' || state.status === 'defeat'}
            key={`${x}:${y}`}
            onClick={() => dispatch({ type: 'PLACE_TOWER', x, y })}
            type="button"
            aria-label={
              occupiedTower
                ? `${occupiedTower.name}, клетка ${x + 1}:${y + 1}`
                : isPathCell
                  ? `Дорога, клетка ${x + 1}:${y + 1}`
                  : `Свободная клетка ${x + 1}:${y + 1}`
            }
          />
        );
      })}

      {selectedTower && (
        <div
          className="tower-range"
          style={{
            ...getEntityPosition(selectedTower.x, selectedTower.y),
            width: `${(selectedTower.range * 2 / BOARD_COLUMNS) * 100}%`,
            borderColor: selectedTower.color,
            backgroundColor: `${selectedTower.color}14`,
          }}
          aria-hidden="true"
        />
      )}

      {state.towers.map((tower) => {
        const isSelected = tower.instanceId === state.selectedPlacedTowerId;
        const isFusionSource = tower.instanceId === state.fusionSourceTowerId;
        const segments = getCompositionSegments(tower.composition);

        return (
          <div
            aria-hidden="true"
            className={`placed-tower${isSelected ? ' placed-tower--selected' : ''}${isFusionSource ? ' placed-tower--fusion-source' : ''}`}
            key={tower.instanceId}
            style={{
              ...getEntityPosition(tower.x, tower.y),
              borderColor: tower.color,
              boxShadow: `0 0 18px ${tower.color}66`,
            }}
            title={`${tower.name}: ранг ${tower.level}, урон ${tower.damage}, радиус ${tower.range}`}
          >
            <span style={{ color: tower.color }}>{tower.symbol}</span>
            <span className="tower-mini-composition">
              {segments.map((colorId, segmentIndex) => (
                <i
                  key={`${tower.instanceId}-${colorId}-${segmentIndex}`}
                  style={{ background: FUSION_COLORS[colorId].hex }}
                />
              ))}
            </span>
          </div>
        );
      })}

      {state.enemies.map((enemy) => {
        const position = getPathPosition(enemy.progress);
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

        return (
          <div
            className="battle-enemy"
            key={enemy.instanceId}
            style={getEntityPosition(position.x, position.y)}
            title={`${enemy.name}: ${Math.max(0, Math.ceil(enemy.hp))} HP`}
          >
            <div className="enemy-health">
              <span style={{ width: `${hpPercent}%` }} />
            </div>
            <span className="enemy-symbol" style={{ color: enemy.color }}>
              {enemy.symbol}
            </span>
          </div>
        );
      })}
    </div>
  );
}
EOF

cat > src/components/TowerShop.tsx <<'EOF'
import type { CSSProperties } from 'react';
import { TOWERS } from '../config/towers';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface TowerShopProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function TowerShop({ state, dispatch }: TowerShopProps) {
  const selectedTower = TOWERS.find((tower) => tower.id === state.selectedTowerId);

  return (
    <aside className="tower-shop" aria-label="Выбор башен">
      <div className="tower-shop__heading">
        <p className="eyebrow">Арсенал</p>
        <h2>Выберите цвет</h2>
      </div>

      <div className="tower-list">
        {TOWERS.map((tower) => {
          const isSelected = tower.id === state.placingTowerId;

          return (
            <button
              className={`tower-option${isSelected ? ' tower-option--selected' : ''}`}
              key={tower.id}
              onClick={() => dispatch({ type: 'SELECT_TOWER', towerId: tower.id })}
              style={{ '--tower-color': tower.color } as CSSProperties}
              type="button"
            >
              <span className="tower-option__symbol">{tower.symbol}</span>
              <span className="tower-option__content">
                <strong>{tower.name}</strong>
                <small>{tower.description}</small>
                <span className="tower-option__stats">
                  Урон {tower.damage} · Радиус {tower.range} · Цена {tower.placeCost}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="selection-note">
        {state.placingTowerId && selectedTower ? (
          <>Режим установки: <strong>{selectedTower.name}</strong></>
        ) : (
          <>Режим установки выключен. Нажмите на цвет, чтобы взять башню.</>
        )}
      </div>

      <ol className="game-help">
        <li>Нажмите на цвет, затем на свободную клетку.</li>
        <li>После установки режим автоматически выключается.</li>
        <li>Выберите две совместимые башни, чтобы создать гибрид.</li>
      </ol>
    </aside>
  );
}
EOF

cat > src/components/TowerInspector.tsx <<'EOF'
import { FUSION_COLORS, FUSION_RARITIES } from '../config/fusionSystem';
import {
  canFuseTowers,
  getActiveFusionAbilities,
  getCompositionEntries,
  getCompositionLabel,
  getCompositionSegments,
  getFusionCost,
} from '../game/fusionLogic';
import type { BattleDispatch, BattleState, BattleTower } from '../types/Battle';

interface TowerInspectorProps {
  tower: BattleTower | null;
  state: BattleState;
  dispatch: BattleDispatch;
}

export function TowerInspector({ tower, state, dispatch }: TowerInspectorProps) {
  if (!tower) {
    return (
      <aside className="tower-inspector" aria-label="Выбранная башня">
        <p className="eyebrow">Установленная башня</p>
        <h2>Башня не выбрана</h2>
        <p className="tower-inspector__empty">
          Нажмите на занятую клетку поля, чтобы увидеть состав, радиус, способности и действия башни.
        </p>
      </aside>
    );
  }

  const abilities = getActiveFusionAbilities(tower.composition);
  const rarity = FUSION_RARITIES[tower.fusionRarity];
  const segments = getCompositionSegments(tower.composition);
  const fusionSource = state.towers.find((candidate) => candidate.instanceId === state.fusionSourceTowerId);
  const isFusionSource = state.fusionSourceTowerId === tower.instanceId;
  const possibleTargets = fusionSource
    ? state.towers.filter((candidate) => canFuseTowers(fusionSource, candidate))
    : [];
  const previewCost = fusionSource && fusionSource.instanceId !== tower.instanceId && canFuseTowers(fusionSource, tower)
    ? getFusionCost(fusionSource, tower)
    : null;

  return (
    <aside className="tower-inspector" aria-label="Выбранная башня">
      <div className="tower-inspector__heading">
        <span className="tower-inspector__symbol" style={{ borderColor: tower.color, color: tower.color }}>
          {tower.symbol}
        </span>
        <div>
          <p className="eyebrow">Установленная башня</p>
          <h2>{tower.name}</h2>
          <span className={`tower-level ${rarity.cssClass}`}>
            Ранг {tower.level} · {rarity.label}
          </span>
        </div>
      </div>

      <div className="composition-bar" aria-label={getCompositionLabel(tower.composition)}>
        {segments.map((colorId, index) => (
          <span key={`${colorId}-${index}`} style={{ background: FUSION_COLORS[colorId].hex }} />
        ))}
      </div>

      <dl className="composition-list">
        {getCompositionEntries(tower.composition).map((entry) => (
          <div key={entry.colorId}>
            <dt>{FUSION_COLORS[entry.colorId].label}</dt>
            <dd>{entry.value}/10 · {FUSION_COLORS[entry.colorId].primaryStatLabel}</dd>
          </div>
        ))}
      </dl>

      <dl className="tower-details">
        <div>
          <dt>Урон</dt>
          <dd>{tower.damage}</dd>
        </div>
        <div>
          <dt>Радиус</dt>
          <dd>{tower.range}</dd>
        </div>
        <div>
          <dt>Перезарядка</dt>
          <dd>{(tower.cooldown / 1000).toFixed(2)} сек.</dd>
        </div>
        <div>
          <dt>Вложено</dt>
          <dd>{tower.investedEnergy}</dd>
        </div>
      </dl>

      <div className="ability-list">
        <strong>Активные способности</strong>
        {abilities.length > 0 ? (
          <ul>
            {abilities.map((ability) => (
              <li key={ability.id}>
                <span>{ability.name}</span>
                <small>{ability.shortDescription}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Чистая башня. Соедините её с другим цветом, чтобы открыть синергию.</p>
        )}
      </div>

      {previewCost !== null && (
        <p className="tower-inspector__warning">
          Слияние с выбранной исходной башней стоит {previewCost} энергии.
        </p>
      )}

      {isFusionSource && (
        <p className="tower-inspector__warning">
          Режим слияния включён. Совместимые башни подсвечены на поле: {possibleTargets.length}.
        </p>
      )}

      <div className="tower-inspector__actions">
        {isFusionSource ? (
          <button
            className="tower-upgrade-button"
            onClick={() => dispatch({ type: 'CANCEL_FUSION' })}
            type="button"
          >
            Отменить слияние
          </button>
        ) : (
          <button
            className="tower-upgrade-button"
            onClick={() => dispatch({ type: 'START_FUSION' })}
            type="button"
          >
            Начать слияние
          </button>
        )}

        <button
          className="tower-sell-button"
          onClick={() => dispatch({ type: 'SELL_SELECTED_TOWER' })}
          type="button"
        >
          Продать за {Math.floor(tower.investedEnergy * 0.6)}
        </button>

        <button
          className="tower-back-button"
          onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
          type="button"
        >
          Назад к арсеналу
        </button>
      </div>

      <p className="tower-inspector__note">
        Слияние заменяет обычное улучшение. Чем реже состав, тем дороже следующее слияние.
      </p>
    </aside>
  );
}
EOF

cat > src/components/FusionAtlas.tsx <<'EOF'
import { FUSION_COLORS } from '../config/fusionSystem';
import type { FusionColorId } from '../config/fusionSystem';
import { getFusionAtlasRows } from '../game/fusionLogic';
import type { BattleDispatch, BattleState } from '../types/Battle';

const PAIRS: Array<[FusionColorId, FusionColorId]> = [
  ['red', 'green'],
  ['red', 'blue'],
  ['green', 'blue'],
];

interface FusionAtlasProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function FusionAtlas({ state, dispatch }: FusionAtlasProps) {
  return (
    <aside className="fusion-atlas">
      <button
        className="fusion-atlas__toggle"
        onClick={() => dispatch({ type: 'TOGGLE_FUSION_ATLAS' })}
        type="button"
      >
        {state.showFusionAtlas ? 'Скрыть атлас слияний' : 'Показать атлас слияний'}
      </button>

      {state.showFusionAtlas && (
        <div className="fusion-atlas__content">
          <p className="eyebrow">Атлас слияний</p>
          <h2>27 цветовых результатов</h2>
          <p>
            Все вероятности открыты заранее. 5/5 даёт две способности, а редкие 9/1 дают самую сильную способность доминирующего цвета.
          </p>

          {PAIRS.map(([leftColor, rightColor]) => (
            <section className="fusion-pair" key={`${leftColor}-${rightColor}`}>
              <h3>
                <span style={{ color: FUSION_COLORS[leftColor].hex }}>{FUSION_COLORS[leftColor].label}</span>
                {' + '}
                <span style={{ color: FUSION_COLORS[rightColor].hex }}>{FUSION_COLORS[rightColor].label}</span>
              </h3>

              <div className="fusion-result-list">
                {getFusionAtlasRows(leftColor, rightColor).map((row) => (
                  <article className="fusion-result" key={`${row.label}-${row.chance}`}>
                    <strong>{row.name}</strong>
                    <span>{row.label} · {row.chance}% · {row.rarity.label}</span>
                    <small>{row.abilities.map((ability) => ability.name).join(' + ')}</small>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
EOF

cat > src/components/Battle.tsx <<'EOF'
import { useReducer } from 'react';
import { battleReducer, createInitialBattleState } from '../game/battleReducer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import '../towerManagement.css';
import '../colorFusion.css';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { FusionAtlas } from './FusionAtlas';
import { TowerInspector } from './TowerInspector';
import { TowerShop } from './TowerShop';

export function Battle() {
  const [state, dispatch] = useReducer(
    battleReducer,
    createInitialBattleState(),
  );

  useBattleLoop(dispatch);

  const selectedPlacedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  ) ?? null;

  return (
    <main className="game-app">
      <BattleHeader state={state} />

      <div className="game-layout">
        <section className="battle-card" aria-label="Игровое поле">
          <BattleBoard state={state} dispatch={dispatch} />
          <BattleControls state={state} dispatch={dispatch} />
        </section>

        <div className="game-sidebar">
          {selectedPlacedTower ? (
            <TowerInspector
              tower={selectedPlacedTower}
              state={state}
              dispatch={dispatch}
            />
          ) : (
            <TowerShop
              state={state}
              dispatch={dispatch}
            />
          )}
          <FusionAtlas state={state} dispatch={dispatch} />
        </div>
      </div>
    </main>
  );
}
EOF

cat > src/colorFusion.css <<'EOF'
.board-cell--occupied {
  cursor: pointer;
}

.board-cell--fusion-target {
  background: rgba(196, 181, 253, 0.18);
  box-shadow: inset 0 0 0 2px rgba(196, 181, 253, 0.6);
}

.placed-tower {
  pointer-events: none;
}

.placed-tower--fusion-source {
  outline: 3px solid #fbbf24;
  outline-offset: 5px;
}

.tower-mini-composition {
  position: absolute;
  left: 50%;
  bottom: -10px;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  width: 150%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  transform: translateX(-50%);
  background: #11141b;
}

.tower-mini-composition i {
  display: block;
  height: 100%;
}

.composition-bar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  margin: 14px 0 10px;
}

.composition-bar span {
  height: 10px;
  border-radius: 999px;
}

.composition-list {
  display: grid;
  gap: 7px;
  margin: 0 0 14px;
}

.composition-list div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #303444;
  border-radius: 9px;
  background: #11141b;
}

.composition-list dt,
.composition-list dd {
  margin: 0;
  font-size: 12px;
}

.composition-list dt {
  color: #aeb4c3;
  font-weight: 800;
}

.composition-list dd {
  color: #f2f3f7;
}

.ability-list {
  margin: 10px 0 14px;
  padding: 12px;
  border: 1px solid #303444;
  border-radius: 12px;
  background: #11141b;
}

.ability-list strong {
  display: block;
  margin-bottom: 8px;
  color: #f7f8fb;
  font-size: 13px;
}

.ability-list ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ability-list li span,
.ability-list li small {
  display: block;
}

.ability-list li span {
  color: #c4b5fd;
  font-size: 13px;
  font-weight: 800;
}

.ability-list li small,
.ability-list p {
  margin: 0;
  color: #9299aa;
  font-size: 12px;
  line-height: 1.45;
}

.tower-back-button {
  min-height: 42px;
  padding: 9px 12px;
  border: 1px solid #3a4052;
  border-radius: 10px;
  color: #d7d9e1;
  background: #202430;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.fusion-rarity--balanced { color: #86efac; }
.fusion-rarity--uncommon { color: #93c5fd; }
.fusion-rarity--rare { color: #c4b5fd; }
.fusion-rarity--epic { color: #f0abfc; }
.fusion-rarity--legendary { color: #fbbf24; }

.fusion-atlas {
  border: 1px solid #303444;
  border-radius: 18px;
  background: #171a23;
  text-align: left;
}

.fusion-atlas__toggle {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 0;
  border-radius: 18px;
  color: #f7f8fb;
  background: #202430;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.fusion-atlas__content {
  display: grid;
  gap: 14px;
  max-height: 480px;
  overflow: auto;
  padding: 16px;
}

.fusion-atlas h2,
.fusion-atlas h3,
.fusion-atlas p {
  margin: 0;
}

.fusion-atlas h2 {
  color: #f7f8fb;
  font-size: 21px;
}

.fusion-atlas p {
  color: #9299aa;
  font-size: 12px;
  line-height: 1.45;
}

.fusion-pair {
  display: grid;
  gap: 8px;
}

.fusion-pair h3 {
  font-size: 14px;
}

.fusion-result-list {
  display: grid;
  gap: 6px;
}

.fusion-result {
  display: grid;
  gap: 2px;
  padding: 9px;
  border: 1px solid #303444;
  border-radius: 10px;
  background: #11141b;
}

.fusion-result strong {
  color: #f7f8fb;
  font-size: 12px;
}

.fusion-result span,
.fusion-result small {
  color: #9299aa;
  font-size: 11px;
}

@media (max-width: 940px) {
  .fusion-atlas__content {
    max-height: none;
  }
}
EOF

cat > docs/FUSION_SYSTEM.md <<'EOF'
# v0.5.0 — Цветовой Завет

## Идея

Башни больше не развиваются обычной кнопкой улучшения. Сила появляется через слияние цветов.

## Базовые цвета

- Красный — радиус, фокус, добивание.
- Зелёный — перезарядка, темп, повторные атаки.
- Синий — распространение, рикошет, цепные атаки.

## Правило состава

Сумма цвета гибрида всегда равна 10.

Примеры:

- Красный 5 + Зелёный 5;
- Красный 7 + Синий 3;
- Зелёный 1 + Синий 9.

## Вероятности

| Состав | Вероятность |
|---|---:|
| 5/5 | 70% |
| 6/4 | 7.5% |
| 4/6 | 7.5% |
| 7/3 | 5% |
| 3/7 | 5% |
| 8/2 | 2% |
| 2/8 | 2% |
| 9/1 | 0.5% |
| 1/9 | 0.5% |

## Главное правило способностей

- 5/5 получает две способности — по одной от каждого цвета.
- 6/4, 7/3, 8/2 и 9/1 получают только способность доминирующего цвета.
- Меньший цвет продолжает влиять на основную характеристику, но не открывает свою способность.

## Стоимость слияния

Чем реже башня, тем дороже следующее слияние.

| Редкость | Множитель |
|---|---:|
| Равновесная | ×1.0 |
| Необычная | ×1.25 |
| Редкая | ×1.6 |
| Эпическая | ×2.2 |
| Легендарная | ×3.0 |

## Ограничение текущего этапа

В v0.5.0 реализованы двухцветные слияния. Три цвета будут проектироваться отдельно после проверки 27 двухцветных результатов.
EOF

cat > PATCH_NOTES/v0.5.0_COLOR_COVENANT.md <<'EOF'
# v0.5.0 — Цветовой Завет

## Обложка патча

Три цвета. Двадцать семь гибридов. Один путь, который нужно защитить.

## Что изменилось

Обычное улучшение башен заменено системой цветового слияния.

Теперь игрок не просто нажимает «улучшить». Он создаёт новые башни через сочетания красного, зелёного и синего цвета.

## Главное

- добавлены цветовые составы башен;
- добавлены двухцветные гибриды;
- добавлен атлас слияний;
- все вероятности видны игроку заранее;
- 5/5 даёт две способности;
- редкие 9/1 дают легендарную способность доминирующего цвета;
- следующая стоимость слияния зависит от редкости башни.

## Почему это важно

Игрок теперь может мечтать о конкретном результате, видеть таблицу редкости и строить стратегию вокруг цвета, а не просто вокруг цены улучшения.

## Что дальше

- балансировка урона и волн;
- визуальные эффекты способностей;
- отдельные анимации для красных, зелёных и синих синергий;
- проектирование трёхцветных башен.
EOF

git add -A
git commit -m "Добавить систему цветовых слияний"

npm run build
npm run lint

echo

echo "Готово. Ветка: $(git branch --show-current)"
echo "Теперь можно открыть localhost через npm run dev и проверить патч."
