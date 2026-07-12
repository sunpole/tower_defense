import { useReducer } from 'react';
import { battleReducer, createInitialBattleState } from '../game/battleReducer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import '../towerManagement.css';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { TowerInspector } from './TowerInspector';
import { TowerShop } from './TowerShop';

export function Battle() {
  const [state, dispatch] = useReducer(
    battleReducer,
    createInitialBattleState(),
  );

  useBattleLoop(dispatch);

  const selectedPlacedTower = state.towers.find(
    (tower) => tower.instanceId === state.selectedPlacedTowerId,
  ) ?? null;

  return (
    <main className="game-app">
      <BattleHeader state={state} />

      <div className="game-layout">
        <section className="battle-card" aria-label="Игровое поле">
          <BattleBoard state={state} dispatch={dispatch} />
          <BattleControls state={state} dispatch={dispatch} />
        </section>

        <div className="game-sidebar">
          <TowerShop
            selectedTowerId={state.selectedTowerId}
            dispatch={dispatch}
          />
          <TowerInspector
            tower={selectedPlacedTower}
            energy={state.energy}
            dispatch={dispatch}
          />
        </div>
      </div>
    </main>
  );
}
