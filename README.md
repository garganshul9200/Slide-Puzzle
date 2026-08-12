# Tile Quest

A production-structured sliding picture-puzzle game. Split the picture into tiles, slide them
into the empty slot, and rebuild the image — across a 100-level quest, daily challenges,
missions, achievements, XP, coins, themes and a full meta-economy.

This repository ships the game as a **React + Vite + TypeScript** build (this workspace
produces web builds). The architecture mirrors the React Native target 1:1 so the codebase
ports cleanly; the mapping table below shows where each native technology lands.

| Native stack (store build)        | This implementation                                   |
| --------------------------------- | ----------------------------------------------------- |
| React Native + TypeScript         | React 19 + TypeScript (strict)                        |
| React Navigation                  | Typed screen state machine (`src/state/store.ts`)     |
| Zustand                           | Zustand (+ `persist` middleware)                      |
| Reanimated / Gesture Handler      | GPU-composited CSS transform transitions, pointer API |
| MMKV                              | Versioned localStorage save (`tile-quest-save`)       |
| Fast Image / asset `levels/*.jpg` | Procedural seeded artwork (`src/game/art.ts`)         |
| Firebase Auth / Firestore         | Anonymous device id + same `SaveState` shape, sync-ready |
| google-mobile-ads                 | `AdOverlay` shim with identical rewarded/interstitial callbacks |
| Remote Config                     | `src/game/config.ts` single balance source (RC defaults) |
| Crashlytics / Analytics / FCM     | Hook points in store actions (toast/event seams)      |

## Setup

```bash
npm install
npm run dev        # local dev server
npm run build      # production build (dist/)
npx vitest run     # unit tests (puzzle engine)
```

## Architecture (feature-based)

```
src/
  game/        # pure, unit-tested core
    puzzle.ts  # board model, solvable shuffle, slides, hint heuristic
    art.ts     # seeded procedural level artwork (100 levels + dailies)
    config.ts  # balance: grids, par, XP/coins, themes, achievements, missions
    types.ts   # shared domain types
    utils.ts   # PRNG, UTC day/week keys (anti clock-cheat), formatting
  state/
    store.ts   # Zustand store: progression, economy, dailies, persistence
  audio/
    audio.ts   # WebAudio synth: SFX + ambient music, volume/mute controls
  components/
    Board.tsx  # tile rendering + slide/cascade/peek/win animations
    fx.tsx     # ambient particles, confetti
    ui.tsx     # icon set (inline SVG), buttons, panels, modals
    overlays.tsx # pause, level complete, chest, ads, tutorial, login reward
  screens/     # Home, LevelMap, Game, Daily, Awards, Profile
```

## Gameplay rules implemented

- **Always solvable** — Fisher–Yates shuffle + inversion-parity validation
  (`isSolvable`), parity fix-up by swapping two tiles, re-roll until ≥ 60 % scrambled.
- **Difficulty curve** — levels 1–20 → 3×3, 21–40 → 4×4, 41–70 → 5×5, 71–100 → 6×6.
- **Progression** — only the highest unlocked level is playable; completed levels stay
  replayable; progress persists across restarts; mid-game snapshots resume on return.
- **Daily challenges** — 3 puzzles seeded from the UTC date (clock changes don't reroll);
  each completion skips one locked level; resets at UTC midnight; no repeats per day.
- **Hints** — 3 free per UTC day (auto-plays the best Manhattan-reducing move), then a
  rewarded ad or coins; unlimited with Premium. **Undo** — unlimited move history.
- **Scoring** — 1–3 stars vs. par moves, coins (first-clear bonus), XP with speed and
  no-hint bonuses, best moves/time per level, "double coins" rewarded ad.
- **Meta** — mystery chest every 5 levels, daily/weekly missions, 7-day login streak
  rewards, 13 achievements, 7 themes, premium IAP flow, interstitial cadence (every 4 wins),
  simulated rewarded/interstitial ads with the real callback contract.
- **Anti-cheat** — all day logic runs on UTC day keys that only move forward; the timer
  pauses when the tab is hidden; snapshots are server-shaped for Firebase validation.

## Accessibility & settings

Reduced motion, large text, vibration toggle, music/SFX volumes and mutes,
high-saturation colorblind-considerate palettes, keyboard play (arrow keys),
aria labels on icon buttons.

## Future-ready seams

`GameParams.mode` extends to PvP/custom/AI puzzles; `SaveState` syncs to Firestore per
anonymous uid; `config.ts` hydrates from Remote Config; `AdOverlay` swaps its creative for
`react-native-google-mobile-ads`; events/season packs are additive theme + art seeds.
