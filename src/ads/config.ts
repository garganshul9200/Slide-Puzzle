/**
 * AdMob unit IDs. Set USE_TEST_ADS true for emulator / debug so production
 * inventory is never requested by accident.
 */
export const USE_TEST_ADS = false;

/** Live AdMob App ID — must match AndroidManifest APPLICATION_ID. */
export const ADMOB_APP_ID = 'ca-app-pub-2848005220802634~3283286768';

export const AD_UNITS = {
  banner: 'ca-app-pub-2848005220802634/7951541543',
  interstitial: 'ca-app-pub-2848005220802634/2627062673',
  rewarded: 'ca-app-pub-2848005220802634/6183164308',
} as const;

/** Show an interstitial after this much active puzzle playtime. */
export const INTERSTITIAL_EVERY_MS = 3 * 60_000;
