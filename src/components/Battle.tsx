import { useReducer } from 'react';
import { battleReducer, createInitialBattleState } from '../game/battleReducer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import '../towerManagement.css';
import '../colorFusion.css';
import '../fusionUx.css';
import '../combatEffects.css';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { FusionAtlas } from './FusionAtlas';
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
          {selectedPlacedTower ? (
            <TowerInspector
              tower={selectedPlacedTower}
              state={state}
              dispatch={dispatch}
            />
          ) : (
            <TowerShop
              state={state}
              dispatch={dispatch}
            />
          )}
          <FusionAtlas state={state} dispatch={dispatch} />
        </div>
      </div>
    </main>
  );
}
