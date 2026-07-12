import type { CSSProperties } from 'react';
import { FUSION_COLORS } from '../config/fusionSystem';
import { BOARD_COLUMNS, BOARD_ROWS } from '../config/gameSettings';
import {
  getEntityPosition,
  getPathPosition,
  PATH_CELL_KEYS,
} from '../game/battleGeometry';
import {
  canFuseTowers,
  getCompositionSegments,
  getFusionCost,
} from '../game/fusionLogic';
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
  const selectedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  );
  const fusionSourceTower = state.towers.find(
    (tower) => tower.instanceId === state.fusionSourceTowerId,
  );
  const fusionTargets = fusionSourceTower
    ? state.towers.filter((tower) => canFuseTowers(fusionSourceTower, tower))
    : [];

  return (
    <div className="battle-board" style={boardStyle}>
      {fusionSourceTower && (
        <div className="fusion-board-guide" role="status">
          <strong>Слияние: шаг 2 из 2</strong>
          <span>
            Нажмите на подсвеченную башню. Цена указана рядом с каждой целью.
          </span>
        </div>
      )}

      {Array.from({ length: BOARD_COLUMNS * BOARD_ROWS }, (_, index) => {
        const x = index % BOARD_COLUMNS;
        const y = Math.floor(index / BOARD_COLUMNS);
        const isPathCell = PATH_CELL_KEYS.has(`${x}:${y}`);
        const occupiedTower = state.towers.find(
          (tower) => tower.x === x && tower.y === y,
        );
        const isFusionTarget = Boolean(
          fusionSourceTower &&
          occupiedTower &&
          fusionSourceTower.instanceId !== occupiedTower.instanceId &&
          canFuseTowers(fusionSourceTower, occupiedTower),
        );
        const fusionCost = isFusionTarget && fusionSourceTower && occupiedTower
          ? getFusionCost(fusionSourceTower, occupiedTower)
          : null;
        const isAffordable = fusionCost !== null && fusionCost <= state.energy;

        return (
          <button
            className={`board-cell${isPathCell ? ' board-cell--path' : ''}${occupiedTower ? ' board-cell--occupied' : ''}${isFusionTarget ? ' board-cell--fusion-target' : ''}${isFusionTarget && !isAffordable ? ' board-cell--fusion-unaffordable' : ''}`}
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
                ? `${occupiedTower.name}, клетка ${x + 1}:${y + 1}${
                    fusionCost !== null
                      ? `, слияние стоит ${fusionCost} энергии`
                      : ''
                  }`
                : isPathCell
                  ? `Дорога, клетка ${x + 1}:${y + 1}`
                  : `Свободная клетка ${x + 1}:${y + 1}`
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

      <BattleEffects effects={state.effects} />

      {state.towers.map((tower) => {
        const isSelected = tower.instanceId === state.selectedPlacedTowerId;
        const isFusionSource = tower.instanceId === state.fusionSourceTowerId;
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
            className={`placed-tower${isSelected ? ' placed-tower--selected' : ''}${isFusionSource ? ' placed-tower--fusion-source' : ''}`}
            key={tower.instanceId}
            style={{
              ...getEntityPosition(tower.x, tower.y),
              borderColor: tower.color,
              boxShadow: `0 0 18px ${tower.color}66`,
            }}
            title={`${tower.name}: ранг ${tower.level}, урон ${tower.damage}, радиус ${tower.range}`}
          >
            <span style={{ color: tower.color }}>{tower.symbol}</span>
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

      {fusionSourceTower && fusionTargets.map((target) => {
        const cost = getFusionCost(fusionSourceTower, target);
        const isAffordable = cost <= state.energy;

        return (
          <span
            aria-hidden="true"
            className={`fusion-cost-badge${
              isAffordable ? '' : ' fusion-cost-badge--insufficient'
            }`}
            key={`fusion-cost-${target.instanceId}`}
            style={getEntityPosition(target.x, target.y)}
          >
            {cost} ⚡
          </span>
        );
      })}

      {state.enemies.map((enemy) => {
        const position = getPathPosition(enemy.progress);
        const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

        return (
          <div
            className={`battle-enemy battle-enemy--${enemy.archetype}`}
            key={enemy.instanceId}
            style={getEntityPosition(position.x, position.y)}
            title={`${enemy.name}: ${Math.max(0, Math.ceil(enemy.hp))} HP · урон базе ${enemy.baseDamage}`}
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
