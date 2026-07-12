import type { CSSProperties } from 'react';
import { BOARD_COLUMNS, BOARD_ROWS } from '../config/gameSettings';
import {
  getEntityPosition,
  getPathPosition,
  PATH_CELL_KEYS,
} from '../game/battleGeometry';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface BattleBoardProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function BattleBoard({ state, dispatch }: BattleBoardProps) {
  const boardStyle = {
    '--board-columns': BOARD_COLUMNS,
    '--board-rows': BOARD_ROWS,
  } as CSSProperties;
  const selectedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  );

  return (
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

      {selectedTower && (
        <div
          className="tower-range"
          style={{
            ...getEntityPosition(selectedTower.x, selectedTower.y),
            width: `${(selectedTower.range * 2 / BOARD_COLUMNS) * 100}%`,
            borderColor: selectedTower.color,
            backgroundColor: `${selectedTower.color}14`,
          }}
          aria-hidden="true"
        />
      )}

      {state.towers.map((tower) => {
        const isSelected = tower.instanceId === state.selectedPlacedTowerId;

        return (
          <button
            aria-label={`${tower.name}, уровень ${tower.level}. Выбрать башню`}
            aria-pressed={isSelected}
            className={`placed-tower${isSelected ? ' placed-tower--selected' : ''}`}
            key={tower.instanceId}
            onClick={() =>
              dispatch({ type: 'SELECT_PLACED_TOWER', instanceId: tower.instanceId })
            }
            style={{
              ...getEntityPosition(tower.x, tower.y),
              borderColor: tower.color,
              boxShadow: `0 0 18px ${tower.color}66`,
            }}
            title={`${tower.name}: уровень ${tower.level}, урон ${tower.damage}, радиус ${tower.range}`}
            type="button"
          >
            <span style={{ color: tower.color }}>{tower.symbol}</span>
          </button>
        );
      })}

      {state.enemies.map((enemy) => {
        const position = getPathPosition(enemy.progress);
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

        return (
          <div
            className="battle-enemy"
            key={enemy.instanceId}
            style={getEntityPosition(position.x, position.y)}
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
  );
}
