import {
  BOSS_MUSIC_TRACKS,
  NORMAL_MUSIC_TRACKS,
  PRIORITY_SFX,
} from './audioManifest';

export type MusicMode = 'normal' | 'boss' | 'silent';

export interface AudioSettings {
  masterMuted: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface PlaySfxOptions {
  group?: string;
  cooldownMs?: number;
  maxVoices?: number;
  volume?: number;
  playbackRate?: number;
  priority?: boolean;
  probability?: number;
}

const STORAGE_KEY = 'tower-defense-audio-settings-v1';
const MAX_ACTIVE_SFX = 16;
const DEFAULT_SETTINGS: AudioSettings = {
  masterMuted: false,
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
  musicVolume: 0.3,
  sfxVolume: 0.6,
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function loadSettings(): AudioSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<AudioSettings>;

    return {
      masterMuted: Boolean(parsed.masterMuted),
      musicEnabled: parsed.musicEnabled !== false,
      sfxEnabled: parsed.sfxEnabled !== false,
      masterVolume: clamp(Number(parsed.masterVolume) || DEFAULT_SETTINGS.masterVolume),
      musicVolume: clamp(Number(parsed.musicVolume) || DEFAULT_SETTINGS.musicVolume),
      sfxVolume: clamp(Number(parsed.sfxVolume) || DEFAULT_SETTINGS.sfxVolume),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

class AudioEngine {
  private settings: AudioSettings = loadSettings();
  private listeners = new Set<() => void>();
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loadingBuffers = new Map<string, Promise<AudioBuffer | null>>();
  private missingFiles = new Set<string>();
  private cooldowns = new Map<string, number>();
  private activeSfx = 0;
  private activeGroups = new Map<string, number>();
  private unlocked = false;
  private desiredMusicMode: MusicMode = 'silent';
  private currentMusicMode: MusicMode = 'silent';
  private currentMusic: HTMLAudioElement | null = null;
  private lastMusicPath = '';
  private fadeTimer: number | null = null;
  private duckTimer: number | null = null;
  private musicDuck = 1;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.settings;

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private saveSettings() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Игра остаётся работоспособной при запрете localStorage.
    }
  }

  private updateSettings(next: AudioSettings) {
    this.settings = next;
    this.saveSettings();
    this.applyVolumes();
    this.emit();
  }

  toggleMaster() {
    this.updateSettings({
      ...this.settings,
      masterMuted: !this.settings.masterMuted,
    });
  }

  toggleMusic() {
    const musicEnabled = !this.settings.musicEnabled;
    this.updateSettings({ ...this.settings, musicEnabled });

    if (!musicEnabled) {
      this.currentMusic?.pause();
    } else if (this.unlocked && this.desiredMusicMode !== 'silent') {
      void this.startNextMusic(this.desiredMusicMode, true);
    }
  }

  toggleSfx() {
    this.updateSettings({
      ...this.settings,
      sfxEnabled: !this.settings.sfxEnabled,
    });
  }

  private ensureContext() {
    if (this.context) return this.context;

    const AudioContextConstructor = window.AudioContext;
    this.context = new AudioContextConstructor();
    this.masterGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 5;
    this.compressor.attack.value = 0.006;
    this.compressor.release.value = 0.18;
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.context.destination);
    this.applyVolumes();
    return this.context;
  }

  async unlock() {
    if (this.unlocked) return;

    const context = this.ensureContext();
    try {
      await context.resume();
      this.unlocked = true;
      void this.preloadPrioritySounds();
      if (this.desiredMusicMode !== 'silent') {
        void this.startNextMusic(this.desiredMusicMode, true);
      }
    } catch {
      // Следующий пользовательский клик повторит разблокировку.
    }
  }

  private applyVolumes() {
    const master = this.settings.masterMuted ? 0 : this.settings.masterVolume;
    if (this.masterGain) this.masterGain.gain.value = master;
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.sfxVolume;
    if (this.currentMusic) {
      this.currentMusic.volume = this.getMusicTargetVolume();
    }
  }

  private getMusicTargetVolume() {
    if (
      this.settings.masterMuted ||
      !this.settings.musicEnabled ||
      this.desiredMusicMode === 'silent'
    ) {
      return 0;
    }

    return clamp(
      this.settings.masterVolume *
        this.settings.musicVolume *
        this.musicDuck,
    );
  }

  private async loadBuffer(path: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(path)) return this.buffers.get(path) ?? null;
    if (this.missingFiles.has(path)) return null;
    if (this.loadingBuffers.has(path)) return this.loadingBuffers.get(path) ?? null;

    const promise = (async () => {
      try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const context = this.ensureContext();
        const buffer = await context.decodeAudioData(arrayBuffer);
        this.buffers.set(path, buffer);
        return buffer;
      } catch {
        this.missingFiles.add(path);
        return null;
      } finally {
        this.loadingBuffers.delete(path);
      }
    })();

    this.loadingBuffers.set(path, promise);
    return promise;
  }

  private async preloadPrioritySounds() {
    await Promise.allSettled(
      PRIORITY_SFX.map((path) => this.loadBuffer(path)),
    );
  }

  async playSfx(path: string, options: PlaySfxOptions = {}) {
    if (
      !this.unlocked ||
      this.settings.masterMuted ||
      !this.settings.sfxEnabled ||
      Math.random() > (options.probability ?? 1)
    ) {
      return;
    }

    const now = performance.now();
    const group = options.group ?? path;
    const cooldownMs = options.cooldownMs ?? 0;
    const previousPlay = this.cooldowns.get(group) ?? -Infinity;
    if (now - previousPlay < cooldownMs) return;

    const groupVoices = this.activeGroups.get(group) ?? 0;
    const maxVoices = options.maxVoices ?? 2;
    if (groupVoices >= maxVoices) return;
    if (this.activeSfx >= MAX_ACTIVE_SFX && !options.priority) return;

    const buffer = await this.loadBuffer(path);
    if (!buffer || !this.context || !this.sfxGain) return;

    this.cooldowns.set(group, performance.now());
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = options.playbackRate ?? 1;
    gain.gain.value = clamp(options.volume ?? 1, 0, 1.5);
    source.connect(gain);
    gain.connect(this.sfxGain);

    this.activeSfx += 1;
    this.activeGroups.set(group, groupVoices + 1);

    source.onended = () => {
      this.activeSfx = Math.max(0, this.activeSfx - 1);
      const remaining = Math.max(0, (this.activeGroups.get(group) ?? 1) - 1);
      if (remaining === 0) this.activeGroups.delete(group);
      else this.activeGroups.set(group, remaining);
      source.disconnect();
      gain.disconnect();
    };

    source.start();
  }

  playRandomSfx(paths: readonly string[], options: PlaySfxOptions = {}) {
    if (paths.length === 0) return;
    const path = paths[Math.floor(Math.random() * paths.length)];
    void this.playSfx(path, options);
  }

  setMusicMode(mode: MusicMode) {
    this.desiredMusicMode = mode;

    if (mode === 'silent') {
      this.fadeOutMusic();
      return;
    }

    if (!this.unlocked || !this.settings.musicEnabled || this.settings.masterMuted) {
      return;
    }

    if (
      this.currentMusic &&
      !this.currentMusic.paused &&
      this.currentMusicMode === mode
    ) {
      return;
    }

    void this.startNextMusic(mode, false);
  }

  private chooseMusicPath(mode: Exclude<MusicMode, 'silent'>) {
    const tracks = mode === 'boss' ? BOSS_MUSIC_TRACKS : NORMAL_MUSIC_TRACKS;
    const choices = tracks.filter((path) => path !== this.lastMusicPath);
    const pool = choices.length > 0 ? choices : tracks;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private async startNextMusic(
    mode: Exclude<MusicMode, 'silent'>,
    immediate: boolean,
  ) {
    if (
      !this.unlocked ||
      !this.settings.musicEnabled ||
      this.settings.masterMuted ||
      this.desiredMusicMode === 'silent'
    ) {
      return;
    }

    const path = this.chooseMusicPath(mode);
    const next = new Audio(path);
    next.preload = 'auto';
    next.volume = 0;
    next.addEventListener('ended', () => {
      if (this.currentMusic === next && this.desiredMusicMode === mode) {
        void this.startNextMusic(mode, false);
      }
    });

    try {
      await next.play();
    } catch {
      return;
    }

    const previous = this.currentMusic;
    this.currentMusic = next;
    this.currentMusicMode = mode;
    this.lastMusicPath = path;
    this.crossfade(previous, next, immediate ? 250 : 1600);
  }

  private crossfade(
    previous: HTMLAudioElement | null,
    next: HTMLAudioElement,
    durationMs: number,
  ) {
    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    const startedAt = performance.now();
    const targetVolume = this.getMusicTargetVolume();
    const previousStartVolume = previous?.volume ?? 0;

    this.fadeTimer = window.setInterval(() => {
      const progress = clamp((performance.now() - startedAt) / durationMs);
      next.volume = targetVolume * progress;
      if (previous) previous.volume = previousStartVolume * (1 - progress);

      if (progress >= 1) {
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        if (previous) {
          previous.pause();
          previous.src = '';
        }
      }
    }, 40);
  }

  private fadeOutMusic() {
    const current = this.currentMusic;
    if (!current) return;
    const startVolume = current.volume;
    const startedAt = performance.now();

    if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
    this.fadeTimer = window.setInterval(() => {
      const progress = clamp((performance.now() - startedAt) / 500);
      current.volume = startVolume * (1 - progress);
      if (progress >= 1) {
        if (this.fadeTimer !== null) window.clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        current.pause();
      }
    }, 40);
  }

  duckMusic(durationMs = 900, factor = 0.55) {
    this.musicDuck = clamp(factor, 0.1, 1);
    this.applyVolumes();
    if (this.duckTimer !== null) window.clearTimeout(this.duckTimer);
    this.duckTimer = window.setTimeout(() => {
      this.musicDuck = 1;
      this.applyVolumes();
      this.duckTimer = null;
    }, durationMs);
  }
}

export const audioEngine = new AudioEngine();
