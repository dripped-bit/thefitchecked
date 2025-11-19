/**
 * Clear Cache Utility
 * Comprehensive cache clearing for development and troubleshooting
 * Clears IndexedDB, localStorage, sessionStorage, and all app data
 */

import indexedDBService from '../services/indexedDBService';
import promptDebugService from '../services/promptDebugService';

/**
 * Clear all app cache and storage
 * WARNING: This will delete ALL user data including:
 * - Avatar library
 * - Closet items
 * - Style preferences
 * - Outfit plans
 * - Calendar data
 * - All localStorage and sessionStorage
 */
export async function clearAppCache(): Promise<void> {
  try {
    console.log('🧹 [CACHE-CLEAR] Starting comprehensive cache clear...');

    // 1. Clear IndexedDB
    console.log('🗄️ [CACHE-CLEAR] Deleting IndexedDB database...');
    await indexedDBService.deleteDatabase();
    console.log('✅ [CACHE-CLEAR] IndexedDB cleared');

    // 2. Clear localStorage
    console.log('💾 [CACHE-CLEAR] Clearing localStorage...');
    const localStorageKeys = Object.keys(localStorage);
    console.log(`📦 [CACHE-CLEAR] Found ${localStorageKeys.length} localStorage items`);
    localStorage.clear();
    console.log('✅ [CACHE-CLEAR] localStorage cleared');

    // 3. Clear sessionStorage
    console.log('⏳ [CACHE-CLEAR] Clearing sessionStorage...');
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log(`📦 [CACHE-CLEAR] Found ${sessionStorageKeys.length} sessionStorage items`);
    sessionStorage.clear();
    console.log('✅ [CACHE-CLEAR] sessionStorage cleared');

    // 4. Clear prompt debug logs
    console.log('📝 [CACHE-CLEAR] Clearing prompt debug logs...');
    promptDebugService.clearAllEntries();
    console.log('✅ [CACHE-CLEAR] Prompt debug logs cleared');

    console.log('🎉 [CACHE-CLEAR] All cache cleared successfully!');
    console.log('🔄 [CACHE-CLEAR] Reloading page in 1 second...');

    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ [CACHE-CLEAR] Failed to clear cache:', error);
    throw error;
  }
}

/**
 * Clear cache with user confirmation
 */
export async function clearAppCacheWithConfirmation(): Promise<boolean> {
  const confirmed = confirm(
    '⚠️ WARNING: This will delete ALL app data including:\n\n' +
    '• Avatar library\n' +
    '• Closet items\n' +
    '• Style preferences\n' +
    '• Outfit plans\n' +
    '• Calendar data\n' +
    '• All saved settings\n\n' +
    'This action cannot be undone. Continue?'
  );

  if (confirmed) {
    await clearAppCache();
    return true;
  }

  console.log('🚫 [CACHE-CLEAR] Cache clear cancelled by user');
  return false;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  localStorage: number;
  sessionStorage: number;
  indexedDB: string;
} {
  return {
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length,
    indexedDB: 'fit-checked-db (multiple stores)'
  };
}

/**
 * Log current cache usage
 */
export function logCacheStats(): void {
  const stats = getCacheStats();
  console.log('📊 [CACHE-STATS] Current cache usage:');
  console.log('  • localStorage items:', stats.localStorage);
  console.log('  • sessionStorage items:', stats.sessionStorage);
  console.log('  • IndexedDB:', stats.indexedDB);

  // Log localStorage contents
  if (stats.localStorage > 0) {
    console.log('\n📦 [CACHE-STATS] localStorage keys:');
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      const size = value ? new Blob([value]).size : 0;
      console.log(`  • ${key}: ${(size / 1024).toFixed(2)} KB`);
    });
  }
}

export default {
  clearAppCache,
  clearAppCacheWithConfirmation,
  getCacheStats,
  logCacheStats
};
