import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const forwardedArguments = process.argv.slice(2);

if (!existsSync(viteEntry)) {
  console.error('Vite не найден. Сначала выполните npm ci или npm install.');
  process.exit(1);
}

const viteProcess = spawn(
  process.execPath,
  [viteEntry, ...forwardedArguments],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: false,
  },
);

let combinedOutput = '';
let browserOpened = false;

function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

function getChromePath() {
  if (process.platform !== 'win32') return null;

  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(
        process.env.LOCALAPPDATA,
        'Google',
        'Chrome',
        'Application',
        'chrome.exe',
      ),
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        'Google',
        'Chrome',
        'Application',
        'chrome.exe',
      ),
    process.env['PROGRAMFILES(X86)'] &&
      path.join(
        process.env['PROGRAMFILES(X86)'],
        'Google',
        'Chrome',
        'Application',
        'chrome.exe',
      ),
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function openChromeTabs(localUrl) {
  if (browserOpened || process.env.NO_OPEN === '1') return;
  browserOpened = true;

  const origin = new URL(localUrl).origin;
  const gameUrl = `${origin}/`;
  const debugUrl = `${origin}/?debug=1`;
  const urls = [gameUrl, debugUrl];

  if (process.platform === 'win32') {
    const chromePath = getChromePath();

    if (chromePath) {
      spawn(chromePath, ['--new-window', ...urls], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      }).unref();
    } else {
      spawn(
        'cmd.exe',
        ['/d', '/s', '/c', 'start', '""', 'chrome', '--new-window', ...urls],
        {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        },
      ).unref();
    }
  } else if (process.platform === 'darwin') {
    spawn('open', ['-na', 'Google Chrome', '--args', '--new-window', ...urls], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else {
    const chromeProcess = spawn('google-chrome', ['--new-window', ...urls], {
      detached: true,
      stdio: 'ignore',
    });

    chromeProcess.on('error', () => {
      console.warn('Google Chrome не найден. Откройте вкладки вручную:');
      console.warn(gameUrl);
      console.warn(debugUrl);
    });

    chromeProcess.unref();
  }

  console.log('\nChrome: открыты игра и debug-режим в двух вкладках.');
  console.log(`Игра:  ${gameUrl}`);
  console.log(`Debug: ${debugUrl}\n`);
}

function handleOutput(chunk, targetStream) {
  const text = chunk.toString();
  targetStream.write(text);

  combinedOutput = `${combinedOutput}${stripAnsi(text)}`.slice(-6000);
  const localMatch = combinedOutput.match(/Local:\s+(https?:\/\/[^\s]+)/);

  if (localMatch) {
    openChromeTabs(localMatch[1]);
  }
}

viteProcess.stdout.on('data', (chunk) => handleOutput(chunk, process.stdout));
viteProcess.stderr.on('data', (chunk) => handleOutput(chunk, process.stderr));

viteProcess.on('error', (error) => {
  console.error('Не удалось запустить Vite:', error.message);
  process.exitCode = 1;
});

viteProcess.on('exit', (code, signal) => {
  if (signal) {
    process.exitCode = 0;
    return;
  }

  process.exitCode = code ?? 0;
});
