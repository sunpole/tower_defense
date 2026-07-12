import { ENEMIES } from '../config/enemies';
import type { BattleEnemy } from '../types/Battle';

let enemySequence = 0;

export function createEnemy(wave: number): BattleEnemy {
  const template = ENEMIES[0];
  const hpMultiplier = 1 + (wave - 1) * 0.28;
  const speedMultiplier = 1 + (wave - 1) * 0.05;
  const hp = Math.round(template.hp * hpMultiplier);

  enemySequence += 1;

  return {
    ...template,
    instanceId: `enemy-${enemySequence}`,
    hp,
    maxHp: hp,
    speed: template.speed * speedMultiplier,
    rewardEnergy: template.rewardEnergy + (wave - 1) * 2,
    progress: 0,
  };
}
