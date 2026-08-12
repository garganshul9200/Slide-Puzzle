# Slide Puzzle

A sliding picture-puzzle game for web and Android. Split the picture into tiles, slide them into the empty slot, and rebuild the image across a 100-level quest, daily challenges, missions, achievements, XP, coins, themes, and ads.

> **This is a vibe-coded application** — built iteratively with AI pair-programming in Cursor (prompts, review, and polish in chat). Expect a shipping-oriented game structure with live AdMob, Capacitor, and a full meta loop, not a from-scratch handcrafted architecture document.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript + Tailwind CSS 4 |
| Build | Vite 7 (single-file web bundle) |
| Native shell | Capacitor 8 (Android) |
| State | Zustand + `persist` (localStorage) |
| Ads | `@capacitor-community/admob` (banner, rewarded, interstitial) |
| Network | `@capacitor/network` (app requires connectivity) |

**App ID:** `com.tilequest.game` · **Display name:** Slide Puzzle

## Features

- **Always-solvable boards** — shuffle with inversion-parity checks
- **Difficulty curve** — 3×3 → 6×6 across levels 1–100
- **Daily challenges** — 3 UTC-seeded puzzles; each clear skips a locked level
- **Hints / undo / peek / mix** — mix & extras gated by rewarded ads (Premium skips)
- **Progression** — stars, XP, coins, chests, missions, achievements, themes
- **Ads** — bottom banner on play, rewarded for mix/hints/double coins, interstitial every 4 wins and every 10 minutes of playtime
- **Offline gate** — full-screen block until the device is online again
- **Safe areas** — notch / gesture-bar padding on native

## Project layout

```
src/
  ads/           # AdMob config + banner / rewarded / interstitial helpers
  audio/         # WebAudio SFX + ambient music
  components/    # Board, UI, overlays, banner slot, offline gate
  game/          # Pure puzzle engine, art, balance, types (unit-tested)
  hooks/         # Shared online status
  screens/       # Home, Map, Game, Daily, Awards, Profile
  state/         # Zustand store + persistence
android/         # Capacitor Android project
```

## Setup

```bash
npm install
```

### Web

```bash
npm run dev          # local Vite server
npm run build        # production build → dist/
npx vitest run       # puzzle engine unit tests
```

### Android (no Android Studio required)

Needs JDK **21**, Android SDK, and an emulator or device.

```bash
# optional: pin Java for Gradle
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"

npm run android:run   # build web → cap sync → deploy to a target
npm run android:apk   # assemble debug APK only
```

Useful one-offs:

```bash
npm run android:sync  # build + npx cap sync android
emulator -avd <name>  # start an AVD from the CLI
```

## Ads config

Live unit IDs live in `src/ads/config.ts`. The Android App ID in `android/app/src/main/AndroidManifest.xml` must match `ADMOB_APP_ID`.

- Set `USE_TEST_ADS = true` for emulator / debug to avoid burning production inventory.
- Premium players skip banner, timed interstitials, and rewarded gates for mix.

## Gameplay notes

- Progress persists under the key `tile-quest-save` (legacy id; display name is Slide Puzzle).
- Day/streak/daily logic uses **UTC** day keys (clock rollback does not advance rewards).
- Level art is procedural and seeded (`src/game/art.ts`) — no shipped image pack.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production web build |
| `npm run android:sync` | Build + Capacitor sync |
| `npm run android:run` | Sync and run on device/emulator |
| `npm run android:apk` | Debug APK via Gradle |

## License / vibe

Vibe-coded for fun and iteration. Ship, tweak balance in `src/game/config.ts`, and keep the AdMob IDs out of test builds until you’re ready for store traffic.
