import { BOARD_COLUMNS, BOARD_ROWS } from '../config/gameSettings';
import { getEntityPosition } from '../game/battleGeometry';
import type { BattleEffect } from '../types/Battle';

interface BattleEffectsProps {
  effects: BattleEffect[];
}

export function BattleEffects({ effects }: BattleEffectsProps) {
  return (
    <div className="battle-effects" aria-hidden="true">
      <svg
        className="battle-effects__svg"
        viewBox={`0 0 ${BOARD_COLUMNS} ${BOARD_ROWS}`}
        preserveAspectRatio="none"
      >
        {effects.map((effect) => {
          const fromX = effect.fromX + 0.5;
          const fromY = effect.fromY + 0.5;
          const toX = effect.toX + 0.5;
          const toY = effect.toY + 0.5;

          if (effect.kind === 'aura') {
            return (
              <g key={effect.id} className="combat-effect combat-effect--aura">
                <circle
                  cx={fromX}
                  cy={fromY}
                  r={Math.max(0.35, effect.radius ?? 1)}
                  style={{ stroke: effect.color }}
                />
                <circle
                  className="combat-effect__core"
                  cx={fromX}
                  cy={fromY}
                  r="0.18"
                  style={{ fill: effect.color }}
                />
              </g>
            );
          }

          return (
            <g key={effect.id} className={`combat-effect combat-effect--${effect.kind}`}>
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                style={{ stroke: effect.color }}
              />
              <circle
                className="combat-effect__impact"
                cx={toX}
                cy={toY}
                r="0.16"
                style={{ fill: effect.color }}
              />
            </g>
          );
        })}
      </svg>

      {effects
        .filter((effect) => effect.label)
        .map((effect) => (
          <span
            className="combat-effect__label"
            key={`${effect.id}-label`}
            style={{
              ...getEntityPosition(effect.fromX, effect.fromY),
              borderColor: effect.color,
              color: effect.color,
            }}
          >
            {effect.label}
          </span>
        ))}
    </div>
  );
}
