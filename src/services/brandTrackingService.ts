/**
 * Brand Tracking Service
 * Tracks user brand preferences across the app:
 * - Closet items
 * - Wishlist items
 * - Calendar shopping links
 * - Style preferences
 * - Shopping link clicks
 * - Purchase indicators
 */

import { supabase } from './supabaseClient';

interface BrandInteraction {
  userId: string;
  brand: string;
  interactionType: 'closet_item' | 'wishlist' | 'calendar_save' | 'style_preference' | 'link_click' | 'purchase_indicator';
  source: 'closet' | 'wishlist' | 'calendar' | 'style_quiz' | 'outfit_generator';
  metadata?: {
    itemId?: string;
    productUrl?: string;
    price?: string;
    category?: string;
    store?: string;
    timeSpent?: number; // milliseconds spent on product page
  };
  timestamp: string;
}

interface BrandPreferences {
  favoriteBrands: Array<{
    brand: string;
    interactions: number;
    lastInteraction: string;
    sources: string[];
  }>;
  purchaseIndicators: Array<{
    brand: string;
    productUrl: string;
    timeSpent: number;
    timestamp: string;
  }>;
  stylePreferences: {
    casualBrands: string[];
    formalBrands: string[];
    activewearBrands: string[];
  };
}

class BrandTrackingService {
  /**
   * Track any brand interaction
   */
  async trackBrandInteraction(interaction: BrandInteraction): Promise<void> {
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('brand_interactions')
        .insert({
          user_id: interaction.userId,
          brand: interaction.brand.toLowerCase(),
          interaction_type: interaction.interactionType,
          source: interaction.source,
          metadata: interaction.metadata,
          created_at: interaction.timestamp
        });

      if (error) throw error;

      console.log('✅ [BRAND-TRACKING] Tracked:', interaction.brand, interaction.interactionType);

      // Also save to localStorage for offline access
      const localBrands = JSON.parse(localStorage.getItem('user_brands') || '[]');
      localBrands.push(interaction);
      localStorage.setItem('user_brands', JSON.stringify(localBrands.slice(-100))); // Keep last 100
    } catch (error) {
      console.error('❌ [BRAND-TRACKING] Error:', error);
    }
  }

  /**
   * Track closet item (when user adds item)
   */
  async trackClosetItem(userId: string, brand: string, category: string, itemId: string): Promise<void> {
    await this.trackBrandInteraction({
      userId,
      brand,
      interactionType: 'closet_item',
      source: 'closet',
      metadata: { itemId, category },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track wishlist addition
   */
  async trackWishlistItem(userId: string, brand: string, productUrl: string, price?: string): Promise<void> {
    await this.trackBrandInteraction({
      userId,
      brand,
      interactionType: 'wishlist',
      source: 'wishlist',
      metadata: { productUrl, price },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track calendar shopping link save
   */
  async trackCalendarShoppingLink(userId: string, brand: string, productUrl: string, eventId: string): Promise<void> {
    await this.trackBrandInteraction({
      userId,
      brand,
      interactionType: 'calendar_save',
      source: 'calendar',
      metadata: { productUrl, itemId: eventId },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track shopping link click (when user opens product page)
   */
  async trackShoppingLinkClick(params: {
    userId: string;
    eventId: string;
    productUrl: string;
    productTitle: string;
    store: string;
    price?: string;
    source: 'calendar' | 'wishlist';
  }): Promise<void> {
    // Extract brand from store or title
    const brand = this.extractBrand(params.store, params.productTitle);

    await this.trackBrandInteraction({
      userId: params.userId,
      brand,
      interactionType: 'link_click',
      source: params.source,
      metadata: {
        productUrl: params.productUrl,
        store: params.store,
        price: params.price,
        itemId: params.eventId
      },
      timestamp: new Date().toISOString()
    });

    // Save click timestamp for time-spent calculation
    localStorage.setItem(`shopping_click_${params.productUrl}`, Date.now().toString());
  }

  /**
   * Track when user returns from shopping (potential purchase indicator)
   */
  async trackBrowserReturn(params: {
    userId: string;
    eventId: string;
    productUrl: string;
    store: string;
    timeSpent: number;
  }): Promise<void> {
    // Calculate actual time spent
    const clickTime = localStorage.getItem(`shopping_click_${params.productUrl}`);
    const timeSpent = clickTime ? Date.now() - parseInt(clickTime) : 0;

    // If user spent > 30 seconds, likely interested/purchased
    if (timeSpent > 30000) {
      const brand = this.extractBrand(params.store, '');

      await this.trackBrandInteraction({
        userId: params.userId,
        brand,
        interactionType: 'purchase_indicator',
        source: 'calendar',
        metadata: {
          productUrl: params.productUrl,
          store: params.store,
          timeSpent,
          itemId: params.eventId
        },
        timestamp: new Date().toISOString()
      });

      console.log('🛒 [BRAND-TRACKING] Purchase indicator:', brand, `(${(timeSpent / 1000).toFixed(0)}s spent)`);
    }

    // Clean up
    localStorage.removeItem(`shopping_click_${params.productUrl}`);
  }

  /**
   * Track style preference brands (from style quiz)
   */
  async trackStylePreferenceBrands(userId: string, brands: string[], category: string): Promise<void> {
    for (const brand of brands) {
      await this.trackBrandInteraction({
        userId,
        brand,
        interactionType: 'style_preference',
        source: 'style_quiz',
        metadata: { category },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get user's favorite brands (for recommendations)
   */
  async getUserFavoriteBrands(userId: string, limit: number = 10): Promise<BrandPreferences> {
    try {
      const { data, error } = await supabase
        .from('brand_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200); // Get recent interactions

      if (error) throw error;

      // Aggregate by brand
      const brandCounts: Map<string, {
        count: number;
        lastInteraction: string;
        sources: Set<string>;
        purchaseIndicators: number;
      }> = new Map();

      data?.forEach(interaction => {
        const current = brandCounts.get(interaction.brand) || {
          count: 0,
          lastInteraction: interaction.created_at,
          sources: new Set(),
          purchaseIndicators: 0
        };

        current.count++;
        current.sources.add(interaction.source);
        
        if (interaction.interaction_type === 'purchase_indicator') {
          current.purchaseIndicators++;
        }

        brandCounts.set(interaction.brand, current);
      });

      // Sort by count + purchase indicators
      const sortedBrands = Array.from(brandCounts.entries())
        .sort((a, b) => {
          const scoreA = a[1].count + (a[1].purchaseIndicators * 5); // Weight purchases 5x
          const scoreB = b[1].count + (b[1].purchaseIndicators * 5);
          return scoreB - scoreA;
        })
        .slice(0, limit)
        .map(([brand, data]) => ({
          brand,
          interactions: data.count,
          lastInteraction: data.lastInteraction,
          sources: Array.from(data.sources)
        }));

      return {
        favoriteBrands: sortedBrands,
        purchaseIndicators: [], // TODO: Implement if needed
        stylePreferences: {
          casualBrands: [],
          formalBrands: [],
          activewearBrands: []
        }
      };
    } catch (error) {
      console.error('❌ [BRAND-TRACKING] Error getting favorite brands:', error);
      return {
        favoriteBrands: [],
        purchaseIndicators: [],
        stylePreferences: { casualBrands: [], formalBrands: [], activewearBrands: [] }
      };
    }
  }

  /**
   * Extract brand name from store or product title
   */
  private extractBrand(store: string, title: string): string {
    // Common store names that ARE brands
    const storeBrands = ['Zara', 'H&M', 'Nike', 'Adidas', 'Uniqlo', 'Gap', 'Levi\'s', 'Nordstrom', 'Amazon', 'Target', 'Walmart'];
    
    for (const brand of storeBrands) {
      if (store.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    // Extract from title (first word often the brand)
    const titleWords = title.split(' ');
    if (titleWords.length > 0 && titleWords[0].length > 2) {
      return titleWords[0];
    }

    // Fallback to store name
    return store || 'Unknown';
  }
}

export const brandTrackingService = new BrandTrackingService();
export default brandTrackingService;
