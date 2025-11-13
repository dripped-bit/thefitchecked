import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thefitchecked.app',
  appName: 'TheFitChecked',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    scrollEnabled: false, // Disable native scroll - app handles scrolling
    backgroundColor: '#FFFFFF',
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile'
  },
  plugins: {
    Keyboard: {
      resize: 'none', // Prevent keyboard from resizing viewport
      style: 'dark',
      resizeOnFullScreen: false
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#FFFFFF'
    }
  }
};

export default config;
