import { useReducer } from 'react';
import { battleReducer, createInitialBattleState } from '../game/battleReducer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { TowerShop } from './TowerShop';

export function Battle() {
  const [state, dispatch] = useReducer(
    battleReducer,
    createInitialBattleState(),
  );

  useBattleLoop(dispatch);

  return (
    <main className="game-app">
      <BattleHeader state={state} />

      <div className="game-layout">
        <section className="battle-card" aria-label="Игровое поле">
          <BattleBoard state={state} dispatch={dispatch} />
          <BattleControls state={state} dispatch={dispatch} />
        </section>

        <TowerShop
          selectedTowerId={state.selectedTowerId}
          dispatch={dispatch}
        />
      </div>
    </main>
  );
}
