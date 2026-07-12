import { useEffect } from 'react';
import { TICK_MS } from '../config/gameSettings';
import type { BattleDispatch } from '../types/Battle';

export function useBattleLoop(dispatch: BattleDispatch) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      dispatch({ type: 'TICK', delta: TICK_MS });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [dispatch]);
}
