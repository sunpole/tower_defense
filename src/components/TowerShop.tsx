import type { CSSProperties } from 'react';
import { TOWERS } from '../config/towers';
import type { BattleDispatch } from '../types/Battle';

interface TowerShopProps {
  selectedTowerId: number;
  dispatch: BattleDispatch;
}

export function TowerShop({ selectedTowerId, dispatch }: TowerShopProps) {
  const selectedTower = TOWERS.find((tower) => tower.id === selectedTowerId);

  return (
    <aside className="tower-shop" aria-label="Выбор башен">
      <div className="tower-shop__heading">
        <p className="eyebrow">Арсенал</p>
        <h2>Выберите башню</h2>
      </div>

      <div className="tower-list">
        {TOWERS.map((tower) => {
          const isSelected = tower.id === selectedTowerId;

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
  );
}
