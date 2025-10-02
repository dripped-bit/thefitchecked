/**
 * useDevMode Hook - Enables development mode functionality in components
 * Listens for demo data events from the dev panel and provides auto-fill capabilities
 */

import { useEffect, useCallback } from 'react';
import demoDataService from '../services/demoDataService';

export type DemoDataType =
  | 'measurements'
  | 'userOnboarding'
  | 'styleProfile'
  | 'clothingPrompt'
  | 'outfitName'
  | 'clearAll';

export interface DemoDataEvent {
  type: DemoDataType;
  data?: any;
  variation?: string;
}

// Global event emitter for demo data
class DemoDataEventEmitter {
  private listeners: Map<DemoDataType | 'all', ((event: DemoDataEvent) => void)[]> = new Map();

  subscribe(type: DemoDataType | 'all', callback: (event: DemoDataEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: DemoDataEvent) {
    // Emit to specific type listeners
    const typeListeners = this.listeners.get(event.type) || [];
    typeListeners.forEach(callback => callback(event));

    // Emit to 'all' listeners
    const allListeners = this.listeners.get('all') || [];
    allListeners.forEach(callback => callback(event));

    console.log(`🔧 [DEV-MODE] Event emitted:`, event);
  }
}

export const demoDataEmitter = new DemoDataEventEmitter();

/**
 * Hook for components that need to respond to dev mode demo data events
 */
export function useDevMode(options: {
  onMeasurements?: (data: any) => void;
  onUserOnboarding?: (data: any) => void;
  onStyleProfile?: (data: any) => void;
  onClothingPrompt?: (data: any) => void;
  onOutfitName?: (data: any) => void;
  onClearAll?: () => void;
  listenToAll?: boolean;
} = {}) {

  // Subscribe to demo data events
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to specific event types based on provided handlers
    if (options.onMeasurements) {
      const unsub = demoDataEmitter.subscribe('measurements', (event) => {
        options.onMeasurements!(event.data);
      });
      unsubscribers.push(unsub);
    }

    if (options.onUserOnboarding) {
      const unsub = demoDataEmitter.subscribe('userOnboarding', (event) => {
        options.onUserOnboarding!(event.data);
      });
      unsubscribers.push(unsub);
    }

    if (options.onStyleProfile) {
      const unsub = demoDataEmitter.subscribe('styleProfile', (event) => {
        options.onStyleProfile!(event.data);
      });
      unsubscribers.push(unsub);
    }

    if (options.onClothingPrompt) {
      const unsub = demoDataEmitter.subscribe('clothingPrompt', (event) => {
        options.onClothingPrompt!(event.data);
      });
      unsubscribers.push(unsub);
    }

    if (options.onOutfitName) {
      const unsub = demoDataEmitter.subscribe('outfitName', (event) => {
        options.onOutfitName!(event.data);
      });
      unsubscribers.push(unsub);
    }

    if (options.onClearAll) {
      const unsub = demoDataEmitter.subscribe('clearAll', () => {
        options.onClearAll!();
      });
      unsubscribers.push(unsub);
    }

    // Listen to all events if requested
    if (options.listenToAll) {
      const unsub = demoDataEmitter.subscribe('all', (event) => {
        console.log('🔧 [DEV-MODE] Received event:', event);
      });
      unsubscribers.push(unsub);
    }

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [options]);

  // Helper functions for emitting events (for dev panel use)
  const emitMeasurements = useCallback((variation?: string) => {
    const data = variation
      ? demoDataService.getVariationMeasurements(variation as any)
      : demoDataService.getMeasurements();

    demoDataEmitter.emit({
      type: 'measurements',
      data,
      variation
    });
  }, []);

  const emitUserOnboarding = useCallback(() => {
    const data = demoDataService.getUserData();
    demoDataEmitter.emit({
      type: 'userOnboarding',
      data
    });
  }, []);

  const emitStyleProfile = useCallback(() => {
    const data = demoDataService.getStyleProfile();
    demoDataEmitter.emit({
      type: 'styleProfile',
      data
    });
  }, []);

  const emitClothingPrompt = useCallback((style?: string) => {
    const data = style
      ? demoDataService.getClothingPrompt(style as any)
      : demoDataService.getClothingPrompt();

    demoDataEmitter.emit({
      type: 'clothingPrompt',
      data,
      variation: style
    });
  }, []);

  const emitOutfitName = useCallback((category?: string) => {
    const data = category
      ? demoDataService.getOutfitName(category as any)
      : demoDataService.getOutfitName();

    demoDataEmitter.emit({
      type: 'outfitName',
      data,
      variation: category
    });
  }, []);

  const emitClearAll = useCallback(() => {
    demoDataService.clearAllDemoData();
    demoDataEmitter.emit({
      type: 'clearAll'
    });
  }, []);

  // Determine if dev mode is enabled
  const devModeEnabled = process.env.NODE_ENV === 'development' ||
                        localStorage.getItem('devMode') === 'true' ||
                        window.location.search.includes('dev=true');

  return {
    // Dev mode status
    devModeEnabled,

    // Emit functions (primarily for dev panel)
    emitMeasurements,
    emitUserOnboarding,
    emitStyleProfile,
    emitClothingPrompt,
    emitOutfitName,
    emitClearAll,

    // Direct access to demo data service
    demoDataService
  };
}

/**
 * Simplified hook for forms that only need to listen for their specific data type
 */
export function useDevModeAutoFill<T>(
  dataType: DemoDataType,
  onDataReceived: (data: T) => void
) {
  return useDevMode({
    [getCallbackName(dataType)]: onDataReceived
  });
}

// Helper function to get the correct callback name
function getCallbackName(dataType: DemoDataType): string {
  const mapping: Record<DemoDataType, string> = {
    measurements: 'onMeasurements',
    userOnboarding: 'onUserOnboarding',
    styleProfile: 'onStyleProfile',
    clothingPrompt: 'onClothingPrompt',
    outfitName: 'onOutfitName',
    clearAll: 'onClearAll'
  };
  return mapping[dataType] || 'onClearAll';
}

export default useDevMode;