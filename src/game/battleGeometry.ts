import {
  BATTLE_PATH,
  BOARD_COLUMNS,
  BOARD_ROWS,
} from '../config/gameSettings';
import type { BattleEnemy, BattleTower } from '../types/Battle';

export const PATH_CELL_KEYS = new Set(
  BATTLE_PATH.map((point) => `${point.x}:${point.y}`),
);

export function getPathPosition(progress: number) {
  const finalIndex = BATTLE_PATH.length - 1;
  const segmentIndex = Math.min(Math.floor(progress), finalIndex - 1);
  const localProgress = progress - segmentIndex;
  const start = BATTLE_PATH[segmentIndex];
  const end = BATTLE_PATH[segmentIndex + 1];

  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
  };
}

export function getDistance(
  tower: Pick<BattleTower, 'x' | 'y'>,
  enemy: BattleEnemy,
) {
  const position = getPathPosition(enemy.progress);
  return Math.hypot(tower.x - position.x, tower.y - position.y);
}

export function getEntityPosition(x: number, y: number) {
  return {
    left: `${((x + 0.5) / BOARD_COLUMNS) * 100}%`,
    top: `${((y + 0.5) / BOARD_ROWS) * 100}%`,
  };
}
