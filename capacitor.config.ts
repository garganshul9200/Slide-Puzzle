import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.slidepuzzlequest.game",
  appName: "Slide Puzzle",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    SystemBars: {
      // Inject --safe-area-inset-* so CSS can clear notch / gesture bars.
      insetsHandling: "css",
      style: "DARK",
    },
  },
};

export default config;
