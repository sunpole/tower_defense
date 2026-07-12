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

  return (
    <>
      {!isFinalState && (
        <section
          className={`wave-preview wave-preview--${plan.threat.toLowerCase()}`}
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
              <dd>×{plan.hpMultiplier.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Скорость</dt>
              <dd>×{plan.speedMultiplier.toFixed(2)}</dd>
            </div>
          </dl>
        </section>
      )}

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
          Начать заново
        </button>
      </div>
    </>
  );
}
