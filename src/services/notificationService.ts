import { supabase } from './supabaseClient';

/**
 * Notification Service
 * Manages in-app notifications and email reminders
 */

export interface Notification {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  sent_at?: Date;
  opened: boolean;
  created_at?: Date;
}

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          metadata: metadata || {},
          opened: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error creating notification:', error);
        return null;
      }

      console.log('✅ [NOTIFICATIONS] Notification created:', title);
      return data;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('opened', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as opened
   */
  async markAsOpened(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ opened: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error marking notification as opened:', error);
        return false;
      }

      console.log('✅ [NOTIFICATIONS] Notification marked as opened');
      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to mark notification as opened:', error);
      return false;
    }
  }

  /**
   * Send weekly style recap notification
   */
  async sendWeeklyRecap(userId: string, stats: {
    outfitsGenerated: number;
    favoriteCount: number;
    topStyle: string;
  }): Promise<boolean> {
    try {
      const message = `You generated ${stats.outfitsGenerated} outfits this week! ${
        stats.favoriteCount > 0 ? `You favorited ${stats.favoriteCount} of them. ` : ''
      }Your most popular style was ${stats.topStyle}. Keep exploring!`;

      await this.createNotification(
        userId,
        'weekly_recap',
        '✨ Your Weekly Style Recap',
        message,
        {
          outfits_generated: stats.outfitsGenerated,
          favorite_count: stats.favoriteCount,
          top_style: stats.topStyle
        }
      );

      console.log('📧 [NOTIFICATIONS] Weekly recap sent');
      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to send weekly recap:', error);
      return false;
    }
  }

  /**
   * Send outfit reminder for upcoming event
   */
  async sendOutfitReminder(
    userId: string,
    occasion: string,
    eventDate: Date,
    outfitId?: string
  ): Promise<boolean> {
    try {
      const message = outfitId
        ? `You have an outfit saved for your ${occasion} on ${eventDate.toLocaleDateString()}! Tap to view it.`
        : `Your ${occasion} is coming up on ${eventDate.toLocaleDateString()}! Need help planning an outfit?`;

      await this.createNotification(
        userId,
        'event_reminder',
        `📅 Upcoming: ${occasion}`,
        message,
        {
          occasion,
          event_date: eventDate.toISOString(),
          outfit_id: outfitId
        }
      );

      console.log('📧 [NOTIFICATIONS] Reminder sent for:', occasion);
      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to send reminder:', error);
      return false;
    }
  }

  /**
   * Send new collection notification
   */
  async sendCollectionNotification(
    userId: string,
    collectionName: string,
    outfitCount: number
  ): Promise<boolean> {
    try {
      const message = `Your "${collectionName}" collection now has ${outfitCount} outfit${
        outfitCount !== 1 ? 's' : ''
      }!`;

      await this.createNotification(
        userId,
        'collection_update',
        '📚 Collection Updated',
        message,
        {
          collection_name: collectionName,
          outfit_count: outfitCount
        }
      );

      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to send collection notification:', error);
      return false;
    }
  }

  /**
   * Send rating request notification
   */
  async sendRatingRequest(userId: string, outfitId: string): Promise<boolean> {
    try {
      const message = 'How did you like this outfit? Rate it to help us recommend better styles!';

      await this.createNotification(
        userId,
        'rating_request',
        '⭐ Rate Your Outfit',
        message,
        {
          outfit_id: outfitId
        }
      );

      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to send rating request:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('opened', false);

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Delete old notifications
   */
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('opened', true)
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error cleaning up notifications:', error);
        return false;
      }

      console.log('🗑️ [NOTIFICATIONS] Cleaned up old notifications');
      return true;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Failed to cleanup notifications:', error);
      return false;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
export default notificationService;
