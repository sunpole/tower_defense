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
};

const BASE_DAMAGE_BY_ARCHETYPE: Record<EnemyArchetypeId, number> = {
  normal: 1,
  swift: 1,
  brute: 1,
  elite: 2,
  miniBoss: 3,
  boss: 5,
};

export function createEnemy(
  wave: number,
  spawnIndex: number,
  routeThreatMultiplier: number,
  routeRewardMultiplier: number,
): BattleEnemy {
  const plan = getWavePlan(wave);
  const sequence = getWaveSequence(plan);
  const archetype = sequence[Math.min(spawnIndex, sequence.length - 1)] ?? 'normal';
  const template = ENEMIES[TEMPLATE_BY_ARCHETYPE[archetype]];
  const hp = Math.round(template.hp * plan.hpMultiplier * routeThreatMultiplier);

  enemySequence += 1;

  return {
    ...template,
    instanceId: `enemy-${enemySequence}`,
    archetype,
    baseDamage: BASE_DAMAGE_BY_ARCHETYPE[archetype],
    hp,
    maxHp: hp,
    speed: Number((template.speed * plan.speedMultiplier).toFixed(3)),
    rewardEnergy: Math.round(
      template.rewardEnergy * plan.rewardMultiplier * routeRewardMultiplier,
    ),
    progress: 0,
  };
}
