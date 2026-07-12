export interface GridPoint {
  x: number;
  y: number;
}

export const BOARD_COLUMNS = 12;
export const BOARD_ROWS = 8;
export const STARTING_ENERGY = 180;
export const STARTING_BASE_HEALTH = 10;
export const TOTAL_WAVES = 5;
export const SPAWN_INTERVAL_MS = 650;
export const TICK_MS = 100;

export const BATTLE_PATH: readonly GridPoint[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 5, y: 2 },
  { x: 6, y: 2 },
  { x: 6, y: 3 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
  { x: 8, y: 4 },
  { x: 9, y: 4 },
  { x: 9, y: 3 },
  { x: 10, y: 3 },
  { x: 11, y: 3 },
];
