import type { CSSProperties } from 'react';
import { FUSION_COLORS } from '../config/fusionSystem';
import { BOARD_COLUMNS, BOARD_ROWS } from '../config/gameSettings';
import {
  getEntityPosition,
  getPathPosition,
} from '../game/battleGeometry';
import { canSuperFuseTowers } from '../game/fusionEconomy';
import { getCompositionSegments } from '../game/fusionLogic';
import { getPathCellKeys } from '../game/routeGeneration';
import type { BattleDispatch, BattleState } from '../types/Battle';
import { BattleEffects } from './BattleEffects';

interface BattleBoardProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function BattleBoard({ state, dispatch }: BattleBoardProps) {
  const boardStyle = {
    '--board-columns': BOARD_COLUMNS,
    '--board-rows': BOARD_ROWS,
  } as CSSProperties;
  const pathCellKeys = getPathCellKeys(state.route);
  const selectedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  );
  const superFusionSource = state.towers.find(
    (tower) => tower.instanceId === state.fusionSourceTowerId,
  );
  const superFusionTargets = superFusionSource
    ? state.towers.filter((tower) => canSuperFuseTowers(superFusionSource, tower))
    : [];
  const superFusionTargetIds = new Set(
    superFusionTargets.map((tower) => tower.instanceId),
  );
  const routeStart = state.route[0];
  const routeEnd = state.route[state.route.length - 1];

  return (
    <div className="battle-board" style={boardStyle}>
      {superFusionSource && (
        <div className="fusion-board-guide fusion-board-guide--super" role="status">
          <strong>🧬 Суперслияние: шаг 2 из 2</strong>
          <span>
            Выберите любую башню уровня {superFusionSource.level}, отмеченную значком 🧬.
          </span>
        </div>
      )}

      {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => {
        const x = index % BOARD_COLUMNS;
        const y = Math.floor(index / BOARD_COLUMNS);
        const isPathCell = pathCellKeys.has(`${x}:${y}`);
        const occupiedTower = state.towers.find(
          (tower) => tower.x === x && tower.y === y,
        );
        const isSuperFusionTarget = Boolean(
          occupiedTower && superFusionTargetIds.has(occupiedTower.instanceId),
        );

        return (
          <button
            className={`board-cell${isPathCell ? ' board-cell--path' : ''}${occupiedTower ? ' board-cell--occupied' : ''}${isSuperFusionTarget ? ' board-cell--super-fusion-target' : ''}`}
            disabled={
              isPathCell ||
              state.status === 'victory' ||
              state.status === 'defeat'
            }
            key={`${x}:${y}`}
            onClick={() => dispatch({ type: 'PLACE_TOWER', x, y })}
            type="button"
            aria-label={
              occupiedTower
                ? `${occupiedTower.name}, уровень ${occupiedTower.level}, клетка ${x + 1}:${y + 1}${
                    isSuperFusionTarget ? ', доступна для суперслияния' : ''
                  }`
                : isPathCell
                  ? `Дорога, клетка ${x + 1}:${y + 1}`
                  : `Свободная клетка ${x + 1}:${y + 1}`
            }
          />
        );
      })}

      {routeStart && (
        <span
          className="route-marker route-marker--start"
          style={getEntityPosition(routeStart.x, routeStart.y)}
          aria-hidden="true"
        >
          ВХОД
        </span>
      )}
      {routeEnd && (
        <span
          className="route-marker route-marker--finish"
          style={getEntityPosition(routeEnd.x, routeEnd.y)}
          aria-hidden="true"
        >
          БАЗА
        </span>
      )}

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

      <BattleEffects effects={state.effects} />

      {state.towers.map((tower) => {
        const isSelected = tower.instanceId === state.selectedPlacedTowerId;
        const isFusionSource = tower.instanceId === state.fusionSourceTowerId;
        const isSuperTarget = superFusionTargetIds.has(tower.instanceId);
        const segments = getCompositionSegments(tower.composition);
        const cooldownProgress = tower.cooldown <= 0
          ? 100
          : Math.min(
              100,
              Math.max(0, (1 - tower.cooldownRemaining / tower.cooldown) * 100),
            );

        return (
          <div
            aria-hidden="true"
            className={`placed-tower${isSelected ? ' placed-tower--selected' : ''}${isFusionSource ? ' placed-tower--fusion-source' : ''}${isSuperTarget ? ' placed-tower--super-target' : ''}`}
            key={tower.instanceId}
            style={{
              ...getEntityPosition(tower.x, tower.y),
              borderColor: tower.color,
              boxShadow: `0 0 18px ${tower.color}66`,
            }}
            title={`${tower.name}: уровень ${tower.level}, урон ${tower.damage}, радиус ${tower.range}`}
          >
            <span style={{ color: tower.color }}>{tower.symbol}</span>
            {isSuperTarget && (
              <span className="super-fusion-marker" title="Доступна для суперслияния">
                🧬
              </span>
            )}
            <span className="tower-mini-composition">
              {segments.map((colorId, segmentIndex) => (
                <i
                  key={`${tower.instanceId}-${colorId}-${segmentIndex}`}
                  style={{ background: FUSION_COLORS[colorId].hex }}
                />
              ))}
            </span>
            <span className="tower-cooldown" title="Перезарядка атаки">
              <i style={{ width: `${cooldownProgress}%` }} />
            </span>
          </div>
        );
      })}

      {state.enemies.map((enemy) => {
        const position = getPathPosition(enemy.progress, state.route);
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
        const hpLabel = `${Math.max(0, Math.ceil(enemy.hp))}`;

        return (
          <div
            className={`battle-enemy battle-enemy--${enemy.archetype}`}
            key={enemy.instanceId}
            style={getEntityPosition(position.x, position.y)}
            title={`${enemy.name}: ${hpLabel} HP · урон базе ${enemy.baseDamage}`}
          >
            <div className="enemy-health">
              <span style={{ width: `${hpPercent}%` }} />
            </div>
            <span className="enemy-symbol" style={{ color: enemy.color }}>
              {enemy.symbol}
            </span>
            <small className="enemy-hp-label">{hpLabel} HP</small>
          </div>
        );
      })}
    </div>
  );
}
