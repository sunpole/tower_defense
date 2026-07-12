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
    <aside className="tower-shop" aria-label="Выбор башен">
      <div className="tower-shop__heading">
        <p className="eyebrow">Арсенал</p>
        <h2>Выберите цвет</h2>
      </div>

      <div className="tower-list">
        {TOWERS.map((tower) => {
          const isSelected = tower.id === state.placingTowerId;

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

      <div className="selection-note">
        {state.placingTowerId && selectedTower ? (
          <>Режим установки: <strong>{selectedTower.name}</strong></>
        ) : (
          <>Режим установки выключен. Нажмите на цвет, чтобы взять башню.</>
        )}
      </div>

      <ol className="game-help">
        <li>Нажмите на цвет, затем на свободную клетку.</li>
        <li>После установки режим автоматически выключается.</li>
        <li>Выберите две совместимые башни, чтобы создать гибрид.</li>
      </ol>
    </aside>
  );
}
