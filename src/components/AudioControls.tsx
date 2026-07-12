import { useSyncExternalStore } from 'react';
import { audioEngine } from '../audio/audioEngine';

export function AudioControls() {
  const settings = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    audioEngine.getSnapshot,
  );

  return (
    <div className="audio-controls" aria-label="Настройки звука">
      <button
        aria-label={settings.masterMuted ? 'Включить весь звук' : 'Выключить весь звук'}
        aria-pressed={!settings.masterMuted}
        className={`audio-control${settings.masterMuted ? '' : ' audio-control--active'}`}
        onClick={() => audioEngine.toggleMaster()}
        title={settings.masterMuted ? 'Включить весь звук' : 'Выключить весь звук'}
        type="button"
      >
        {settings.masterMuted ? '🔇' : '🔊'}
        <span>Звук</span>
      </button>

      <button
        aria-label={settings.musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
        aria-pressed={settings.musicEnabled}
        className={`audio-control${settings.musicEnabled ? ' audio-control--active' : ''}`}
        onClick={() => audioEngine.toggleMusic()}
        title={settings.musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
        type="button"
      >
        ♫
        <span>Музыка</span>
      </button>

      <button
        aria-label={settings.sfxEnabled ? 'Выключить эффекты' : 'Включить эффекты'}
        aria-pressed={settings.sfxEnabled}
        className={`audio-control${settings.sfxEnabled ? ' audio-control--active' : ''}`}
        onClick={() => audioEngine.toggleSfx()}
        title={settings.sfxEnabled ? 'Выключить эффекты' : 'Включить эффекты'}
        type="button"
      >
        ✦
        <span>Эффекты</span>
      </button>
    </div>
  );
}
