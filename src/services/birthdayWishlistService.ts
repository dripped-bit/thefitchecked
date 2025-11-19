/**
 * Birthday Wishlist Service
 * Manages birthday wishlist sharing and public access
 */

import { supabase } from './supabaseClient';
import { Share } from '@capacitor/share';

interface BirthdayShare {
  id: string;
  shareToken: string;
  title: string;
  birthdayDate?: string;
  message?: string;
  isPublic: boolean;
  viewCount: number;
}

class BirthdayWishlistService {
  async createBirthdayShare(
    title: string,
    birthdayDate?: Date,
    message?: string
  ): Promise<{ success: boolean; shareToken?: string; url?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique share token
      const shareToken = this.generateToken();

      const { data, error } = await supabase
        .from('birthday_wishlist_shares')
        .insert({
          user_id: user.id,
          share_token: shareToken,
          title,
          birthday_date: birthdayDate?.toISOString().split('T')[0],
          message,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/birthday/${shareToken}`;

      return {
        success: true,
        shareToken,
        url
      };
    } catch (error: any) {
      console.error('❌ [BIRTHDAY] Error creating share:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async shareBirthdayList(shareToken: string, url: string): Promise<void> {
    try {
      await Share.share({
        title: 'My Birthday Wishlist',
        text: 'Check out my birthday wishlist!',
        url,
        dialogTitle: 'Share Birthday Wishlist'
      });
    } catch (error) {
      console.error('❌ [BIRTHDAY] Share error:', error);
    }
  }

  async toggleBirthdayItem(itemId: string, isBirthday: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ is_birthday_item: isBirthday })
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ [BIRTHDAY] Toggle error:', error);
      return false;
    }
  }

  async getBirthdayItems(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_birthday_item', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ [BIRTHDAY] Get items error:', error);
      return [];
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export default new BirthdayWishlistService();
export type { BirthdayShare };
