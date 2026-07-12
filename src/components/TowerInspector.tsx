import type { BattleDispatch, BattleTower } from '../types/Battle';
import {
  getTowerSellRefund,
  getTowerUpgradeCost,
  MAX_TOWER_LEVEL,
} from '../game/towerProgression';

interface TowerInspectorProps {
  tower: BattleTower | null;
  energy: number;
  dispatch: BattleDispatch;
}

export function TowerInspector({ tower, energy, dispatch }: TowerInspectorProps) {
  if (!tower) {
    return (
      <section className="tower-inspector" aria-label="Управление башней">
        <p className="eyebrow">Установленная башня</p>
        <h2>Ничего не выбрано</h2>
        <p className="tower-inspector__empty">
          Нажмите на башню на поле, чтобы увидеть её радиус, улучшить или продать.
        </p>
      </section>
    );
  }

  const upgradeCost = getTowerUpgradeCost(tower);
  const sellRefund = getTowerSellRefund(tower);
  const cooldownSeconds = (tower.cooldown / 1000).toFixed(2).replace(/\.00$/, '');
  const canAffordUpgrade = upgradeCost !== null && energy >= upgradeCost;

  return (
    <section className="tower-inspector" aria-label="Управление выбранной башней">
      <div className="tower-inspector__heading">
        <span
          className="tower-inspector__symbol"
          style={{ borderColor: tower.color, color: tower.color }}
        >
          {tower.symbol}
        </span>
        <div>
          <p className="eyebrow">Установленная башня</p>
          <h2>{tower.name}</h2>
          <span className="tower-level">Уровень {tower.level}/{MAX_TOWER_LEVEL}</span>
        </div>
      </div>

      <dl className="tower-details">
        <div><dt>Урон</dt><dd>{tower.damage}</dd></div>
        <div><dt>Радиус</dt><dd>{tower.range}</dd></div>
        <div><dt>Перезарядка</dt><dd>{cooldownSeconds} сек.</dd></div>
        <div><dt>Вложено</dt><dd>{tower.investedEnergy}</dd></div>
      </dl>

      <div className="tower-inspector__actions">
        <button
          className="tower-upgrade-button"
          disabled={!canAffordUpgrade}
          onClick={() => dispatch({ type: 'UPGRADE_SELECTED_TOWER' })}
          type="button"
        >
          {upgradeCost === null
            ? 'Максимальный уровень'
            : `Улучшить за ${upgradeCost}`}
        </button>

        <button
          className="tower-sell-button"
          onClick={() => dispatch({ type: 'SELL_SELECTED_TOWER' })}
          type="button"
        >
          Продать за {sellRefund}
        </button>
      </div>

      {upgradeCost !== null && !canAffordUpgrade && (
        <p className="tower-inspector__warning">
          Недостаточно энергии: нужно {upgradeCost}, доступно {energy}.
        </p>
      )}

      <p className="tower-inspector__note">
        При продаже возвращается 60% всей энергии, вложенной в башню.
      </p>
    </section>
  );
}
