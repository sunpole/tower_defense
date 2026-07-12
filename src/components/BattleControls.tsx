import { TOTAL_WAVES } from '../config/gameSettings';
import {
  formatWaveComposition,
  getWaveEnemyCount,
  getWavePlan,
} from '../game/waveBalance';
import type { BattleDispatch, BattleState } from '../types/Battle';

interface BattleControlsProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function BattleControls({ state, dispatch }: BattleControlsProps) {
  const previewWave = Math.min(
    state.status === 'running' ? state.wave : state.wave + 1,
    TOTAL_WAVES,
  );
  const plan = getWavePlan(previewWave);
  const remainingEnemies = state.enemies.length + state.spawnRemaining;
  const isFinalState = state.status === 'victory' || state.status === 'defeat';
  const routeThreatPercent = Math.round((state.routeThreatMultiplier - 1) * 100);
  const routeThreatLabel = routeThreatPercent === 0
    ? 'без поправки'
    : routeThreatPercent > 0
      ? `+${routeThreatPercent}% HP врагов`
      : `${routeThreatPercent}% HP врагов`;

  return (
    <>
      {!isFinalState && (
        <section
          className={`wave-preview wave-preview--${plan.threat.toLowerCase()}${
            plan.bossKind !== 'none' ? ' wave-preview--boss' : ''
          }`}
          aria-label="Информация о волне"
        >
          <div>
            <span className="wave-preview__eyebrow">
              {state.status === 'running'
                ? `Волна ${state.wave} идёт`
                : `Следующая волна: ${previewWave}/${TOTAL_WAVES}`}
            </span>
            <strong>{plan.label}</strong>
            <small>{formatWaveComposition(plan)}</small>
            {plan.bossKind !== 'none' && (
              <b className={`boss-warning boss-warning--${plan.bossKind}`}>
                {plan.bossKind === 'boss'
                  ? 'Большой босс: 5 урона базе при прорыве'
                  : 'Мини-босс: 3 урона базе при прорыве'}
              </b>
            )}
          </div>
          <dl>
            <div>
              <dt>Угроза</dt>
              <dd>{plan.threat}</dd>
            </div>
            <div>
              <dt>{state.status === 'running' ? 'Осталось' : 'Всего'}</dt>
              <dd>{state.status === 'running' ? remainingEnemies : getWaveEnemyCount(plan)}</dd>
            </div>
            <div>
              <dt>Здоровье</dt>
              <dd>×{(plan.hpMultiplier * state.routeThreatMultiplier).toFixed(2)}</dd>
            </div>
            <div>
              <dt>Скорость</dt>
              <dd>×{plan.speedMultiplier.toFixed(2)}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="route-summary" aria-label="Параметры текущего маршрута">
        <div>
          <span>Карта</span>
          <strong>{state.routeLabel}</strong>
        </div>
        <div>
          <span>Длина</span>
          <strong>{state.routeLength} клеток</strong>
        </div>
        <div>
          <span>Повороты</span>
          <strong>{state.routeTurns}</strong>
        </div>
        <div>
          <span>Баланс пути</span>
          <strong>{routeThreatLabel}</strong>
        </div>
        <div>
          <span>Seed</span>
          <strong>{state.routeSeed}</strong>
        </div>
      </section>

      <div className={`battle-message battle-message--${state.status}`}>
        {state.message}
      </div>

      <div className="battle-actions">
        <button
          className="primary-action"
          disabled={
            state.status === 'running' ||
            state.status === 'victory' ||
            state.status === 'defeat'
          }
          onClick={() => dispatch({ type: 'START_WAVE' })}
          type="button"
        >
          {state.wave === 0
            ? 'Запустить первую волну'
            : `Запустить волну ${Math.min(state.wave + 1, TOTAL_WAVES)}`}
        </button>

        <button
          className="secondary-action"
          onClick={() => dispatch({ type: 'RESET' })}
          type="button"
        >
          Новая карта
        </button>
      </div>
    </>
  );
}
