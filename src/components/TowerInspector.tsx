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
  if (!tower) {
    return (
      <aside className="tower-inspector" aria-label="Выбранная башня">
        <p className="eyebrow">Слияние и башня</p>
        <h2>Башня не выбрана</h2>
        <p className="tower-inspector__empty">
          Магазин остаётся доступен выше. Нажмите на установленную башню, чтобы
          увидеть состав, радиус, перезарядку, способности и цену слияния.
        </p>
      </aside>
    );
  }

  const abilities = getActiveFusionAbilities(tower.composition);
  const rarity = FUSION_RARITIES[tower.fusionRarity];
  const segments = getCompositionSegments(tower.composition);
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
    ? 'Все в радиусе'
    : `${tower.targetCount}`;

  return (
    <aside className="tower-inspector" aria-label="Выбранная башня">
      <div className="tower-inspector__heading">
        <span
          className="tower-inspector__symbol"
          style={{ borderColor: tower.color, color: tower.color }}
        >
          {tower.symbol}
        </span>
        <div>
          <p className="eyebrow">Слияние и башня</p>
          <h2>{tower.name}</h2>
          <span className={`tower-level ${rarity.cssClass}`}>
            Ранг {tower.level} · {rarity.label}
          </span>
        </div>
      </div>

      <div className="composition-bar" aria-label={getCompositionLabel(tower.composition)}>
        {segments.map((colorId, index) => (
          <span
            key={`${colorId}-${index}`}
            style={{ background: FUSION_COLORS[colorId].hex }}
          />
        ))}
      </div>

      <dl className="composition-list">
        {getCompositionEntries(tower.composition).map((entry) => (
          <div key={entry.colorId}>
            <dt>{FUSION_COLORS[entry.colorId].label}</dt>
            <dd>
              {entry.value}/10 · {FUSION_COLORS[entry.colorId].primaryStatLabel}
            </dd>
          </div>
        ))}
      </dl>

      <dl className="tower-details tower-details--extended">
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
          <dt>Атак в секунду</dt>
          <dd>{attackRate}</dd>
        </div>
        <div>
          <dt>Целей</dt>
          <dd>{targetsLabel}</dd>
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
                <small>{ability.fullDescription}</small>
                <em>{getAbilityExactEffect(ability.id)}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Чистая башня. Соедините её с другим цветом, чтобы открыть
            цветовую способность.
          </p>
        )}
      </div>

      <div className="fusion-steps" aria-label="Как выполнить слияние">
        <strong>Как выполнить слияние</strong>
        <ol>
          <li className="is-done">Исходная башня выбрана.</li>
          <li className={isFusionSource ? 'is-done' : 'is-active'}>
            Нажмите кнопку начала слияния.
          </li>
          <li className={isFusionSource ? 'is-active' : ''}>
            Нажмите на подсвеченную башню. Цена будет написана прямо на поле.
          </li>
        </ol>
      </div>

      <div
        className={`fusion-budget${
          compatibleTargets.length > 0 && affordableTargets === 0
            ? ' fusion-budget--insufficient'
            : ''
        }`}
      >
        {compatibleTargets.length > 0 && fusionCostRange ? (
          <>
            <div>
              <span>Цена следующего слияния</span>
              <strong>{fusionCostRange} энергии</strong>
            </div>
            <div>
              <span>Ваш запас</span>
              <strong>{state.energy} энергии</strong>
            </div>
            <p>
              Совместимых башен: {compatibleTargets.length}. Сейчас доступно по
              энергии: {affordableTargets}.
            </p>
            {minimumFusionCost !== null && state.energy < minimumFusionCost && (
              <b>
                Не хватает {minimumFusionCost - state.energy} энергии для самого
                дешёвого слияния.
              </b>
            )}
          </>
        ) : (
          <p>
            Совместимых башен пока нет. Поставьте чистую башню другого цвета
            или подходящий цвет для уже созданного гибрида.
          </p>
        )}
      </div>

      {isFusionSource && (
        <div className="fusion-mode-notice" role="status">
          <strong>Режим слияния включён</strong>
          <span>
            Совместимые башни подсвечены. Зелёная цена означает, что энергии
            хватает; красная — что сначала нужно накопить энергию.
          </span>
        </div>
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
            disabled={compatibleTargets.length === 0}
            onClick={() => dispatch({ type: 'START_FUSION' })}
            type="button"
          >
            {fusionCostRange
              ? `Начать слияние · ${fusionCostRange} энергии`
              : 'Нет совместимой башни'}
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
          Снять выделение
        </button>
      </div>

      <p className="tower-inspector__note">
        Чем реже цветовой состав, тем дороже следующее слияние. Все варианты и
        точные параметры постоянно видны в атласе слева.
      </p>
    </aside>
  );
}
