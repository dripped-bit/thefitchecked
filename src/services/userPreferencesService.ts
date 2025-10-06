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

export interface StyleProfilePreferences {
  id: string;
  style_vibes?: string[];
  favorite_colors?: string[];
  avoid_colors?: string[];
  lifestyle?: string[];
  favorite_stores?: string[];
  custom_stores?: string[];
  fit_preference?: string;
  occasion_priorities?: string[];
  boundaries?: string[];
  three_words?: string[];
  inspiration_images?: {
    inspiration1?: string | null;
    inspiration2?: string | null;
  };
  created_at?: Date;
  updated_at?: Date;
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

  /**
   * Save complete style profile preferences to Supabase
   */
  async saveStyleProfile(userId: string, profile: Omit<StyleProfilePreferences, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('style_preferences')
        .upsert({
          id: userId,
          style_vibes: profile.style_vibes || [],
          favorite_colors: profile.favorite_colors || [],
          avoid_colors: profile.avoid_colors || [],
          lifestyle: profile.lifestyle || [],
          favorite_stores: profile.favorite_stores || [],
          custom_stores: profile.custom_stores || [],
          fit_preference: profile.fit_preference || '',
          occasion_priorities: profile.occasion_priorities || [],
          boundaries: profile.boundaries || [],
          three_words: profile.three_words || [],
          inspiration_images: profile.inspiration_images || {},
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ [USER-PREFS] Error saving style profile:', error);
        return false;
      }

      console.log('✅ [USER-PREFS] Style profile saved to Supabase');
      return true;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to save style profile:', error);
      return false;
    }
  }

  /**
   * Get complete style profile from Supabase
   */
  async getStyleProfile(userId: string): Promise<StyleProfilePreferences | null> {
    try {
      const { data, error } = await supabase
        .from('style_preferences')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [USER-PREFS] Error fetching style profile:', error);
        return null;
      }

      console.log('📚 [USER-PREFS] Style profile loaded from Supabase');
      return data;
    } catch (error) {
      console.error('❌ [USER-PREFS] Failed to fetch style profile:', error);
      return null;
    }
  }
}

// Singleton instance
export const userPreferencesService = new UserPreferencesService();
export default userPreferencesService;
