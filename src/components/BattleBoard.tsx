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

      {state.towers.map((tower) => (
        <div
          className="placed-tower"
          key={tower.instanceId}
          style={{
            ...getEntityPosition(tower.x, tower.y),
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
