@echo off
chcp 65001 > nul
echo Creating Vite + React + TypeScript project...
call npm create vite@latest . -- --template react-ts
echo Installing additional packages...
call npm install pixi.js
call npm install @types/pixi.js
call npm install @serbanghita-gamedev/pathfinding
echo Done! Run start.bat to start dev server.
pause