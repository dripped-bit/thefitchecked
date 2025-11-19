/**
 * User Context Aggregator Service
 * Collects ALL user data from multiple sources for comprehensive AI fashion advice
 * - Closet inventory with images
 * - Style preferences and sizes
 * - Analytics (most worn, favorites, cost per wear)
 * - Wishlist items and price tracking
 * - Upcoming trips and packing needs
 * - Calendar events
 */

import { supabase } from './supabaseClient';
import authService from './authService';
import stylePreferencesService, { UserStyleProfile } from './stylePreferencesService';
import closetAnalyticsService, { AnalyticsData } from './closetAnalyticsService';

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  color?: string;
  price?: number;
  image_url: string;
  thumbnail_url?: string;
  favorite: boolean;
  times_worn: number;
  notes?: string;
  created_at?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  brand?: string;
  price: string;
  image: string;
  url: string;
  category?: string;
  created_at: string;
}

export interface TripData {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type?: string;
  activities?: string[];
  weather_forecast?: any;
}

export interface UserContext {
  // Closet Inventory
  closet: {
    items: ClothingItem[];
    totalItems: number;
    byCategory: Record<string, ClothingItem[]>;
    favoriteItems: ClothingItem[];
    recentlyAdded: ClothingItem[];
  };
  
  // Style Preferences
  stylePreferences: UserStyleProfile | null;
  
  // Analytics
  analytics: AnalyticsData | null;
  
  // Wishlist
  wishlist: {
    items: WishlistItem[];
    totalValue: number;
    byCategory: Record<string, WishlistItem[]>;
  };
  
  // Trips
  trips: {
    upcoming: TripData[];
    destinations: string[];
  };
  
  // Metadata
  hasData: boolean;
  dataTimestamp: string;
}

class UserContextAggregatorService {
  private cache: Map<string, { context: UserContext; timestamp: number }> = new Map();
  private CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  /**
   * Gather ALL user data from all sources
   */
  async gatherAllData(forceRefresh: boolean = false): Promise<UserContext> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return this.emptyContext();
    }

    const cacheKey = `context_${user.id}`;
    
    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📦 [USER-CONTEXT] Using cached data');
        return cached.context;
      }
    }

    console.log('📦 [USER-CONTEXT] Gathering all user data...');
    
    // Fetch all data in parallel for speed
    const [
      closetData,
      stylePrefs,
      analyticsData,
      wishlistData,
      tripsData
    ] = await Promise.all([
      this.fetchClosetInventory(user.id),
      this.fetchStylePreferences(),
      this.fetchAnalytics(),
      this.fetchWishlist(user.id),
      this.fetchTrips(user.id)
    ]);

    const context: UserContext = {
      closet: closetData,
      stylePreferences: stylePrefs,
      analytics: analyticsData,
      wishlist: wishlistData,
      trips: tripsData,
      hasData: closetData.totalItems > 0 || !!stylePrefs,
      dataTimestamp: new Date().toISOString()
    };

    // Cache result
    this.cache.set(cacheKey, {
      context,
      timestamp: Date.now()
    });

    console.log('✅ [USER-CONTEXT] Data gathered:', {
      closetItems: closetData.totalItems,
      hasPreferences: !!stylePrefs,
      wishlistItems: wishlistData.items.length,
      upcomingTrips: tripsData.upcoming.length
    });

    return context;
  }

  /**
   * Fetch closet inventory from database
   */
  private async fetchClosetInventory(userId: string): Promise<UserContext['closet']> {
    try {
      const { data: items, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!items || items.length === 0) {
        return {
          items: [],
          totalItems: 0,
          byCategory: {},
          favoriteItems: [],
          recentlyAdded: []
        };
      }

      // Organize by category
      const byCategory: Record<string, ClothingItem[]> = {};
      items.forEach(item => {
        const cat = item.category || 'uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });

      return {
        items,
        totalItems: items.length,
        byCategory,
        favoriteItems: items.filter(i => i.favorite),
        recentlyAdded: items.slice(0, 5) // Last 5 added
      };

    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching closet:', error);
      return {
        items: [],
        totalItems: 0,
        byCategory: {},
        favoriteItems: [],
        recentlyAdded: []
      };
    }
  }

  /**
   * Fetch style preferences from IndexedDB
   */
  private async fetchStylePreferences(): Promise<UserStyleProfile | null> {
    try {
      return await stylePreferencesService.loadStyleProfile();
    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching style prefs:', error);
      return null;
    }
  }

  /**
   * Fetch analytics data
   */
  private async fetchAnalytics(): Promise<AnalyticsData | null> {
    try {
      return await closetAnalyticsService.getAnalytics();
    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching analytics:', error);
      return null;
    }
  }

  /**
   * Fetch wishlist items
   */
  private async fetchWishlist(userId: string): Promise<UserContext['wishlist']> {
    try {
      const { data: items, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!items || items.length === 0) {
        return { items: [], totalValue: 0, byCategory: {} };
      }

      // Calculate total value
      const totalValue = items.reduce((sum, item) => {
        const price = parseFloat(item.price?.replace(/[^0-9.-]+/g, '') || '0');
        return sum + price;
      }, 0);

      // Organize by category
      const byCategory: Record<string, WishlistItem[]> = {};
      items.forEach(item => {
        const cat = item.category || 'uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });

      return {
        items,
        totalValue,
        byCategory
      };

    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching wishlist:', error);
      return { items: [], totalValue: 0, byCategory: {} };
    }
  }

  /**
   * Fetch upcoming trips
   */
  private async fetchTrips(userId: string): Promise<UserContext['trips']> {
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (!trips || trips.length === 0) {
        return { upcoming: [], destinations: [] };
      }

      return {
        upcoming: trips,
        destinations: trips.map(t => t.destination)
      };

    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching trips:', error);
      return { upcoming: [], destinations: [] };
    }
  }

  /**
   * Empty context for users with no data
   */
  private emptyContext(): UserContext {
    return {
      closet: {
        items: [],
        totalItems: 0,
        byCategory: {},
        favoriteItems: [],
        recentlyAdded: []
      },
      stylePreferences: null,
      analytics: null,
      wishlist: {
        items: [],
        totalValue: 0,
        byCategory: {}
      },
      trips: {
        upcoming: [],
        destinations: []
      },
      hasData: false,
      dataTimestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [USER-CONTEXT] Cache cleared');
  }
}

export default new UserContextAggregatorService();
