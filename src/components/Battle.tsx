import { useEffect, useReducer } from 'react';
import type { CSSProperties } from 'react';
import { ENEMIES } from '../config/enemies';
import {
  BATTLE_PATH,
  BOARD_COLUMNS,
  BOARD_ROWS,
  SPAWN_INTERVAL_MS,
  STARTING_BASE_HEALTH,
  STARTING_ENERGY,
  TICK_MS,
  TOTAL_WAVES,
} from '../config/gameSettings';
import { TOWERS } from '../config/towers';
import type { IEnemy } from '../types/Enemy';
import type { IPlacedTower } from '../types/Tower';

interface BattleEnemy extends IEnemy {
  instanceId: string;
  maxHp: number;
  progress: number;
}

interface BattleTower extends IPlacedTower {
  instanceId: string;
  cooldownRemaining: number;
}

type BattleStatus = 'idle' | 'running' | 'victory' | 'defeat';

interface BattleState {
  selectedTowerId: number;
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

type BattleAction =
  | { type: 'SELECT_TOWER'; towerId: number }
  | { type: 'PLACE_TOWER'; x: number; y: number }
  | { type: 'START_WAVE' }
  | { type: 'TICK'; delta: number }
  | { type: 'RESET' };

const PATH_CELL_KEYS = new Set(BATTLE_PATH.map((point) => `${point.x}:${point.y}`));

let enemySequence = 0;
let towerSequence = 0;

const INITIAL_STATE: BattleState = {
  selectedTowerId: TOWERS[0]?.id ?? 1,
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

function getPathPosition(progress: number) {
  const finalIndex = BATTLE_PATH.length - 1;
  const segmentIndex = Math.min(Math.floor(progress), finalIndex - 1);
  const localProgress = progress - segmentIndex;
  const start = BATTLE_PATH[segmentIndex];
  const end = BATTLE_PATH[segmentIndex + 1];

  return {
    x: start.x + (end.x - start.x) * localProgress,
    y: start.y + (end.y - start.y) * localProgress,
  };
}

function getDistance(
  tower: Pick<BattleTower, 'x' | 'y'>,
  enemy: BattleEnemy,
) {
  const position = getPathPosition(enemy.progress);
  return Math.hypot(tower.x - position.x, tower.y - position.y);
}

function createEnemy(wave: number): BattleEnemy {
  const template = ENEMIES[0];
  const hpMultiplier = 1 + (wave - 1) * 0.28;
  const speedMultiplier = 1 + (wave - 1) * 0.05;
  const hp = Math.round(template.hp * hpMultiplier);

  enemySequence += 1;

  return {
    ...template,
    instanceId: `enemy-${enemySequence}`,
    hp,
    maxHp: hp,
    speed: template.speed * speedMultiplier,
    rewardEnergy: template.rewardEnergy + (wave - 1) * 2,
    progress: 0,
  };
}

function battleReducer(state: BattleState, action: BattleAction): BattleState {
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

      const towerTemplate = TOWERS.find((tower) => tower.id === state.selectedTowerId);

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
      return {
        ...INITIAL_STATE,
        selectedTowerId: state.selectedTowerId,
      };

    default:
      return state;
  }
}

function getEntityStyle(x: number, y: number): CSSProperties {
  return {
    left: `${((x + 0.5) / BOARD_COLUMNS) * 100}%`,
    top: `${((y + 0.5) / BOARD_ROWS) * 100}%`,
  };
}

export function Battle() {
  const [state, dispatch] = useReducer(battleReducer, INITIAL_STATE);
  const selectedTower = TOWERS.find((tower) => tower.id === state.selectedTowerId);
  const boardStyle = {
    '--board-columns': BOARD_COLUMNS,
    '--board-rows': BOARD_ROWS,
  } as CSSProperties;

  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: 'TICK', delta: TICK_MS });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="game-app">
      <header className="game-header">
        <div>
          <p className="eyebrow">Tower Defense · первый игровой цикл</p>
          <h1>Защита пути</h1>
        </div>

        <div className="game-stats" aria-label="Показатели игры">
          <div><span>Энергия</span><strong>{state.energy}</strong></div>
          <div><span>База</span><strong>{state.baseHealth}</strong></div>
          <div><span>Волна</span><strong>{state.wave}/{TOTAL_WAVES}</strong></div>
          <div><span>Победы</span><strong>{state.kills}</strong></div>
        </div>
      </header>

      <div className="game-layout">
        <section className="battle-card" aria-label="Игровое поле">
          <div className="battle-board" style={boardStyle}>
            {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => {
              const x = index % BOARD_COLUMNS;
              const y = Math.floor(index / BOARD_COLUMNS);
              const isPathCell = PATH_CELL_KEYS.has(`${x}:${y}`);

              return (
                <button
                  className={`board-cell${isPathCell ? ' board-cell--path' : ''}`}
                  disabled={
                    isPathCell || state.status === 'victory' || state.status === 'defeat'
                  }
                  key={`${x}:${y}`}
                  onClick={() => dispatch({ type: 'PLACE_TOWER', x, y })}
                  type="button"
                  aria-label={
                    isPathCell
                      ? `Дорога, клетка ${x + 1}:${y + 1}`
                      : `Поставить башню, клетка ${x + 1}:${y + 1}`
                  }
                />
              );
            })}

            {state.towers.map((tower) => (
              <div
                className="placed-tower"
                key={tower.instanceId}
                style={{
                  ...getEntityStyle(tower.x, tower.y),
                  borderColor: tower.color,
                  boxShadow: `0 0 18px ${tower.color}66`,
                }}
                title={`${tower.name}: урон ${tower.damage}, радиус ${tower.range}`}
              >
                <span style={{ color: tower.color }}>{tower.symbol}</span>
              </div>
            ))}

            {state.enemies.map((enemy) => {
              const position = getPathPosition(enemy.progress);
              const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

              return (
                <div
                  className="battle-enemy"
                  key={enemy.instanceId}
                  style={getEntityStyle(position.x, position.y)}
                  title={`${enemy.name}: ${Math.max(0, Math.ceil(enemy.hp))} HP`}
                >
                  <div className="enemy-health">
                    <span style={{ width: `${hpPercent}%` }} />
                  </div>
                  <span className="enemy-symbol" style={{ color: enemy.color }}>
                    {enemy.symbol}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={`battle-message battle-message--${state.status}`}>
            {state.message}
          </div>

          <div className="battle-actions">
            <button
              className="primary-action"
              disabled={
                state.status === 'running' ||
                state.status === 'victory' ||
                state.status === 'defeat'
              }
              onClick={() => dispatch({ type: 'START_WAVE' })}
              type="button"
            >
              {state.wave === 0 ? 'Запустить первую волну' : 'Запустить следующую волну'}
            </button>

            <button
              className="secondary-action"
              onClick={() => dispatch({ type: 'RESET' })}
              type="button"
            >
              Начать заново
            </button>
          </div>
        </section>

        <aside className="tower-shop" aria-label="Выбор башен">
          <div className="tower-shop__heading">
            <p className="eyebrow">Арсенал</p>
            <h2>Выберите башню</h2>
          </div>

          <div className="tower-list">
            {TOWERS.map((tower) => {
              const isSelected = tower.id === state.selectedTowerId;

              return (
                <button
                  className={`tower-option${isSelected ? ' tower-option--selected' : ''}`}
                  key={tower.id}
                  onClick={() => dispatch({ type: 'SELECT_TOWER', towerId: tower.id })}
                  style={{ '--tower-color': tower.color } as CSSProperties}
                  type="button"
                >
                  <span className="tower-option__symbol">{tower.symbol}</span>
                  <span className="tower-option__content">
                    <strong>{tower.name}</strong>
                    <small>{tower.description}</small>
                    <span className="tower-option__stats">
                      Урон {tower.damage} · Радиус {tower.range} · Цена {tower.placeCost}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {selectedTower && (
            <div className="selection-note">
              Сейчас выбрана: <strong>{selectedTower.name}</strong>
            </div>
          )}

          <ol className="game-help">
            <li>Выберите башню.</li>
            <li>Нажмите на свободную клетку рядом с дорогой.</li>
            <li>Запустите волну и не дайте врагам добраться до базы.</li>
          </ol>
        </aside>
      </div>
    </main>
  );
}
