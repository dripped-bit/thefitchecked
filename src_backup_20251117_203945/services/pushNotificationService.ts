/**
 * Push Notification Service
 * Handles native iOS push notifications for outfit reminders and shopping links
 * Falls back to localStorage when not on native platform
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  scheduleAt: Date;
  data?: any;
}

export interface CalendarReminderData {
  id: string;
  eventDate: string;
  occasion: string;
  shoppingLinks: string[];
}

class PushNotificationService {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isNative) {
      console.log('📱 [PUSH] Not on native platform, skipping permission request');
      return false;
    }

    try {
      const permission = await LocalNotifications.requestPermissions();
      const granted = permission.display === 'granted';
      
      if (granted) {
        console.log('✅ [PUSH] Notification permission granted');
      } else {
        console.warn('⚠️ [PUSH] Notification permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ [PUSH] Failed to request permission:', error);
      return false;
    }
  }

  /**
   * Schedule outfit reminder notification
   */
  async scheduleOutfitReminder(
    calendarEntry: CalendarReminderData,
    daysBeforeEvent: number
  ): Promise<boolean> {
    if (!this.isNative) {
      console.log('📱 [PUSH] Not on native platform, using localStorage fallback');
      return this.fallbackLocalStorage(calendarEntry, daysBeforeEvent);
    }

    try {
      // Calculate notification time
      const eventDate = new Date(calendarEntry.eventDate);
      const notificationDate = new Date(eventDate);
      notificationDate.setDate(eventDate.getDate() - daysBeforeEvent);
      notificationDate.setHours(9, 0, 0, 0);  // 9 AM reminder

      // Don't schedule if date is in the past
      if (notificationDate < new Date()) {
        console.warn('⚠️ [PUSH] Notification date in past, skipping');
        return false;
      }

      // Generate a unique notification ID
      const notificationId = parseInt(calendarEntry.id) || Date.now();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: `🛍️ Shop for ${calendarEntry.occasion}`,
            body: `Your event is in ${daysBeforeEvent} day${daysBeforeEvent !== 1 ? 's' : ''}! Tap to view shopping links.`,
            schedule: { at: notificationDate },
            sound: 'default',
            actionTypeId: 'OUTFIT_REMINDER',
            extra: {
              type: 'outfit_reminder',
              calendarEntryId: calendarEntry.id,
              shoppingLinks: calendarEntry.shoppingLinks,
              occasion: calendarEntry.occasion,
              eventDate: calendarEntry.eventDate
            }
          }
        ]
      });

      console.log(`✅ [PUSH] Scheduled notification for: ${notificationDate.toLocaleString()}`);
      console.log(`📋 [PUSH] Notification ID: ${notificationId}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ [PUSH] Failed to schedule notification:', error);
      return this.fallbackLocalStorage(calendarEntry, daysBeforeEvent);
    }
  }

  /**
   * Fallback to localStorage when native notifications unavailable
   */
  private fallbackLocalStorage(
    calendarEntry: CalendarReminderData,
    daysBeforeEvent: number
  ): boolean {
    try {
      const reminders = JSON.parse(localStorage.getItem('outfit_reminders') || '[]');
      
      const eventDate = new Date(calendarEntry.eventDate);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(eventDate.getDate() - daysBeforeEvent);
      
      reminders.push({
        id: calendarEntry.id,
        eventDate: calendarEntry.eventDate,
        occasion: calendarEntry.occasion,
        message: `Don't forget to shop for your ${calendarEntry.occasion} outfit!`,
        shoppingLinks: calendarEntry.shoppingLinks,
        reminderDate: reminderDate.toISOString(),
        daysBeforeEvent
      });
      
      localStorage.setItem('outfit_reminders', JSON.stringify(reminders));
      console.log('📝 [PUSH] Reminder saved to localStorage as fallback');
      
      return true;
    } catch (error) {
      console.error('❌ [PUSH] Failed to save to localStorage:', error);
      return false;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: number): Promise<void> {
    if (!this.isNative) {
      console.log('📱 [PUSH] Not on native platform, skipping cancel');
      return;
    }
    
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }]
      });
      console.log('🗑️ [PUSH] Cancelled notification:', notificationId);
    } catch (error) {
      console.error('❌ [PUSH] Failed to cancel notification:', error);
    }
  }

  /**
   * Get all pending (scheduled) notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    if (!this.isNative) {
      console.log('📱 [PUSH] Not on native platform, returning empty array');
      return [];
    }
    
    try {
      const result = await LocalNotifications.getPending();
      console.log(`📋 [PUSH] ${result.notifications.length} pending notifications`);
      return result.notifications;
    } catch (error) {
      console.error('❌ [PUSH] Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * Setup notification tap handler
   * Call this once on app launch
   */
  setupNotificationHandler(): void {
    if (!this.isNative) {
      console.log('📱 [PUSH] Not on native platform, skipping handler setup');
      return;
    }

    // Handle notification tap
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('📱 [PUSH] Notification tapped:', notification);
      
      const data = notification.notification.extra;
      
      if (data?.type === 'outfit_reminder' && data?.shoppingLinks) {
        this.handleOutfitReminderTap(data);
      }
    });

    console.log('✅ [PUSH] Notification handler setup complete');
  }

  /**
   * Handle notification tap - navigate to calendar/shopping
   */
  private handleOutfitReminderTap(data: any): void {
    console.log('🛍️ [PUSH] Handling outfit reminder tap:', data.occasion);
    
    // Store intent to open shopping links
    sessionStorage.setItem('pending_shopping_action', JSON.stringify({
      type: 'outfit_reminder',
      calendarEntryId: data.calendarEntryId,
      shoppingLinks: data.shoppingLinks,
      occasion: data.occasion,
      eventDate: data.eventDate
    }));

    // Navigate to calendar
    // This will be picked up by the Calendar component to show shopping links
    window.location.hash = '#/calendar';
    
    console.log('✅ [PUSH] Navigation to calendar triggered');
  }

  /**
   * Clear all pending notifications (for testing/reset)
   */
  async clearAllNotifications(): Promise<void> {
    if (!this.isNative) return;
    
    try {
      const pending = await this.getPendingNotifications();
      
      if (pending.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.map(n => ({ id: n.id }))
        });
        console.log(`🗑️ [PUSH] Cleared ${pending.length} notifications`);
      }
    } catch (error) {
      console.error('❌ [PUSH] Failed to clear notifications:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
