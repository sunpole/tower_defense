import type { Dispatch } from 'react';
import {
  STARTING_BASE_HEALTH,
  TOTAL_WAVES,
} from '../config/gameSettings';
import type { BattleAction, BattleState } from '../types/Battle';
import {
  battleReducer,
  createInitialBattleState,
} from './battleReducer';

export type GameSpeed = 1 | 2 | 4;

export interface BalanceBattleState extends BattleState {
  gameSpeed: GameSpeed;
  isPaused: boolean;
  autoStart: boolean;
  elapsedMs: number;
  placements: number;
  fusions: number;
  miniBossKills: number;
  bossKills: number;
  sessionId: string;
}

export type BalanceAction =
  | BattleAction
  | { type: 'BALANCE_TICK'; realDelta: number }
  | { type: 'SET_GAME_SPEED'; speed: GameSpeed }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TOGGLE_AUTO_START' }
  | { type: 'RESTART_SAME_ROUTE' }
  | { type: 'DEBUG_SET_NEXT_WAVE'; wave: number }
  | { type: 'DEBUG_ADD_ENERGY'; amount: number }
  | { type: 'DEBUG_RESTORE_BASE' };

export type BalanceDispatch = Dispatch<BalanceAction>;

function createSessionId(routeSeed: number) {
  return `${Date.now()}-${routeSeed}`;
}

export function createBalanceInitialState(
  selectedTowerId?: number,
  routeSeed?: number,
): BalanceBattleState {
  const base = createInitialBattleState(selectedTowerId, routeSeed);

  return {
    ...base,
    gameSpeed: 1,
    isPaused: false,
    autoStart: false,
    elapsedMs: 0,
    placements: 0,
    fusions: 0,
    miniBossKills: 0,
    bossKills: 0,
    sessionId: createSessionId(base.routeSeed),
  };
}

function mergeBaseState(
  previous: BalanceBattleState,
  next: BattleState,
): BalanceBattleState {
  return {
    ...previous,
    ...next,
  };
}

function countDefeatedBosses(
  previous: BalanceBattleState,
  next: BattleState,
  scaledDelta: number,
) {
  const nextEnemyIds = new Set(next.enemies.map((enemy) => enemy.instanceId));
  let miniBossKills = 0;
  let bossKills = 0;

  for (const enemy of previous.enemies) {
    if (
      (enemy.archetype !== 'miniBoss' && enemy.archetype !== 'boss') ||
      nextEnemyIds.has(enemy.instanceId)
    ) {
      continue;
    }

    const escaped =
      enemy.progress + enemy.speed * (scaledDelta / 1000) >=
      previous.route.length - 1;

    if (escaped) {
      continue;
    }

    if (enemy.archetype === 'miniBoss') miniBossKills += 1;
    if (enemy.archetype === 'boss') bossKills += 1;
  }

  return { miniBossKills, bossKills };
}

function runBalanceTick(
  state: BalanceBattleState,
  realDelta: number,
): BalanceBattleState {
  if (state.isPaused || state.status !== 'running') {
    return state;
  }

  const scaledDelta = realDelta * state.gameSpeed;
  const nextBase = battleReducer(state, {
    type: 'TICK',
    delta: scaledDelta,
  });
  const defeatedBosses = countDefeatedBosses(state, nextBase, scaledDelta);
  let next = mergeBaseState(state, nextBase);

  next = {
    ...next,
    elapsedMs: state.elapsedMs + realDelta,
    miniBossKills: state.miniBossKills + defeatedBosses.miniBossKills,
    bossKills: state.bossKills + defeatedBosses.bossKills,
  };

  if (
    state.status === 'running' &&
    next.status === 'idle' &&
    next.autoStart &&
    next.wave < TOTAL_WAVES
  ) {
    next = mergeBaseState(
      next,
      battleReducer(next, { type: 'START_WAVE' }),
    );
    next.message = `Автозапуск: началась волна ${next.wave}.`;
  }

  return next;
}

export function balanceLabReducer(
  state: BalanceBattleState,
  action: BalanceAction,
): BalanceBattleState {
  switch (action.type) {
    case 'BALANCE_TICK':
      return runBalanceTick(state, action.realDelta);

    case 'SET_GAME_SPEED':
      return {
        ...state,
        gameSpeed: action.speed,
        message: `Скорость боя: ×${action.speed}.`,
      };

    case 'TOGGLE_PAUSE':
      if (state.status !== 'running') return state;
      return {
        ...state,
        isPaused: !state.isPaused,
        message: state.isPaused ? 'Бой продолжен.' : 'Бой поставлен на паузу.',
      };

    case 'TOGGLE_AUTO_START':
      return {
        ...state,
        autoStart: !state.autoStart,
        message: state.autoStart
          ? 'Автозапуск волн выключен.'
          : 'Автозапуск волн включён.',
      };

    case 'RESTART_SAME_ROUTE':
      return createBalanceInitialState(state.selectedTowerId, state.routeSeed);

    case 'RESET':
      return createBalanceInitialState(state.selectedTowerId);

    case 'DEBUG_SET_NEXT_WAVE': {
      if (state.status === 'running') return state;
      const targetWave = Math.max(1, Math.min(TOTAL_WAVES, action.wave));

      return {
        ...state,
        wave: targetWave - 1,
        status: 'idle',
        enemies: [],
        effects: [],
        spawnRemaining: 0,
        spawnCooldown: 0,
        isPaused: false,
        message: `Debug: следующей будет волна ${targetWave}.`,
      };
    }

    case 'DEBUG_ADD_ENERGY':
      return {
        ...state,
        energy: state.energy + Math.max(0, action.amount),
        message: `Debug: добавлено ${Math.max(0, action.amount)} энергии.`,
      };

    case 'DEBUG_RESTORE_BASE':
      return {
        ...state,
        baseHealth: STARTING_BASE_HEALTH,
        message: 'Debug: здоровье базы восстановлено.',
      };

    default: {
      const nextBase = battleReducer(state, action as BattleAction);
      const next = mergeBaseState(state, nextBase);
      const placementSucceeded =
        action.type === 'PLACE_TOWER' &&
        next.towers.length > state.towers.length;
      const fusionSucceeded =
        action.type === 'FUSE_WITH_TOWER' &&
        next.towers.length < state.towers.length &&
        next.energy < state.energy;

      return {
        ...next,
        placements: state.placements + (placementSucceeded ? 1 : 0),
        fusions: state.fusions + (fusionSucceeded ? 1 : 0),
      };
    }
  }
}
