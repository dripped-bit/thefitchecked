/**
 * Outfit History Service
 * Handles saving and retrieving outfit history for AI learning
 */

import { supabase } from './supabaseClient';
import { OutfitItem, CalendarEvent, WeatherData } from './smartCalendarService';

export interface OutfitHistoryRecord {
  id?: string;
  user_id?: string;
  worn_date: Date;
  outfit_items: OutfitItem[];
  event_id?: string;
  event_type?: string;
  weather_data?: WeatherData;
  time_of_day?: 'morning' | 'afternoon' | 'evening';
  day_of_week?: string;
  user_rating?: number;
  mood?: string;
  notes?: string;
  created_at?: Date;
}

class OutfitHistoryService {
  /**
   * Save outfit worn today to Supabase
   */
  async saveOutfitHistory(record: OutfitHistoryRecord): Promise<boolean> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('⚠️ [OUTFIT-HISTORY] No authenticated user, saving to localStorage');
        this.saveToLocalStorage(record);
        return false;
      }

      // Determine time of day
      const hour = record.worn_date.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' = 'afternoon';
      if (hour < 12) timeOfDay = 'morning';
      else if (hour >= 17) timeOfDay = 'evening';

      // Get day of week
      const dayOfWeek = record.worn_date.toLocaleDateString('en-US', { weekday: 'long' });

      // Prepare data for Supabase
      const historyData = {
        user_id: user.id,
        worn_date: record.worn_date.toISOString().split('T')[0], // Date only
        outfit_items: record.outfit_items,
        event_id: record.event_id || null,
        event_type: record.event_type || null,
        weather_data: record.weather_data || null,
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        user_rating: record.user_rating || null,
        mood: record.mood || null,
        notes: record.notes || null
      };

      const { data, error } = await supabase
        .from('outfit_history')
        .insert([historyData])
        .select()
        .single();

      if (error) {
        console.error('❌ [OUTFIT-HISTORY] Failed to save to Supabase:', error);
        this.saveToLocalStorage(record);
        return false;
      }

      console.log('✅ [OUTFIT-HISTORY] Saved to Supabase:', data.id);

      // Also save to localStorage as backup
      this.saveToLocalStorage(record);

      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Error saving outfit history:', error);
      this.saveToLocalStorage(record);
      return false;
    }
  }

  /**
   * Fallback: Save to localStorage
   */
  private saveToLocalStorage(record: OutfitHistoryRecord): void {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('outfitHistory') || '[]');
      existingHistory.push({
        ...record,
        worn_date: record.worn_date.toISOString(),
        created_at: new Date().toISOString()
      });
      localStorage.setItem('outfitHistory', JSON.stringify(existingHistory));
      console.log('💾 [OUTFIT-HISTORY] Saved to localStorage as backup');
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Failed to save to localStorage:', error);
    }
  }

  /**
   * Get outfit history for current user (last N days)
   */
  async getOutfitHistory(daysBack: number = 30): Promise<OutfitHistoryRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('⚠️ [OUTFIT-HISTORY] No authenticated user, loading from localStorage');
        return this.getFromLocalStorage(daysBack);
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('worn_date', startDate.toISOString().split('T')[0])
        .order('worn_date', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-HISTORY] Failed to fetch from Supabase:', error);
        return this.getFromLocalStorage(daysBack);
      }

      console.log(`✅ [OUTFIT-HISTORY] Loaded ${data.length} records from Supabase`);

      return data.map(record => ({
        ...record,
        worn_date: new Date(record.worn_date),
        created_at: record.created_at ? new Date(record.created_at) : undefined
      }));
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Error fetching outfit history:', error);
      return this.getFromLocalStorage(daysBack);
    }
  }

  /**
   * Fallback: Get from localStorage
   */
  private getFromLocalStorage(daysBack: number): OutfitHistoryRecord[] {
    try {
      const history = JSON.parse(localStorage.getItem('outfitHistory') || '[]');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      return history
        .map((record: any) => ({
          ...record,
          worn_date: new Date(record.worn_date),
          created_at: record.created_at ? new Date(record.created_at) : undefined
        }))
        .filter((record: OutfitHistoryRecord) => record.worn_date >= startDate)
        .sort((a: OutfitHistoryRecord, b: OutfitHistoryRecord) =>
          b.worn_date.getTime() - a.worn_date.getTime()
        );
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Failed to load from localStorage:', error);
      return [];
    }
  }

  /**
   * Get outfit history for AI learning (includes all relevant data)
   */
  async getHistoryForAI(limit: number = 50): Promise<OutfitHistoryRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return this.getFromLocalStorage(90).slice(0, limit);
      }

      const { data, error } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', user.id)
        .order('worn_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [OUTFIT-HISTORY] Failed to fetch AI history:', error);
        return this.getFromLocalStorage(90).slice(0, limit);
      }

      return data.map(record => ({
        ...record,
        worn_date: new Date(record.worn_date),
        created_at: record.created_at ? new Date(record.created_at) : undefined
      }));
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Error fetching AI history:', error);
      return [];
    }
  }

  /**
   * Get style insights from outfit history
   */
  async getStyleInsights(): Promise<{
    favoriteCategories: { [key: string]: number };
    averageRating: number;
    mostWornItems: OutfitItem[];
    weatherPreferences: { [key: string]: number };
    moodDistribution: { [key: string]: number };
  }> {
    const history = await this.getOutfitHistory(90);

    const insights = {
      favoriteCategories: {} as { [key: string]: number },
      averageRating: 0,
      mostWornItems: [] as OutfitItem[],
      weatherPreferences: {} as { [key: string]: number },
      moodDistribution: {} as { [key: string]: number }
    };

    if (history.length === 0) return insights;

    // Count categories
    history.forEach(record => {
      record.outfit_items.forEach(item => {
        insights.favoriteCategories[item.category] =
          (insights.favoriteCategories[item.category] || 0) + 1;
      });

      // Weather preferences
      if (record.weather_data) {
        const temp = record.weather_data.temperature;
        const range = temp < 60 ? 'cold' : temp < 75 ? 'mild' : 'warm';
        insights.weatherPreferences[range] = (insights.weatherPreferences[range] || 0) + 1;
      }

      // Mood distribution
      if (record.mood) {
        insights.moodDistribution[record.mood] = (insights.moodDistribution[record.mood] || 0) + 1;
      }
    });

    // Calculate average rating
    const ratings = history.filter(r => r.user_rating).map(r => r.user_rating!);
    insights.averageRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return insights;
  }

  /**
   * Check if outfit items have been worn recently (repeat detection)
   */
  async checkRecentlyWorn(items: OutfitItem[], daysBack: number = 7): Promise<boolean> {
    const history = await this.getOutfitHistory(daysBack);

    const itemIds = items.map(item => item.id);

    return history.some(record => {
      const historicItemIds = record.outfit_items.map(item => item.id);
      // Check if there's significant overlap (>50% of items)
      const overlap = itemIds.filter(id => historicItemIds.includes(id)).length;
      return overlap > itemIds.length / 2;
    });
  }

  /**
   * Get recent outfit history for timeline display
   */
  async getRecentHistory(days: number = 7): Promise<OutfitHistoryRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('⚠️ [OUTFIT-HISTORY] No authenticated user');
        return [];
      }

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const { data, error } = await supabase
        .from('outfit_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('worn_date', daysAgo.toISOString().split('T')[0])
        .order('worn_date', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-HISTORY] Error fetching recent history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Exception in getRecentHistory:', error);
      return [];
    }
  }

  /**
   * Get outfit image from calendar event for a specific date
   */
  async getOutfitImage(date: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // Query using start_time (timestamp) - need to match just the date portion
      const { data, error } = await supabase
        .from('calendar_events')
        .select('outfit_image_url')
        .eq('user_id', user.id)
        .gte('start_time', `${date}T00:00:00`)
        .lt('start_time', `${date}T23:59:59`)
        .eq('wore_today', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [OUTFIT-HISTORY] Error fetching outfit image:', error);
        return null;
      }

      return data?.outfit_image_url || null;
    } catch (error) {
      console.error('❌ [OUTFIT-HISTORY] Exception in getOutfitImage:', error);
      return null;
    }
  }
}

export const outfitHistoryService = new OutfitHistoryService();
export default outfitHistoryService;
