import type { Dispatch } from 'react';
import type { FusionAbility, FusionComposition, FusionRarityId } from '../config/fusionSystem';
import type { IEnemy } from './Enemy';
import type { IPlacedTower } from './Tower';

export type EnemyArchetypeId = 'normal' | 'swift' | 'brute' | 'elite';
export type BattleEffectKind = 'projectile' | 'laser' | 'aura';

export interface BattleEnemy extends IEnemy {
  instanceId: string;
  archetype: EnemyArchetypeId;
  baseDamage: number;
  maxHp: number;
  progress: number;
}

export interface BattleEffect {
  id: string;
  kind: BattleEffectKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  ttl: number;
  radius?: number;
  label?: string;
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
  effects: BattleEffect[];
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
