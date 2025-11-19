/**
 * Prompt Debug Service
 * Developer tool for logging and monitoring prompts used in avatar and outfit generation
 * Access via keyboard shortcut Ctrl+Shift+D (Cmd+Shift+D on Mac)
 */

export interface PromptDebugEntry {
  id: string;
  timestamp: string;
  type: 'avatar' | 'outfit';
  serviceName: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, any>;
  metadata?: {
    imageUrl?: string;
    generationTime?: number;
    success?: boolean;
    error?: string;
  };
}

const STORAGE_KEY = 'fitChecked_promptDebugLogs';
const MAX_ENTRIES = 100; // Keep last 100 prompt logs

class PromptDebugService {
  private listeners: Array<(entries: PromptDebugEntry[]) => void> = [];

  /**
   * Log a new prompt entry
   */
  logPrompt(entry: Omit<PromptDebugEntry, 'id' | 'timestamp'>): PromptDebugEntry {
    const newEntry: PromptDebugEntry = {
      ...entry,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    const allEntries = this.getAllEntries();
    allEntries.unshift(newEntry);

    // Keep only last MAX_ENTRIES
    const trimmedEntries = allEntries.slice(0, MAX_ENTRIES);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEntries));
      console.log('🔍 [PROMPT-DEBUG] Logged:', entry.type, entry.serviceName);

      // Notify listeners
      this.notifyListeners(trimmedEntries);

      return newEntry;
    } catch (error) {
      console.error('❌ [PROMPT-DEBUG] Failed to log prompt:', error);
      throw error;
    }
  }

  /**
   * Get all prompt entries
   */
  getAllEntries(): PromptDebugEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('❌ [PROMPT-DEBUG] Failed to load entries:', error);
      return [];
    }
  }

  /**
   * Get entries filtered by type
   */
  getEntriesByType(type: 'avatar' | 'outfit'): PromptDebugEntry[] {
    return this.getAllEntries().filter(entry => entry.type === type);
  }

  /**
   * Get most recent entry of a specific type
   */
  getLatestEntry(type?: 'avatar' | 'outfit'): PromptDebugEntry | null {
    const entries = type ? this.getEntriesByType(type) : this.getAllEntries();
    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Clear all entries
   */
  clearAllEntries(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 [PROMPT-DEBUG] All entries cleared');
      this.notifyListeners([]);
      return true;
    } catch (error) {
      console.error('❌ [PROMPT-DEBUG] Failed to clear entries:', error);
      return false;
    }
  }

  /**
   * Export entries as JSON
   */
  exportEntries(): string {
    const entries = this.getAllEntries();
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Get statistics
   */
  getStats() {
    const entries = this.getAllEntries();
    const avatarEntries = entries.filter(e => e.type === 'avatar');
    const outfitEntries = entries.filter(e => e.type === 'outfit');
    const successfulEntries = entries.filter(e => e.metadata?.success !== false);

    return {
      total: entries.length,
      avatar: avatarEntries.length,
      outfit: outfitEntries.length,
      successful: successfulEntries.length,
      failed: entries.length - successfulEntries.length
    };
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: (entries: PromptDebugEntry[]) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(entries: PromptDebugEntry[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(entries);
      } catch (error) {
        console.error('❌ [PROMPT-DEBUG] Listener error:', error);
      }
    });
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugModeEnabled(): boolean {
    try {
      return localStorage.getItem('fitChecked_devMode') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    try {
      if (enabled) {
        localStorage.setItem('fitChecked_devMode', 'true');
        console.log('🔍 [PROMPT-DEBUG] Debug mode enabled');
      } else {
        localStorage.removeItem('fitChecked_devMode');
        console.log('🔍 [PROMPT-DEBUG] Debug mode disabled');
      }
    } catch (error) {
      console.error('❌ [PROMPT-DEBUG] Failed to set debug mode:', error);
    }
  }
}

// Export singleton instance
export const promptDebugService = new PromptDebugService();
export default promptDebugService;
