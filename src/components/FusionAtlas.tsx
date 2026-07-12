import { FUSION_COLORS } from '../config/fusionSystem';
import type { FusionColorId } from '../config/fusionSystem';
import { getFusionAtlasRows } from '../game/fusionLogic';
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
  return (
    <aside className="fusion-atlas">
      <button
        className="fusion-atlas__toggle"
        onClick={() => dispatch({ type: 'TOGGLE_FUSION_ATLAS' })}
        type="button"
      >
        {state.showFusionAtlas ? 'Скрыть атлас слияний' : 'Показать атлас слияний'}
      </button>

      {state.showFusionAtlas && (
        <div className="fusion-atlas__content">
          <p className="eyebrow">Атлас слияний</p>
          <h2>27 цветовых результатов</h2>
          <p>
            Все вероятности открыты заранее. 5/5 даёт две способности, а редкие 9/1 дают самую сильную способность доминирующего цвета.
          </p>

          {PAIRS.map(([leftColor, rightColor]) => (
            <section className="fusion-pair" key={`${leftColor}-${rightColor}`}>
              <h3>
                <span style={{ color: FUSION_COLORS[leftColor].hex }}>{FUSION_COLORS[leftColor].label}</span>
                {' + '}
                <span style={{ color: FUSION_COLORS[rightColor].hex }}>{FUSION_COLORS[rightColor].label}</span>
              </h3>

              <div className="fusion-result-list">
                {getFusionAtlasRows(leftColor, rightColor).map((row) => (
                  <article className="fusion-result" key={`${row.label}-${row.chance}`}>
                    <strong>{row.name}</strong>
                    <span>{row.label} · {row.chance}% · {row.rarity.label}</span>
                    <small>{row.abilities.map((ability) => ability.name).join(' + ')}</small>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
