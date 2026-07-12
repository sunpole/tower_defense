import { useState } from 'react';
import {
  BASE_FUSION_COST,
  FUSION_COLORS,
} from '../config/fusionSystem';
import type { FusionColorId } from '../config/fusionSystem';
import {
  buildFusionStats,
  getFusionAtlasRows,
} from '../game/fusionLogic';
import { getAbilityExactEffect } from '../game/fusionPresentation';
import type { BattleDispatch, BattleState } from '../types/Battle';

const PAIRS: Array<[FusionColorId, FusionColorId]> = [
  ['red', 'green'],
  ['red', 'blue'],
  ['green', 'blue'],
];

interface FusionAtlasProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function FusionAtlas({ state, dispatch }: FusionAtlasProps) {
  const [activePairIndex, setActivePairIndex] = useState(0);
  const [leftColor, rightColor] = PAIRS[activePairIndex];
  const rows = getFusionAtlasRows(leftColor, rightColor);

  const closeAtlas = () => {
    if (state.showFusionAtlas) {
      dispatch({ type: 'TOGGLE_FUSION_ATLAS' });
    }
  };

  return (
    <>
      <aside className="fusion-atlas-launcher">
        <button
          className="fusion-atlas__toggle"
          onClick={() => dispatch({ type: 'TOGGLE_FUSION_ATLAS' })}
          type="button"
        >
          <span>Атлас слияний</span>
          <small>27 гибридов · цифры · способности</small>
        </button>
      </aside>

      {state.showFusionAtlas && (
        <div
          className="fusion-atlas-overlay"
          onMouseDown={closeAtlas}
          role="presentation"
        >
          <section
            aria-labelledby="fusion-atlas-title"
            aria-modal="true"
            className="fusion-atlas-drawer"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="fusion-atlas__header">
              <div>
                <p className="eyebrow">Атлас слияний</p>
                <h2 id="fusion-atlas-title">Все 27 двухцветных башен</h2>
                <p>
                  Здесь показаны характеристики башни сразу после первого
                  слияния двух чистых башен: ранг 2, цена {BASE_FUSION_COST}
                  {' '}энергии.
                </p>
              </div>
              <button
                aria-label="Закрыть атлас слияний"
                className="fusion-atlas__close"
                onClick={closeAtlas}
                type="button"
              >
                ×
              </button>
            </header>

            <nav aria-label="Пары цветов" className="fusion-atlas__tabs">
              {PAIRS.map(([firstColor, secondColor], index) => (
                <button
                  aria-pressed={activePairIndex === index}
                  className={activePairIndex === index ? 'is-active' : ''}
                  key={`${firstColor}-${secondColor}`}
                  onClick={() => setActivePairIndex(index)}
                  type="button"
                >
                  <span style={{ color: FUSION_COLORS[firstColor].hex }}>
                    {FUSION_COLORS[firstColor].label}
                  </span>
                  {' + '}
                  <span style={{ color: FUSION_COLORS[secondColor].hex }}>
                    {FUSION_COLORS[secondColor].label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="fusion-atlas__legend">
              <div>
                <strong style={{ color: FUSION_COLORS[leftColor].hex }}>
                  {FUSION_COLORS[leftColor].label}
                </strong>
                <span>
                  {FUSION_COLORS[leftColor].primaryStatLabel}: чем больше число,
                  тем сильнее влияние цвета.
                </span>
              </div>
              <div>
                <strong style={{ color: FUSION_COLORS[rightColor].hex }}>
                  {FUSION_COLORS[rightColor].label}
                </strong>
                <span>
                  {FUSION_COLORS[rightColor].primaryStatLabel}: влияет на итоговые
                  параметры даже без активной способности.
                </span>
              </div>
            </div>

            <div className="fusion-atlas-grid">
              {rows.map((row) => {
                const stats = buildFusionStats(row.composition, 2);
                const targetLabel = stats.targetCount >= 99
                  ? 'Все в радиусе'
                  : `${stats.targetCount}`;

                return (
                  <article
                    className={`fusion-atlas-card ${row.rarity.cssClass}`}
                    key={`${row.label}-${row.chance}`}
                  >
                    <div className="fusion-atlas-card__heading">
                      <div>
                        <strong>{row.name}</strong>
                        <span>{row.label}</span>
                      </div>
                      <div className="fusion-atlas-card__chance">
                        <b>{row.chance}%</b>
                        <small>{row.rarity.label}</small>
                      </div>
                    </div>

                    <dl className="fusion-atlas-card__stats">
                      <div>
                        <dt>Урон</dt>
                        <dd>{stats.damage}</dd>
                      </div>
                      <div>
                        <dt>Радиус</dt>
                        <dd>{stats.range}</dd>
                      </div>
                      <div>
                        <dt>Перезарядка</dt>
                        <dd>{(stats.cooldown / 1000).toFixed(2)} сек.</dd>
                      </div>
                      <div>
                        <dt>Целей</dt>
                        <dd>{targetLabel}</dd>
                      </div>
                    </dl>

                    <div className="fusion-atlas-card__abilities">
                      <strong>
                        {row.abilities.length === 2
                          ? 'Две активные способности'
                          : 'Активная способность'}
                      </strong>
                      {row.abilities.map((ability) => (
                        <div key={ability.id}>
                          <span>{ability.name}</span>
                          <p>{ability.fullDescription}</p>
                          <small>{getAbilityExactEffect(ability.id)}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
