import type { EnemyArchetypeId } from '../types/Battle';

export type WaveThreat = 'Низкая' | 'Средняя' | 'Высокая' | 'Критическая';
export type BossWaveKind = 'none' | 'mini' | 'boss';

export interface WaveSpawnDefinition {
  archetype: EnemyArchetypeId;
  cubeFace?: number;
}

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
  cubeFaces: number[];
  routeSeed: number;
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

function createRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function getCubeFacesForWave(wave: number, routeSeed: number) {
  const blockIndex = Math.floor((wave - 1) / 5);
  const blockStart = blockIndex * 5 + 1;
  const random = createRandom((routeSeed ^ ((blockIndex + 1) * 0x9e3779b9)) >>> 0);
  const totalCubes = 3 + Math.floor(random() * 8);
  const waves: number[][] = Array.from({ length: 5 }, () => []);

  for (let index = 0; index < totalCubes; index += 1) {
    const targetWaveIndex = Math.floor(random() * 5);
    const face = 1 + Math.floor(random() * 6);
    waves[targetWaveIndex].push(face);
  }

  return waves[wave - blockStart] ?? [];
}

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

export function getWavePlan(wave: number, routeSeed = 1): WavePlan {
  const safeWave = Math.max(1, Math.min(30, wave));
  const bossKind = getBossKind(safeWave);
  const chapter = Math.floor((safeWave - 1) / 5);
  const isBossWave = bossKind !== 'none';
  const cubeFaces = getCubeFacesForWave(safeWave, routeSeed);

  const counts: Record<EnemyArchetypeId, number> = {
    normal: 5 + Math.floor(safeWave * (isBossWave ? 0.45 : 0.68)),
    swift: safeWave >= 2 ? Math.floor((safeWave + 1) / 3) : 0,
    brute: safeWave >= 3 ? Math.floor((safeWave + 1) / 4) : 0,
    elite: safeWave >= 6 ? Math.floor((safeWave - 1) / 7) : 0,
    cube: cubeFaces.length,
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
    cubeFaces,
    routeSeed,
  };
}

export function getWaveEnemyCount(plan: WavePlan) {
  return Object.values(plan.counts).reduce((total, count) => total + count, 0);
}

export function getVisibleWaveEnemyCount(plan: WavePlan) {
  return getWaveEnemyCount(plan) - plan.counts.cube;
}

export function getWaveSequence(plan: WavePlan): WaveSpawnDefinition[] {
  const remaining = {
    normal: plan.counts.normal,
    swift: plan.counts.swift,
    brute: plan.counts.brute,
    elite: plan.counts.elite,
  };
  const sequence: WaveSpawnDefinition[] = [];

  while (Object.values(remaining).some((count) => count > 0)) {
    for (const archetype of ARCHETYPE_ORDER) {
      if (archetype in remaining) {
        const key = archetype as keyof typeof remaining;
        if (remaining[key] > 0) {
          sequence.push({ archetype });
          remaining[key] -= 1;
        }
      }
    }
  }

  const random = createRandom((plan.routeSeed ^ (plan.wave * 0x85ebca6b)) >>> 0);

  plan.cubeFaces.forEach((cubeFace) => {
    const insertionIndex = Math.floor(random() * (sequence.length + 1));
    sequence.splice(insertionIndex, 0, { archetype: 'cube', cubeFace });
  });

  if (plan.counts.miniBoss > 0) sequence.push({ archetype: 'miniBoss' });
  if (plan.counts.boss > 0) sequence.push({ archetype: 'boss' });

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
