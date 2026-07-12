import { ENEMIES } from '../config/enemies';
import type { BattleEnemy, EnemyArchetypeId } from '../types/Battle';
import {
  getWavePlan,
  getWaveSequence,
} from './waveBalance';

let enemySequence = 0;

const TEMPLATE_BY_ARCHETYPE: Record<EnemyArchetypeId, number> = {
  normal: 0,
  swift: 1,
  brute: 2,
  elite: 3,
  miniBoss: 4,
  boss: 5,
  cube: 6,
};

const BASE_DAMAGE_BY_ARCHETYPE: Record<EnemyArchetypeId, number> = {
  normal: 1,
  swift: 1,
  brute: 1,
  elite: 2,
  cube: 0,
  miniBoss: 3,
  boss: 5,
};

const CUBE_SYMBOLS = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function createEnemy(
  wave: number,
  spawnIndex: number,
  routeThreatMultiplier: number,
  routeRewardMultiplier: number,
  routeSeed: number,
): BattleEnemy {
  const plan = getWavePlan(wave, routeSeed);
  const sequence = getWaveSequence(plan);
  const spawn = sequence[Math.min(spawnIndex, sequence.length - 1)] ?? { archetype: 'normal' as const };
  const archetype = spawn.archetype;
  const template = ENEMIES[TEMPLATE_BY_ARCHETYPE[archetype]];
  const cubeFace = archetype === 'cube' ? Math.max(1, Math.min(6, spawn.cubeFace ?? 1)) : undefined;
  const baseHp = cubeFace ? 48 + cubeFace * 24 : template.hp;
  const hp = Math.round(baseHp * plan.hpMultiplier * routeThreatMultiplier);
  const baseSpeed = cubeFace ? 0.68 + cubeFace * 0.12 : template.speed;

  enemySequence += 1;

  return {
    ...template,
    instanceId: `enemy-${enemySequence}`,
    archetype,
    baseDamage: BASE_DAMAGE_BY_ARCHETYPE[archetype],
    name: cubeFace ? `Кубик судьбы · ${cubeFace}` : template.name,
    symbol: cubeFace ? CUBE_SYMBOLS[cubeFace - 1] : template.symbol,
    color: cubeFace ? '#ffffff' : template.color,
    hp,
    maxHp: hp,
    speed: Number((baseSpeed * plan.speedMultiplier).toFixed(3)),
    rewardEnergy: cubeFace
      ? 0
      : Math.round(
          template.rewardEnergy * plan.rewardMultiplier * routeRewardMultiplier,
        ),
    progress: 0,
    cubeFace,
    fusionPointReward: cubeFace ?? 0,
  };
}
