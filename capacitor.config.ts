import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.popmusic.player',
  appName: 'POP Music Player',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    App: {
      // Keep app alive in background for music playback
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
