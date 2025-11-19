/**
 * Outfit Reminder Service
 * Manages occasion tracking and reminder notifications
 * Integrates with existing pushNotificationService
 */

import { supabase } from './supabaseClient';
import authService from './authService';
import { pushNotificationService } from './pushNotificationService';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface Occasion {
  id?: string;
  user_id?: string;
  name: string;
  date: string; // ISO date string
  type: 'wedding' | 'party' | 'business' | 'date' | 'interview' | 'casual' | 'formal' | 'other';
  reminder_days: number[]; // e.g., [7, 3, 1] for 7 days, 3 days, 1 day before
  outfit_purchased: boolean;
  outfit_notes?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeviceToken {
  id?: string;
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android';
  app_version?: string;
  last_updated?: string;
  is_active: boolean;
}

class OutfitReminderService {
  private initialized = false;

  /**
   * Initialize the service - call this on app startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('👔 [OUTFIT-REMINDER] Initializing service...');

    try {
      // Request push notification permission
      if (Capacitor.isNativePlatform()) {
        await this.setupPushNotifications();
      }

      // Setup local notification handler
      await pushNotificationService.requestPermission();
      pushNotificationService.setupNotificationHandler();

      this.initialized = true;
      console.log('✅ [OUTFIT-REMINDER] Service initialized');
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Initialization failed:', error);
    }
  }

  /**
   * Setup push notifications (APNs for iOS)
   */
  private async setupPushNotifications(): Promise<void> {
    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();

      if (permResult.receive !== 'granted') {
        console.warn('⚠️ [OUTFIT-REMINDER] Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration success
      await PushNotifications.addListener('registration', async (token) => {
        console.log('📱 [OUTFIT-REMINDER] APNs token received:', token.value);
        await this.registerDeviceToken(token.value);
      });

      // Listen for registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ [OUTFIT-REMINDER] APNs registration error:', error);
      });

      // Listen for push notifications
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📬 [OUTFIT-REMINDER] Push notification received:', notification);
      });

      // Listen for notification actions (taps)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 [OUTFIT-REMINDER] Notification tapped:', action);
        const data = action.notification.data;
        if (data.occasionId) {
          this.handleNotificationTap(data.occasionId);
        }
      });

      console.log('✅ [OUTFIT-REMINDER] Push notifications configured');
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to setup push notifications:', error);
    }
  }

  /**
   * Register device token with backend
   */
  private async registerDeviceToken(token: string): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [OUTFIT-REMINDER] No user, skipping token registration');
        return;
      }

      const deviceToken: Partial<DeviceToken> = {
        user_id: user.id,
        device_token: token,
        platform: 'ios',
        app_version: '1.0.0', // TODO: Get from app config
        is_active: true
      };

      const { error } = await supabase
        .from('device_tokens')
        .upsert(deviceToken, {
          onConflict: 'device_token'
        });

      if (error) throw error;

      console.log('✅ [OUTFIT-REMINDER] Device token registered');
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to register token:', error);
    }
  }

  /**
   * Create a new occasion
   */
  async createOccasion(occasion: Omit<Occasion, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Occasion | null> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const newOccasion: Partial<Occasion> = {
        ...occasion,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('occasions')
        .insert(newOccasion)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [OUTFIT-REMINDER] Occasion created:', data.name);

      // Schedule local notifications
      if (data) {
        await this.scheduleReminders(data);
      }

      return data;
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to create occasion:', error);
      return null;
    }
  }

  /**
   * Get all occasions for current user
   */
  async getOccasions(): Promise<Occasion[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('occasions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      console.log(`✅ [OUTFIT-REMINDER] Fetched ${data?.length || 0} occasions`);
      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to fetch occasions:', error);
      return [];
    }
  }

  /**
   * Get upcoming occasions (next 30 days)
   */
  async getUpcomingOccasions(): Promise<Occasion[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return [];

      const now = new Date().toISOString();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const future = futureDate.toISOString();

      const { data, error } = await supabase
        .from('occasions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', now)
        .lte('date', future)
        .order('date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to fetch upcoming occasions:', error);
      return [];
    }
  }

  /**
   * Update an occasion
   */
  async updateOccasion(id: string, updates: Partial<Occasion>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('occasions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [OUTFIT-REMINDER] Occasion updated:', id);

      // If outfit was purchased, cancel reminders
      if (updates.outfit_purchased) {
        await this.cancelReminders(id);
      }

      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to update occasion:', error);
      return false;
    }
  }

  /**
   * Delete an occasion
   */
  async deleteOccasion(id: string): Promise<boolean> {
    try {
      // Cancel reminders first
      await this.cancelReminders(id);

      const { error } = await supabase
        .from('occasions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [OUTFIT-REMINDER] Occasion deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to delete occasion:', error);
      return false;
    }
  }

  /**
   * Mark outfit as purchased
   */
  async markOutfitPurchased(occasionId: string): Promise<boolean> {
    return this.updateOccasion(occasionId, { outfit_purchased: true });
  }

  /**
   * Schedule local reminders for an occasion
   */
  private async scheduleReminders(occasion: Occasion): Promise<void> {
    try {
      if (!occasion.reminder_days || occasion.reminder_days.length === 0) {
        console.log('⚠️ [OUTFIT-REMINDER] No reminder days configured');
        return;
      }

      // Use existing pushNotificationService for local notifications
      for (const daysBefore of occasion.reminder_days) {
        const eventDate = new Date(occasion.date);
        const reminderDate = new Date(eventDate);
        reminderDate.setDate(eventDate.getDate() - daysBefore);
        reminderDate.setHours(9, 0, 0, 0); // 9 AM

        // Only schedule if in the future
        if (reminderDate <= new Date()) continue;

        const message = daysBefore === 1
          ? `Your ${occasion.name} is tomorrow! Have you purchased your outfit?`
          : `Your ${occasion.name} is in ${daysBefore} days! Time to plan your outfit.`;

        // Schedule using existing service
        await pushNotificationService.scheduleOutfitReminder(
          {
            id: occasion.id || '',
            eventDate: occasion.date,
            occasion: occasion.name,
            shoppingLinks: [] // Could integrate shopping links here
          },
          daysBefore
        );
      }

      console.log(`✅ [OUTFIT-REMINDER] Scheduled ${occasion.reminder_days.length} reminders for ${occasion.name}`);
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to schedule reminders:', error);
    }
  }

  /**
   * Cancel all reminders for an occasion
   */
  private async cancelReminders(occasionId: string): Promise<void> {
    try {
      // Get the occasion to know which notifications to cancel
      const { data: occasion, error } = await supabase
        .from('occasions')
        .select('*')
        .eq('id', occasionId)
        .single();

      if (error || !occasion) return;

      // Cancel each reminder using notification IDs
      for (const daysBefore of occasion.reminder_days || []) {
        const notificationId = parseInt(occasionId) || Date.now();
        await pushNotificationService.cancelNotification(notificationId);
      }

      console.log(`✅ [OUTFIT-REMINDER] Cancelled reminders for occasion ${occasionId}`);
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to cancel reminders:', error);
    }
  }

  /**
   * Handle notification tap - navigate to occasion detail
   */
  private handleNotificationTap(occasionId: string): void {
    console.log('🔗 [OUTFIT-REMINDER] Navigate to occasion:', occasionId);

    // Store pending navigation
    sessionStorage.setItem('pending_occasion_view', occasionId);

    // Navigate to calendar/occasions page
    window.location.hash = '#/calendar';
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(): Promise<{
    totalOccasions: number;
    upcomingOccasions: number;
    outfitsPurchased: number;
    needsAttention: number;
  }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { totalOccasions: 0, upcomingOccasions: 0, outfitsPurchased: 0, needsAttention: 0 };
      }

      const now = new Date().toISOString();

      // Total occasions
      const { count: totalOccasions } = await supabase
        .from('occasions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Upcoming occasions (next 30 days)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const { count: upcomingOccasions } = await supabase
        .from('occasions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', now)
        .lte('date', futureDate.toISOString());

      // Outfits purchased
      const { count: outfitsPurchased } = await supabase
        .from('occasions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('outfit_purchased', true);

      // Needs attention (upcoming without outfit)
      const { count: needsAttention } = await supabase
        .from('occasions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', now)
        .lte('date', futureDate.toISOString())
        .eq('outfit_purchased', false);

      return {
        totalOccasions: totalOccasions || 0,
        upcomingOccasions: upcomingOccasions || 0,
        outfitsPurchased: outfitsPurchased || 0,
        needsAttention: needsAttention || 0
      };
    } catch (error) {
      console.error('❌ [OUTFIT-REMINDER] Failed to get statistics:', error);
      return { totalOccasions: 0, upcomingOccasions: 0, outfitsPurchased: 0, needsAttention: 0 };
    }
  }
}

// Export singleton instance
export const outfitReminderService = new OutfitReminderService();
export default outfitReminderService;
