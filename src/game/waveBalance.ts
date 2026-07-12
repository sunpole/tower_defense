import type { EnemyArchetypeId } from '../types/Battle';

export type WaveThreat = 'Низкая' | 'Средняя' | 'Высокая' | 'Критическая';
export type BossWaveKind = 'none' | 'mini' | 'boss';

export interface WavePlan {
  wave: number;
  label: string;
  threat: WaveThreat;
  bossKind: BossWaveKind;
  hpMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  completionBonus: number;
  counts: Record<EnemyArchetypeId, number>;
}

const REGULAR_LABELS = [
  'Разведка',
  'Быстрый след',
  'Тяжёлый строй',
  'Разделённый натиск',
  'Давление разлома',
  'Смешанная орда',
  'Ломающий строй',
  'Двойная угроза',
];

const ARCHETYPE_ORDER: EnemyArchetypeId[] = [
  'normal',
  'swift',
  'normal',
  'brute',
  'normal',
  'elite',
];

function getBossKind(wave: number): BossWaveKind {
  if (wave % 10 === 0) return 'boss';
  if (wave % 10 === 5) return 'mini';
  return 'none';
}

function getThreat(wave: number, bossKind: BossWaveKind): WaveThreat {
  if (bossKind === 'boss' || wave >= 24) return 'Критическая';
  if (bossKind === 'mini' || wave >= 14) return 'Высокая';
  if (wave >= 5) return 'Средняя';
  return 'Низкая';
}

function getWaveLabel(wave: number, bossKind: BossWaveKind) {
  if (bossKind === 'boss') return `Владыка разлома · этап ${wave / 10}`;
  if (bossKind === 'mini') return `Предвестник бездны · этап ${Math.ceil(wave / 10)}`;
  return REGULAR_LABELS[(wave - 1) % REGULAR_LABELS.length];
}

export function getWavePlan(wave: number): WavePlan {
  const safeWave = Math.max(1, Math.min(30, wave));
  const bossKind = getBossKind(safeWave);
  const chapter = Math.floor((safeWave - 1) / 5);
  const isBossWave = bossKind !== 'none';

  const counts: Record<EnemyArchetypeId, number> = {
    normal: 5 + Math.floor(safeWave * (isBossWave ? 0.45 : 0.68)),
    swift: safeWave >= 2 ? Math.floor((safeWave + 1) / 3) : 0,
    brute: safeWave >= 3 ? Math.floor((safeWave + 1) / 4) : 0,
    elite: safeWave >= 6 ? Math.floor((safeWave - 1) / 7) : 0,
    miniBoss: bossKind === 'mini' ? 1 : 0,
    boss: bossKind === 'boss' ? 1 : 0,
  };

  if (bossKind === 'boss') {
    counts.swift = Math.max(2, Math.floor(counts.swift * 0.65));
    counts.brute = Math.max(2, Math.floor(counts.brute * 0.7));
  }

  const hpMultiplier = Number((1 + (safeWave - 1) * 0.155 + chapter * 0.16).toFixed(3));
  const speedMultiplier = Number((1 + Math.min(0.38, (safeWave - 1) * 0.012)).toFixed(3));
  const rewardMultiplier = Number((1 + Math.min(0.82, (safeWave - 1) * 0.022)).toFixed(3));
  const completionBonus = bossKind === 'boss'
    ? 80 + safeWave * 3
    : bossKind === 'mini'
      ? 48 + safeWave * 2
      : 14 + Math.floor(safeWave * 1.7);

  return {
    wave: safeWave,
    label: getWaveLabel(safeWave, bossKind),
    threat: getThreat(safeWave, bossKind),
    bossKind,
    hpMultiplier,
    speedMultiplier,
    rewardMultiplier,
    completionBonus,
    counts,
  };
}

export function getWaveEnemyCount(plan: WavePlan) {
  return Object.values(plan.counts).reduce((total, count) => total + count, 0);
}

export function getWaveSequence(plan: WavePlan): EnemyArchetypeId[] {
  const remaining = {
    normal: plan.counts.normal,
    swift: plan.counts.swift,
    brute: plan.counts.brute,
    elite: plan.counts.elite,
  };
  const sequence: EnemyArchetypeId[] = [];

  while (Object.values(remaining).some((count) => count > 0)) {
    for (const archetype of ARCHETYPE_ORDER) {
      if (archetype in remaining) {
        const key = archetype as keyof typeof remaining;
        if (remaining[key] > 0) {
          sequence.push(archetype);
          remaining[key] -= 1;
        }
      }
    }
  }

  if (plan.counts.miniBoss > 0) sequence.push('miniBoss');
  if (plan.counts.boss > 0) sequence.push('boss');

  return sequence;
}

export function formatWaveComposition(plan: WavePlan) {
  const parts = [
    plan.counts.normal > 0 ? `обычных ${plan.counts.normal}` : null,
    plan.counts.swift > 0 ? `быстрых ${plan.counts.swift}` : null,
    plan.counts.brute > 0 ? `тяжёлых ${plan.counts.brute}` : null,
    plan.counts.elite > 0 ? `стражей ${plan.counts.elite}` : null,
    plan.counts.miniBoss > 0 ? 'мини-босс 1' : null,
    plan.counts.boss > 0 ? 'БОЛЬШОЙ БОСС 1' : null,
  ].filter(Boolean);

  return parts.join(' · ');
}
