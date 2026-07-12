import { FUSION_COLORS, FUSION_RARITIES } from '../config/fusionSystem';
import {
  canFuseTowers,
  getActiveFusionAbilities,
  getCompositionEntries,
  getCompositionLabel,
  getCompositionSegments,
  getFusionCost,
} from '../game/fusionLogic';
import type { BattleDispatch, BattleState, BattleTower } from '../types/Battle';

interface TowerInspectorProps {
  tower: BattleTower | null;
  state: BattleState;
  dispatch: BattleDispatch;
}

export function TowerInspector({ tower, state, dispatch }: TowerInspectorProps) {
  if (!tower) {
    return (
      <aside className="tower-inspector" aria-label="Выбранная башня">
        <p className="eyebrow">Установленная башня</p>
        <h2>Башня не выбрана</h2>
        <p className="tower-inspector__empty">
          Нажмите на занятую клетку поля, чтобы увидеть состав, радиус, способности и действия башни.
        </p>
      </aside>
    );
  }

  const abilities = getActiveFusionAbilities(tower.composition);
  const rarity = FUSION_RARITIES[tower.fusionRarity];
  const segments = getCompositionSegments(tower.composition);
  const fusionSource = state.towers.find((candidate) => candidate.instanceId === state.fusionSourceTowerId);
  const isFusionSource = state.fusionSourceTowerId === tower.instanceId;
  const possibleTargets = fusionSource
    ? state.towers.filter((candidate) => canFuseTowers(fusionSource, candidate))
    : [];
  const previewCost = fusionSource && fusionSource.instanceId !== tower.instanceId && canFuseTowers(fusionSource, tower)
    ? getFusionCost(fusionSource, tower)
    : null;

  return (
    <aside className="tower-inspector" aria-label="Выбранная башня">
      <div className="tower-inspector__heading">
        <span className="tower-inspector__symbol" style={{ borderColor: tower.color, color: tower.color }}>
          {tower.symbol}
        </span>
        <div>
          <p className="eyebrow">Установленная башня</p>
          <h2>{tower.name}</h2>
          <span className={`tower-level ${rarity.cssClass}`}>
            Ранг {tower.level} · {rarity.label}
          </span>
        </div>
      </div>

      <div className="composition-bar" aria-label={getCompositionLabel(tower.composition)}>
        {segments.map((colorId, index) => (
          <span key={`${colorId}-${index}`} style={{ background: FUSION_COLORS[colorId].hex }} />
        ))}
      </div>

      <dl className="composition-list">
        {getCompositionEntries(tower.composition).map((entry) => (
          <div key={entry.colorId}>
            <dt>{FUSION_COLORS[entry.colorId].label}</dt>
            <dd>{entry.value}/10 · {FUSION_COLORS[entry.colorId].primaryStatLabel}</dd>
          </div>
        ))}
      </dl>

      <dl className="tower-details">
        <div>
          <dt>Урон</dt>
          <dd>{tower.damage}</dd>
        </div>
        <div>
          <dt>Радиус</dt>
          <dd>{tower.range}</dd>
        </div>
        <div>
          <dt>Перезарядка</dt>
          <dd>{(tower.cooldown / 1000).toFixed(2)} сек.</dd>
        </div>
        <div>
          <dt>Вложено</dt>
          <dd>{tower.investedEnergy}</dd>
        </div>
      </dl>

      <div className="ability-list">
        <strong>Активные способности</strong>
        {abilities.length > 0 ? (
          <ul>
            {abilities.map((ability) => (
              <li key={ability.id}>
                <span>{ability.name}</span>
                <small>{ability.shortDescription}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>Чистая башня. Соедините её с другим цветом, чтобы открыть синергию.</p>
        )}
      </div>

      {previewCost !== null && (
        <p className="tower-inspector__warning">
          Слияние с выбранной исходной башней стоит {previewCost} энергии.
        </p>
      )}

      {isFusionSource && (
        <p className="tower-inspector__warning">
          Режим слияния включён. Совместимые башни подсвечены на поле: {possibleTargets.length}.
        </p>
      )}

      <div className="tower-inspector__actions">
        {isFusionSource ? (
          <button
            className="tower-upgrade-button"
            onClick={() => dispatch({ type: 'CANCEL_FUSION' })}
            type="button"
          >
            Отменить слияние
          </button>
        ) : (
          <button
            className="tower-upgrade-button"
            onClick={() => dispatch({ type: 'START_FUSION' })}
            type="button"
          >
            Начать слияние
          </button>
        )}

        <button
          className="tower-sell-button"
          onClick={() => dispatch({ type: 'SELL_SELECTED_TOWER' })}
          type="button"
        >
          Продать за {Math.floor(tower.investedEnergy * 0.6)}
        </button>

        <button
          className="tower-back-button"
          onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
          type="button"
        >
          Назад к арсеналу
        </button>
      </div>

      <p className="tower-inspector__note">
        Слияние заменяет обычное улучшение. Чем реже состав, тем дороже следующее слияние.
      </p>
    </aside>
  );
}
