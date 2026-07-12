import { useState } from 'react';
import { FUSION_COLORS, FUSION_RARITIES } from '../config/fusionSystem';
import {
  canFuseTowers,
  getActiveFusionAbilities,
  getCompositionEntries,
  getCompositionLabel,
  getCompositionSegments,
  getFusionCost,
} from '../game/fusionLogic';
import {
  formatFusionCostRange,
  getAbilityExactEffect,
} from '../game/fusionPresentation';
import type { BattleDispatch, BattleState, BattleTower } from '../types/Battle';

interface TowerInspectorProps {
  tower: BattleTower | null;
  state: BattleState;
  dispatch: BattleDispatch;
}

export function TowerInspector({ tower, state, dispatch }: TowerInspectorProps) {
  const [saleConfirmTowerId, setSaleConfirmTowerId] = useState<string | null>(null);

  if (!tower) {
    return (
      <aside className="tower-inspector tower-inspector--empty" aria-label="Выбранная башня">
        <div className="tower-inspector__empty-icon" aria-hidden="true">◎</div>
        <div>
          <p className="eyebrow">Синтез</p>
          <h2>Выберите башню</h2>
          <p className="tower-inspector__empty">
            Нажмите на башню на поле: здесь появятся характеристики, способности и слияние.
          </p>
        </div>
      </aside>
    );
  }

  const abilities = getActiveFusionAbilities(tower.composition);
  const rarity = FUSION_RARITIES[tower.fusionRarity];
  const segments = getCompositionSegments(tower.composition);
  const compositionEntries = getCompositionEntries(tower.composition);
  const isFusionSource = state.fusionSourceTowerId === tower.instanceId;
  const compatibleTargets = state.towers.filter((candidate) =>
    canFuseTowers(tower, candidate),
  );
  const fusionCosts = compatibleTargets.map((candidate) =>
    getFusionCost(tower, candidate),
  );
  const fusionCostRange = formatFusionCostRange(fusionCosts);
  const minimumFusionCost = fusionCosts.length > 0
    ? Math.min(...fusionCosts)
    : null;
  const affordableTargets = fusionCosts.filter((cost) => cost <= state.energy).length;
  const attackRate = (1000 / tower.cooldown).toFixed(2);
  const targetsLabel = tower.attackType === 'aura' || tower.targetCount >= 99
    ? 'Все'
    : `${tower.targetCount}`;
  const saleValue = Math.floor(tower.investedEnergy * 0.6);
  const isConfirmingSale = saleConfirmTowerId === tower.instanceId;
  const hasCompatibleTargets = compatibleTargets.length > 0;
  const canAffordAnyFusion = affordableTargets > 0;

  const clearSelection = () => {
    setSaleConfirmTowerId(null);
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const confirmSale = () => {
    setSaleConfirmTowerId(null);
    dispatch({ type: 'SELL_SELECTED_TOWER' });
  };

  return (
    <aside className="tower-inspector tower-inspector--compact" aria-label="Выбранная башня">
      <div className="tower-inspector__heading tower-inspector__heading--compact">
        <span
          className="tower-inspector__symbol"
          style={{ borderColor: tower.color, color: tower.color }}
        >
          {tower.symbol}
        </span>
        <div className="tower-inspector__identity">
          <p className="eyebrow">Синтез и башня</p>
          <h2>{tower.name}</h2>
          <span className={`tower-level ${rarity.cssClass}`}>
            Ранг {tower.level} · {rarity.label}
          </span>
        </div>
        <button
          aria-label="Снять выделение с башни"
          className="tower-inspector__close"
          onClick={clearSelection}
          title="Снять выделение"
          type="button"
        >
          ×
        </button>
      </div>

      <div className="composition-bar composition-bar--compact" aria-label={getCompositionLabel(tower.composition)}>
        {segments.map((colorId, index) => (
          <span
            key={`${colorId}-${index}`}
            style={{ background: FUSION_COLORS[colorId].hex }}
          />
        ))}
      </div>

      <div className="composition-pills" aria-label="Цветовой состав">
        {compositionEntries.map((entry) => (
          <span key={entry.colorId} style={{ '--composition-color': FUSION_COLORS[entry.colorId].hex } as React.CSSProperties}>
            <b>{FUSION_COLORS[entry.colorId].label}</b>
            {entry.value}/10
          </span>
        ))}
      </div>

      <dl className="tower-details tower-details--compact">
        <div><dt>Урон</dt><dd>{tower.damage}</dd></div>
        <div><dt>Радиус</dt><dd>{tower.range}</dd></div>
        <div><dt>Перезарядка</dt><dd>{(tower.cooldown / 1000).toFixed(2)}с</dd></div>
        <div><dt>Атак/с</dt><dd>{attackRate}</dd></div>
        <div><dt>Целей</dt><dd>{targetsLabel}</dd></div>
        <div><dt>Вложено</dt><dd>{tower.investedEnergy} ⚡</dd></div>
      </dl>

      <section className="ability-list ability-list--compact" aria-label="Активные способности">
        <div className="compact-section-heading">
          <strong>Способности</strong>
          <span>{abilities.length || 'нет'}</span>
        </div>
        {abilities.length > 0 ? (
          <ul>
            {abilities.map((ability) => (
              <li key={ability.id} title={ability.fullDescription}>
                <div>
                  <span>{ability.name}</span>
                  <small>{ability.fullDescription}</small>
                </div>
                <em>{getAbilityExactEffect(ability.id)}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ability-list__empty">
            Чистый цвет. Соедините с другой башней, чтобы открыть синергию.
          </p>
        )}
      </section>

      <section className={`fusion-console${isFusionSource ? ' fusion-console--active' : ''}${hasCompatibleTargets && !canAffordAnyFusion ? ' fusion-console--insufficient' : ''}`} aria-label="Управление слиянием">
        <div className="compact-section-heading">
          <strong>Слияние</strong>
          <span>{compatibleTargets.length} совместимых</span>
        </div>

        <div className="fusion-progress" aria-label="Этапы слияния">
          <span className="is-done">1 · Башня</span>
          <span className={isFusionSource ? 'is-done' : 'is-active'}>2 · Режим</span>
          <span className={isFusionSource ? 'is-active' : ''}>3 · Цель</span>
        </div>

        <div className="fusion-console__metrics">
          <div>
            <span>Цена</span>
            <strong>{fusionCostRange ? `${fusionCostRange} ⚡` : '—'}</strong>
          </div>
          <div>
            <span>Энергия</span>
            <strong>{state.energy} ⚡</strong>
          </div>
          <div>
            <span>Доступно</span>
            <strong>{affordableTargets}/{compatibleTargets.length}</strong>
          </div>
        </div>

        <p className="fusion-console__message" role="status">
          {isFusionSource
            ? 'Выберите подсвеченную башню на поле. Цена указана рядом с целью.'
            : hasCompatibleTargets
              ? canAffordAnyFusion
                ? 'Готово: включите режим и выберите цель на поле.'
                : minimumFusionCost !== null
                  ? `Нужно ещё ${minimumFusionCost - state.energy} энергии.`
                  : 'Слияние пока недоступно.'
              : 'Поставьте совместимый цвет рядом с дорогой.'}
        </p>

        {isFusionSource ? (
          <button
            className="tower-upgrade-button tower-upgrade-button--compact"
            onClick={() => dispatch({ type: 'CANCEL_FUSION' })}
            type="button"
          >
            Отменить режим слияния
          </button>
        ) : (
          <button
            className="tower-upgrade-button tower-upgrade-button--compact"
            disabled={!hasCompatibleTargets}
            onClick={() => dispatch({ type: 'START_FUSION' })}
            type="button"
          >
            {fusionCostRange ? `Начать слияние · ${fusionCostRange} ⚡` : 'Нет совместимой башни'}
          </button>
        )}
      </section>

      <div className={`tower-danger-zone${isConfirmingSale ? ' tower-danger-zone--confirming' : ''}`}>
        {!isConfirmingSale ? (
          <button
            aria-expanded="false"
            className="tower-danger-zone__trigger"
            onClick={() => setSaleConfirmTowerId(tower.instanceId)}
            type="button"
          >
            Продажа башни
          </button>
        ) : (
          <>
            <span>Продать за <strong>{saleValue} ⚡</strong>?</span>
            <button
              className="tower-danger-zone__cancel"
              onClick={() => setSaleConfirmTowerId(null)}
              type="button"
            >
              Отмена
            </button>
            <button
              className="tower-danger-zone__confirm"
              onClick={confirmSale}
              type="button"
            >
              Подтвердить
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
