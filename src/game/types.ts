/**
 * Tile Quest — shared domain types.
 * Kept separate from the store so engine, config and tests can import
 * them without pulling in React/Zustand.
 */

export type ScreenName = 'home' | 'map' | 'daily' | 'awards' | 'profile' | 'game';

export interface GameParams {
  mode: 'main' | 'daily';
  /** 1..100 for main mode */
  level: number;
  /** 0..2 for daily mode */
  dailyIndex?: number;
}

export interface ScreenState {
  name: ScreenName;
  game?: GameParams;
}

export interface BestRecord {
  moves: number;
  timeMs: number;
}

export interface Stats {
  gamesPlayed: number;
  wins: number;
  hintsUsed: number;
  adsWatched: number;
  totalMoves: number;
  totalTimeMs: number;
  perfectRuns: number;
  noHintWins: number;
  fastWins: number;
  dailyCompleted: number;
  longestStreak: number;
  /** Transient counters reset on UTC day/week rollover (missions). */
  winsToday: number;
  noHintWinsToday: number;
  dailiesToday: number;
  winsWeek: number;
  levelsCompleted: number;
}

export interface Settings {
  music: boolean;
  sfx: boolean;
  vibration: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  musicVol: number;
  sfxVol: number;
}

/** Mid-game snapshot so a run survives app restarts (main mode only). */
export interface InProgressGame {
  level: number;
  mode: 'main' | 'daily';
  dailyIndex?: number;
  board: number[];
  n: number;
  moves: number;
  elapsedMs: number;
  hintsUsed: number;
}

export interface SaveState {
  version: number;
  /** Anonymous device account id (maps to Firebase anonymous auth in native build). */
  deviceId: string;
  username: string;
  avatarId: number;
  country: string;
  xp: number;
  coins: number;
  premium: boolean;
  /** Highest playable main level. */
  unlockedLevel: number;
  stars: Record<number, number>;
  best: Record<number, BestRecord>;
  completedLevels: number[];
  hintsLeft: number;
  hintsDay: string;
  streak: number;
  lastLoginDay: string;
  rewardClaimedDay: string;
  dailyDay: string;
  dailyDone: [boolean, boolean, boolean];
  missionsDay: string;
  missionsWeek: string;
  claimedMissions: string[];
  achievements: string[];
  stats: Stats;
  themeId: string;
  ownedThemes: string[];
  settings: Settings;
  tutorialDone: boolean;
  inProgress: InProgressGame | null;
  /** Completed levels since the last interstitial (ad cadence). */
  winsSinceAd: number;
  lastSeenTs: number;
}

export interface LevelResult {
  level: number;
  mode: 'main' | 'daily';
  dailyIndex?: number;
  moves: number;
  timeMs: number;
  hintsUsed: number;
}

export interface RewardSummary {
  stars: number;
  coinsEarned: number;
  xpEarned: number;
  firstClear: boolean;
  newUnlocked: number | null;
  xpLevel: number;
  xpLevelBefore: number;
  chest: boolean;
  bestMoves: boolean;
  bestTime: boolean;
}

export interface ChestReward {
  kind: 'coins' | 'hints';
  amount: number;
}

export interface DailyRewardClaim {
  day: number;
  label: string;
  kind: 'coins' | 'hints' | 'skip' | 'theme';
  amount: number;
  themeId?: string;
}
