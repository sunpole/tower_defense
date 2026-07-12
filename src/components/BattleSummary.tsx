import type { BalanceDispatch } from '../game/balanceLab';
import {
  formatElapsedTime,
  getAverageWave,
  getWinRate,
  type BalanceProfileStats,
  type BalanceSessionSummary,
} from '../game/gameStats';

interface BattleSummaryProps {
  summary: BalanceSessionSummary;
  profile: BalanceProfileStats;
  dispatch: BalanceDispatch;
}

export function BattleSummary({
  summary,
  profile,
  dispatch,
}: BattleSummaryProps) {
  const victory = summary.result === 'victory';

  return (
    <div className="battle-summary-backdrop" role="presentation">
      <section
        aria-labelledby="battle-summary-title"
        className={`battle-summary battle-summary--${summary.result}`}
        role="dialog"
      >
        <p className="battle-summary__eyebrow">Отчёт полигона баланса</p>
        <h2 id="battle-summary-title">
          {victory ? 'Победа' : 'Поражение'} · волна {summary.waveReached}/30
        </h2>

        <div className="battle-summary__grid">
          <div><span>Seed</span><strong>{summary.routeSeed}</strong></div>
          <div><span>Маршрут</span><strong>{summary.routeLength} клеток</strong></div>
          <div><span>Уничтожено</span><strong>{summary.kills}</strong></div>
          <div><span>Время</span><strong>{formatElapsedTime(summary.elapsedMs)}</strong></div>
          <div><span>Установлено башен</span><strong>{summary.placements}</strong></div>
          <div><span>Слияний</span><strong>{summary.fusions}</strong></div>
          <div><span>Максимальный ранг</span><strong>{summary.highestRank}</strong></div>
          <div><span>Энергия</span><strong>{summary.remainingEnergy}</strong></div>
          <div><span>Мини-боссов</span><strong>{summary.miniBossKills}</strong></div>
          <div><span>Больших боссов</span><strong>{summary.bossKills}</strong></div>
          <div><span>HP базы</span><strong>{summary.remainingBaseHealth}</strong></div>
          <div><span>Поворотов</span><strong>{summary.routeTurns}</strong></div>
        </div>

        <div className="battle-profile">
          <h3>Локальная статистика</h3>
          <div>
            <span>Партий <strong>{profile.games}</strong></span>
            <span>Побед <strong>{profile.wins}</strong></span>
            <span>Поражений <strong>{profile.losses}</strong></span>
            <span>Победы <strong>{getWinRate(profile).toFixed(1)}%</strong></span>
            <span>Средняя волна <strong>{getAverageWave(profile).toFixed(1)}</strong></span>
          </div>
        </div>

        <div className="battle-summary__actions">
          <button
            className="primary-action"
            onClick={() => dispatch({ type: 'RESTART_SAME_ROUTE' })}
            type="button"
          >
            Повторить эту карту
          </button>
          <button
            className="secondary-action"
            onClick={() => dispatch({ type: 'RESET' })}
            type="button"
          >
            Новая карта
          </button>
        </div>
      </section>
    </div>
  );
}
