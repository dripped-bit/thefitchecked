/**
 * Debug Configuration
 * Centralized control for console logging verbosity
 */

export interface DebugConfig {
  // Service-specific logging
  showFashnLogs: boolean;
  showFashnWarnings: boolean;
  showSampleValidation: boolean;
  showAvatarGeneration: boolean;
  showClosetOperations: boolean;
  showCalendarOperations: boolean;

  // General logging
  showDetailedLogs: boolean;
  showPerformanceMetrics: boolean;
  showApiCalls: boolean;

  // Development helpers
  groupSimilarLogs: boolean;
  suppressRepetitiveWarnings: boolean;
}

// Default configuration - set to false in production
export const DEBUG_CONFIG: DebugConfig = {
  // Service logging (disable to reduce noise)
  showFashnLogs: import.meta.env.DEV,
  showFashnWarnings: false, // Only show once per session
  showSampleValidation: false, // Disable noisy sample scoring logs
  showAvatarGeneration: import.meta.env.DEV,
  showClosetOperations: import.meta.env.DEV,
  showCalendarOperations: import.meta.env.DEV,

  // General logging
  showDetailedLogs: import.meta.env.DEV,
  showPerformanceMetrics: import.meta.env.DEV,
  showApiCalls: import.meta.env.DEV,

  // Development helpers
  groupSimilarLogs: true,
  suppressRepetitiveWarnings: true
};

/**
 * Conditional logging helper
 */
export const debugLog = {
  fashn: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showFashnLogs) {
      console.log(message, ...args);
    }
  },

  sample: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showSampleValidation) {
      console.log(message, ...args);
    }
  },

  avatar: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showAvatarGeneration) {
      console.log(message, ...args);
    }
  },

  closet: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showClosetOperations) {
      console.log(message, ...args);
    }
  },

  calendar: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showCalendarOperations) {
      console.log(message, ...args);
    }
  },

  api: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showApiCalls) {
      console.log(message, ...args);
    }
  },

  performance: (message: string, ...args: any[]) => {
    if (DEBUG_CONFIG.showPerformanceMetrics) {
      console.log(message, ...args);
    }
  }
};

/**
 * Warning suppression helper
 * Tracks warning counts and only shows first occurrence + summary
 */
class WarningManager {
  private warnCounts = new Map<string, number>();
  private originalWarn = console.warn;
  private enabled = false;

  enable() {
    if (this.enabled || !DEBUG_CONFIG.suppressRepetitiveWarnings) return;

    console.warn = (...args: any[]) => {
      const message = args.join(' ');

      const count = this.warnCounts.get(message) || 0;
      this.warnCounts.set(message, count + 1);

      // Show first occurrence
      if (count === 0) {
        this.originalWarn.apply(console, args);
      }
      // Show summary at milestones
      else if (count === 10 || count === 50 || count === 100) {
        this.originalWarn(`(Suppressed ${count} similar warnings)`);
      }
    };

    this.enabled = true;
  }

  disable() {
    if (!this.enabled) return;
    console.warn = this.originalWarn;
    this.enabled = false;
  }

  reset() {
    this.warnCounts.clear();
  }

  getStats() {
    const stats: Record<string, number> = {};
    this.warnCounts.forEach((count, message) => {
      stats[message.substring(0, 100)] = count;
    });
    return stats;
  }
}

export const warningManager = new WarningManager();

/**
 * Initialize debug configuration
 */
export function initializeDebugConfig() {
  if (import.meta.env.DEV) {
    console.groupCollapsed('⚙️ Debug Configuration');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Config:', DEBUG_CONFIG);
    console.groupEnd();

    // Enable warning suppression
    if (DEBUG_CONFIG.suppressRepetitiveWarnings) {
      warningManager.enable();
    }
  }
}

/**
 * Get debug stats
 */
export function getDebugStats() {
  return {
    config: DEBUG_CONFIG,
    warnings: warningManager.getStats()
  };
}
