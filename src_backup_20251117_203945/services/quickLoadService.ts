/**
 * Quick Load Service - Fast app startup for returning users
 * Features: login state persistence, background data sync, offline mode,
 * cached outfit suggestions, and smart routing to bypass setup pages
 */

import { userDataService, CompleteUserData } from './userDataService';
import { personalizedFashionService, DailySuggestions } from './personalizedFashionService';
import { weatherService } from './weatherService';
import { smartNotificationService } from './smartNotificationService';
import { enhancedClosetService } from './enhancedClosetService';

export interface LoginState {
  isLoggedIn: boolean;
  userId: string;
  sessionId: string;
  lastLogin: string;
  loginMethod: 'email' | 'google' | 'apple' | 'guest';
  rememberMe: boolean;
  sessionExpiry: string;
}

export interface AppState {
  setupCompleted: boolean;
  canSkipToSuggestions: boolean;
  hasAvatar: boolean;
  hasStyleProfile: boolean;
  hasClosetItems: boolean;
  targetPage: string; // where to route the user
  loadingProgress: number;
  cacheStatus: {
    outfitSuggestions: 'fresh' | 'stale' | 'missing';
    weatherData: 'fresh' | 'stale' | 'missing';
    userData: 'fresh' | 'stale' | 'missing';
  };
}

export interface OfflineCache {
  dailySuggestions: DailySuggestions[];
  outfitCombinations: any[];
  weatherData: any;
  closetAnalytics: any;
  lastUpdated: string;
  expiresAt: string;
}

export interface BackgroundSyncStatus {
  inProgress: boolean;
  lastSync: string;
  nextScheduledSync: string;
  syncItems: {
    userData: 'pending' | 'syncing' | 'completed' | 'failed';
    outfitSuggestions: 'pending' | 'syncing' | 'completed' | 'failed';
    weatherData: 'pending' | 'syncing' | 'completed' | 'failed';
    notifications: 'pending' | 'syncing' | 'completed' | 'failed';
  };
  errors: string[];
}

class QuickLoadService {
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private backgroundSyncTimer: NodeJS.Timeout | null = null;
  private syncStatus: BackgroundSyncStatus = {
    inProgress: false,
    lastSync: '',
    nextScheduledSync: '',
    syncItems: {
      userData: 'pending',
      outfitSuggestions: 'pending',
      weatherData: 'pending',
      notifications: 'pending'
    },
    errors: []
  };

  constructor() {
    this.initializeQuickLoad();
  }

  /**
   * Initialize quick load system
   */
  private async initializeQuickLoad(): Promise<void> {
    console.log('🚀 [QUICK-LOAD] Initializing...');

    // Check login state
    const loginState = this.getLoginState();

    if (loginState.isLoggedIn && this.isSessionValid(loginState)) {
      console.log('✅ [QUICK-LOAD] Valid session found');

      // Start background sync
      this.startBackgroundSync();

      // Initialize notifications
      this.initializeNotifications();

      console.log('🚀 [QUICK-LOAD] Quick load ready');
    } else {
      console.log('🔐 [QUICK-LOAD] No valid session, user needs to log in');
      this.clearSession();
    }
  }

  /**
   * Perform fast app startup for returning users
   */
  async performQuickLoad(): Promise<AppState> {
    console.log('⚡ [QUICK-LOAD] Starting fast load...');

    const startTime = Date.now();
    let progress = 0;

    // Step 1: Check login state (10%)
    const loginState = this.getLoginState();
    progress = 10;

    if (!loginState.isLoggedIn || !this.isSessionValid(loginState)) {
      return {
        setupCompleted: false,
        canSkipToSuggestions: false,
        hasAvatar: false,
        hasStyleProfile: false,
        hasClosetItems: false,
        targetPage: '/login',
        loadingProgress: 100,
        cacheStatus: {
          outfitSuggestions: 'missing',
          weatherData: 'missing',
          userData: 'missing'
        }
      };
    }

    // Step 2: Load user data (30%)
    const userData = userDataService.getAllUserData();
    progress = 30;

    // Step 3: Check app completion state (50%)
    const setupCompleted = userDataService.isSetupCompleted();
    const canSkipToSuggestions = userDataService.canSkipToSuggestions();
    progress = 50;

    // Step 4: Load cached data (70%)
    const cacheStatus = await this.checkCacheStatus();
    progress = 70;

    // Step 5: Prepare for display (90%)
    const targetPage = this.determineTargetPage(setupCompleted, canSkipToSuggestions, userData);
    progress = 90;

    // Step 6: Complete (100%)
    const appState: AppState = {
      setupCompleted,
      canSkipToSuggestions,
      hasAvatar: !!(userData?.avatar?.imageUrl),
      hasStyleProfile: !!(userData?.styleProfile?.fashionPersonality?.archetypes?.length),
      hasClosetItems: !!(userData?.closet?.length),
      targetPage,
      loadingProgress: 100,
      cacheStatus
    };

    const loadTime = Date.now() - startTime;
    console.log(`⚡ [QUICK-LOAD] Completed in ${loadTime}ms, routing to: ${targetPage}`);

    return appState;
  }

  /**
   * Determine which page to route the user to
   */
  private determineTargetPage(setupCompleted: boolean, canSkipToSuggestions: boolean, userData: CompleteUserData | null): string {
    // If user can skip to suggestions, go directly to page 6
    if (canSkipToSuggestions || setupCompleted) {
      return '/outfits/daily'; // Page 6 - Daily suggestions
    }

    // Otherwise, determine where they left off in setup
    if (!userData) {
      return '/setup/profile'; // Page 1 - Profile setup
    }

    if (!userData.avatar?.imageUrl) {
      return '/setup/avatar'; // Page 2 - Avatar creation
    }

    if (!userData.measurements?.height) {
      return '/setup/measurements'; // Page 3 - Measurements
    }

    if (!userData.styleProfile?.fashionPersonality?.archetypes?.length) {
      return '/setup/style'; // Page 4 - Style preferences
    }

    if (!userData.closet?.length) {
      return '/setup/closet'; // Page 5 - Virtual closet
    }

    return '/outfits/daily'; // Page 6 - Daily suggestions
  }

  /**
   * Save login state
   */
  saveLoginState(
    userId: string,
    loginMethod: 'email' | 'google' | 'apple' | 'guest',
    rememberMe: boolean = true
  ): void {
    const sessionExpiry = new Date();
    sessionExpiry.setTime(sessionExpiry.getTime() + this.SESSION_DURATION);

    const loginState: LoginState = {
      isLoggedIn: true,
      userId,
      sessionId: this.generateSessionId(),
      lastLogin: new Date().toISOString(),
      loginMethod,
      rememberMe,
      sessionExpiry: sessionExpiry.toISOString()
    };

    // Store login state
    if (rememberMe) {
      localStorage.setItem('loginState', JSON.stringify(loginState));
    } else {
      sessionStorage.setItem('loginState', JSON.stringify(loginState));
    }

    // Update user data service
    const userData = userDataService.getAllUserData();
    if (userData) {
      userData.metadata.lastLogin = loginState.lastLogin;
      userDataService.saveUserProfile(userData.profile);
    }

    console.log('🔐 [QUICK-LOAD] Login state saved');
  }

  /**
   * Get current login state
   */
  getLoginState(): LoginState {
    try {
      // Check localStorage first (remember me)
      let stored = localStorage.getItem('loginState');
      if (!stored) {
        // Check sessionStorage (session only)
        stored = sessionStorage.getItem('loginState');
      }

      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load login state');
    }

    return {
      isLoggedIn: false,
      userId: '',
      sessionId: '',
      lastLogin: '',
      loginMethod: 'email',
      rememberMe: false,
      sessionExpiry: ''
    };
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(loginState: LoginState): boolean {
    if (!loginState.isLoggedIn) return false;

    const expiry = new Date(loginState.sessionExpiry);
    const now = new Date();

    return now < expiry;
  }

  /**
   * Clear session and logout
   */
  clearSession(): void {
    localStorage.removeItem('loginState');
    sessionStorage.removeItem('loginState');
    this.clearOfflineCache();
    this.stopBackgroundSync();
    console.log('🔐 [QUICK-LOAD] Session cleared');
  }

  /**
   * Check cache status for different data types
   */
  private async checkCacheStatus(): Promise<AppState['cacheStatus']> {
    const cache = this.getOfflineCache();

    return {
      outfitSuggestions: this.getCacheItemStatus(cache?.dailySuggestions, 'dailySuggestions'),
      weatherData: this.getCacheItemStatus(cache?.weatherData, 'weatherData'),
      userData: this.getCacheItemStatus(userDataService.getAllUserData(), 'userData')
    };
  }

  /**
   * Get cache item status
   */
  private getCacheItemStatus(data: any, type: string): 'fresh' | 'stale' | 'missing' {
    if (!data) return 'missing';

    const cacheAge = this.getCacheAge(data);

    if (cacheAge < this.CACHE_DURATION / 2) return 'fresh';
    if (cacheAge < this.CACHE_DURATION) return 'stale';
    return 'missing';
  }

  /**
   * Get cache age in milliseconds
   */
  private getCacheAge(data: any): number {
    const timestamp = data?.timestamp || data?.lastUpdated || data?.generatedAt;
    if (!timestamp) return Infinity;

    return Date.now() - new Date(timestamp).getTime();
  }

  /**
   * Start background data synchronization
   */
  startBackgroundSync(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }

    // Immediate sync
    this.performBackgroundSync();

    // Schedule regular syncs
    this.backgroundSyncTimer = setInterval(() => {
      this.performBackgroundSync();
    }, this.SYNC_INTERVAL);

    console.log('🔄 [QUICK-LOAD] Background sync started');
  }

  /**
   * Stop background synchronization
   */
  stopBackgroundSync(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
    console.log('⏹️ [QUICK-LOAD] Background sync stopped');
  }

  /**
   * Perform background data synchronization
   */
  private async performBackgroundSync(): Promise<void> {
    if (this.syncStatus.inProgress) {
      console.log('🔄 [QUICK-LOAD] Sync already in progress, skipping');
      return;
    }

    this.syncStatus.inProgress = true;
    this.syncStatus.errors = [];
    const startTime = Date.now();

    console.log('🔄 [QUICK-LOAD] Starting background sync...');

    try {
      // Sync weather data
      await this.syncWeatherData();

      // Sync outfit suggestions
      await this.syncOutfitSuggestions();

      // Sync user data (save any local changes)
      await this.syncUserData();

      // Sync notifications
      await this.syncNotifications();

      this.syncStatus.lastSync = new Date().toISOString();
      console.log(`✅ [QUICK-LOAD] Background sync completed in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('❌ [QUICK-LOAD] Background sync failed:', error);
      this.syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.syncStatus.inProgress = false;
      const nextSync = new Date();
      nextSync.setTime(nextSync.getTime() + this.SYNC_INTERVAL);
      this.syncStatus.nextScheduledSync = nextSync.toISOString();
    }
  }

  /**
   * Sync weather data
   */
  private async syncWeatherData(): Promise<void> {
    this.syncStatus.syncItems.weatherData = 'syncing';

    try {
      const weatherData = await weatherService.getCurrentWeather();

      // Update offline cache
      const cache = this.getOfflineCache();
      cache.weatherData = weatherData;
      cache.lastUpdated = new Date().toISOString();
      this.saveOfflineCache(cache);

      this.syncStatus.syncItems.weatherData = 'completed';
    } catch (error) {
      this.syncStatus.syncItems.weatherData = 'failed';
      throw error;
    }
  }

  /**
   * Sync outfit suggestions
   */
  private async syncOutfitSuggestions(): Promise<void> {
    this.syncStatus.syncItems.outfitSuggestions = 'syncing';

    try {
      // Generate fresh daily suggestions
      const suggestions = await personalizedFashionService.generateDailySuggestions();

      // Generate outfit combinations from closet
      const combinations = await enhancedClosetService.generateOutfitCombinations();

      // Update offline cache
      const cache = this.getOfflineCache();
      cache.dailySuggestions = [suggestions];
      cache.outfitCombinations = combinations;
      cache.lastUpdated = new Date().toISOString();
      this.saveOfflineCache(cache);

      this.syncStatus.syncItems.outfitSuggestions = 'completed';
    } catch (error) {
      this.syncStatus.syncItems.outfitSuggestions = 'failed';
      throw error;
    }
  }

  /**
   * Sync user data
   */
  private async syncUserData(): Promise<void> {
    this.syncStatus.syncItems.userData = 'syncing';

    try {
      // In a real app, this would sync with a backend server
      // For now, just ensure local data is saved
      const userData = userDataService.getAllUserData();
      if (userData) {
        userData.metadata.lastLogin = new Date().toISOString();
        // Data is automatically saved by userDataService
      }

      this.syncStatus.syncItems.userData = 'completed';
    } catch (error) {
      this.syncStatus.syncItems.userData = 'failed';
      throw error;
    }
  }

  /**
   * Sync notifications
   */
  private async syncNotifications(): Promise<void> {
    this.syncStatus.syncItems.notifications = 'syncing';

    try {
      // Check for new notifications
      await smartNotificationService.checkWeatherAlerts();
      await smartNotificationService.checkPriceAlerts();

      this.syncStatus.syncItems.notifications = 'completed';
    } catch (error) {
      this.syncStatus.syncItems.notifications = 'failed';
      throw error;
    }
  }

  /**
   * Get offline cache
   */
  getOfflineCache(): OfflineCache {
    try {
      const stored = localStorage.getItem('offlineCache');
      if (stored) {
        const cache = JSON.parse(stored);

        // Check if cache is expired
        const expiresAt = new Date(cache.expiresAt);
        if (expiresAt > new Date()) {
          return cache;
        }
      }
    } catch (error) {
      console.warn('Failed to load offline cache');
    }

    // Return empty cache
    return this.createEmptyCache();
  }

  /**
   * Save offline cache
   */
  saveOfflineCache(cache: OfflineCache): void {
    try {
      // Set expiry time
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + this.CACHE_DURATION);
      cache.expiresAt = expiresAt.toISOString();

      localStorage.setItem('offlineCache', JSON.stringify(cache));
      console.log('💾 [QUICK-LOAD] Offline cache saved');
    } catch (error) {
      console.error('Failed to save offline cache:', error);
    }
  }

  /**
   * Create empty cache structure
   */
  private createEmptyCache(): OfflineCache {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.CACHE_DURATION);

    return {
      dailySuggestions: [],
      outfitCombinations: [],
      weatherData: null,
      closetAnalytics: null,
      lastUpdated: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Clear offline cache
   */
  clearOfflineCache(): void {
    localStorage.removeItem('offlineCache');
    console.log('🗑️ [QUICK-LOAD] Offline cache cleared');
  }

  /**
   * Get cached daily suggestions for offline mode
   */
  getCachedDailySuggestions(): DailySuggestions | null {
    const cache = this.getOfflineCache();

    if (cache.dailySuggestions.length > 0) {
      // Return the most recent suggestions
      const latest = cache.dailySuggestions[cache.dailySuggestions.length - 1];

      // Check if they're for today
      const today = new Date().toISOString().split('T')[0];
      if (latest.date === today) {
        return latest;
      }
    }

    return null;
  }

  /**
   * Get cached outfit combinations
   */
  getCachedOutfitCombinations(): any[] {
    const cache = this.getOfflineCache();
    return cache.outfitCombinations || [];
  }

  /**
   * Check if app is in offline mode
   */
  isOfflineMode(): boolean {
    return !navigator.onLine;
  }

  /**
   * Initialize notifications for returning users
   */
  private initializeNotifications(): void {
    // Request permission if not already granted
    smartNotificationService.requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('🔔 [QUICK-LOAD] Notifications initialized');
      }
    });
  }

  /**
   * Get sync status for UI display
   */
  getSyncStatus(): BackgroundSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force a manual sync
   */
  async forceSyncNow(): Promise<void> {
    console.log('🔄 [QUICK-LOAD] Manual sync requested');
    await this.performBackgroundSync();
  }

  /**
   * Preload critical data for faster navigation
   */
  async preloadCriticalData(): Promise<void> {
    console.log('⚡ [QUICK-LOAD] Preloading critical data...');

    try {
      // Preload weather data if stale
      const cache = this.getOfflineCache();
      if (!cache.weatherData || this.getCacheAge(cache.weatherData) > this.CACHE_DURATION / 2) {
        weatherService.getCurrentWeather().catch(() => {
          // Silent fail - use cached data
        });
      }

      // Preload today's suggestions if missing
      const cachedSuggestions = this.getCachedDailySuggestions();
      if (!cachedSuggestions) {
        personalizedFashionService.generateDailySuggestions().catch(() => {
          // Silent fail - will generate on demand
        });
      }

      console.log('✅ [QUICK-LOAD] Critical data preloaded');
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get app performance metrics
   */
  getPerformanceMetrics(): {
    cacheHitRate: number;
    averageLoadTime: number;
    syncSuccessRate: number;
    offlineFallbackUsage: number;
  } {
    // In a real app, these would be tracked over time
    return {
      cacheHitRate: 0.85, // 85% cache hit rate
      averageLoadTime: 1200, // 1.2 seconds average load time
      syncSuccessRate: 0.95, // 95% sync success rate
      offlineFallbackUsage: 0.05 // 5% offline fallback usage
    };
  }

  /**
   * Export data for backup
   */
  exportAllData(): string {
    const loginState = this.getLoginState();
    const userData = userDataService.getAllUserData();
    const cache = this.getOfflineCache();
    const syncStatus = this.getSyncStatus();

    return JSON.stringify({
      loginState,
      userData,
      cache,
      syncStatus,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import data from backup
   */
  importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.userData) {
        userDataService.importUserData(JSON.stringify(data.userData));
      }

      if (data.cache) {
        this.saveOfflineCache(data.cache);
      }

      console.log('✅ [QUICK-LOAD] Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Singleton instance
export const quickLoadService = new QuickLoadService();
export default quickLoadService;