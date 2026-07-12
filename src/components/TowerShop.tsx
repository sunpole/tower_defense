import type { CSSProperties } from 'react';
import { TOWERS } from '../config/towers';
import type { BattleDispatch } from '../types/Battle';

interface TowerShopProps {
  selectedTowerId: number;
  placementMode: boolean;
  dispatch: BattleDispatch;
}

export function TowerShop({
  selectedTowerId,
  placementMode,
  dispatch,
}: TowerShopProps) {
  const selectedTower = TOWERS.find((tower) => tower.id === selectedTowerId);

  return (
    <aside className="tower-shop" aria-label="Выбор башен">
      <div className="tower-shop__heading">
        <p className="eyebrow">Арсенал</p>
        <h2>Выберите башню</h2>
      </div>

      <div className="tower-list">
        {TOWERS.map((tower) => {
          const isReadyToPlace = placementMode && tower.id === selectedTowerId;

          return (
            <button
              aria-pressed={isReadyToPlace}
              className={`tower-option${isReadyToPlace ? ' tower-option--selected' : ''}`}
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

      <div className={`selection-note${placementMode ? ' selection-note--active' : ''}`}>
        {placementMode && selectedTower ? (
          <>
            В руке: <strong>{selectedTower.name}</strong>.
            <br />
            Нажмите на свободную клетку. Повторный клик по этой карточке отменит установку.
          </>
        ) : (
          'Режим установки выключен. Нажмите на тип башни, чтобы взять её.'
        )}
      </div>

      <ol className="game-help">
        <li>Нажмите на тип башни, затем на свободную клетку.</li>
        <li>После установки режим автоматически выключится.</li>
        <li>Нажмите на занятую клетку, чтобы выбрать установленную башню.</li>
      </ol>
    </aside>
  );
}
