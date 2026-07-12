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
  minimumStraightColumns: number;
}

interface RouteCandidate {
  points: GridPoint[];
  turns: number;
}

const ROUTE_PROFILES: Record<RouteKind, RouteProfile> = {
  short: {
    turnChance: 0.28,
    maxVerticalStep: 2,
    minimumStraightColumns: 3,
  },
  standard: {
    turnChance: 0.46,
    maxVerticalStep: 3,
    minimumStraightColumns: 2,
  },
  long: {
    turnChance: 0.64,
    maxVerticalStep: 3,
    minimumStraightColumns: 2,
  },
};

const ORTHOGONAL_OFFSETS: readonly GridPoint[] = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

const FALLBACK_ROUTE: readonly GridPoint[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 2, y: 2 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 1 },
  { x: 5, y: 1 },
  { x: 5, y: 2 },
  { x: 5, y: 3 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
  { x: 8, y: 4 },
  { x: 8, y: 5 },
  { x: 8, y: 6 },
  { x: 9, y: 6 },
  { x: 10, y: 6 },
  { x: 11, y: 6 },
];

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

function pointKey(point: GridPoint) {
  return `${point.x}:${point.y}`;
}

function pickRouteKind(random: () => number): RouteKind {
  const roll = random();
  if (roll < 0.24) return 'short';
  if (roll < 0.76) return 'standard';
  return 'long';
}

function isOneCellWideRoute(points: readonly GridPoint[]) {
  const pointIndexes = new Map(
    points.map((point, index) => [pointKey(point), index]),
  );

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];

    for (const offset of ORTHOGONAL_OFFSETS) {
      const touchingIndex = pointIndexes.get(
        pointKey({ x: point.x + offset.x, y: point.y + offset.y }),
      );

      if (
        touchingIndex !== undefined &&
        Math.abs(touchingIndex - index) > 1
      ) {
        return false;
      }
    }
  }

  return true;
}

function countRouteTurns(points: readonly GridPoint[]) {
  let turns = 0;

  for (let index = 2; index < points.length; index += 1) {
    const previous = points[index - 1];
    const beforePrevious = points[index - 2];
    const current = points[index];
    const previousDirection = {
      x: previous.x - beforePrevious.x,
      y: previous.y - beforePrevious.y,
    };
    const currentDirection = {
      x: current.x - previous.x,
      y: current.y - previous.y,
    };

    if (
      previousDirection.x !== currentDirection.x ||
      previousDirection.y !== currentDirection.y
    ) {
      turns += 1;
    }
  }

  return turns;
}

function buildRoute(seed: number, attempt: number): RouteCandidate {
  const random = mulberry32((seed + attempt * 0x9e3779b9) >>> 0);
  const kind = pickRouteKind(random);
  const profile = ROUTE_PROFILES[kind];
  const minimumRow = 1;
  const maximumRow = BOARD_ROWS - 2;
  let currentRow = minimumRow + Math.floor(random() * (maximumRow - minimumRow + 1));
  let lastVerticalColumn = -profile.minimumStraightColumns;
  const points: GridPoint[] = [{ x: 0, y: currentRow }];

  for (let x = 1; x < BOARD_COLUMNS; x += 1) {
    let targetRow = currentRow;
    const verticalColumn = x - 1;
    const hasStraightClearance =
      verticalColumn - lastVerticalColumn >= profile.minimumStraightColumns;

    if (hasStraightClearance && random() < profile.turnChance) {
      const direction = random() < 0.5 ? -1 : 1;
      const magnitude = 1 + Math.floor(random() * profile.maxVerticalStep);
      targetRow = clamp(currentRow + direction * magnitude, minimumRow, maximumRow);

      if (targetRow === currentRow) {
        targetRow = clamp(currentRow - direction, minimumRow, maximumRow);
      }
    }

    if (targetRow !== currentRow) {
      const direction = Math.sign(targetRow - currentRow);

      while (currentRow !== targetRow) {
        currentRow += direction;
        points.push({ x: verticalColumn, y: currentRow });
      }

      lastVerticalColumn = verticalColumn;
    }

    points.push({ x, y: currentRow });
  }

  return {
    points,
    turns: countRouteTurns(points),
  };
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
  let generated: RouteCandidate | null = null;
  let bestValidCandidate: RouteCandidate | null = null;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidate = buildRoute(seed, attempt);

    if (!isOneCellWideRoute(candidate.points)) {
      continue;
    }

    if (
      bestValidCandidate === null ||
      candidate.points.length > bestValidCandidate.points.length
    ) {
      bestValidCandidate = candidate;
    }

    if (candidate.points.length >= 14) {
      generated = candidate;
      break;
    }
  }

  if (generated === null) {
    generated = bestValidCandidate ?? {
      points: [...FALLBACK_ROUTE],
      turns: countRouteTurns(FALLBACK_ROUTE),
    };
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
  return new Set(path.map((point) => pointKey(point)));
}
