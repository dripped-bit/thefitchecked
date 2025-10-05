import { supabase } from './supabaseClient'

/**
 * User Preferences Service
 * Manages user style preferences in Supabase
 */

export interface UserPreferences {
  id: string;
  preferred_style?: string;
  favorite_colors?: string[];
  gender?: string;
  created_at: Date;
}

class UserPreferencesService {
  /**
   * Save or update user preferences
   */
  async savePreferences(userId: string, preferences: {
    preferred_style?: string;
    favorite_colors?: string[];
    gender?: string;
  }): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          preferred_style: preferences.preferred_style,
          favorite_colors: preferences.favorite_colors,
          gender: preferences.gender
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [USER-PREFS] Error saving preferences:', error);
        return null;
      }

      console.log('✅ [USER-PREFS] Preferences saved successfully');
      return data;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to save preferences:', error);
      return null;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [USER-PREFS] Error fetching preferences:', error);
        return null;
      }

      console.log('📚 [USER-PREFS] Preferences loaded');
      return data;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to fetch preferences:', error);
      return null;
    }
  }

  /**
   * Update preferred style
   */
  async updatePreferredStyle(userId: string, style: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ preferred_style: style })
        .eq('id', userId);

      if (error) {
        console.error('❌ [USER-PREFS] Error updating style:', error);
        return false;
      }

      console.log('🎨 [USER-PREFS] Preferred style updated');
      return true;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to update style:', error);
      return false;
    }
  }

  /**
   * Update favorite colors
   */
  async updateFavoriteColors(userId: string, colors: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ favorite_colors: colors })
        .eq('id', userId);

      if (error) {
        console.error('❌ [USER-PREFS] Error updating colors:', error);
        return false;
      }

      console.log('🎨 [USER-PREFS] Favorite colors updated');
      return true;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to update colors:', error);
      return false;
    }
  }
}

// Singleton instance
export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;
