import type { CSSProperties } from 'react';
import { TOWERS } from '../config/towers';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface TowerShopProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

function getCompactTowerName(name: string) {
  return name.replace(/\s+башня$/i, '');
}

function getAttackRole(attackType: string) {
  if (attackType === 'aura') return 'Импульс';
  if (attackType === 'laser') return 'Лазер';
  return 'Снаряд';
}

export function TowerShop({ state, dispatch }: TowerShopProps) {
  const selectedTower = TOWERS.find((tower) => tower.id === state.selectedTowerId);

  return (
    <aside className="tower-shop tower-shop--persistent tower-shop--compact" aria-label="Выбор башен">
      <div className="tower-shop__heading tower-shop__heading--compact">
        <div>
          <p className="eyebrow">Арсенал</p>
          <h2>Башни</h2>
        </div>
        <strong className="tower-shop__balance tower-shop__balance--pill">
          {state.energy} ⚡
        </strong>
      </div>

      <div className="tower-list tower-list--compact">
        {TOWERS.map((tower) => {
          const isSelected = tower.id === state.placingTowerId;
          const canAfford = state.energy >= tower.placeCost;
          const isGameOver = state.status === 'victory' || state.status === 'defeat';
          const isDisabled = !canAfford || isGameOver;
          const shortfall = Math.max(0, tower.placeCost - state.energy);

          return (
            <button
              aria-label={
                canAfford
                  ? `${tower.name}, купить за ${tower.placeCost} энергии`
                  : `${tower.name}, не хватает ${shortfall} энергии`
              }
              className={`tower-option tower-option--compact${isSelected ? ' tower-option--selected' : ''}${isDisabled ? ' tower-option--unavailable' : ''}`}
              disabled={isDisabled}
              key={tower.id}
              onClick={() => dispatch({ type: 'SELECT_TOWER', towerId: tower.id })}
              style={{ '--tower-color': tower.color } as CSSProperties}
              title={`${tower.description}. Урон ${tower.damage}, радиус ${tower.range}, цена ${tower.placeCost}.`}
              type="button"
            >
              <span className="tower-option__symbol">{tower.symbol}</span>
              <span className="tower-option__compact-name">
                <strong>{getCompactTowerName(tower.name)}</strong>
                <small>{getAttackRole(tower.attackType)}</small>
              </span>
              <span className="tower-option__compact-stats" aria-hidden="true">
                <b>У {tower.damage}</b>
                <b>R {tower.range}</b>
                <b>{tower.placeCost} ⚡</b>
              </span>
              <span className={`tower-option__compact-status${canAfford ? '' : ' is-insufficient'}`}>
                {canAfford ? (isSelected ? 'Выбрана' : 'Установить') : `−${shortfall} ⚡`}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`selection-note selection-note--compact${state.placingTowerId ? ' selection-note--active' : ''}`}>
        {state.placingTowerId && selectedTower ? (
          <>Установка: <strong>{getCompactTowerName(selectedTower.name)}</strong> · выберите клетку</>
        ) : (
          <>Выберите цвет, затем свободную клетку.</>
        )}
      </div>
    </aside>
  );
}
