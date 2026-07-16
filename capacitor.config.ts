import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.darrensantana.scripturequest',
  appName: 'Lightbearer',
  webDir: 'dist/scripture-quest/browser',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1600,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#0f0f0f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      splashFullScreen: true,
    },
  },
};

export default config;
