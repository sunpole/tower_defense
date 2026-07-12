import {
  BATTLE_PATH,
  SPAWN_INTERVAL_MS,
  STARTING_BASE_HEALTH,
  STARTING_ENERGY,
  TOTAL_WAVES,
} from '../config/gameSettings';
import { TOWERS } from '../config/towers';
import type {
  BattleAction,
  BattleEnemy,
  BattleState,
  BattleTower,
} from '../types/Battle';
import { getDistance, PATH_CELL_KEYS } from './battleGeometry';
import { createEnemy } from './createEnemy';
import {
  canFuseTowers,
  createBaseBattleTower,
  fuseTowers,
  getFusionCost,
} from './fusionLogic';

let towerSequence = 0;

export function createInitialBattleState(
  selectedTowerId = TOWERS[0]?.id ?? 1,
): BattleState {
  return {
    selectedTowerId,
    placingTowerId: null,
    selectedPlacedTowerId: null,
    fusionSourceTowerId: null,
    showFusionAtlas: false,
    towers: [],
    enemies: [],
    energy: STARTING_ENERGY,
    baseHealth: STARTING_BASE_HEALTH,
    wave: 0,
    status: 'idle',
    spawnRemaining: 0,
    spawnCooldown: 0,
    kills: 0,
    message: 'Нажмите на тип башни, затем на свободную клетку. Башни развиваются через слияние цветов.',
  };
}

function getSelectedTower(state: BattleState) {
  return state.towers.find((tower) => tower.instanceId === state.selectedPlacedTowerId) ?? null;
}

function applyDamage(target: BattleEnemy, damage: number) {
  target.hp -= damage;
}

function getTowerTargets(tower: BattleTower, enemies: BattleEnemy[]) {
  const canIgnoreRange =
    tower.ignoresRangeEvery > 0 &&
    tower.attackCounter > 0 &&
    tower.attackCounter % tower.ignoresRangeEvery === 0;

  const possibleTargets = enemies.filter((enemy) =>
    enemy.hp > 0 && (canIgnoreRange || getDistance(tower, enemy) <= tower.range),
  );

  return possibleTargets.sort((left, right) => right.progress - left.progress);
}

function attackWithTower(tower: BattleTower, enemies: BattleEnemy[]) {
  const targets = getTowerTargets(tower, enemies);

  if (targets.length === 0) {
    return tower;
  }

  const nextTower: BattleTower = {
    ...tower,
    attackCounter: tower.attackCounter + 1,
  };
  const abilityIds = new Set(nextTower.activeAbilityIds);
  const isAreaAttack = nextTower.attackType === 'aura' || abilityIds.has('blue-9-network');
  const targetLimit = isAreaAttack ? targets.length : Math.min(nextTower.targetCount, targets.length);
  const selectedTargets = targets.slice(0, targetLimit);

  selectedTargets.forEach((target, index) => {
    let damage = nextTower.damage;

    if (index > 0) {
      damage *= abilityIds.has('blue-8-chain') ? 0.55 : 0.42;
    }

    if (abilityIds.has('red-8-execute') && target.hp / target.maxHp <= 0.35) {
      damage *= 1.75;
    }

    if (abilityIds.has('red-7-critical') && nextTower.attackCounter % 4 === 0) {
      damage *= 2;
    }

    applyDamage(target, Math.round(damage));
  });

  if (abilityIds.has('green-5-double') && nextTower.attackCounter % 5 === 0 && selectedTargets[0]) {
    applyDamage(selectedTargets[0], Math.round(nextTower.damage * 0.55));
  }

  if (abilityIds.has('green-7-burst') && nextTower.attackCounter % 6 === 0) {
    selectedTargets.slice(0, 3).forEach((target) => applyDamage(target, Math.round(nextTower.damage * 0.45)));
  }

  const resetChance = abilityIds.has('green-8-reset') ? 0.22 : 0;
  const isReset = resetChance > 0 && Math.random() < resetChance;

  return {
    ...nextTower,
    cooldownRemaining: isReset ? Math.round(nextTower.cooldown * 0.22) : nextTower.cooldown,
  };
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  switch (action.type) {
    case 'SELECT_TOWER': {
      const isSameTower = state.placingTowerId === action.towerId;

      return {
        ...state,
        selectedTowerId: action.towerId,
        placingTowerId: isSameTower ? null : action.towerId,
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        message: isSameTower
          ? 'Режим установки выключен.'
          : 'Режим установки включён. Нажмите на свободную клетку.',
      };
    }

    case 'SELECT_PLACED_TOWER': {
      const tower = state.towers.find(
        (candidate) => candidate.instanceId === action.instanceId,
      );

      if (!tower) {
        return state;
      }

      return {
        ...state,
        placingTowerId: null,
        selectedPlacedTowerId: tower.instanceId,
        message: `${tower.name}. Вы можете начать слияние или продать башню.`,
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        placingTowerId: null,
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        message: 'Выделение снято.',
      };

    case 'PLACE_TOWER': {
      if (state.status === 'victory' || state.status === 'defeat') {
        return state;
      }

      const occupiedTower = state.towers.find((tower) => tower.x === action.x && tower.y === action.y);

      if (occupiedTower) {
        return battleReducer(state, {
          type: state.fusionSourceTowerId && state.fusionSourceTowerId !== occupiedTower.instanceId
            ? 'FUSE_WITH_TOWER'
            : 'SELECT_PLACED_TOWER',
          instanceId: occupiedTower.instanceId,
        } as BattleAction);
      }

      if (!state.placingTowerId) {
        return {
          ...state,
          selectedPlacedTowerId: null,
          fusionSourceTowerId: null,
          message: 'Пустая клетка. Чтобы поставить башню, сначала выберите цвет в арсенале.',
        };
      }

      if (PATH_CELL_KEYS.has(`${action.x}:${action.y}`)) {
        return { ...state, message: 'На дороге башню ставить нельзя.' };
      }

      const towerTemplate = TOWERS.find(
        (tower) => tower.id === state.placingTowerId,
      );

      if (!towerTemplate) {
        return { ...state, message: 'Не удалось найти выбранную башню.' };
      }

      if (state.energy < towerTemplate.placeCost) {
        return { ...state, message: 'Недостаточно энергии для установки башни.' };
      }

      towerSequence += 1;
      const instanceId = `tower-${towerSequence}`;
      const tower = createBaseBattleTower(towerTemplate, instanceId, action.x, action.y);

      return {
        ...state,
        towers: [...state.towers, tower],
        selectedPlacedTowerId: instanceId,
        fusionSourceTowerId: null,
        placingTowerId: null,
        energy: state.energy - towerTemplate.placeCost,
        message: `${tower.name} установлена. Режим установки выключен.`,
      };
    }

    case 'START_FUSION': {
      const selectedTower = getSelectedTower(state);

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      return {
        ...state,
        placingTowerId: null,
        fusionSourceTowerId: selectedTower.instanceId,
        message: 'Выберите вторую совместимую башню для слияния.',
      };
    }

    case 'CANCEL_FUSION':
      return {
        ...state,
        fusionSourceTowerId: null,
        message: 'Слияние отменено.',
      };

    case 'FUSE_WITH_TOWER': {
      const source = state.towers.find((tower) => tower.instanceId === state.fusionSourceTowerId);
      const target = state.towers.find((tower) => tower.instanceId === action.instanceId);

      if (!source || !target) {
        return { ...state, message: 'Для слияния нужны две выбранные башни.' };
      }

      if (!canFuseTowers(source, target)) {
        return {
          ...state,
          selectedPlacedTowerId: target.instanceId,
          message: 'Эти башни пока нельзя соединить. В v0.5.0 работают чистые пары и усиление гибрида чистым цветом.',
        };
      }

      const fusionCost = getFusionCost(source, target);

      if (state.energy < fusionCost) {
        return {
          ...state,
          selectedPlacedTowerId: source.instanceId,
          message: `Для слияния требуется ${fusionCost} энергии.`,
        };
      }

      const fusedTower = fuseTowers(source, target, fusionCost);

      if (!fusedTower) {
        return { ...state, message: 'Слияние не удалось.' };
      }

      return {
        ...state,
        towers: state.towers
          .filter((tower) => tower.instanceId !== source.instanceId && tower.instanceId !== target.instanceId)
          .concat(fusedTower),
        selectedPlacedTowerId: fusedTower.instanceId,
        fusionSourceTowerId: null,
        energy: state.energy - fusionCost,
        message: `Слияние завершено: ${fusedTower.name}.`,
      };
    }

    case 'SELL_SELECTED_TOWER': {
      const selectedTower = getSelectedTower(state);

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      const refund = Math.floor(selectedTower.investedEnergy * 0.6);

      return {
        ...state,
        towers: state.towers.filter((tower) => tower.instanceId !== selectedTower.instanceId),
        selectedPlacedTowerId: null,
        fusionSourceTowerId: null,
        energy: state.energy + refund,
        message: `${selectedTower.name} продана. Возвращено ${refund} энергии.`,
      };
    }

    case 'TOGGLE_FUSION_ATLAS':
      return {
        ...state,
        showFusionAtlas: !state.showFusionAtlas,
      };

    case 'START_WAVE': {
      if (state.status === 'running' || state.wave >= TOTAL_WAVES) {
        return state;
      }

      const nextWave = state.wave + 1;
      const enemyCount = 5 + (nextWave - 1) * 2;

      return {
        ...state,
        wave: nextWave,
        status: 'running',
        spawnRemaining: enemyCount,
        spawnCooldown: 0,
        message: `Волна ${nextWave} началась: врагов ${enemyCount}.`,
      };
    }

    case 'TICK': {
      if (state.status !== 'running') {
        return state;
      }

      let spawnRemaining = state.spawnRemaining;
      let spawnCooldown = state.spawnCooldown - action.delta;
      let enemies = state.enemies.map((enemy) => ({ ...enemy }));

      if (spawnRemaining > 0 && spawnCooldown <= 0) {
        enemies.push(createEnemy(state.wave));
        spawnRemaining -= 1;
        spawnCooldown += SPAWN_INTERVAL_MS;
      }

      let escapedEnemies = 0;

      enemies = enemies
        .map((enemy) => ({
          ...enemy,
          progress: enemy.progress + enemy.speed * (action.delta / 1000),
        }))
        .filter((enemy) => {
          const escaped = enemy.progress >= BATTLE_PATH.length - 1;
          if (escaped) {
            escapedEnemies += 1;
          }
          return !escaped;
        });

      const baseHealth = Math.max(0, state.baseHealth - escapedEnemies);

      if (baseHealth === 0) {
        return {
          ...state,
          enemies,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          status: 'defeat',
          message: 'Поражение: враги разрушили базу.',
        };
      }

      const towers = state.towers.map((tower) => ({
        ...tower,
        cooldownRemaining: Math.max(0, tower.cooldownRemaining - action.delta),
      }));

      const attackedTowers = towers.map((tower) =>
        tower.cooldownRemaining > 0 ? tower : attackWithTower(tower, enemies),
      );

      let energy = state.energy;
      let kills = state.kills;
      const survivors: BattleEnemy[] = [];

      for (const enemy of enemies) {
        if (enemy.hp <= 0) {
          energy += enemy.rewardEnergy;
          kills += 1;
        } else {
          survivors.push(enemy);
        }
      }

      if (spawnRemaining === 0 && survivors.length === 0) {
        if (state.wave >= TOTAL_WAVES) {
          return {
            ...state,
            towers: attackedTowers,
            enemies: [],
            energy,
            baseHealth,
            spawnRemaining,
            spawnCooldown,
            kills,
            status: 'victory',
            message: `Победа! Пройдено волн: ${TOTAL_WAVES}.`,
          };
        }

        return {
          ...state,
          towers: attackedTowers,
          enemies: [],
          energy: energy + 25,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          kills,
          status: 'idle',
          message: `Волна ${state.wave} завершена. Бонус: 25 энергии.`,
        };
      }

      return {
        ...state,
        towers: attackedTowers,
        enemies: survivors,
        energy,
        baseHealth,
        spawnRemaining,
        spawnCooldown,
        kills,
      };
    }

    case 'RESET':
      return createInitialBattleState(state.selectedTowerId);

    default:
      return state;
  }
}
