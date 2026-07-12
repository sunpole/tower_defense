import type { Dispatch } from 'react';
import type { IEnemy } from './Enemy';
import type { IPlacedTower } from './Tower';

export interface BattleEnemy extends IEnemy {
  instanceId: string;
  maxHp: number;
  progress: number;
}

export interface BattleTower extends IPlacedTower {
  instanceId: string;
  cooldownRemaining: number;
  investedEnergy: number;
}

export type BattleStatus = 'idle' | 'running' | 'victory' | 'defeat';

export interface BattleState {
  selectedTowerId: number;
  selectedPlacedTowerId: string | null;
  towers: BattleTower[];
  enemies: BattleEnemy[];
  energy: number;
  baseHealth: number;
  wave: number;
  status: BattleStatus;
  spawnRemaining: number;
  spawnCooldown: number;
  kills: number;
  message: string;
}

export type BattleAction =
  | { type: 'SELECT_TOWER'; towerId: number }
  | { type: 'SELECT_PLACED_TOWER'; instanceId: string }
  | { type: 'PLACE_TOWER'; x: number; y: number }
  | { type: 'UPGRADE_SELECTED_TOWER' }
  | { type: 'SELL_SELECTED_TOWER' }
  | { type: 'START_WAVE' }
  | { type: 'TICK'; delta: number }
  | { type: 'RESET' };

export type BattleDispatch = Dispatch<BattleAction>;
