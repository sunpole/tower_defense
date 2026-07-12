import { TOTAL_WAVES } from '../config/gameSettings';
import type { BattleState } from '../types/Battle';

interface BattleHeaderProps {
  state: BattleState;
}

export function BattleHeader({ state }: BattleHeaderProps) {
  return (
    <header className="game-header">
      <div>
        <p className="eyebrow">Цветовой Завет · Кубическая судьба</p>
        <h1>Защита пути</h1>
      </div>

      <div className="game-stats game-stats--six" aria-label="Показатели игры">
        <div><span>Энергия</span><strong>{state.energy}</strong></div>
        <div><span>Слияние 🎲</span><strong>{state.fusionPoints}</strong></div>
        <div><span>Супер 🧬</span><strong>{state.superFusionPoints}</strong></div>
        <div><span>База</span><strong>{state.baseHealth}</strong></div>
        <div><span>Волна</span><strong>{state.wave}/{TOTAL_WAVES}</strong></div>
        <div><span>Уничтожено</span><strong>{state.kills}</strong></div>
      </div>
    </header>
  );
}
