/**
 * Game balance, meta definitions and economy.
 * In the native build these values are hydrated from Firebase Remote Config
 * (with these exact numbers as the local defaults), so live-ops can tune
 * rewards, ad cadence and events without a release.
 */

import type { SaveState } from './types';

export const TOTAL_LEVELS = 100;
export const DAILY_SLOTS = 3;
export const HINTS_PER_DAY = 3;
export const AD_EVERY = 4; // interstitial cadence: every N completed levels

/** Difficulty bands: 1-20 → 3x3, 21-40 → 4x4, 41-70 → 5x5, 71-100 → 6x6. */
export function gridForLevel(level: number): number {
  if (level <= 20) return 3;
  if (level <= 40) return 4;
  if (level <= 70) return 5;
  return 6;
}

export const DAILY_GRID = [3, 4, 5] as const;

export interface Band {
  from: number;
  to: number;
  n: number;
  name: string;
}

export const BANDS: Band[] = [
  { from: 1, to: 20, n: 3, name: 'Meadow Trail' },
  { from: 21, to: 40, n: 4, name: 'Amber Cliffs' },
  { from: 41, to: 70, n: 5, name: 'Twilight Reef' },
  { from: 71, to: 100, n: 6, name: 'Star Summit' },
];

export const PAR_MOVES: Record<number, number> = { 3: 30, 4: 80, 5: 150, 6: 260 };
export const PAR_TIME_MS: Record<number, number> = {
  3: 45_000,
  4: 150_000,
  5: 360_000,
  6: 640_000,
};

/** Three-star rating: based on move count vs. par for the grid size. */
export function starsFor(moves: number, n: number): number {
  const par = PAR_MOVES[n];
  if (moves <= par) return 3;
  if (moves <= Math.round(par * 1.6)) return 2;
  return 1;
}

/** First-clear coin bonus encourages forward progress. */
export function coinsFor(stars: number, firstClear: boolean): number {
  return firstClear ? 30 + stars * 15 : 10 + stars * 5;
}

export function xpFor(stars: number, n: number, timeMs: number, hintsUsed: number): number {
  let xp = 40 + stars * 20;
  if (timeMs <= PAR_TIME_MS[n]) xp += 25; // speed bonus
  if (hintsUsed === 0) xp += 20; // clean run bonus
  return xp;
}

export function xpLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 80)) + 1;
}

export function xpProgress(xp: number): { level: number; into: number; need: number } {
  const level = xpLevel(xp);
  const base = (level - 1) * (level - 1) * 80;
  const next = level * level * 80;
  return { level, into: xp - base, need: next - base };
}

/* ---------------------------------- themes --------------------------------- */

export interface ThemeVars {
  bg1: string;
  bg2: string;
  glow: string;
  panel: string;
  panel2: string;
  edge: string;
  text: string;
  sub: string;
  accent: string;
  accent2: string;
  gold: string;
  frame: string;
  boardbg: string;
  navbg: string;
}

export interface ThemeDef {
  id: string;
  name: string;
  cost: number;
  premiumOnly?: boolean;
  vars: ThemeVars;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    cost: 0,
    vars: {
      bg1: '#08202b', bg2: '#0d3a4a', glow: 'rgba(46,196,182,0.22)',
      panel: '#0f2e3c', panel2: '#123c4d', edge: '#1e5468',
      text: '#f2f7f5', sub: '#9fc3c9', accent: '#2ec4b6', accent2: '#4cc9f0',
      gold: '#ffb638', frame: '#14485c', boardbg: '#0a2836', navbg: 'rgba(6,26,34,0.92)',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    cost: 0,
    vars: {
      bg1: '#0b0e14', bg2: '#141a24', glow: 'rgba(76,201,240,0.16)',
      panel: '#151b27', panel2: '#1b2330', edge: '#2a3547',
      text: '#eef1f6', sub: '#94a3b8', accent: '#4cc9f0', accent2: '#a78bfa',
      gold: '#fbbf24', frame: '#1d2634', boardbg: '#10151f', navbg: 'rgba(8,11,17,0.92)',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    cost: 120,
    vars: {
      bg1: '#eceae4', bg2: '#f7f5ef', glow: 'rgba(224,83,47,0.14)',
      panel: '#fbfaf6', panel2: '#f1efe7', edge: '#d8d4c6',
      text: '#23262b', sub: '#6b7076', accent: '#e0532f', accent2: '#2c5364',
      gold: '#e8a33d', frame: '#e4e0d3', boardbg: '#e7e4da', navbg: 'rgba(240,238,231,0.94)',
    },
  },
  {
    id: 'glass',
    name: 'Glass',
    cost: 150,
    vars: {
      bg1: '#0e2233', bg2: '#1b4965', glow: 'rgba(94,234,212,0.2)',
      panel: 'rgba(233,246,255,0.10)', panel2: 'rgba(233,246,255,0.16)', edge: 'rgba(233,246,255,0.25)',
      text: '#f2fbff', sub: '#b9d7e4', accent: '#5eead4', accent2: '#7dd3fc',
      gold: '#fcd34d', frame: 'rgba(233,246,255,0.14)', boardbg: 'rgba(4,20,32,0.55)', navbg: 'rgba(10,28,42,0.85)',
    },
  },
  {
    id: 'wood',
    name: 'Wood',
    cost: 180,
    vars: {
      bg1: '#241105', bg2: '#4a2410', glow: 'rgba(232,163,61,0.2)',
      panel: '#5c3018', panel2: '#6f3c1e', edge: '#8a4f28',
      text: '#fdf0dc', sub: '#d3ae82', accent: '#e8a33d', accent2: '#f4c26b',
      gold: '#ffd166', frame: '#7a431f', boardbg: '#3a1c0b', navbg: 'rgba(26,12,4,0.92)',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    cost: 260,
    vars: {
      bg1: '#0d0114', bg2: '#24033b', glow: 'rgba(255,47,179,0.22)',
      panel: '#1b0630', panel2: '#2a0a48', edge: '#4b1273',
      text: '#fdf3ff', sub: '#c79be0', accent: '#ff2fb3', accent2: '#22e0ff',
      gold: '#ffe94a', frame: '#3a0d61', boardbg: '#140524', navbg: 'rgba(13,1,20,0.92)',
    },
  },
  {
    id: 'space',
    name: 'Space',
    cost: 0,
    premiumOnly: true,
    vars: {
      bg1: '#02030a', bg2: '#0b1030', glow: 'rgba(124,108,255,0.24)',
      panel: '#0d1330', panel2: '#141b42', edge: '#26306b',
      text: '#eef2ff', sub: '#9aa7d8', accent: '#7c6cff', accent2: '#38e1ff',
      gold: '#ffd166', frame: '#1a2250', boardbg: '#060a1e', navbg: 'rgba(2,3,10,0.92)',
    },
  },
];

/* ------------------------------- achievements ------------------------------ */

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (s: SaveState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', name: 'First Steps', desc: 'Complete level 1', icon: 'flag', check: (s) => s.stats.levelsCompleted >= 1 },
  { id: 'ten', name: 'Trailblazer', desc: 'Complete 10 levels', icon: 'map', check: (s) => s.stats.levelsCompleted >= 10 },
  { id: 'fifty', name: 'Pathfinder', desc: 'Complete 50 levels', icon: 'compass', check: (s) => s.stats.levelsCompleted >= 50 },
  { id: 'hundred', name: 'Quest Master', desc: 'Complete all 100 levels', icon: 'crown', check: (s) => s.stats.levelsCompleted >= 100 },
  { id: 'moves1k', name: 'Marathon Mover', desc: 'Make 1,000 total moves', icon: 'moves', check: (s) => s.stats.totalMoves >= 1000 },
  { id: 'nohint', name: 'Pure Mind', desc: 'Win a puzzle without hints', icon: 'bulb', check: (s) => s.stats.noHintWins >= 1 },
  { id: 'perfect', name: 'Perfectionist', desc: 'Earn a 3-star rating', icon: 'star', check: (s) => s.stats.perfectRuns >= 1 },
  { id: 'fast', name: 'Fast Solver', desc: 'Win in under 60% of par time', icon: 'bolt', check: (s) => s.stats.fastWins >= 1 },
  { id: 'daily10', name: 'Daily Devotee', desc: 'Complete 10 daily challenges', icon: 'sun', check: (s) => s.stats.dailyCompleted >= 10 },
  { id: 'dailymaster', name: 'Daily Master', desc: 'Complete 30 daily challenges', icon: 'gift', check: (s) => s.stats.dailyCompleted >= 30 },
  { id: 'streak7', name: 'Week of Fire', desc: 'Reach a 7-day login streak', icon: 'flame', check: (s) => s.stats.longestStreak >= 7 },
  { id: 'streak100', name: 'Unstoppable', desc: 'Reach a 100-day login streak', icon: 'shield', check: (s) => s.stats.longestStreak >= 100 },
  { id: 'themes3', name: 'Collector', desc: 'Own 3 themes', icon: 'palette', check: (s) => s.ownedThemes.length >= 3 },
];

/* --------------------------------- missions -------------------------------- */

export interface Mission {
  id: string;
  name: string;
  target: number;
  stat: 'winsToday' | 'noHintWinsToday' | 'dailiesToday' | 'winsWeek';
  coins: number;
  weekly?: boolean;
}

export const MISSIONS: Mission[] = [
  { id: 'd-win3', name: 'Win 3 puzzles today', target: 3, stat: 'winsToday', coins: 60 },
  { id: 'd-nohint1', name: 'Win without a hint today', target: 1, stat: 'noHintWinsToday', coins: 50 },
  { id: 'd-daily2', name: 'Complete 2 daily challenges', target: 2, stat: 'dailiesToday', coins: 80 },
  { id: 'w-win15', name: 'Win 15 puzzles this week', target: 15, stat: 'winsWeek', coins: 250, weekly: true },
];

/* ------------------------------- daily rewards ------------------------------ */

export interface DailyRewardDef {
  label: string;
  kind: 'coins' | 'hints' | 'skip' | 'theme';
  amount: number;
  themeId?: string;
}

export const DAILY_REWARDS: DailyRewardDef[] = [
  { label: '75 Coins', kind: 'coins', amount: 75 },
  { label: '1 Hint', kind: 'hints', amount: 1 },
  { label: 'Level Skip', kind: 'skip', amount: 1 },
  { label: 'Glass Theme', kind: 'theme', amount: 0, themeId: 'glass' },
  { label: '150 Coins', kind: 'coins', amount: 150 },
  { label: '2 Hints', kind: 'hints', amount: 2 },
  { label: '300 Coins', kind: 'coins', amount: 300 },
];

/* ----------------------------------- shop ---------------------------------- */

export const SHOP = {
  rewardedCoins: 50,
  hintRefillCost: 80,
  premiumLabel: '$2.99',
};

export const AVATARS = [
  { bg: '#ffb638', face: '#5c3a00' },
  { bg: '#2ec4b6', face: '#04302b' },
  { bg: '#ff5d73', face: '#4d0a16' },
  { bg: '#4cc9f0', face: '#063446' },
  { bg: '#7b4dd6', face: '#251048' },
  { bg: '#95d5b2', face: '#14402a' },
];

export const COUNTRIES = [
  '—', 'United States', 'United Kingdom', 'India', 'Germany', 'France', 'Japan',
  'Brazil', 'Canada', 'Australia', 'Spain', 'Italy', 'Mexico', 'Philippines', 'Other',
];
