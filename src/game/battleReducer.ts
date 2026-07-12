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
  BattleEffect,
  BattleEnemy,
  BattleState,
  BattleTower,
} from '../types/Battle';
import { getDistance, getPathPosition, PATH_CELL_KEYS } from './battleGeometry';
import { createEnemy } from './createEnemy';
import {
  canFuseTowers,
  createBaseBattleTower,
  fuseTowers,
  getFusionCost,
} from './fusionLogic';
import { getWaveEnemyCount, getWavePlan } from './waveBalance';

let towerSequence = 0;
let effectSequence = 0;

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
    effects: [],
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

function getTowerTargets(tower: BattleTower, enemies: BattleEnemy[], canIgnoreRange: boolean) {
  return enemies
    .filter((enemy) => enemy.hp > 0 && (canIgnoreRange || getDistance(tower, enemy) <= tower.range))
    .sort((left, right) => right.progress - left.progress);
}

function nextEffectId() {
  effectSequence += 1;
  return `effect-${effectSequence}`;
}

function createLineEffect(
  tower: BattleTower,
  target: BattleEnemy,
  kind: 'projectile' | 'laser',
  label?: string,
): BattleEffect {
  const position = getPathPosition(target.progress);

  return {
    id: nextEffectId(),
    kind,
    fromX: tower.x,
    fromY: tower.y,
    toX: position.x,
    toY: position.y,
    color: tower.color,
    ttl: kind === 'laser' ? 240 : 380,
    label,
  };
}

function createAuraEffect(tower: BattleTower, label?: string): BattleEffect {
  return {
    id: nextEffectId(),
    kind: 'aura',
    fromX: tower.x,
    fromY: tower.y,
    toX: tower.x,
    toY: tower.y,
    color: tower.color,
    ttl: 460,
    radius: tower.range,
    label,
  };
}

function getAbilityLabel(
  tower: BattleTower,
  targets: BattleEnemy[],
  canIgnoreRange: boolean,
  isReset: boolean,
) {
  const abilityIds = new Set(tower.activeAbilityIds);
  const counter = tower.attackCounter;

  if (canIgnoreRange && abilityIds.has('red-9-horizon')) return 'Выстрел за горизонт';
  if (abilityIds.has('blue-9-network') && targets.length > 1) return 'Синяя сеть';
  if (abilityIds.has('red-8-execute') && targets.some((target) => target.hp / target.maxHp <= 0.35)) return 'Казнь';
  if (abilityIds.has('red-7-critical') && counter % 4 === 0) return 'Критический фокус';
  if (abilityIds.has('green-7-burst') && counter % 6 === 0) return 'Очередь';
  if (abilityIds.has('green-5-double') && counter % 5 === 0) return 'Двойной такт';
  if (isReset && abilityIds.has('green-8-reset')) return 'Сброс цикла';
  if (abilityIds.has('green-9-overload') && counter % 8 === 0) return 'Перегрузка';
  if (abilityIds.has('blue-8-chain') && targets.length > 1 && counter % 4 === 0) return 'Цепная волна';
  if (abilityIds.has('blue-7-split') && targets.length > 1 && counter % 4 === 0) return 'Расщепление';
  if (abilityIds.has('blue-6-ricochet') && targets.length > 1 && counter % 4 === 0) return 'Рикошет';
  if (abilityIds.has('red-5-focus') && counter % 6 === 0) return 'Пристрелка';
  if (abilityIds.has('green-6-accelerate') && counter % 8 === 0) return 'Разгон';
  if (abilityIds.has('blue-5-seeking') && counter % 6 === 0) return 'Наведение';

  return undefined;
}

function attackWithTower(
  tower: BattleTower,
  enemies: BattleEnemy[],
): { tower: BattleTower; effects: BattleEffect[] } {
  const canIgnoreRange =
    tower.ignoresRangeEvery > 0 &&
    tower.attackCounter > 0 &&
    tower.attackCounter % tower.ignoresRangeEvery === 0;
  const targets = getTowerTargets(tower, enemies, canIgnoreRange);

  if (targets.length === 0) {
    return { tower, effects: [] };
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
  const abilityLabel = getAbilityLabel(nextTower, selectedTargets, canIgnoreRange, isReset);
  const effects: BattleEffect[] = [];

  if (nextTower.attackType === 'aura') {
    effects.push(createAuraEffect(nextTower, abilityLabel));
  } else {
    const effectKind = nextTower.attackType === 'laser' ? 'laser' : 'projectile';
    selectedTargets.forEach((target, index) => {
      effects.push(createLineEffect(nextTower, target, effectKind, index === 0 ? abilityLabel : undefined));
    });
  }

  return {
    tower: {
      ...nextTower,
      cooldownRemaining: isReset ? Math.round(nextTower.cooldown * 0.22) : nextTower.cooldown,
    },
    effects,
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
        return { ...state, message: `Недостаточно энергии: нужно ${towerTemplate.placeCost}, доступно ${state.energy}.` };
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
        message: 'Шаг 2/2: нажмите на подсвеченную совместимую башню. Цена указана рядом с ней.',
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
          message: 'Эти башни пока нельзя соединить. Работают чистые пары и усиление гибрида чистым цветом.',
        };
      }

      const fusionCost = getFusionCost(source, target);

      if (state.energy < fusionCost) {
        return {
          ...state,
          selectedPlacedTowerId: source.instanceId,
          message: `Слияние недоступно: нужно ${fusionCost} энергии, доступно ${state.energy}, не хватает ${fusionCost - state.energy}.`,
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
        effects: [
          ...state.effects,
          createAuraEffect(fusedTower, `${fusedTower.name} · ${fusedTower.fusionRarity}`),
        ].slice(-36),
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
      const plan = getWavePlan(nextWave);
      const enemyCount = getWaveEnemyCount(plan);

      return {
        ...state,
        wave: nextWave,
        status: 'running',
        spawnRemaining: enemyCount,
        spawnCooldown: 0,
        message: `Волна ${nextWave}: ${plan.label}. Врагов ${enemyCount}, угроза: ${plan.threat.toLowerCase()}.`,
      };
    }

    case 'TICK': {
      let effects = state.effects
        .map((effect) => ({ ...effect, ttl: effect.ttl - action.delta }))
        .filter((effect) => effect.ttl > 0);

      if (state.status !== 'running') {
        return effects.length === state.effects.length ? state : { ...state, effects };
      }

      let spawnRemaining = state.spawnRemaining;
      let spawnCooldown = state.spawnCooldown - action.delta;
      let enemies = state.enemies.map((enemy) => ({ ...enemy }));
      const plan = getWavePlan(state.wave);
      const waveEnemyCount = getWaveEnemyCount(plan);

      if (spawnRemaining > 0 && spawnCooldown <= 0) {
        const spawnIndex = waveEnemyCount - spawnRemaining;
        enemies.push(createEnemy(state.wave, spawnIndex));
        spawnRemaining -= 1;
        spawnCooldown += SPAWN_INTERVAL_MS;
      }

      let escapedDamage = 0;

      enemies = enemies
        .map((enemy) => ({
          ...enemy,
          progress: enemy.progress + enemy.speed * (action.delta / 1000),
        }))
        .filter((enemy) => {
          const escaped = enemy.progress >= BATTLE_PATH.length - 1;
          if (escaped) {
            escapedDamage += enemy.baseDamage;
          }
          return !escaped;
        });

      const baseHealth = Math.max(0, state.baseHealth - escapedDamage);

      if (baseHealth === 0) {
        return {
          ...state,
          enemies,
          effects,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          status: 'defeat',
          message: 'Поражение: враги разрушили базу. Перестройте позиции или начните слияние раньше.',
        };
      }

      const cooledTowers = state.towers.map((tower) => ({
        ...tower,
        cooldownRemaining: Math.max(0, tower.cooldownRemaining - action.delta),
      }));
      const attackedTowers: BattleTower[] = [];

      for (const tower of cooledTowers) {
        if (tower.cooldownRemaining > 0) {
          attackedTowers.push(tower);
          continue;
        }

        const result = attackWithTower(tower, enemies);
        attackedTowers.push(result.tower);
        effects.push(...result.effects);
      }

      effects = effects.slice(-36);

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
            effects,
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
          effects,
          energy: energy + plan.completionBonus,
          baseHealth,
          spawnRemaining,
          spawnCooldown,
          kills,
          status: 'idle',
          message: `Волна ${state.wave} завершена. Бонус: ${plan.completionBonus} энергии. Подготовьтесь к следующей угрозе.`,
        };
      }

      return {
        ...state,
        towers: attackedTowers,
        enemies: survivors,
        effects,
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
