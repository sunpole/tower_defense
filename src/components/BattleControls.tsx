import type { BattleDispatch, BattleState } from '../types/Battle';

interface BattleControlsProps {
  state: BattleState;
  dispatch: BattleDispatch;
}

export function BattleControls({ state, dispatch }: BattleControlsProps) {
  return (
    <>
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
          {state.wave === 0 ? 'Запустить первую волну' : 'Запустить следующую волну'}
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
