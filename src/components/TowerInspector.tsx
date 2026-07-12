import { useState, type CSSProperties } from 'react';
import { FUSION_COLORS, FUSION_RARITIES } from '../config/fusionSystem';
import {
  getLevelBonusLabel,
  getSameLevelPairs,
  getSuperFusionTargets,
} from '../game/fusionEconomy';
import {
  getActiveFusionAbilities,
  getCompositionEntries,
  getCompositionLabel,
  getCompositionSegments,
} from '../game/fusionLogic';
import { getAbilityExactEffect } from '../game/fusionPresentation';
import type { BattleDispatch, BattleState, BattleTower } from '../types/Battle';

interface TowerInspectorProps {
  tower: BattleTower | null;
  state: BattleState;
  dispatch: BattleDispatch;
}

interface FusionWalletProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

function FusionWallet({ state, dispatch }: FusionWalletProps) {
  const randomPairs = getSameLevelPairs(state.towers);
  const canRandomFuse =
    state.fusionPoints > 0 &&
    randomPairs.length > 0 &&
    state.status !== 'victory' &&
    state.status !== 'defeat';

  return (
    <section className="fusion-wallet" aria-label="Очки слияния">
      <div className="fusion-wallet__currency">
        <span>🎲 Очки слияния</span>
        <strong>{state.fusionPoints}</strong>
        <small>Кубики дают очки по числу точек на грани.</small>
      </div>
      <div className="fusion-wallet__currency fusion-wallet__currency--super">
        <span>🧬 Суперслияние</span>
        <strong>{state.superFusionPoints}</strong>
        <small>По 1 очку за убитого мини-босса или босса.</small>
      </div>
      <button
        className="random-fusion-button"
        disabled={!canRandomFuse}
        onClick={() => dispatch({ type: 'RANDOM_FUSION' })}
        type="button"
      >
        🎲 Случайное слияние · 1
      </button>
      <p>
        Игра сама выбирает две башни одного уровня. Результат получает прежние шансы 5/5–9/1, но уровень не повышается.
      </p>
    </section>
  );
}

export function TowerInspector({ tower, state, dispatch }: TowerInspectorProps) {
  const [saleConfirmTowerId, setSaleConfirmTowerId] = useState<string | null>(null);

  if (!tower) {
    return (
      <aside className="tower-inspector tower-inspector--empty tower-inspector--fusion-hub" aria-label="Слияния">
        <FusionWallet state={state} dispatch={dispatch} />
        <div className="tower-inspector__empty-hint">
          <div className="tower-inspector__empty-icon" aria-hidden="true">◎</div>
          <div>
            <p className="eyebrow">Башня</p>
            <h2>Выберите башню</h2>
            <p className="tower-inspector__empty">
              Для суперслияния сначала выберите башню на поле.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const abilities = getActiveFusionAbilities(tower.composition);
  const rarity = FUSION_RARITIES[tower.fusionRarity];
  const segments = getCompositionSegments(tower.composition);
  const compositionEntries = getCompositionEntries(tower.composition);
  const isSuperFusionSource = state.fusionSourceTowerId === tower.instanceId;
  const superTargets = getSuperFusionTargets(tower, state.towers);
  const attackRate = (1000 / tower.cooldown).toFixed(2);
  const targetsLabel = tower.attackType === 'aura' || tower.targetCount >= 99
    ? 'Все'
    : `${tower.targetCount}`;
  const saleValue = Math.floor(tower.investedEnergy * 0.6);
  const isConfirmingSale = saleConfirmTowerId === tower.instanceId;
  const canStartSuper = state.superFusionPoints > 0 && superTargets.length > 0;

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
      <FusionWallet state={state} dispatch={dispatch} />

      <div className="tower-inspector__heading tower-inspector__heading--compact">
        <span
          className="tower-inspector__symbol"
          style={{ borderColor: tower.color, color: tower.color }}
        >
          {tower.symbol}
        </span>
        <div className="tower-inspector__identity">
          <p className="eyebrow">Башня и суперслияние</p>
          <h2>{tower.name}</h2>
          <span className={`tower-level ${rarity.cssClass}`}>
            Уровень {tower.level} · {rarity.label} · {getLevelBonusLabel(tower.level)}
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
          <span
            key={entry.colorId}
            style={{ '--composition-color': FUSION_COLORS[entry.colorId].hex } as CSSProperties}
          >
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
            Чистый цвет. Случайное или суперслияние создаст цветовую синергию.
          </p>
        )}
      </section>

      <section className={`super-fusion-console${isSuperFusionSource ? ' super-fusion-console--active' : ''}`} aria-label="Суперслияние">
        <div className="compact-section-heading">
          <strong>🧬 Суперслияние</strong>
          <span>{superTargets.length} целей уровня {tower.level}</span>
        </div>
        <p>
          Две башни одного уровня превращаются в случайную башню уровня {tower.level + 1}. Новый уровень усиливает базовые характеристики ещё на 50%.
        </p>
        {isSuperFusionSource ? (
          <button
            className="tower-upgrade-button tower-upgrade-button--compact"
            onClick={() => dispatch({ type: 'CANCEL_SUPER_FUSION' })}
            type="button"
          >
            Отменить суперслияние
          </button>
        ) : (
          <button
            className="tower-upgrade-button tower-upgrade-button--compact"
            disabled={!canStartSuper}
            onClick={() => dispatch({ type: 'START_SUPER_FUSION' })}
            type="button"
          >
            {state.superFusionPoints < 1
              ? 'Нет очка суперслияния'
              : superTargets.length < 1
                ? `Нет второй башни уровня ${tower.level}`
                : 'Выбрать вторую башню · 1 🧬'}
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
