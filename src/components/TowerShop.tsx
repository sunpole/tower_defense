import type { CSSProperties } from 'react';
import { TOWERS } from '../config/towers';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface TowerShopProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function TowerShop({ state, dispatch }: TowerShopProps) {
  const selectedTower = TOWERS.find((tower) => tower.id === state.selectedTowerId);

  return (
    <aside className="tower-shop tower-shop--persistent" aria-label="Выбор башен">
      <div className="tower-shop__heading">
        <p className="eyebrow">Арсенал</p>
        <h2>Магазин башен</h2>
        <span className="tower-shop__balance">Доступно: {state.energy} энергии</span>
      </div>

      <div className="tower-list">
        {TOWERS.map((tower) => {
          const isSelected = tower.id === state.placingTowerId;
          const canAfford = state.energy >= tower.placeCost;
          const isGameOver = state.status === 'victory' || state.status === 'defeat';
          const isDisabled = !canAfford || isGameOver;

          return (
            <button
              aria-label={
                canAfford
                  ? `${tower.name}, купить за ${tower.placeCost} энергии`
                  : `${tower.name}, не хватает ${tower.placeCost - state.energy} энергии`
              }
              className={`tower-option${isSelected ? ' tower-option--selected' : ''}${isDisabled ? ' tower-option--unavailable' : ''}`}
              disabled={isDisabled}
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
                <span className={`tower-option__availability${canAfford ? '' : ' is-insufficient'}`}>
                  {canAfford
                    ? 'Доступна для установки'
                    : `Не хватает ${tower.placeCost - state.energy} энергии`}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="selection-note">
        {state.placingTowerId && selectedTower ? (
          <>Режим установки: <strong>{selectedTower.name}</strong></>
        ) : (
          <>Выберите доступную башню, затем нажмите на свободную клетку.</>
        )}
      </div>
    </aside>
  );
}
