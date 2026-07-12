import { useReducer } from 'react';
import { battleReducer, createInitialBattleState } from '../game/battleReducer';
import { useBattleLoop } from '../hooks/useBattleLoop';
import '../towerManagement.css';
import '../colorFusion.css';
import '../fusionUx.css';
import '../combatEffects.css';
import '../battleBalance.css';
import '../stableWorkspace.css';
import '../fullscreenWorkspace.css';
import { BattleBoard } from './BattleBoard';
import { BattleControls } from './BattleControls';
import { BattleHeader } from './BattleHeader';
import { BattleStatusBars } from './BattleStatusBars';
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
    <main className="game-app game-app--workspace">
      <BattleHeader state={state} />

      <div className="game-workspace">
        <div className="game-atlas-column">
          <FusionAtlas />
        </div>

        <section className="battle-card battle-card--workspace" aria-label="Игровое поле">
          <BattleBoard state={state} dispatch={dispatch} />
          <BattleStatusBars state={state} />
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
  );
}
