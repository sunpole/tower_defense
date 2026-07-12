import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  type GridPoint,
} from '../config/gameSettings';
import { generateBattleRoute } from './routeGeneration';
import { getWavePlan } from './waveBalance';

export interface BalanceDiagnosticsResult {
  passed: boolean;
  checkedRoutes: number;
  errors: string[];
}

function pointKey(point: GridPoint) {
  return `${point.x}:${point.y}`;
}

function validateRoute(seed: number) {
  const route = generateBattleRoute(seed);
  const errors: string[] = [];
  const pointIndexes = new Map<string, number>();

  if (route.points[0]?.x !== 0) {
    errors.push(`seed ${seed}: путь не начинается слева`);
  }

  if (route.points.at(-1)?.x !== BOARD_COLUMNS - 1) {
    errors.push(`seed ${seed}: путь не заканчивается справа`);
  }

  route.points.forEach((point, index) => {
    const key = pointKey(point);
    if (pointIndexes.has(key)) {
      errors.push(`seed ${seed}: повтор клетки ${key}`);
    }
    pointIndexes.set(key, index);
  });

  for (let index = 1; index < route.points.length; index += 1) {
    const previous = route.points[index - 1];
    const current = route.points[index];
    const distance = Math.abs(previous.x - current.x) + Math.abs(previous.y - current.y);

    if (distance !== 1) {
      errors.push(`seed ${seed}: разрыв между клетками ${index} и ${index + 1}`);
      break;
    }
  }

  const offsets = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  route.points.forEach((point, index) => {
    offsets.forEach((offset) => {
      const touchingIndex = pointIndexes.get(
        pointKey({ x: point.x + offset.x, y: point.y + offset.y }),
      );

      if (touchingIndex !== undefined && Math.abs(touchingIndex - index) > 1) {
        errors.push(`seed ${seed}: дорога касается сама себя возле ${pointKey(point)}`);
      }
    });
  });

  const freeCells = BOARD_COLUMNS * BOARD_ROWS - route.points.length;
  if (freeCells < 56) {
    errors.push(`seed ${seed}: осталось только ${freeCells} клеток для строительства`);
  }

  return errors;
}

function validateCubeBlocks(routeSeed: number) {
  const errors: string[] = [];

  for (let blockStart = 1; blockStart <= 26; blockStart += 5) {
    const plans = Array.from({ length: 5 }, (_, index) =>
      getWavePlan(blockStart + index, routeSeed),
    );
    const faces = plans.flatMap((plan) => plan.cubeFaces);

    if (faces.length < 3 || faces.length > 10) {
      errors.push(
        `seed ${routeSeed}, волны ${blockStart}–${blockStart + 4}: кубиков ${faces.length}, ожидалось 3–10`,
      );
    }

    if (faces.some((face) => face < 1 || face > 6)) {
      errors.push(
        `seed ${routeSeed}, волны ${blockStart}–${blockStart + 4}: найдена недопустимая грань`,
      );
    }
  }

  return errors;
}

export function runBalanceDiagnostics(sampleCount = 500): BalanceDiagnosticsResult {
  const errors: string[] = [];

  for (let seed = 1; seed <= sampleCount; seed += 1) {
    errors.push(...validateRoute(seed));
    errors.push(...validateCubeBlocks(seed));
    if (errors.length >= 8) break;
  }

  const miniBossWaves = [5, 15, 25];
  const bossWaves = [10, 20, 30];

  miniBossWaves.forEach((wave) => {
    if (getWavePlan(wave).counts.miniBoss !== 1) {
      errors.push(`волна ${wave}: отсутствует мини-босс`);
    }
  });

  bossWaves.forEach((wave) => {
    if (getWavePlan(wave).counts.boss !== 1) {
      errors.push(`волна ${wave}: отсутствует большой босс`);
    }
  });

  return {
    passed: errors.length === 0,
    checkedRoutes: sampleCount,
    errors: errors.slice(0, 8),
  };
}
