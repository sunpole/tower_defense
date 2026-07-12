export type EnemyArchetypeId = 'normal' | 'swift' | 'brute' | 'elite';

export interface WavePlan {
  wave: number;
  label: string;
  threat: 'Низкая' | 'Средняя' | 'Высокая' | 'Критическая';
  hpMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  completionBonus: number;
  counts: Record<EnemyArchetypeId, number>;
}

const WAVE_PLANS: WavePlan[] = [
  {
    wave: 1,
    label: 'Разведка',
    threat: 'Низкая',
    hpMultiplier: 1,
    speedMultiplier: 1,
    rewardMultiplier: 1,
    completionBonus: 15,
    counts: { normal: 6, swift: 0, brute: 0, elite: 0 },
  },
  {
    wave: 2,
    label: 'Первый натиск',
    threat: 'Средняя',
    hpMultiplier: 1.1,
    speedMultiplier: 1.02,
    rewardMultiplier: 1.03,
    completionBonus: 15,
    counts: { normal: 6, swift: 2, brute: 0, elite: 0 },
  },
  {
    wave: 3,
    label: 'Тяжёлый след',
    threat: 'Средняя',
    hpMultiplier: 1.25,
    speedMultiplier: 1.04,
    rewardMultiplier: 1.06,
    completionBonus: 16,
    counts: { normal: 7, swift: 2, brute: 1, elite: 0 },
  },
  {
    wave: 4,
    label: 'Разделённый строй',
    threat: 'Высокая',
    hpMultiplier: 1.45,
    speedMultiplier: 1.06,
    rewardMultiplier: 1.09,
    completionBonus: 17,
    counts: { normal: 7, swift: 3, brute: 2, elite: 0 },
  },
  {
    wave: 5,
    label: 'Первый страж',
    threat: 'Высокая',
    hpMultiplier: 1.7,
    speedMultiplier: 1.08,
    rewardMultiplier: 1.12,
    completionBonus: 18,
    counts: { normal: 8, swift: 3, brute: 2, elite: 1 },
  },
  {
    wave: 6,
    label: 'Давление',
    threat: 'Высокая',
    hpMultiplier: 2,
    speedMultiplier: 1.1,
    rewardMultiplier: 1.15,
    completionBonus: 19,
    counts: { normal: 8, swift: 4, brute: 3, elite: 1 },
  },
  {
    wave: 7,
    label: 'Ломающий строй',
    threat: 'Высокая',
    hpMultiplier: 2.35,
    speedMultiplier: 1.12,
    rewardMultiplier: 1.18,
    completionBonus: 20,
    counts: { normal: 9, swift: 4, brute: 4, elite: 1 },
  },
  {
    wave: 8,
    label: 'Двойная угроза',
    threat: 'Критическая',
    hpMultiplier: 2.75,
    speedMultiplier: 1.14,
    rewardMultiplier: 1.21,
    completionBonus: 21,
    counts: { normal: 9, swift: 5, brute: 4, elite: 2 },
  },
  {
    wave: 9,
    label: 'Последний рубеж',
    threat: 'Критическая',
    hpMultiplier: 3.2,
    speedMultiplier: 1.16,
    rewardMultiplier: 1.24,
    completionBonus: 22,
    counts: { normal: 10, swift: 5, brute: 5, elite: 2 },
  },
  {
    wave: 10,
    label: 'Цветовой шторм',
    threat: 'Критическая',
    hpMultiplier: 3.75,
    speedMultiplier: 1.18,
    rewardMultiplier: 1.27,
    completionBonus: 0,
    counts: { normal: 10, swift: 6, brute: 6, elite: 2 },
  },
];

const ARCHETYPE_ORDER: EnemyArchetypeId[] = ['normal', 'swift', 'normal', 'brute', 'normal', 'elite'];

export function getWavePlan(wave: number): WavePlan {
  return WAVE_PLANS[Math.max(0, Math.min(WAVE_PLANS.length - 1, wave - 1))];
}

export function getWaveEnemyCount(plan: WavePlan) {
  return Object.values(plan.counts).reduce((total, count) => total + count, 0);
}

export function getWaveSequence(plan: WavePlan): EnemyArchetypeId[] {
  const remaining = { ...plan.counts };
  const sequence: EnemyArchetypeId[] = [];

  while (Object.values(remaining).some((count) => count > 0)) {
    for (const archetype of ARCHETYPE_ORDER) {
      if (remaining[archetype] > 0) {
        sequence.push(archetype);
        remaining[archetype] -= 1;
      }
    }
  }

  return sequence;
}

export function formatWaveComposition(plan: WavePlan) {
  const parts = [
    plan.counts.normal > 0 ? `обычных ${plan.counts.normal}` : null,
    plan.counts.swift > 0 ? `быстрых ${plan.counts.swift}` : null,
    plan.counts.brute > 0 ? `тяжёлых ${plan.counts.brute}` : null,
    plan.counts.elite > 0 ? `стражей ${plan.counts.elite}` : null,
  ].filter(Boolean);

  return parts.join(' · ');
}
