/**
 * Reminder Notification Service
 * Handles checking and triggering purchase reminders for calendar events
 */

interface StoredReminder {
  id: number;
  reminderDate: string;
  eventDate: string;
  occasion: string;
  message: string;
  shoppingLinks?: string[];
  notified: boolean;
  createdAt: number;
}

class ReminderNotificationService {
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
  private readonly STORAGE_KEY = 'outfit_reminders';

  /**
   * Initialize the reminder service
   */
  initialize() {
    console.log('🔔 [REMINDERS] Initializing reminder notification service');

    // Request notification permission if not already granted
    this.requestNotificationPermission();

    // Check for due reminders immediately
    this.checkReminders();

    // Set up periodic checking
    this.startPeriodicCheck();
  }

  /**
   * Request browser notification permission
   */
  private async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('⚠️ [REMINDERS] Browser does not support notifications');
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        console.log('🔔 [REMINDERS] Notification permission:', permission);
      } catch (error) {
        console.error('❌ [REMINDERS] Error requesting notification permission:', error);
      }
    }
  }

  /**
   * Start periodic reminder checking
   */
  private startPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkReminders();
    }, this.CHECK_INTERVAL_MS);

    console.log('✅ [REMINDERS] Periodic check started (every hour)');
  }

  /**
   * Check for reminders that are due
   */
  checkReminders() {
    const reminders = this.getReminders();
    const now = new Date();

    console.log(`🔍 [REMINDERS] Checking ${reminders.length} reminders`);

    let triggeredCount = 0;

    reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.reminderDate);

      // Check if reminder is due and hasn't been notified yet
      if (!reminder.notified && reminderDate <= now) {
        this.triggerReminder(reminder);
        reminder.notified = true;
        triggeredCount++;
      }
    });

    if (triggeredCount > 0) {
      this.saveReminders(reminders);
      console.log(`✅ [REMINDERS] Triggered ${triggeredCount} reminder(s)`);
    }

    // Clean up old reminders (events that passed more than 7 days ago)
    this.cleanupOldReminders();
  }

  /**
   * Trigger a reminder notification
   */
  private triggerReminder(reminder: StoredReminder) {
    console.log('🔔 [REMINDERS] Triggering reminder:', reminder.occasion);

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      this.showBrowserNotification(reminder);
    }

    // Also trigger in-app notification (custom UI)
    this.showInAppNotification(reminder);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(reminder: StoredReminder) {
    try {
      const notification = new Notification('🛍️ Time to Shop!', {
        body: reminder.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `reminder-${reminder.id}`,
        requireInteraction: true,
        data: {
          reminderId: reminder.id,
          shoppingLinks: reminder.shoppingLinks
        }
      });

      notification.onclick = () => {
        window.focus();
        notification.close();

        // Open shopping links if available
        if (reminder.shoppingLinks && reminder.shoppingLinks.length > 0) {
          console.log('🔗 [REMINDERS] Opening shopping links:', reminder.shoppingLinks.length);
          // Open first link in same tab, others in new tabs
          window.location.href = reminder.shoppingLinks[0];
        }
      };

      console.log('✅ [REMINDERS] Browser notification shown');
    } catch (error) {
      console.error('❌ [REMINDERS] Error showing browser notification:', error);
    }
  }

  /**
   * Show in-app notification (custom UI)
   */
  private showInAppNotification(reminder: StoredReminder) {
    // Create a custom event that components can listen to
    const event = new CustomEvent('outfit-reminder', {
      detail: reminder
    });
    window.dispatchEvent(event);

    console.log('✅ [REMINDERS] In-app notification event dispatched');
  }

  /**
   * Get all reminders from localStorage
   */
  private getReminders(): StoredReminder[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [REMINDERS] Error loading reminders:', error);
      return [];
    }
  }

  /**
   * Save reminders to localStorage
   */
  private saveReminders(reminders: StoredReminder[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('❌ [REMINDERS] Error saving reminders:', error);
    }
  }

  /**
   * Clean up old reminders
   */
  private cleanupOldReminders() {
    const reminders = this.getReminders();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filtered = reminders.filter(reminder => {
      const eventDate = new Date(reminder.eventDate);
      return eventDate >= sevenDaysAgo;
    });

    if (filtered.length < reminders.length) {
      this.saveReminders(filtered);
      console.log(`🧹 [REMINDERS] Cleaned up ${reminders.length - filtered.length} old reminder(s)`);
    }
  }

  /**
   * Get all pending (not notified) reminders
   */
  getPendingReminders(): StoredReminder[] {
    return this.getReminders().filter(r => !r.notified);
  }

  /**
   * Mark a reminder as dismissed
   */
  dismissReminder(reminderId: number) {
    const reminders = this.getReminders();
    const updated = reminders.map(r =>
      r.id === reminderId ? { ...r, notified: true } : r
    );
    this.saveReminders(updated);
    console.log('✅ [REMINDERS] Reminder dismissed:', reminderId);
  }

  /**
   * Stop the service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 [REMINDERS] Service stopped');
    }
  }
}

// Export singleton instance
export default new ReminderNotificationService();
