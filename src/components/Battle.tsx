import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
} from 'react';
import {
  balanceLabReducer,
  createBalanceInitialState,
} from '../game/balanceLab';
import {
  buildSessionSummary,
  getBalanceProfileSnapshot,
  recordBalanceSession,
  subscribeBalanceProfile,
} from '../game/gameStats';
import { useBattleLoop } from '../hooks/useBattleLoop';
import type { BattleDispatch } from '../types/Battle';
import { BalanceToolbar } from './BalanceToolbar';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { BattleStatusBars } from './BattleStatusBars';
import { BattleSummary } from './BattleSummary';
import { FusionAtlas } from './FusionAtlas';
import { TowerInspector } from './TowerInspector';
import { TowerShop } from './TowerShop';

export function Battle() {
  const [state, balanceDispatch] = useReducer(
    balanceLabReducer,
    createBalanceInitialState(),
  );
  const profile = useSyncExternalStore(
    subscribeBalanceProfile,
    getBalanceProfileSnapshot,
    getBalanceProfileSnapshot,
  );
  const recordedSessionRef = useRef<string | null>(null);
  const debugMode = useMemo(
    () => new URLSearchParams(window.location.search).get('debug') === '1',
    [],
  );
  const dispatch = useCallback<BattleDispatch>(
    (action) => balanceDispatch(action),
    [balanceDispatch],
  );
  const summary = useMemo(() => {
    const isFinished = state.status === 'victory' || state.status === 'defeat';
    return isFinished ? buildSessionSummary(state) : null;
  }, [state]);

  useBattleLoop(balanceDispatch);

  useEffect(() => {
    if (!summary || recordedSessionRef.current === summary.sessionId) return;
    recordedSessionRef.current = summary.sessionId;
    recordBalanceSession(summary);
  }, [summary]);

  const selectedPlacedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  ) ?? null;

  return (
    <>
      <main className="game-app game-app--workspace">
        <BattleHeader state={state} />

        <div className="game-workspace">
          <div className="game-atlas-column">
            <FusionAtlas />
          </div>

          <section className="battle-card battle-card--workspace" aria-label="Игровое поле">
            <BattleBoard state={state} dispatch={dispatch} />
            <BattleStatusBars state={state} />
            <BalanceToolbar
              state={state}
              dispatch={balanceDispatch}
              debugMode={debugMode}
            />
            <BattleControls state={state} dispatch={dispatch} />
          </section>

          <div className="game-right-column">
            <TowerShop state={state} dispatch={dispatch} />
            <TowerInspector
              tower={selectedPlacedTower}
              state={state}
              dispatch={dispatch}
            />
          </div>
        </div>
      </main>

      {summary && (
        <BattleSummary
          summary={summary}
          profile={profile}
          dispatch={balanceDispatch}
        />
      )}
    </>
  );
}
