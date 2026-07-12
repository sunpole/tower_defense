import type { BalanceBattleState } from './balanceLab';

const STORAGE_KEY = 'tower-defense-balance-profile-v1';

export interface BalanceSessionSummary {
  sessionId: string;
  result: 'victory' | 'defeat';
  waveReached: number;
  routeSeed: number;
  routeLength: number;
  routeTurns: number;
  kills: number;
  placements: number;
  fusions: number;
  highestRank: number;
  miniBossKills: number;
  bossKills: number;
  remainingEnergy: number;
  remainingBaseHealth: number;
  elapsedMs: number;
  completedAt: string;
}

export interface BalanceProfileStats {
  games: number;
  wins: number;
  losses: number;
  totalWaveReached: number;
  totalElapsedMs: number;
  lastSessions: BalanceSessionSummary[];
}

export const EMPTY_BALANCE_PROFILE: BalanceProfileStats = {
  games: 0,
  wins: 0,
  losses: 0,
  totalWaveReached: 0,
  totalElapsedMs: 0,
  lastSessions: [],
};

const listeners = new Set<() => void>();
let cachedProfile: BalanceProfileStats | null = null;

function readStoredProfile(): BalanceProfileStats {
  if (typeof window === 'undefined') return EMPTY_BALANCE_PROFILE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY_BALANCE_PROFILE;

    const parsed = JSON.parse(stored) as Partial<BalanceProfileStats>;

    return {
      games: Number(parsed.games) || 0,
      wins: Number(parsed.wins) || 0,
      losses: Number(parsed.losses) || 0,
      totalWaveReached: Number(parsed.totalWaveReached) || 0,
      totalElapsedMs: Number(parsed.totalElapsedMs) || 0,
      lastSessions: Array.isArray(parsed.lastSessions)
        ? parsed.lastSessions.slice(0, 10)
        : [],
    };
  } catch {
    return EMPTY_BALANCE_PROFILE;
  }
}

export function buildSessionSummary(
  state: BalanceBattleState,
): BalanceSessionSummary {
  return {
    sessionId: state.sessionId,
    result: state.status === 'victory' ? 'victory' : 'defeat',
    waveReached: state.wave,
    routeSeed: state.routeSeed,
    routeLength: state.routeLength,
    routeTurns: state.routeTurns,
    kills: state.kills,
    placements: state.placements,
    fusions: state.fusions,
    highestRank: state.towers.reduce(
      (maximum, tower) => Math.max(maximum, tower.level),
      0,
    ),
    miniBossKills: state.miniBossKills,
    bossKills: state.bossKills,
    remainingEnergy: state.energy,
    remainingBaseHealth: state.baseHealth,
    elapsedMs: state.elapsedMs,
    completedAt: new Date().toISOString(),
  };
}

export function getBalanceProfileSnapshot(): BalanceProfileStats {
  if (cachedProfile === null) {
    cachedProfile = readStoredProfile();
  }

  return cachedProfile;
}

export function subscribeBalanceProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordBalanceSession(
  summary: BalanceSessionSummary,
): BalanceProfileStats {
  const current = getBalanceProfileSnapshot();

  if (current.lastSessions.some((session) => session.sessionId === summary.sessionId)) {
    return current;
  }

  const next: BalanceProfileStats = {
    games: current.games + 1,
    wins: current.wins + (summary.result === 'victory' ? 1 : 0),
    losses: current.losses + (summary.result === 'defeat' ? 1 : 0),
    totalWaveReached: current.totalWaveReached + summary.waveReached,
    totalElapsedMs: current.totalElapsedMs + summary.elapsedMs,
    lastSessions: [summary, ...current.lastSessions].slice(0, 10),
  };

  cachedProfile = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Игра остаётся работоспособной, даже если локальное хранилище запрещено.
  }

  listeners.forEach((listener) => listener());
  return next;
}

export function getWinRate(profile: BalanceProfileStats) {
  return profile.games > 0 ? (profile.wins / profile.games) * 100 : 0;
}

export function getAverageWave(profile: BalanceProfileStats) {
  return profile.games > 0
    ? profile.totalWaveReached / profile.games
    : 0;
}

export function formatElapsedTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
