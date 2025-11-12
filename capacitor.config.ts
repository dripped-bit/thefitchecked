import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thefitchecked.app',
  appName: 'TheFitChecked',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scrollEnabled: true
  }
};

export default config;
