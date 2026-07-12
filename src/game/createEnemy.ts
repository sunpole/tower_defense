import { ENEMIES } from '../config/enemies';
import type { BattleEnemy } from '../types/Battle';
import {
  getWavePlan,
  getWaveSequence,
  type EnemyArchetypeId,
} from './waveBalance';

let enemySequence = 0;

const TEMPLATE_BY_ARCHETYPE: Record<EnemyArchetypeId, number> = {
  normal: 0,
  swift: 1,
  brute: 2,
  elite: 3,
};

export function createEnemy(wave: number, spawnIndex: number): BattleEnemy {
  const plan = getWavePlan(wave);
  const sequence = getWaveSequence(plan);
  const archetype = sequence[Math.min(spawnIndex, sequence.length - 1)] ?? 'normal';
  const template = ENEMIES[TEMPLATE_BY_ARCHETYPE[archetype]];
  const hp = Math.round(template.hp * plan.hpMultiplier);

  enemySequence += 1;

  return {
    ...template,
    instanceId: `enemy-${enemySequence}`,
    archetype,
    baseDamage: archetype === 'elite' ? 2 : 1,
    hp,
    maxHp: hp,
    speed: Number((template.speed * plan.speedMultiplier).toFixed(3)),
    rewardEnergy: Math.round(template.rewardEnergy * plan.rewardMultiplier),
    progress: 0,
  };
}
