/**
 * Global game store (Zustand) + persistence.
 *
 * The persistence layer plays the role MMKV plays in the native build:
 * a small, versioned, synchronous key-value save. Everything a player
 * earns is written here on every mutation, so progress survives reloads
 * and reinstalls of the PWA shell. With Firebase wired in (native build)
 * the same SaveState shape syncs to Firestore under the anonymous uid.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  ACHIEVEMENTS,
  AD_EVERY,
  DAILY_GRID,
  DAILY_REWARDS,
  HINTS_PER_DAY,
  PAR_TIME_MS,
  SHOP,
  THEMES,
  TOTAL_LEVELS,
  coinsFor,
  gridForLevel,
  starsFor,
  xpFor,
  xpLevel,
} from '../game/config';
import type { Mission } from '../game/config';
import { dayKey, makeDeviceId, prevDayKey, weekKey } from '../game/utils';
import type {
  BestRecord,
  ChestReward,
  DailyRewardClaim,
  GameParams,
  InProgressGame,
  LevelResult,
  RewardSummary,
  SaveState,
  ScreenState,
  Settings,
  Stats,
} from '../game/types';

export interface Toast {
  id: number;
  text: string;
  icon?: string;
}

interface StoreState extends SaveState {
  /* ----- runtime (never persisted) ----- */
  screen: ScreenState;
  toasts: Toast[];
  pendingReward: DailyRewardClaim | null;
  chestReward: ChestReward | null;
  lastCoinsEarned: number;

  /* ----- actions ----- */
  nav: (screen: ScreenState) => void;
  toast: (text: string, icon?: string) => void;
  dismissToast: (id: number) => void;
  startGame: (p: GameParams) => void;
  completeLevel: (r: LevelResult) => RewardSummary;
  saveSnapshot: (g: InProgressGame | null) => void;
  consumeHint: () => boolean;
  buyHintWithCoins: () => boolean;
  watchAdReward: (kind: 'hint' | 'coins' | 'double' | 'skip' | 'restart') => number;
  shouldInterstitial: () => boolean;
  noteInterstitialShown: () => void;
  claimMission: (m: Mission) => boolean;
  claimPendingReward: () => void;
  buyTheme: (id: string) => boolean;
  setTheme: (id: string) => void;
  buyPremium: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setProfile: (patch: Partial<Pick<SaveState, 'username' | 'avatarId' | 'country'>>) => void;
  finishTutorial: () => void;
  collectChest: () => ChestReward | null;
  onDayCheck: () => void;
}

const defaultStats: Stats = {
  gamesPlayed: 0,
  wins: 0,
  hintsUsed: 0,
  adsWatched: 0,
  totalMoves: 0,
  totalTimeMs: 0,
  perfectRuns: 0,
  noHintWins: 0,
  fastWins: 0,
  dailyCompleted: 0,
  longestStreak: 0,
  winsToday: 0,
  noHintWinsToday: 0,
  dailiesToday: 0,
  winsWeek: 0,
  levelsCompleted: 0,
};

const defaults = (): SaveState => ({
  version: 1,
  deviceId: makeDeviceId(),
  username: 'Explorer',
  avatarId: 0,
  country: '—',
  xp: 0,
  coins: 100,
  premium: false,
  unlockedLevel: 1,
  stars: {},
  best: {},
  completedLevels: [],
  hintsLeft: HINTS_PER_DAY,
  hintsDay: dayKey(),
  streak: 0,
  lastLoginDay: '',
  rewardClaimedDay: '',
  dailyDay: dayKey(),
  dailyDone: [false, false, false],
  missionsDay: dayKey(),
  missionsWeek: weekKey(),
  claimedMissions: [],
  achievements: [],
  stats: { ...defaultStats },
  themeId: 'classic',
  ownedThemes: ['classic', 'dark'],
  settings: {
    music: true,
    sfx: true,
    vibration: true,
    reduceMotion: false,
    largeText: false,
    musicVol: 0.55,
    sfxVol: 0.85,
  },
  tutorialDone: false,
  inProgress: null,
  winsSinceAd: 0,
  lastSeenTs: Date.now(),
});

let toastSeq = 0;

function rollChest(): ChestReward {
  return Math.random() < 0.62
    ? { kind: 'coins', amount: 40 + Math.floor(Math.random() * 81) }
    : { kind: 'hints', amount: 1 + Math.floor(Math.random() * 2) };
}

type Setter = (partial: Partial<StoreState>) => void;

function checkAchievements(s: StoreState, set: Setter, toast: (t: string, i?: string) => void): void {
  const fresh = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.check(s));
  if (fresh.length === 0) return;
  set({
    achievements: [...s.achievements, ...fresh.map((a) => a.id)],
    coins: s.coins + 25 * fresh.length,
  });
  fresh.forEach((a) => toast(`Achievement: ${a.name} (+25 coins)`, 'trophy'));
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...defaults(),
      screen: { name: 'home' },
      toasts: [],
      pendingReward: null,
      chestReward: null,
      lastCoinsEarned: 0,

      nav: (screen) => set({ screen }),

      toast: (text, icon) => {
        const id = ++toastSeq;
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, icon }] }));
        window.setTimeout(() => get().dismissToast(id), 2800);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      startGame: (p) =>
        set((s) => ({
          screen: { name: 'game', game: p },
          stats: { ...s.stats, gamesPlayed: s.stats.gamesPlayed + 1 },
        })),

      saveSnapshot: (g) => set({ inProgress: g }),

      completeLevel: (r) => {
        const s = get();
        const n = r.mode === 'main' ? gridForLevel(r.level) : DAILY_GRID[r.dailyIndex ?? 0];
        const stars = starsFor(r.moves, n);
        const firstClear = r.mode === 'main' && !s.completedLevels.includes(r.level);
        const coinsEarned = r.mode === 'main' ? coinsFor(stars, firstClear) : 20 + stars * 10;
        const xpEarned = xpFor(stars, n, r.timeMs, r.hintsUsed);

        const stats: Stats = { ...s.stats };
        stats.wins += 1;
        stats.totalMoves += r.moves;
        stats.totalTimeMs += r.timeMs;
        stats.winsToday += 1;
        stats.winsWeek += 1;
        if (stars === 3) stats.perfectRuns += 1;
        if (r.hintsUsed === 0) {
          stats.noHintWins += 1;
          stats.noHintWinsToday += 1;
        }
        if (r.timeMs <= PAR_TIME_MS[n] * 0.6) stats.fastWins += 1;

        let { unlockedLevel } = s;
        let completedLevels = s.completedLevels;
        let newUnlocked: number | null = null;
        const starsMap = { ...s.stars };
        const best: Record<number, BestRecord> = { ...s.best };
        let bestMoves = false;
        let bestTime = false;
        let dailyDone = s.dailyDone;

        if (r.mode === 'main') {
          if (firstClear) {
            completedLevels = [...completedLevels, r.level];
            stats.levelsCompleted += 1;
          }
          const prev = best[r.level];
          bestMoves = !prev || r.moves < prev.moves;
          bestTime = !prev || r.timeMs < prev.timeMs;
          best[r.level] = {
            moves: prev ? Math.min(prev.moves, r.moves) : r.moves,
            timeMs: prev ? Math.min(prev.timeMs, r.timeMs) : r.timeMs,
          };
          starsMap[r.level] = Math.max(starsMap[r.level] ?? 0, stars);
          if (r.level >= unlockedLevel && r.level + 1 <= TOTAL_LEVELS) {
            unlockedLevel = r.level + 1;
            newUnlocked = unlockedLevel;
          }
        } else {
          const di = r.dailyIndex ?? 0;
          dailyDone = s.dailyDone.map((d, i) => (i === di ? true : d)) as [
            boolean,
            boolean,
            boolean,
          ];
          stats.dailyCompleted += 1;
          stats.dailiesToday += 1;
          /* Daily reward: each completed challenge skips one locked level. */
          if (unlockedLevel < TOTAL_LEVELS) {
            unlockedLevel += 1;
            newUnlocked = unlockedLevel;
          }
        }

        const chest = r.mode === 'main' && r.level % 5 === 0;
        const newXp = s.xp + xpEarned;

        set({
          coins: s.coins + coinsEarned,
          xp: newXp,
          unlockedLevel,
          completedLevels,
          stars: starsMap,
          best,
          stats,
          dailyDone,
          inProgress: null,
          lastCoinsEarned: coinsEarned,
          winsSinceAd: s.winsSinceAd + 1,
          chestReward: chest ? rollChest() : s.chestReward,
        });

        checkAchievements(get(), set, get().toast);

        return {
          stars,
          coinsEarned,
          xpEarned,
          firstClear,
          newUnlocked,
          xpLevel: xpLevel(newXp),
          xpLevelBefore: xpLevel(s.xp),
          chest,
          bestMoves,
          bestTime,
        };
      },

      consumeHint: () => {
        const s = get();
        if (s.premium) {
          set({ stats: { ...s.stats, hintsUsed: s.stats.hintsUsed + 1 } });
          return true;
        }
        if (s.hintsLeft <= 0) return false;
        set({
          hintsLeft: s.hintsLeft - 1,
          stats: { ...s.stats, hintsUsed: s.stats.hintsUsed + 1 },
        });
        return true;
      },

      buyHintWithCoins: () => {
        const s = get();
        if (s.coins < SHOP.hintRefillCost) {
          get().toast('Not enough coins', 'coin');
          return false;
        }
        set({ coins: s.coins - SHOP.hintRefillCost, hintsLeft: s.hintsLeft + 1 });
        get().toast('+1 hint purchased', 'bulb');
        return true;
      },

      watchAdReward: (kind) => {
        const s = get();
        const patch: Partial<StoreState> = {
          stats: { ...s.stats, adsWatched: s.stats.adsWatched + 1 },
          winsSinceAd: 0,
        };
        let amount = 0;
        if (kind === 'hint') {
          patch.hintsLeft = s.hintsLeft + 1;
          amount = 1;
        } else if (kind === 'coins') {
          patch.coins = s.coins + SHOP.rewardedCoins;
          amount = SHOP.rewardedCoins;
        } else if (kind === 'double') {
          patch.coins = s.coins + s.lastCoinsEarned;
          amount = s.lastCoinsEarned;
        } else if (kind === 'skip') {
          if (s.unlockedLevel < TOTAL_LEVELS) {
            patch.unlockedLevel = s.unlockedLevel + 1;
            amount = 1;
          } else {
            patch.coins = s.coins + 100;
            amount = 100;
          }
        }
        set(patch);
        return amount;
      },

      shouldInterstitial: () => {
        const s = get();
        return !s.premium && s.winsSinceAd >= AD_EVERY;
      },
      noteInterstitialShown: () => set({ winsSinceAd: 0 }),

      claimMission: (m) => {
        const s = get();
        if (s.claimedMissions.includes(m.id) || s.stats[m.stat] < m.target) return false;
        set({ coins: s.coins + m.coins, claimedMissions: [...s.claimedMissions, m.id] });
        get().toast(`Mission complete! +${m.coins} coins`, 'coin');
        return true;
      },

      claimPendingReward: () => {
        const s = get();
        const r = s.pendingReward;
        if (!r) return;
        const patch: Partial<StoreState> = { pendingReward: null, rewardClaimedDay: dayKey() };
        if (r.kind === 'coins') patch.coins = s.coins + r.amount;
        if (r.kind === 'hints') patch.hintsLeft = s.hintsLeft + r.amount;
        if (r.kind === 'skip') patch.unlockedLevel = Math.min(TOTAL_LEVELS, s.unlockedLevel + 1);
        if (r.kind === 'theme' && r.themeId) {
          if (s.ownedThemes.includes(r.themeId)) patch.coins = s.coins + 100;
          else patch.ownedThemes = [...s.ownedThemes, r.themeId];
        }
        set(patch);
        get().toast(`Day ${r.day} reward: ${r.label}`, 'gift');
      },

      buyTheme: (id) => {
        const s = get();
        const def = THEMES.find((t) => t.id === id);
        if (!def) return false;
        if (s.ownedThemes.includes(id)) {
          set({ themeId: id });
          return true;
        }
        const affordable = def.premiumOnly ? s.premium : s.coins >= def.cost;
        if (!affordable) {
          get().toast(def.premiumOnly ? 'Premium exclusive' : 'Not enough coins', 'lock');
          return false;
        }
        set({
          coins: s.coins - def.cost,
          ownedThemes: [...s.ownedThemes, id],
          themeId: id,
        });
        get().toast(`${def.name} theme unlocked!`, 'palette');
        checkAchievements(get(), set, get().toast);
        return true;
      },

      setTheme: (id) => set({ themeId: id }),

      buyPremium: () => {
        const s = get();
        if (s.premium) return;
        set({
          premium: true,
          ownedThemes: s.ownedThemes.includes('space')
            ? s.ownedThemes
            : [...s.ownedThemes, 'space'],
        });
        get().toast('Premium unlocked — enjoy!', 'crown');
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setProfile: (patch) => set(patch),
      finishTutorial: () => set({ tutorialDone: true }),

      collectChest: () => {
        const r = get().chestReward;
        if (!r) return null;
        set((s) => ({
          chestReward: null,
          coins: r.kind === 'coins' ? s.coins + r.amount : s.coins,
          hintsLeft: r.kind === 'hints' ? s.hintsLeft + r.amount : s.hintsLeft,
        }));
        return r;
      },

      /**
       * UTC-day rollover: streak, daily hints, daily challenges, missions.
       * Anti-cheat: day keys only ever move forward — if the device clock
       * is rolled back, nothing resets and nothing re-grants.
       */
      onDayCheck: () => {
        const now = new Date();
        const today = dayKey(now);
        const wk = weekKey(now);
        const s = get();
        if (today < s.lastLoginDay) return; // clock rolled back — hold state

        const patch: Partial<StoreState> = {};
        let statsDirty = false;
        const stats = { ...s.stats };
        let streak = s.streak;

        if (today !== s.lastLoginDay) {
          streak = s.lastLoginDay === prevDayKey(today) ? s.streak + 1 : 1;
          stats.longestStreak = Math.max(stats.longestStreak, streak);
          statsDirty = true;
          patch.lastLoginDay = today;
          patch.streak = streak;
        }
        if (s.hintsDay !== today) {
          patch.hintsDay = today;
          patch.hintsLeft = HINTS_PER_DAY;
        }
        if (s.dailyDay !== today) {
          patch.dailyDay = today;
          patch.dailyDone = [false, false, false];
        }
        if (s.missionsDay !== today) {
          patch.missionsDay = today;
          patch.claimedMissions = s.claimedMissions.filter((id) => id.startsWith('w-'));
          stats.winsToday = 0;
          stats.noHintWinsToday = 0;
          stats.dailiesToday = 0;
          statsDirty = true;
        }
        if (s.missionsWeek !== wk) {
          patch.missionsWeek = wk;
          patch.claimedMissions = (patch.claimedMissions ?? s.claimedMissions).filter(
            (id) => !id.startsWith('w-'),
          );
          stats.winsWeek = 0;
          statsDirty = true;
        }
        if (statsDirty) patch.stats = stats;

        if (s.rewardClaimedDay !== today && !s.pendingReward) {
          const idx = ((streak - 1) % 7 + 7) % 7;
          patch.pendingReward = { day: idx + 1, ...DAILY_REWARDS[idx] };
        }

        // Skip noop ticks — avoids persisting lastSeenTs every 20s.
        if (Object.keys(patch).length === 0) return;
        patch.lastSeenTs = Date.now();
        set(patch);
      },
    }),
    {
      name: 'tile-quest-save',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): SaveState => ({
        version: s.version,
        deviceId: s.deviceId,
        username: s.username,
        avatarId: s.avatarId,
        country: s.country,
        xp: s.xp,
        coins: s.coins,
        premium: s.premium,
        unlockedLevel: s.unlockedLevel,
        stars: s.stars,
        best: s.best,
        completedLevels: s.completedLevels,
        hintsLeft: s.hintsLeft,
        hintsDay: s.hintsDay,
        streak: s.streak,
        lastLoginDay: s.lastLoginDay,
        rewardClaimedDay: s.rewardClaimedDay,
        dailyDay: s.dailyDay,
        dailyDone: s.dailyDone,
        missionsDay: s.missionsDay,
        missionsWeek: s.missionsWeek,
        claimedMissions: s.claimedMissions,
        achievements: s.achievements,
        stats: s.stats,
        themeId: s.themeId,
        ownedThemes: s.ownedThemes,
        settings: s.settings,
        tutorialDone: s.tutorialDone,
        inProgress: s.inProgress,
        winsSinceAd: s.winsSinceAd,
        lastSeenTs: s.lastSeenTs,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SaveState>;
        return {
          ...current,
          ...p,
          stats: { ...defaultStats, ...(p.stats ?? {}) },
          settings: { ...current.settings, ...(p.settings ?? {}) },
        };
      },
    },
  ),
);
