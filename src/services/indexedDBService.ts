/**
 * IndexedDB Service
 * Provides a simple async API for IndexedDB storage with 50MB+ capacity
 * Replaces localStorage to avoid QuotaExceededError
 */

interface IndexedDBConfig {
  databaseName: string;
  version: number;
  stores: string[];
}

class IndexedDBService {
  private config: IndexedDBConfig = {
    databaseName: 'fit-checked-db',
    version: 1,
    stores: [
      'styleProfile',
      'avatarLibrary',
      'closet',
      'wishlist',
      'outfits',
      'calendar',
      'community',
      'userData',
      'achievements',
      'woreThisToday',
      'quickLoad',
      'demoData'
    ]
  };

  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName, this.config.version);

      request.onerror = () => {
        console.error('❌ [INDEXEDDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('✅ [INDEXEDDB] Database opened successfully');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log('🔧 [INDEXEDDB] Upgrading database schema...');
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for each storage type
        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
            console.log(`📦 [INDEXEDDB] Created object store: ${storeName}`);
          }
        });
      };
    });

    return this.dbPromise;
  }

  /**
   * Get a value from IndexedDB
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const value = request.result;
          if (value !== undefined) {
            console.log(`📖 [INDEXEDDB] Retrieved from ${storeName}/${key}`);
            resolve(value as T);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error(`❌ [INDEXEDDB] Failed to get ${storeName}/${key}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`❌ [INDEXEDDB] Error getting ${storeName}/${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in IndexedDB
   */
  async set<T>(storeName: string, key: string, value: T): Promise<boolean> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);

        request.onsuccess = () => {
          console.log(`💾 [INDEXEDDB] Saved to ${storeName}/${key}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error(`❌ [INDEXEDDB] Failed to save ${storeName}/${key}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`❌ [INDEXEDDB] Error saving ${storeName}/${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from IndexedDB
   */
  async delete(storeName: string, key: string): Promise<boolean> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          console.log(`🗑️ [INDEXEDDB] Deleted ${storeName}/${key}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error(`❌ [INDEXEDDB] Failed to delete ${storeName}/${key}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`❌ [INDEXEDDB] Error deleting ${storeName}/${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys in a store
   */
  async getAllKeys(storeName: string): Promise<string[]> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result.map(k => String(k));
          console.log(`🔑 [INDEXEDDB] Retrieved ${keys.length} keys from ${storeName}`);
          resolve(keys);
        };

        request.onerror = () => {
          console.error(`❌ [INDEXEDDB] Failed to get keys from ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`❌ [INDEXEDDB] Error getting keys from ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<boolean> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log(`🧹 [INDEXEDDB] Cleared all data from ${storeName}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error(`❌ [INDEXEDDB] Failed to clear ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error(`❌ [INDEXEDDB] Error clearing ${storeName}:`, error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    usage: number;
    quota: number;
    usagePercentage: number;
  }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

        console.log(`📊 [INDEXEDDB] Storage usage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${usagePercentage.toFixed(2)}%)`);

        return {
          usage,
          quota,
          usagePercentage
        };
      }
    } catch (error) {
      console.error('❌ [INDEXEDDB] Failed to get storage stats:', error);
    }

    return {
      usage: 0,
      quota: 0,
      usagePercentage: 0
    };
  }

  /**
   * Check if IndexedDB is supported
   */
  isSupported(): boolean {
    return 'indexedDB' in window;
  }

  /**
   * Delete the entire database (for testing/cleanup)
   */
  async deleteDatabase(): Promise<boolean> {
    try {
      // Close existing connection
      if (this.dbPromise) {
        const db = await this.dbPromise;
        db.close();
        this.dbPromise = null;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(this.config.databaseName);

        request.onsuccess = () => {
          console.log('🗑️ [INDEXEDDB] Database deleted successfully');
          resolve(true);
        };

        request.onerror = () => {
          console.error('❌ [INDEXEDDB] Failed to delete database:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ [INDEXEDDB] Error deleting database:', error);
      return false;
    }
  }
}

// Export singleton instance
const indexedDBService = new IndexedDBService();
export default indexedDBService;
