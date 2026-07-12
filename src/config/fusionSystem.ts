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
