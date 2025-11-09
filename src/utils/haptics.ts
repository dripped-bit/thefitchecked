import React from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Haptic Feedback Utilities for TheFitChecked
 *
 * Provides iOS-native haptic feedback for enhanced user experience.
 * All functions are safe to call on web - they simply do nothing if not on native platform.
 *
 * Haptic Types:
 * - Impact: Physical button press feeling (light, medium, heavy)
 * - Notification: Success, warning, error feedback
 * - Selection: Light tap for switching between options
 * - Vibrate: Custom duration vibration
 */

class HapticService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Light impact - for subtle interactions
   * Use for: Toggle switches, checkbox selections, small button taps
   */
  async light() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      console.warn('Haptic light failed:', err);
    }
  }

  /**
   * Medium impact - for standard interactions
   * Use for: Regular button presses, list item selection, menu opening
   */
  async medium() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      console.warn('Haptic medium failed:', err);
    }
  }

  /**
   * Heavy impact - for important interactions
   * Use for: Confirming outfit selection, deleting items, major actions
   */
  async heavy() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (err) {
      console.warn('Haptic heavy failed:', err);
    }
  }

  /**
   * Selection changed - for picker/selector changes
   * Use for: Scrolling through outfit options, style picker, date selector
   */
  async selection() {
    if (!this.isNative) return;
    try {
      await Haptics.selectionStart();
      // Short delay then end
      setTimeout(() => Haptics.selectionEnd(), 50);
    } catch (err) {
      console.warn('Haptic selection failed:', err);
    }
  }

  /**
   * Success notification - for successful actions
   * Use for: Outfit saved, photo uploaded, generation complete
   */
  async success() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (err) {
      console.warn('Haptic success failed:', err);
    }
  }

  /**
   * Warning notification - for cautionary actions
   * Use for: Low storage warning, API limit approaching
   */
  async warning() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (err) {
      console.warn('Haptic warning failed:', err);
    }
  }

  /**
   * Error notification - for failed actions
   * Use for: Upload failed, generation error, invalid input
   */
  async error() {
    if (!this.isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (err) {
      console.warn('Haptic error failed:', err);
    }
  }

  /**
   * Custom vibration pattern
   * Use for: Special effects, unique interactions
   */
  async vibrate(duration: number = 100) {
    if (!this.isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (err) {
      console.warn('Haptic vibrate failed:', err);
    }
  }

  /**
   * Double tap haptic - for favorites/likes
   */
  async doubleTap() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }, 100);
    } catch (err) {
      console.warn('Haptic double tap failed:', err);
    }
  }

  /**
   * Long press haptic - for drag/delete actions
   */
  async longPress() {
    if (!this.isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      setTimeout(async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
      }, 500);
    } catch (err) {
      console.warn('Haptic long press failed:', err);
    }
  }
}

// Export singleton instance
const haptics = new HapticService();
export default haptics;

/**
 * React Hook for Haptic Feedback
 *
 * Usage:
 * const { impact, success, error } = useHaptics();
 * <button onClick={() => { impact('medium'); doSomething(); }}>Click</button>
 */
export const useHaptics = () => {
  return {
    light: () => haptics.light(),
    medium: () => haptics.medium(),
    heavy: () => haptics.heavy(),
    selection: () => haptics.selection(),
    success: () => haptics.success(),
    warning: () => haptics.warning(),
    error: () => haptics.error(),
    vibrate: (duration?: number) => haptics.vibrate(duration),
    doubleTap: () => haptics.doubleTap(),
    longPress: () => haptics.longPress(),
    impact: (style: 'light' | 'medium' | 'heavy') => {
      switch (style) {
        case 'light': return haptics.light();
        case 'medium': return haptics.medium();
        case 'heavy': return haptics.heavy();
      }
    },
    notification: (type: 'success' | 'warning' | 'error') => {
      switch (type) {
        case 'success': return haptics.success();
        case 'warning': return haptics.warning();
        case 'error': return haptics.error();
      }
    }
  };
};

/**
 * Haptic-enabled Button Component
 *
 * Wrapper that adds haptic feedback to any button
 * Note: This is exported but not used - use useHaptics hook instead
 */
export const createHapticWrapper = (
  hapticType: 'light' | 'medium' | 'heavy' = 'medium'
) => {
  return (onClick?: () => void) => {
    return () => {
      haptics[hapticType]();
      onClick?.();
    };
  };
};
