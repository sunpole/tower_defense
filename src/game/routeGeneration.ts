import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  type GridPoint,
} from '../config/gameSettings';

export type RouteKind = 'short' | 'standard' | 'long';

export interface GeneratedRoute {
  seed: number;
  points: GridPoint[];
  length: number;
  turns: number;
  kind: RouteKind;
  label: string;
  threatMultiplier: number;
  rewardMultiplier: number;
}

interface RouteProfile {
  turnChance: number;
  maxVerticalStep: number;
}

const ROUTE_PROFILES: Record<RouteKind, RouteProfile> = {
  short: { turnChance: 0.34, maxVerticalStep: 1 },
  standard: { turnChance: 0.56, maxVerticalStep: 2 },
  long: { turnChance: 0.78, maxVerticalStep: 2 },
};

function mulberry32(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function pickRouteKind(random: () => number): RouteKind {
  const roll = random();
  if (roll < 0.24) return 'short';
  if (roll < 0.76) return 'standard';
  return 'long';
}

function buildRoute(seed: number, attempt: number) {
  const random = mulberry32((seed + attempt * 0x9e3779b9) >>> 0);
  const kind = pickRouteKind(random);
  const profile = ROUTE_PROFILES[kind];
  const minimumRow = 1;
  const maximumRow = BOARD_ROWS - 2;
  let currentRow = minimumRow + Math.floor(random() * (maximumRow - minimumRow + 1));
  let turns = 0;
  const points: GridPoint[] = [{ x: 0, y: currentRow }];

  for (let x = 1; x < BOARD_COLUMNS; x += 1) {
    let targetRow = currentRow;

    if (random() < profile.turnChance) {
      const direction = random() < 0.5 ? -1 : 1;
      const magnitude = 1 + Math.floor(random() * profile.maxVerticalStep);
      targetRow = clamp(currentRow + direction * magnitude, minimumRow, maximumRow);

      if (targetRow === currentRow) {
        targetRow = clamp(currentRow - direction, minimumRow, maximumRow);
      }
    }

    if (targetRow !== currentRow) {
      const direction = Math.sign(targetRow - currentRow);
      turns += 1;

      while (currentRow !== targetRow) {
        currentRow += direction;
        points.push({ x: x - 1, y: currentRow });
      }
    }

    points.push({ x, y: currentRow });
  }

  return { points, turns };
}

function classifyRoute(length: number): RouteKind {
  if (length <= 16) return 'short';
  if (length <= 22) return 'standard';
  return 'long';
}

function getRouteLabel(kind: RouteKind) {
  if (kind === 'short') return 'Быстрый проход';
  if (kind === 'long') return 'Извилистый путь';
  return 'Переменный маршрут';
}

export function createRouteSeed() {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function generateBattleRoute(seed = createRouteSeed()): GeneratedRoute {
  let generated = buildRoute(seed, 0);

  for (let attempt = 1; attempt < 12 && generated.points.length < 14; attempt += 1) {
    generated = buildRoute(seed, attempt);
  }

  const length = generated.points.length;
  const kind = classifyRoute(length);
  const normalizedLength = clamp((length - BOARD_COLUMNS) / 16, 0, 1);
  const threatMultiplier = Number((0.92 + normalizedLength * 0.23).toFixed(3));
  const rewardMultiplier = Number((0.97 + normalizedLength * 0.11).toFixed(3));

  return {
    seed,
    points: generated.points,
    length,
    turns: generated.turns,
    kind,
    label: getRouteLabel(kind),
    threatMultiplier,
    rewardMultiplier,
  };
}

export function getPathCellKeys(path: readonly GridPoint[]) {
  return new Set(path.map((point) => `${point.x}:${point.y}`));
}
