@echo off
chcp 65001 > nul
echo Creating project structure...

cd src

mkdir components
mkdir hooks
mkdir types
mkdir utils
mkdir config
mkdir context
mkdir assets

type nul > components/Camp.tsx
type nul > components/Battle.tsx
type nul > components/Shop.tsx
type nul > components/Inventory.tsx
type nul > components/Converter.tsx
type nul > components/Portal.tsx
type nul > components/BuffIndicator.tsx

type nul > hooks/useGameState.ts
type nul > hooks/useBattle.ts
type nul > hooks/usePathfinding.ts

type nul > types/Tower.ts
type nul > types/Enemy.ts
type nul > types/Currency.ts
type nul > types/Buff.ts
type nul > types/Config.ts

type nul > utils/pathfinder.ts
type nul > utils/fpsMeter.ts
type nul > utils/math.ts
type nul > utils/spriteLoader.ts
type nul > utils/audioManager.ts

type nul > config/towers.ts
type nul > config/enemies.ts
type nul > config/currencies.ts
type nul > config/buffs.ts
type nul > config/gameSettings.ts

type nul > context/GameContext.tsx

cd ..

mkdir public\assets\icons
mkdir public\assets\sounds

echo Structure created successfully!
pause