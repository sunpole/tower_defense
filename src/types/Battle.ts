import type { Dispatch } from 'react';
import type { FusionAbility, FusionComposition, FusionRarityId } from '../config/fusionSystem';
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
  composition: FusionComposition;
  fusionRarity: FusionRarityId;
  activeAbilityIds: string[];
  targetCount: number;
  ignoresRangeEvery: number;
  attackCounter: number;
}

export type BattleStatus = 'idle' | 'running' | 'victory' | 'defeat';

export interface BattleState {
  selectedTowerId: number;
  placingTowerId: number | null;
  selectedPlacedTowerId: string | null;
  fusionSourceTowerId: string | null;
  showFusionAtlas: boolean;
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
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PLACE_TOWER'; x: number; y: number }
  | { type: 'START_FUSION' }
  | { type: 'CANCEL_FUSION' }
  | { type: 'FUSE_WITH_TOWER'; instanceId: string }
  | { type: 'SELL_SELECTED_TOWER' }
  | { type: 'TOGGLE_FUSION_ATLAS' }
  | { type: 'START_WAVE' }
  | { type: 'TICK'; delta: number }
  | { type: 'RESET' };

export interface TowerInspectionData {
  tower: BattleTower;
  abilities: FusionAbility[];
  canStartFusion: boolean;
  isFusionSource: boolean;
}

export type BattleDispatch = Dispatch<BattleAction>;
