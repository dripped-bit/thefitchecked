import { App, URLOpenListenerEvent, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * App Lifecycle & Deep Linking for TheFitChecked
 *
 * Manages app lifecycle events and deep linking for iOS.
 *
 * Lifecycle Events:
 * - App became active (foreground)
 * - App went to background
 * - App state changes
 * - URL opened (deep links)
 *
 * Deep Linking Examples:
 * - thefitchecked://outfit/123
 * - thefitchecked://closet/view
 * - https://thefitchecked.com/share/xyz (Universal Links)
 *
 * iOS Setup Required:
 * - Configure URL Schemes in Info.plist
 * - Configure Associated Domains for Universal Links
 */

type AppStateChangeCallback = (state: AppState) => void;
type DeepLinkCallback = (url: string, params: URLSearchParams) => void;
type BackButtonCallback = () => boolean; // Return true to prevent default

class AppLifecycleService {
  private isNative: boolean;
  private stateChangeListeners: AppStateChangeCallback[] = [];
  private deepLinkListeners: DeepLinkCallback[] = [];
  private backButtonListeners: BackButtonCallback[] = [];

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Initialize app lifecycle listeners
   * Call this in App.tsx on mount
   */
  async initialize() {
    if (!this.isNative) return;

    try {
      // Listen for app state changes (foreground/background)
      await App.addListener('appStateChange', (state) => {
        console.log('📱 App state changed:', state.isActive ? 'ACTIVE' : 'BACKGROUND');
        this.stateChangeListeners.forEach(listener => listener(state));
      });

      // Listen for URL open events (deep links)
      await App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        console.log('🔗 Deep link opened:', event.url);
        this.handleDeepLink(event.url);
      });

      // Listen for back button (Android mainly, but good to have)
      await App.addListener('backButton', ({ canGoBack }) => {
        console.log('⬅️ Back button pressed, canGoBack:', canGoBack);

        // Let listeners handle back button
        for (const listener of this.backButtonListeners) {
          const handled = listener();
          if (handled) return; // Listener handled it
        }

        // Default behavior: exit app if can't go back
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      console.log('✅ App lifecycle initialized');
    } catch (err) {
      console.warn('App lifecycle initialization failed:', err);
    }
  }

  /**
   * Handle deep link URL
   */
  private handleDeepLink(url: string) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      // Notify all deep link listeners
      this.deepLinkListeners.forEach(listener => listener(url, params));
    } catch (err) {
      console.error('Failed to parse deep link:', url, err);
    }
  }

  /**
   * Add app state change listener
   * Callback receives { isActive: boolean }
   */
  onStateChange(callback: AppStateChangeCallback): () => void {
    this.stateChangeListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Add deep link listener
   * Callback receives (url: string, params: URLSearchParams)
   */
  onDeepLink(callback: DeepLinkCallback): () => void {
    this.deepLinkListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.deepLinkListeners = this.deepLinkListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Add back button listener (Android mainly)
   * Return true from callback to prevent default behavior
   */
  onBackButton(callback: BackButtonCallback): () => void {
    this.backButtonListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.backButtonListeners = this.backButtonListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Get app info (version, build number, etc.)
   */
  async getInfo() {
    if (!this.isNative) {
      return {
        name: 'TheFitChecked',
        id: 'com.thefitchecked.app',
        version: '1.0.0',
        build: '1',
      };
    }

    try {
      const info = await App.getInfo();
      return info;
    } catch (err) {
      console.warn('Get app info failed:', err);
      return null;
    }
  }

  /**
   * Get current app state
   */
  async getState() {
    if (!this.isNative) {
      return { isActive: true };
    }

    try {
      const state = await App.getState();
      return state;
    } catch (err) {
      console.warn('Get app state failed:', err);
      return { isActive: true };
    }
  }

  /**
   * Exit app (Android only)
   */
  async exitApp() {
    if (!this.isNative) return;

    try {
      await App.exitApp();
    } catch (err) {
      console.warn('Exit app failed:', err);
    }
  }

  /**
   * Minimize app (send to background)
   */
  async minimizeApp() {
    if (!this.isNative) return;

    try {
      await App.minimizeApp();
    } catch (err) {
      console.warn('Minimize app failed:', err);
    }
  }
}

// Export singleton instance
const appLifecycle = new AppLifecycleService();
export default appLifecycle;

/**
 * React Hook for App State Changes
 *
 * Usage:
 * useAppStateChange((state) => {
 *   if (state.isActive) {
 *     // App came to foreground - refresh data
 *     refreshOutfits();
 *   } else {
 *     // App went to background - save state
 *     saveState();
 *   }
 * });
 */
export const useAppStateChange = (callback: AppStateChangeCallback) => {
  React.useEffect(() => {
    const unsubscribe = appLifecycle.onStateChange(callback);
    return unsubscribe;
  }, [callback]);
};

/**
 * React Hook for Deep Links
 *
 * Usage:
 * useDeepLink((url, params) => {
 *   // Handle deep link
 *   if (url.includes('/outfit/')) {
 *     const outfitId = params.get('id');
 *     navigateToOutfit(outfitId);
 *   }
 * });
 */
export const useDeepLink = (callback: DeepLinkCallback) => {
  React.useEffect(() => {
    const unsubscribe = appLifecycle.onDeepLink(callback);
    return unsubscribe;
  }, [callback]);
};

/**
 * React Hook for Back Button
 *
 * Usage:
 * useBackButton(() => {
 *   if (modalOpen) {
 *     closeModal();
 *     return true; // Prevent default back behavior
 *   }
 *   return false; // Allow default back behavior
 * });
 */
export const useBackButton = (callback: BackButtonCallback) => {
  React.useEffect(() => {
    const unsubscribe = appLifecycle.onBackButton(callback);
    return unsubscribe;
  }, [callback]);
};

/**
 * Hook to get app info
 */
export const useAppInfo = () => {
  const [appInfo, setAppInfo] = React.useState<any>(null);

  React.useEffect(() => {
    appLifecycle.getInfo().then(info => setAppInfo(info));
  }, []);

  return appInfo;
};

/**
 * Deep Link Route Parser
 *
 * Helper to parse TheFitChecked deep links
 */
export class DeepLinkRouter {
  /**
   * Parse outfit deep link
   * Example: thefitchecked://outfit/123
   */
  static parseOutfitLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'outfit' && pathParts[1]) {
        return pathParts[1]; // outfit ID
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse closet view link
   * Example: thefitchecked://closet?view=favorites
   */
  static parseClosetLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'closet') {
        return urlObj.searchParams.get('view') || 'all';
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse share link
   * Example: thefitchecked://share/abc123
   */
  static parseShareLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts[0] === 'share' && pathParts[1]) {
        return pathParts[1]; // share ID
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Import React for hooks
import React from 'react';
