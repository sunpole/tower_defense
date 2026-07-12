import { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { SFX } from '../audio/audioManifest';
import type { BattleEffect, BattleEnemy } from '../types/Battle';
import type { BalanceBattleState } from '../game/balanceLab';
import { getWavePlan } from '../game/waveBalance';

function getCombatProbability(speed: number) {
  if (speed >= 4) return 0.22;
  if (speed >= 2) return 0.38;
  return 0.62;
}

function playAbilityEffect(effect: BattleEffect) {
  const label = effect.label ?? '';

  if (label.includes('Критический')) {
    void audioEngine.playSfx(SFX.redCritical, {
      group: 'red-special',
      cooldownMs: 180,
      maxVoices: 2,
      volume: 0.9,
    });
    return true;
  }
  if (label.includes('Казнь')) {
    void audioEngine.playSfx(SFX.redExecute, {
      group: 'red-special',
      cooldownMs: 220,
      maxVoices: 2,
      volume: 1,
      priority: true,
    });
    return true;
  }
  if (label.includes('горизонт')) {
    void audioEngine.playSfx(SFX.redHorizon, {
      group: 'red-special',
      cooldownMs: 220,
      maxVoices: 2,
      volume: 0.95,
    });
    return true;
  }
  if (label.includes('Двойной')) {
    void audioEngine.playSfx(SFX.greenDouble, {
      group: 'green-special',
      cooldownMs: 180,
      maxVoices: 2,
      volume: 0.85,
    });
    return true;
  }
  if (label.includes('Очередь')) {
    void audioEngine.playSfx(SFX.greenBurst, {
      group: 'green-special',
      cooldownMs: 190,
      maxVoices: 2,
      volume: 0.9,
    });
    return true;
  }
  if (label.includes('Перегрузка')) {
    void audioEngine.playSfx(SFX.greenOverload, {
      group: 'green-special',
      cooldownMs: 260,
      maxVoices: 2,
      volume: 1,
      priority: true,
    });
    return true;
  }
  if (label.includes('Рикошет')) {
    void audioEngine.playSfx(SFX.blueRicochet, {
      group: 'blue-special',
      cooldownMs: 180,
      maxVoices: 2,
      volume: 0.85,
    });
    return true;
  }
  if (label.includes('Цепная')) {
    void audioEngine.playSfx(SFX.blueChain, {
      group: 'blue-special',
      cooldownMs: 190,
      maxVoices: 2,
      volume: 0.9,
    });
    return true;
  }
  if (label.includes('Синяя сеть')) {
    void audioEngine.playSfx(SFX.blueNetwork, {
      group: 'blue-special',
      cooldownMs: 260,
      maxVoices: 2,
      volume: 1,
      priority: true,
    });
    return true;
  }

  return false;
}

function playBasicAttack(effect: BattleEffect, gameSpeed: number) {
  const probability = getCombatProbability(gameSpeed);
  const playbackRate = 0.96 + Math.random() * 0.08;

  if (effect.kind === 'laser') {
    audioEngine.playRandomSfx(SFX.blueLaser, {
      group: 'blue-laser',
      cooldownMs: 75,
      maxVoices: 3,
      volume: 0.48,
      playbackRate,
      probability,
    });
    return;
  }

  if (effect.kind === 'aura') {
    audioEngine.playRandomSfx(SFX.greenPulse, {
      group: 'green-pulse',
      cooldownMs: 135,
      maxVoices: 2,
      volume: 0.52,
      playbackRate,
      probability: Math.max(probability, 0.42),
    });
    return;
  }

  audioEngine.playRandomSfx(SFX.redShot, {
    group: 'red-shot',
    cooldownMs: 75,
    maxVoices: 3,
    volume: 0.5,
    playbackRate,
    probability,
  });
}

function getFusionResultSound(rarity: string) {
  switch (rarity) {
    case 'legendary':
      return SFX.fusionLegendary;
    case 'epic':
      return SFX.fusionEpic;
    case 'rare':
      return SFX.fusionRare;
    case 'uncommon':
      return SFX.fusionUncommon;
    default:
      return SFX.fusionCommon;
  }
}

function playSpawnSounds(enemies: BattleEnemy[]) {
  for (const enemy of enemies) {
    if (enemy.archetype === 'cube') {
      void audioEngine.playSfx(SFX.cubeSpawn, {
        group: 'cube-spawn',
        cooldownMs: 160,
        maxVoices: 2,
        volume: 0.85,
        priority: true,
      });
    } else if (enemy.archetype === 'miniBoss') {
      audioEngine.duckMusic(1200, 0.45);
      void audioEngine.playSfx(SFX.miniBossSpawn, {
        group: 'boss-spawn',
        cooldownMs: 600,
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
    } else if (enemy.archetype === 'boss') {
      audioEngine.duckMusic(1500, 0.4);
      void audioEngine.playSfx(SFX.bossSpawn, {
        group: 'boss-spawn',
        cooldownMs: 800,
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
    } else if (enemy.archetype === 'elite') {
      void audioEngine.playSfx(SFX.enemyEliteSpawn, {
        group: 'elite-spawn',
        cooldownMs: 500,
        maxVoices: 1,
        volume: 0.7,
      });
    }
  }
}

function playRemovedEnemySounds(
  removedEnemies: BattleEnemy[],
  previous: BalanceBattleState,
  state: BalanceBattleState,
) {
  if (state.kills > previous.kills) {
    audioEngine.playRandomSfx(SFX.enemyDeath, {
      group: 'enemy-death',
      cooldownMs: 115,
      maxVoices: 3,
      volume: 0.48,
      playbackRate: 0.94 + Math.random() * 0.12,
    });
  }

  const removedCubes = removedEnemies.filter((enemy) => enemy.archetype === 'cube');
  const gainedFusionPoints = state.fusionPoints > previous.fusionPoints;
  if (gainedFusionPoints && removedCubes.length > 0) {
    void audioEngine.playSfx(SFX.cubeDestroy, {
      group: 'cube-destroy',
      cooldownMs: 120,
      maxVoices: 2,
      volume: 0.85,
      priority: true,
    });

    removedCubes.slice(0, 2).forEach((cube, index) => {
      const face = Math.max(1, Math.min(6, cube.cubeFace ?? 1));
      window.setTimeout(() => {
        void audioEngine.playSfx(SFX.cubeReward[face - 1], {
          group: 'cube-reward',
          cooldownMs: 70,
          maxVoices: 2,
          volume: 0.95,
          priority: true,
        });
      }, 70 + index * 90);
    });
  }

  const gainedSuperPoint = state.superFusionPoints > previous.superFusionPoints;
  if (gainedSuperPoint) {
    const miniBossDefeated = removedEnemies.some(
      (enemy) => enemy.archetype === 'miniBoss',
    );
    const bossDefeated = removedEnemies.some(
      (enemy) => enemy.archetype === 'boss',
    );

    if (bossDefeated) {
      audioEngine.duckMusic(1400, 0.42);
      void audioEngine.playSfx(SFX.bossDefeated, {
        group: 'boss-defeated',
        cooldownMs: 800,
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
    } else if (miniBossDefeated) {
      audioEngine.duckMusic(1100, 0.5);
      void audioEngine.playSfx(SFX.miniBossDefeated, {
        group: 'boss-defeated',
        cooldownMs: 700,
        maxVoices: 1,
        volume: 0.95,
        priority: true,
      });
    }
  }
}

export function useBattleAudio(state: BalanceBattleState) {
  const previousStateRef = useRef<BalanceBattleState | null>(null);

  useEffect(() => {
    const unlock = () => {
      void audioEngine.unlock();
    };
    const playButtonClick = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('button')
        : null;
      if (!target || target.hasAttribute('disabled')) return;
      void audioEngine.playSfx(SFX.uiClick, {
        group: 'ui-click',
        cooldownMs: 55,
        maxVoices: 2,
        volume: 0.45,
      });
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    document.addEventListener('click', playButtonClick);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('click', playButtonClick);
      audioEngine.setMusicMode('silent');
    };
  }, []);

  useEffect(() => {
    const previous = previousStateRef.current;
    if (!previous) {
      previousStateRef.current = state;
      return;
    }

    const waveStarted =
      state.status === 'running' &&
      (previous.status !== 'running' || previous.wave !== state.wave);

    if (waveStarted) {
      const plan = getWavePlan(state.wave, state.routeSeed);
      audioEngine.setMusicMode(plan.bossKind === 'none' ? 'normal' : 'boss');
      void audioEngine.playSfx(SFX.waveStart, {
        group: 'wave-event',
        cooldownMs: 350,
        maxVoices: 1,
        volume: 0.8,
        priority: true,
      });
      if (plan.bossKind !== 'none') {
        audioEngine.duckMusic(1000, 0.5);
        void audioEngine.playSfx(SFX.bossWarning, {
          group: 'boss-warning',
          cooldownMs: 800,
          maxVoices: 1,
          volume: 1,
          priority: true,
        });
      }
    }

    if (previous.status === 'running' && state.status === 'idle') {
      audioEngine.setMusicMode('normal');
      void audioEngine.playSfx(SFX.waveComplete, {
        group: 'wave-event',
        cooldownMs: 350,
        maxVoices: 1,
        volume: 0.82,
        priority: true,
      });
    }

    if (previous.status !== 'victory' && state.status === 'victory') {
      audioEngine.setMusicMode('silent');
      audioEngine.duckMusic(1800, 0.35);
      void audioEngine.playSfx(SFX.victory, {
        group: 'result',
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
    }

    if (previous.status !== 'defeat' && state.status === 'defeat') {
      audioEngine.setMusicMode('silent');
      void audioEngine.playSfx(SFX.defeat, {
        group: 'result',
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
    }

    const previousEnemyIds = new Set(
      previous.enemies.map((enemy) => enemy.instanceId),
    );
    const currentEnemyIds = new Set(
      state.enemies.map((enemy) => enemy.instanceId),
    );
    const spawnedEnemies = state.enemies.filter(
      (enemy) => !previousEnemyIds.has(enemy.instanceId),
    );
    const removedEnemies = previous.enemies.filter(
      (enemy) => !currentEnemyIds.has(enemy.instanceId),
    );

    playSpawnSounds(spawnedEnemies);
    playRemovedEnemySounds(removedEnemies, previous, state);

    if (state.baseHealth < previous.baseHealth) {
      const damage = previous.baseHealth - state.baseHealth;
      void audioEngine.playSfx(
        damage >= 2 ? SFX.baseHitHeavy : SFX.baseHitLight,
        {
          group: 'base-hit',
          cooldownMs: 140,
          maxVoices: 2,
          volume: 1,
          priority: true,
        },
      );
      void audioEngine.playSfx(SFX.enemyEscape, {
        group: 'enemy-escape',
        cooldownMs: 120,
        maxVoices: 2,
        volume: 0.75,
        priority: true,
      });
      if (previous.baseHealth > 3 && state.baseHealth <= 3) {
        audioEngine.duckMusic(1200, 0.45);
        void audioEngine.playSfx(SFX.baseCritical, {
          group: 'base-critical',
          maxVoices: 1,
          volume: 1,
          priority: true,
        });
      }
    }

    const previousEffectIds = new Set(
      previous.effects.map((effect) => effect.id),
    );
    state.effects
      .filter((effect) => !previousEffectIds.has(effect.id))
      .forEach((effect) => {
        if (!playAbilityEffect(effect)) {
          playBasicAttack(effect, state.gameSpeed);
        }
      });

    if (state.towers.length > previous.towers.length && state.energy < previous.energy) {
      void audioEngine.playSfx(SFX.purchaseSuccess, {
        group: 'purchase',
        cooldownMs: 100,
        maxVoices: 2,
        volume: 0.72,
      });
    }

    if (
      state.message !== previous.message &&
      (state.message.includes('Недостаточно энергии') ||
        state.message.includes('нельзя') ||
        state.message.includes('Нужно хотя бы'))
    ) {
      void audioEngine.playSfx(
        state.message.includes('Недостаточно энергии')
          ? SFX.purchaseFailed
          : SFX.uiBlocked,
        {
          group: 'blocked',
          cooldownMs: 180,
          maxVoices: 1,
          volume: 0.75,
        },
      );
    }

    if (
      state.message !== previous.message &&
      state.message.startsWith('Случайное слияние выбрало')
    ) {
      audioEngine.duckMusic(900, 0.58);
      void audioEngine.playSfx(SFX.fusionStart, {
        group: 'fusion',
        cooldownMs: 300,
        maxVoices: 1,
        volume: 0.85,
        priority: true,
      });
      const resultTower = state.towers.find(
        (tower) => tower.instanceId === state.selectedPlacedTowerId,
      );
      window.setTimeout(() => {
        void audioEngine.playSfx(
          getFusionResultSound(resultTower?.fusionRarity ?? 'balanced'),
          {
            group: 'fusion-result',
            maxVoices: 1,
            volume: 1,
            priority: true,
          },
        );
      }, 160);
    }

    if (
      !previous.fusionSourceTowerId &&
      state.fusionSourceTowerId
    ) {
      audioEngine.duckMusic(650, 0.65);
      void audioEngine.playSfx(SFX.superReady, {
        group: 'super-fusion',
        cooldownMs: 250,
        maxVoices: 1,
        volume: 0.9,
        priority: true,
      });
    }

    if (
      state.message !== previous.message &&
      state.message.startsWith('Суперслияние завершено')
    ) {
      audioEngine.duckMusic(1300, 0.42);
      void audioEngine.playSfx(SFX.superComplete, {
        group: 'super-fusion',
        cooldownMs: 300,
        maxVoices: 1,
        volume: 1,
        priority: true,
      });
      window.setTimeout(() => {
        void audioEngine.playSfx(SFX.superLevelUp, {
          group: 'super-level',
          maxVoices: 1,
          volume: 1,
          priority: true,
        });
      }, 180);
    }

    previousStateRef.current = state;
  }, [state]);
}
