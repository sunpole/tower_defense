import { useMemo } from 'react';
import { runBalanceDiagnostics } from '../game/balanceDiagnostics';
import type {
  BalanceBattleState,
  BalanceDispatch,
  GameSpeed,
} from '../game/balanceLab';

interface BalanceToolbarProps {
  state: BalanceBattleState;
  dispatch: BalanceDispatch;
  debugMode: boolean;
}

const SPEEDS: GameSpeed[] = [1, 2, 4];
const DEBUG_WAVES = [5, 10, 15, 20, 25, 30];

export function BalanceToolbar({
  state,
  dispatch,
  debugMode,
}: BalanceToolbarProps) {
  const isRunning = state.status === 'running';
  const diagnostics = useMemo(
    () => (debugMode ? runBalanceDiagnostics(500) : null),
    [debugMode],
  );

  return (
    <section className="balance-toolbar" aria-label="Управление скоростью боя">
      <div className="balance-toolbar__main">
        <button
          className={`balance-control${state.isPaused ? ' balance-control--active' : ''}`}
          disabled={!isRunning}
          onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
          type="button"
        >
          {state.isPaused ? '▶ Продолжить' : 'Ⅱ Пауза'}
        </button>

        <div className="balance-speed" aria-label="Скорость игры">
          {SPEEDS.map((speed) => (
            <button
              className={`balance-control${state.gameSpeed === speed ? ' balance-control--active' : ''}`}
              key={speed}
              onClick={() => dispatch({ type: 'SET_GAME_SPEED', speed })}
              type="button"
            >
              ×{speed}
            </button>
          ))}
        </div>

        <button
          className={`balance-control balance-control--auto${state.autoStart ? ' balance-control--active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_START' })}
          type="button"
        >
          Автоволны: {state.autoStart ? 'вкл.' : 'выкл.'}
        </button>

        <span className="balance-toolbar__time">
          Темп: ×{state.gameSpeed}{state.isPaused ? ' · пауза' : ''}
        </span>
      </div>

      {debugMode && (
        <div className="balance-debug" aria-label="Режим разработчика">
          <strong>DEBUG</strong>
          {diagnostics && (
            <span
              className={`balance-debug__diagnostics${diagnostics.passed ? ' balance-debug__diagnostics--passed' : ' balance-debug__diagnostics--failed'}`}
              title={diagnostics.errors.join('\n') || 'Ошибок не найдено'}
            >
              {diagnostics.passed
                ? `Маршруты: ${diagnostics.checkedRoutes}/${diagnostics.checkedRoutes} ✓`
                : `Ошибки маршрутов: ${diagnostics.errors.length}`}
            </span>
          )}
          <span>Следующая волна:</span>
          {DEBUG_WAVES.map((wave) => (
            <button
              disabled={isRunning}
              key={wave}
              onClick={() => dispatch({ type: 'DEBUG_SET_NEXT_WAVE', wave })}
              type="button"
            >
              {wave}
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'DEBUG_ADD_ENERGY', amount: 500 })}
            type="button"
          >
            +500 энергии
          </button>
          <button
            onClick={() => dispatch({ type: 'DEBUG_RESTORE_BASE' })}
            type="button"
          >
            Восстановить базу
          </button>
          <button
            disabled={isRunning}
            onClick={() => dispatch({ type: 'RESTART_SAME_ROUTE' })}
            type="button"
          >
            Повторить seed
          </button>
        </div>
      )}
    </section>
  );
}
