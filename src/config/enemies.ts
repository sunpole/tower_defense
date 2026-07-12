import type { IEnemy } from '../types/Enemy';

export const ENEMIES: IEnemy[] = [
  {
    id: 1,
    name: 'Странник тьмы',
    color: '#f6c453',
    symbol: '◆',
    hp: 60,
    speed: 0.85,
    rewardEnergy: 16,
    currencyDrop: 1,
    dropChance: 0.15,
    description: 'Базовый враг первой игровой версии.',
  },
];
