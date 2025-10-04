/**
 * Reminder Monitor Service
 * Monitors calendar outfit reminders and triggers notifications when due
 */

import smartNotificationService from './smartNotificationService';

interface OutfitReminder {
  id: number;
  reminderDate: string;
  eventDate: string;
  occasion: string;
  message: string;
  shoppingLinks?: string[];
  triggered?: boolean;
}

class ReminderMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
  private readonly STORAGE_KEY = 'outfit_reminders';

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start monitoring reminders
   */
  startMonitoring(): void {
    console.log('🔔 [REMINDER-MONITOR] Service started');

    // Check immediately on start
    this.checkReminders();

    // Set up recurring check
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring reminders
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🔔 [REMINDER-MONITOR] Service stopped');
    }
  }

  /**
   * Check all reminders and trigger notifications for due reminders
   */
  async checkReminders(): Promise<void> {
    try {
      const reminders = this.getReminders();
      const now = new Date();
      const today = now.toDateString();

      console.log(`🔍 [REMINDER-MONITOR] Checking ${reminders.length} reminders...`);

      for (const reminder of reminders) {
        // Skip if already triggered
        if (reminder.triggered) continue;

        const reminderDate = new Date(reminder.reminderDate);
        const reminderDay = reminderDate.toDateString();

        // Check if reminder date is today or in the past
        if (reminderDay === today || reminderDate < now) {
          console.log('📅 [REMINDER-MONITOR] Reminder due:', {
            id: reminder.id,
            occasion: reminder.occasion,
            eventDate: reminder.eventDate,
            linksCount: reminder.shoppingLinks?.length || 0
          });

          await this.triggerReminder(reminder);
        }
      }
    } catch (error) {
      console.error('❌ [REMINDER-MONITOR] Error checking reminders:', error);
    }
  }

  /**
   * Trigger a reminder notification
   */
  private async triggerReminder(reminder: OutfitReminder): Promise<void> {
    try {
      const eventDate = new Date(reminder.eventDate);
      const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Create notification message
      const message = daysUntil > 0
        ? `Your ${reminder.occasion} is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}! ${reminder.shoppingLinks?.length ? 'Time to shop for your outfit.' : ''}`
        : reminder.message;

      // Create notification with shopping links
      const notification = {
        id: `reminder_${reminder.id}_${Date.now()}`,
        type: 'event_planning' as const,
        title: `🛍️ Outfit Reminder: ${reminder.occasion}`,
        message: message,
        priority: 'high' as const,
        scheduledFor: new Date().toISOString(),
        actionUrl: reminder.shoppingLinks?.length ? '#shopping-links' : undefined,
        actionLabel: reminder.shoppingLinks?.length ? 'View Shopping Links' : undefined,
        data: {
          reminderId: reminder.id,
          occasion: reminder.occasion,
          eventDate: reminder.eventDate,
          shoppingLinks: reminder.shoppingLinks || []
        }
      };

      // Send notification
      await smartNotificationService.sendNotification(notification);

      // Mark reminder as triggered
      this.markReminderTriggered(reminder.id);

      console.log('✅ [REMINDER-MONITOR] Notification sent for reminder:', reminder.id);
    } catch (error) {
      console.error('❌ [REMINDER-MONITOR] Failed to trigger reminder:', error);
    }
  }

  /**
   * Get all reminders from localStorage
   */
  private getReminders(): OutfitReminder[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [REMINDER-MONITOR] Failed to load reminders:', error);
      return [];
    }
  }

  /**
   * Save reminders to localStorage
   */
  private saveReminders(reminders: OutfitReminder[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('❌ [REMINDER-MONITOR] Failed to save reminders:', error);
    }
  }

  /**
   * Mark a reminder as triggered
   */
  private markReminderTriggered(reminderId: number): void {
    const reminders = this.getReminders();
    const updated = reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, triggered: true }
        : reminder
    );
    this.saveReminders(updated);
  }

  /**
   * Add a new reminder (called by CalendarEntryModal)
   */
  addReminder(reminder: Omit<OutfitReminder, 'triggered'>): void {
    const reminders = this.getReminders();
    reminders.push({ ...reminder, triggered: false });
    this.saveReminders(reminders);
    console.log('➕ [REMINDER-MONITOR] Reminder added:', {
      id: reminder.id,
      occasion: reminder.occasion,
      reminderDate: reminder.reminderDate
    });
  }

  /**
   * Remove old triggered reminders (cleanup)
   */
  cleanupOldReminders(daysOld: number = 30): void {
    const reminders = this.getReminders();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filtered = reminders.filter(reminder => {
      const eventDate = new Date(reminder.eventDate);
      return eventDate > cutoffDate || !reminder.triggered;
    });

    this.saveReminders(filtered);
    console.log(`🧹 [REMINDER-MONITOR] Cleaned up old reminders (${reminders.length - filtered.length} removed)`);
  }

  /**
   * Get all pending reminders (not yet triggered)
   */
  getPendingReminders(): OutfitReminder[] {
    return this.getReminders().filter(r => !r.triggered);
  }

  /**
   * Get reminder by ID
   */
  getReminder(id: number): OutfitReminder | null {
    const reminders = this.getReminders();
    return reminders.find(r => r.id === id) || null;
  }
}

// Export singleton instance
export const reminderMonitorService = new ReminderMonitorService();
export default reminderMonitorService;
