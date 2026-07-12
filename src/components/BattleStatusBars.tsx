import { STARTING_BASE_HEALTH } from '../config/gameSettings';
import { getWaveEnemyCount, getWavePlan } from '../game/waveBalance';
import type { BattleState } from '../types/Battle';

interface BattleStatusBarsProps {
  state: BattleState;
}

export function BattleStatusBars({ state }: BattleStatusBarsProps) {
  const wavePlan = state.wave > 0 ? getWavePlan(state.wave, state.routeSeed) : null;
  const waveTotal = wavePlan ? getWaveEnemyCount(wavePlan) : 0;
  const waveRemaining = state.enemies.length + state.spawnRemaining;
  const waveDefeated = Math.max(0, waveTotal - waveRemaining);
  const wavePercent = waveTotal > 0
    ? Math.min(100, Math.max(0, (waveDefeated / waveTotal) * 100))
    : 0;
  const basePercent = Math.min(
    100,
    Math.max(0, (state.baseHealth / STARTING_BASE_HEALTH) * 100),
  );
  const boss = state.enemies.find(
    (enemy) => enemy.archetype === 'boss' || enemy.archetype === 'miniBoss',
  );
  const bossPercent = boss
    ? Math.min(100, Math.max(0, (boss.hp / boss.maxHp) * 100))
    : 0;

  return (
    <section className="battle-status-bars" aria-label="Состояние волны и базы">
      {boss && (
        <div className="battle-status-bar battle-status-bar--boss">
          <div className="battle-status-bar__label">
            <strong>{boss.name}</strong>
            <span>{Math.max(0, Math.ceil(boss.hp))} / {boss.maxHp} HP</span>
          </div>
          <div
            aria-label="Здоровье босса"
            aria-valuemax={boss.maxHp}
            aria-valuemin={0}
            aria-valuenow={Math.max(0, Math.ceil(boss.hp))}
            className="battle-status-bar__track battle-status-bar__track--boss"
            role="progressbar"
          >
            <span
              className="battle-status-bar__fill battle-status-bar__fill--boss"
              style={{ width: `${bossPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="battle-status-bar">
        <div className="battle-status-bar__label">
          <strong>Волна {state.wave || '—'}</strong>
          <span>
            {waveTotal > 0
              ? `Прогресс ${Math.round(wavePercent)}%`
              : 'Подготовка к первой волне'}
          </span>
        </div>
        <div
          aria-label="Прогресс текущей волны"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(wavePercent)}
          className="battle-status-bar__track"
          role="progressbar"
        >
          <span
            className="battle-status-bar__fill battle-status-bar__fill--wave"
            style={{ width: `${wavePercent}%` }}
          />
        </div>
      </div>

      <div className="battle-status-bar">
        <div className="battle-status-bar__label">
          <strong>База</strong>
          <span>{state.baseHealth} / {STARTING_BASE_HEALTH} HP</span>
        </div>
        <div
          aria-label="Здоровье базы"
          aria-valuemax={STARTING_BASE_HEALTH}
          aria-valuemin={0}
          aria-valuenow={state.baseHealth}
          className="battle-status-bar__track"
          role="progressbar"
        >
          <span
            className="battle-status-bar__fill battle-status-bar__fill--base"
            style={{ width: `${basePercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
