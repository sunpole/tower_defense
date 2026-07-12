import { useEffect } from 'react';
import { TICK_MS } from '../config/gameSettings';
import type { BalanceDispatch } from '../game/balanceLab';

export function useBattleLoop(dispatch: BalanceDispatch) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: 'BALANCE_TICK', realDelta: TICK_MS });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [dispatch]);
}
