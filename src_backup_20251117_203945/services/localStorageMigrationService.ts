/**
 * localStorage Migration Service
 * One-time migration from localStorage to IndexedDB
 * Preserves all existing user data during the transition
 */

import indexedDBService from './indexedDBService';

interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  totalSize: number;
}

class LocalStorageMigrationService {
  private readonly MIGRATION_FLAG_KEY = 'indexedDB_migration_completed';

  // Map localStorage keys to IndexedDB stores
  private readonly KEY_MAPPING: Record<string, { store: string; key: string }> = {
    'styleProfile': { store: 'styleProfile', key: 'current' },
    'avatarLibrary': { store: 'avatarLibrary', key: 'library' },
    'closet': { store: 'closet', key: 'items' },
    'wishlist': { store: 'wishlist', key: 'items' },
    'wishlistMonitoring': { store: 'wishlist', key: 'monitoring' },
    'outfitHistory': { store: 'outfits', key: 'history' },
    'generatedOutfits': { store: 'outfits', key: 'generated' },
    'calendarData': { store: 'calendar', key: 'data' },
    'woreThisToday': { store: 'woreThisToday', key: 'entries' },
    'communityPosts': { store: 'community', key: 'posts' },
    'communityLikes': { store: 'community', key: 'likes' },
    'userProfile': { store: 'userData', key: 'profile' },
    'userPreferences': { store: 'userData', key: 'preferences' },
    'achievements': { store: 'achievements', key: 'unlocked' },
    'achievementProgress': { store: 'achievements', key: 'progress' },
    'quickLoadData': { store: 'quickLoad', key: 'data' },
    'demoMode': { store: 'demoData', key: 'settings' }
  };

  /**
   * Check if migration has already been completed
   */
  private hasMigrated(): boolean {
    try {
      return localStorage.getItem(this.MIGRATION_FLAG_KEY) === 'true';
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to check migration status:', error);
      return false;
    }
  }

  /**
   * Mark migration as completed
   */
  private markMigrationComplete(): void {
    try {
      localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
      console.log('✅ [MIGRATION] Migration marked as complete');
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to mark migration as complete:', error);
    }
  }

  /**
   * Get all localStorage keys (excluding migration flag)
   */
  private getLocalStorageKeys(): string[] {
    const keys: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== this.MIGRATION_FLAG_KEY) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to get localStorage keys:', error);
    }

    return keys;
  }

  /**
   * Estimate size of localStorage data
   */
  private estimateSize(data: string): number {
    // Each character is 2 bytes in UTF-16
    return data.length * 2;
  }

  /**
   * Migrate a single localStorage item to IndexedDB
   */
  private async migrateItem(key: string): Promise<{ success: boolean; error?: string; size: number }> {
    try {
      const value = localStorage.getItem(key);

      if (value === null) {
        return { success: false, error: 'No value found', size: 0 };
      }

      const size = this.estimateSize(value);

      // Check if we have a mapping for this key
      const mapping = this.KEY_MAPPING[key];

      if (mapping) {
        // Parse JSON value if possible
        let parsedValue: any = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // If not JSON, store as-is
          parsedValue = value;
        }

        // Save to IndexedDB
        const success = await indexedDBService.set(mapping.store, mapping.key, parsedValue);

        if (success) {
          console.log(`✅ [MIGRATION] Migrated ${key} → ${mapping.store}/${mapping.key} (${(size / 1024).toFixed(2)}KB)`);
          return { success: true, size };
        } else {
          return { success: false, error: 'Failed to save to IndexedDB', size };
        }
      } else {
        // For unmapped keys, store in userData with original key
        let parsedValue: any = value;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }

        const success = await indexedDBService.set('userData', key, parsedValue);

        if (success) {
          console.log(`✅ [MIGRATION] Migrated unmapped key ${key} → userData/${key} (${(size / 1024).toFixed(2)}KB)`);
          return { success: true, size };
        } else {
          return { success: false, error: 'Failed to save to IndexedDB', size };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ [MIGRATION] Failed to migrate ${key}:`, error);
      return { success: false, error: errorMessage, size: 0 };
    }
  }

  /**
   * Perform the full migration from localStorage to IndexedDB
   */
  async migrate(options: { clearLocalStorage?: boolean } = {}): Promise<MigrationResult> {
    console.log('🚀 [MIGRATION] Starting localStorage → IndexedDB migration...');

    // Check if already migrated
    if (this.hasMigrated()) {
      console.log('✅ [MIGRATION] Migration already completed');
      return {
        success: true,
        migratedKeys: [],
        errors: [],
        totalSize: 0
      };
    }

    // Check IndexedDB support
    if (!indexedDBService.isSupported()) {
      console.error('❌ [MIGRATION] IndexedDB not supported');
      return {
        success: false,
        migratedKeys: [],
        errors: ['IndexedDB not supported in this browser'],
        totalSize: 0
      };
    }

    const result: MigrationResult = {
      success: true,
      migratedKeys: [],
      errors: [],
      totalSize: 0
    };

    // Get all localStorage keys
    const keys = this.getLocalStorageKeys();
    console.log(`📋 [MIGRATION] Found ${keys.length} items in localStorage`);

    if (keys.length === 0) {
      console.log('✅ [MIGRATION] No data to migrate');
      this.markMigrationComplete();
      return result;
    }

    // Migrate each item
    for (const key of keys) {
      const itemResult = await this.migrateItem(key);

      if (itemResult.success) {
        result.migratedKeys.push(key);
        result.totalSize += itemResult.size;
      } else {
        result.errors.push(`${key}: ${itemResult.error || 'Unknown error'}`);
        result.success = false;
      }
    }

    // Log migration summary
    const totalSizeMB = result.totalSize / 1024 / 1024;
    console.log(`📊 [MIGRATION] Migration summary:
      ✅ Migrated: ${result.migratedKeys.length}/${keys.length} items
      💾 Total size: ${totalSizeMB.toFixed(2)}MB
      ❌ Errors: ${result.errors.length}
    `);

    if (result.errors.length > 0) {
      console.error('❌ [MIGRATION] Migration errors:', result.errors);
    }

    // Clear localStorage if requested and migration was successful
    if (options.clearLocalStorage && result.success) {
      this.clearLocalStorage();
    }

    // Mark migration as complete (even if some items failed)
    this.markMigrationComplete();

    // Show storage stats
    await indexedDBService.getStorageStats();

    return result;
  }

  /**
   * Clear localStorage (except migration flag)
   */
  private clearLocalStorage(): void {
    try {
      const keys = this.getLocalStorageKeys();

      keys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`🗑️ [MIGRATION] Cleared localStorage key: ${key}`);
        } catch (error) {
          console.error(`❌ [MIGRATION] Failed to clear ${key}:`, error);
        }
      });

      console.log('✅ [MIGRATION] localStorage cleared');
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to clear localStorage:', error);
    }
  }

  /**
   * Reset migration (for testing)
   */
  async resetMigration(): Promise<void> {
    try {
      // Remove migration flag
      localStorage.removeItem(this.MIGRATION_FLAG_KEY);

      // Clear IndexedDB
      await indexedDBService.deleteDatabase();

      console.log('🔄 [MIGRATION] Migration reset complete');
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to reset migration:', error);
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): {
    completed: boolean;
    localStorageItemCount: number;
  } {
    return {
      completed: this.hasMigrated(),
      localStorageItemCount: this.getLocalStorageKeys().length
    };
  }
}

// Export singleton instance
const localStorageMigrationService = new LocalStorageMigrationService();
export default localStorageMigrationService;
