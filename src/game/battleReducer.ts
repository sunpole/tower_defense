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

let towerSequence = 0;

export function createInitialBattleState(
  selectedTowerId = TOWERS[0]?.id ?? 1,
): BattleState {
  return {
    selectedTowerId,
    towers: [],
    enemies: [],
    energy: STARTING_ENERGY,
    baseHealth: STARTING_BASE_HEALTH,
    wave: 0,
    status: 'idle',
    spawnRemaining: 0,
    spawnCooldown: 0,
    kills: 0,
    message: 'Выберите башню, поставьте её рядом с дорогой и запустите волну.',
  };
}

export function battleReducer(
  state: BattleState,
  action: BattleAction,
): BattleState {
  switch (action.type) {
    case 'SELECT_TOWER':
      return {
        ...state,
        selectedTowerId: action.towerId,
        message: 'Башня выбрана. Нажмите на свободную клетку поля.',
      };

    case 'PLACE_TOWER': {
      if (state.status === 'victory' || state.status === 'defeat') {
        return state;
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

      const tower: BattleTower = {
        ...towerTemplate,
        instanceId: `tower-${towerSequence}`,
        x: action.x,
        y: action.y,
        lastShot: 0,
        buffId: null,
        cooldownRemaining: 0,
      };

      return {
        ...state,
        towers: [...state.towers, tower],
        energy: state.energy - towerTemplate.placeCost,
        message: `${towerTemplate.name} установлена.`,
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
