import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Status Bar Configuration for TheFitChecked
 *
 * Manages iOS status bar styling for light/dark mode and app theme.
 * The status bar is the top bar showing time, battery, signal, etc.
 *
 * iOS Status Bar Styles:
 * - Light: Black text (for light backgrounds)
 * - Dark: White text (for dark backgrounds)
 *
 * No Info.plist permissions needed for status bar.
 */

class StatusBarService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize status bar with app's default styling
   * Call this in App.tsx on mount
   */
  async initialize() {
    if (!this.isNative) return;

    try {
      // Set default to light content (white text) for dark nav bars
      await StatusBar.setStyle({ style: Style.Dark });

      // Show status bar
      await StatusBar.show();

      // Set background color (iOS 13+)
      // Use your app's primary color
      await StatusBar.setBackgroundColor({ color: '#000000' });

      console.log('✅ Status bar initialized');
    } catch (err) {
      console.warn('Status bar initialization failed:', err);
    }
  }

  /**
   * Set status bar to light mode (dark text on light background)
   * Use for: Light-themed pages, white backgrounds
   */
  async setLight() {
    if (!this.isNative) return;

    try {
      await StatusBar.setStyle({ style: Style.Light });
    } catch (err) {
      console.warn('Status bar setLight failed:', err);
    }
  }

  /**
   * Set status bar to dark mode (white text on dark background)
   * Use for: Dark-themed pages, navbar with dark background
   */
  async setDark() {
    if (!this.isNative) return;

    try {
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (err) {
      console.warn('Status bar setDark failed:', err);
    }
  }

  /**
   * Set status bar background color
   * iOS 13+ only, Android always
   */
  async setBackgroundColor(color: string) {
    if (!this.isNative) return;

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (err) {
      console.warn('Status bar setBackgroundColor failed:', err);
    }
  }

  /**
   * Show status bar
   */
  async show() {
    if (!this.isNative) return;

    try {
      await StatusBar.show();
    } catch (err) {
      console.warn('Status bar show failed:', err);
    }
  }

  /**
   * Hide status bar
   * Use for: Full-screen photo/video viewing
   */
  async hide() {
    if (!this.isNative) return;

    try {
      await StatusBar.hide();
    } catch (err) {
      console.warn('Status bar hide failed:', err);
    }
  }

  /**
   * Set status bar to match system theme
   * Automatically switches between light/dark based on iOS system settings
   */
  async setDefault() {
    if (!this.isNative) return;

    try {
      await StatusBar.setStyle({ style: Style.Default });
    } catch (err) {
      console.warn('Status bar setDefault failed:', err);
    }
  }

  /**
   * Get current status bar info
   */
  async getInfo() {
    if (!this.isNative) {
      return { visible: true, style: 'default', color: '#000000' };
    }

    try {
      const info = await StatusBar.getInfo();
      return info;
    } catch (err) {
      console.warn('Status bar getInfo failed:', err);
      return null;
    }
  }

  /**
   * Set overlay mode (iOS 13+)
   * When true, content can appear under status bar
   */
  async setOverlaysWebView(overlay: boolean) {
    if (!this.isNative) return;

    try {
      await StatusBar.setOverlaysWebView({ overlay });
    } catch (err) {
      console.warn('Status bar setOverlaysWebView failed:', err);
    }
  }
}

// Export singleton instance
const statusBar = new StatusBarService();
export default statusBar;

/**
 * React Hook for Status Bar
 *
 * Usage in components to automatically set status bar style:
 *
 * useStatusBarStyle('dark'); // Component with dark background
 * useStatusBarStyle('light'); // Component with light background
 */
export const useStatusBarStyle = (style: 'light' | 'dark' | 'default' = 'dark') => {
  React.useEffect(() => {
    const setStyle = async () => {
      if (style === 'light') {
        await statusBar.setLight();
      } else if (style === 'dark') {
        await statusBar.setDark();
      } else {
        await statusBar.setDefault();
      }
    };

    setStyle();

    // Cleanup: Reset to default when unmounting
    return () => {
      statusBar.setDefault();
    };
  }, [style]);
};

/**
 * Hook for full-screen mode (hide status bar)
 *
 * Usage:
 * const { enterFullScreen, exitFullScreen } = useFullScreen();
 *
 * <button onClick={enterFullScreen}>View Full Screen</button>
 */
export const useFullScreen = () => {
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const enterFullScreen = async () => {
    await statusBar.hide();
    setIsFullScreen(true);
  };

  const exitFullScreen = async () => {
    await statusBar.show();
    setIsFullScreen(false);
  };

  const toggleFullScreen = async () => {
    if (isFullScreen) {
      await exitFullScreen();
    } else {
      await enterFullScreen();
    }
  };

  return {
    isFullScreen,
    enterFullScreen,
    exitFullScreen,
    toggleFullScreen,
  };
};

// Import React for hooks
import React from 'react';
