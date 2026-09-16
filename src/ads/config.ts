/**
 * AdMob unit IDs. Set USE_TEST_ADS true for emulator / debug so production
 * inventory is never requested by accident.
 */
export const USE_TEST_ADS = false;

/** Live AdMob App ID — must match AndroidManifest APPLICATION_ID. */
export const ADMOB_APP_ID = 'ca-app-pub-2848005220802634~3283286768';

export const AD_UNITS = {
  banner: 'ca-app-pub-2848005220802634/5306611618',
  interstitial: 'ca-app-pub-2848005220802634/4796259541',
  rewarded: 'ca-app-pub-2848005220802634/7589943842',
} as const;

/** Show an interstitial after this much active puzzle playtime (deferred to a natural break). */
export const INTERSTITIAL_EVERY_MS = 4 * 60_000;
