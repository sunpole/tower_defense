import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  type GridPoint,
} from '../config/gameSettings';
import type { BattleEnemy, BattleTower } from '../types/Battle';

export function getPathPosition(progress: number, path: readonly GridPoint[]) {
  if (path.length === 0) {
    return { x: 0, y: 0 };
  }

  if (path.length === 1) {
    return path[0];
  }

  const finalIndex = path.length - 1;
  const safeProgress = Math.max(0, Math.min(progress, finalIndex));
  const segmentIndex = Math.min(Math.floor(safeProgress), finalIndex - 1);
  const localProgress = safeProgress - segmentIndex;
  const start = path[segmentIndex];
  const end = path[segmentIndex + 1];

  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
  };
}

export function getDistance(
  tower: Pick<BattleTower, 'x' | 'y'>,
  enemy: BattleEnemy,
  path: readonly GridPoint[],
) {
  const position = getPathPosition(enemy.progress, path);
  return Math.hypot(tower.x - position.x, tower.y - position.y);
}

export function getEntityPosition(x: number, y: number) {
  return {
    left: `${((x + 0.5) / BOARD_COLUMNS) * 100}%`,
    top: `${((y + 0.5) / BOARD_ROWS) * 100}%`,
  };
}
