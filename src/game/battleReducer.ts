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
  getTowerSellRefund,
  getTowerUpgradeCost,
  upgradeTower,
} from './towerProgression';

let towerSequence = 0;

export function createInitialBattleState(
  selectedTowerId = TOWERS[0]?.id ?? 1,
): BattleState {
  return {
    selectedTowerId,
    placementMode: false,
    selectedPlacedTowerId: null,
    towers: [],
    enemies: [],
    energy: STARTING_ENERGY,
    baseHealth: STARTING_BASE_HEALTH,
    wave: 0,
    status: 'idle',
    spawnRemaining: 0,
    spawnCooldown: 0,
    kills: 0,
    message: 'Выберите тип башни в арсенале, затем нажмите на свободную клетку.',
  };
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  switch (action.type) {
    case 'SELECT_TOWER': {
      const isCancellingPlacement =
        state.placementMode && state.selectedTowerId === action.towerId;

      if (isCancellingPlacement) {
        return {
          ...state,
          placementMode: false,
          message: 'Установка отменена. Выберите башню на поле или тип в арсенале.',
        };
      }

      return {
        ...state,
        selectedTowerId: action.towerId,
        placementMode: true,
        selectedPlacedTowerId: null,
        message: 'Башня взята для установки. Нажмите на свободную клетку поля.',
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
        placementMode: false,
        selectedPlacedTowerId: tower.instanceId,
        message: `${tower.name}, уровень ${tower.level}. Доступны улучшение и продажа.`,
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        placementMode: false,
        selectedPlacedTowerId: null,
        message: 'Ничего не выбрано. Выберите башню на поле или тип в арсенале.',
      };

    case 'PLACE_TOWER': {
      if (state.status === 'victory' || state.status === 'defeat') {
        return state;
      }

      if (!state.placementMode) {
        return {
          ...state,
          selectedPlacedTowerId: null,
          message: 'Сначала выберите тип башни в арсенале.',
        };
      }

      if (PATH_CELL_KEYS.has(`${action.x}:${action.y}`)) {
        return { ...state, message: 'На дороге башню ставить нельзя.' };
      }

      if (state.towers.some((tower) => tower.x === action.x && tower.y === action.y)) {
        return { ...state, message: 'Эта клетка уже занята.' };
      }

      const towerTemplate = TOWERS.find(
        (tower) => tower.id === state.selectedTowerId,
      );

      if (!towerTemplate) {
        return { ...state, message: 'Не удалось найти выбранную башню.' };
      }

      if (state.energy < towerTemplate.placeCost) {
        return { ...state, message: 'Недостаточно энергии для установки башни.' };
      }

      towerSequence += 1;
      const instanceId = `tower-${towerSequence}`;

      const tower: BattleTower = {
        ...towerTemplate,
        instanceId,
        x: action.x,
        y: action.y,
        lastShot: 0,
        buffId: null,
        cooldownRemaining: 0,
        investedEnergy: towerTemplate.placeCost,
      };

      return {
        ...state,
        towers: [...state.towers, tower],
        placementMode: false,
        selectedPlacedTowerId: instanceId,
        energy: state.energy - towerTemplate.placeCost,
        message: `${towerTemplate.name} установлена и выбрана. Режим установки выключен.`,
      };
    }

    case 'UPGRADE_SELECTED_TOWER': {
      const selectedTower = state.towers.find(
        (tower) => tower.instanceId === state.selectedPlacedTowerId,
      );

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      const upgradeCost = getTowerUpgradeCost(selectedTower);

      if (upgradeCost === null) {
        return { ...state, message: 'Эта башня уже достигла максимального уровня.' };
      }

      if (state.energy < upgradeCost) {
        return {
          ...state,
          message: `Для улучшения требуется ${upgradeCost} энергии.`,
        };
      }

      const upgradedTower = upgradeTower(selectedTower, upgradeCost);

      return {
        ...state,
        towers: state.towers.map((tower) =>
          tower.instanceId === upgradedTower.instanceId ? upgradedTower : tower,
        ),
        energy: state.energy - upgradeCost,
        message: `${upgradedTower.name} улучшена до уровня ${upgradedTower.level}.`,
      };
    }

    case 'SELL_SELECTED_TOWER': {
      const selectedTower = state.towers.find(
        (tower) => tower.instanceId === state.selectedPlacedTowerId,
      );

      if (!selectedTower) {
        return { ...state, message: 'Сначала выберите установленную башню.' };
      }

      const refund = getTowerSellRefund(selectedTower);

      return {
        ...state,
        towers: state.towers.filter(
          (tower) => tower.instanceId !== selectedTower.instanceId,
        ),
        selectedPlacedTowerId: null,
        placementMode: false,
        energy: state.energy + refund,
        message: `${selectedTower.name} продана. Возвращено ${refund} энергии.`,
      };
    }

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

      for (const tower of towers) {
        if (tower.cooldownRemaining > 0) {
          continue;
        }

        const targets = enemies.filter(
          (enemy) => enemy.hp > 0 && getDistance(tower, enemy) <= tower.range,
        );

        if (targets.length === 0) {
          continue;
        }

        if (tower.attackType === 'aura') {
          for (const target of targets) {
            target.hp -= tower.damage;
          }
        } else {
          const target = targets.reduce((leader, candidate) =>
            candidate.progress > leader.progress ? candidate : leader,
          );
          target.hp -= tower.damage;
        }

        tower.cooldownRemaining = tower.cooldown;
      }

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
            towers,
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
          towers,
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
        towers,
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
