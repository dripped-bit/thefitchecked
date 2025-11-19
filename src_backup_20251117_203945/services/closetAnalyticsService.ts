/**
 * Closet Analytics Service
 * Calculates wardrobe insights using Claude for intelligent analysis
 * Features 1-hour caching to reduce API costs
 */

import { supabase } from './supabaseClient';
import authService from './authService';

export interface AnalyticsData {
  totalValue: number;
  wishlistTotal: number;
  itemsThisMonth: number;
  categories: CategorySpending[];
  wishlistByCategory: WishlistCategory[];
  colors: ColorData[];
  bestValueItems: BestValueItem[];
  lastUpdated: string;
}

export interface CategorySpending {
  category: string;
  total: number;
  itemCount: number;
  percentage: number;
}

export interface WishlistCategory {
  category: string;
  total: number;
  color: string;
}

export interface ColorData {
  color: string;
  hex: string;
  count: number;
  percentage: number;
}

export interface BestValueItem {
  id: string;
  name: string;
  price: number;
  timesWorn: number;
  costPerWear: number;
  stars: number;
}

class ClosetAnalyticsService {
  private cache: Map<string, { data: AnalyticsData; timestamp: number }> = new Map();
  private CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  async getAnalytics(forceRefresh: boolean = false): Promise<AnalyticsData> {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const cacheKey = `analytics_${user.id}`;
    
    // Check cache
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('📊 [ANALYTICS] Using cached data');
        return cached.data;
      }
    }

    console.log('📊 [ANALYTICS] Fetching fresh data...');
    
    // Fetch fresh data
    const analyticsData = await this.calculateAnalytics(user.id);
    
    // Cache result
    this.cache.set(cacheKey, {
      data: analyticsData,
      timestamp: Date.now()
    });

    return analyticsData;
  }

  private async calculateAnalytics(userId: string): Promise<AnalyticsData> {
    // 1. Fetch all wardrobe items
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId);

    if (itemsError) {
      console.error('❌ [ANALYTICS] Error fetching items:', itemsError);
      throw itemsError;
    }

    // 2. Fetch wishlist
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId);

    if (wishlistError) {
      console.error('❌ [ANALYTICS] Error fetching wishlist:', wishlistError);
    }

    // 3. Fetch outfit usage (calendar events with shopping_links as proxy for outfit usage)
    const { data: outfits, error: outfitsError } = await supabase
      .from('calendar_events')
      .select('shopping_links, outfit_id')
      .eq('user_id', userId)
      .not('shopping_links', 'is', null);

    if (outfitsError) {
      console.error('❌ [ANALYTICS] Error fetching outfits:', outfitsError);
    }

    const safeItems = items || [];
    const safeWishlist = wishlist || [];
    const safeOutfits = outfits || [];

    // Calculate summary
    const totalValue = safeItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const wishlistTotal = safeWishlist.reduce((sum, item) => {
      return sum + this.parseCurrency(item.price);
    }, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const itemsThisMonth = safeItems.filter(
      item => new Date(item.created_at) >= thisMonth
    ).length;

    // Category spending
    const categoryMap = safeItems.reduce((acc, item) => {
      const cat = item.category || 'uncategorized';
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0 };
      }
      acc[cat].total += item.price || 0;
      acc[cat].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const categories: CategorySpending[] = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        total: data.total,
        itemCount: data.count,
        percentage: totalValue > 0 ? (data.total / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Analyze colors
    const colors = await this.analyzeColors(safeItems);

    // Calculate best value
    const bestValueItems = await this.calculateBestValue(safeItems, safeOutfits);

    // Group wishlist by category
    const wishlistByCategory = await this.groupWishlistByCategory(safeWishlist);

    return {
      totalValue,
      wishlistTotal,
      itemsThisMonth,
      categories,
      wishlistByCategory,
      colors,
      bestValueItems,
      lastUpdated: new Date().toISOString()
    };
  }

  private async analyzeColors(items: any[]): Promise<ColorData[]> {
    // Extract colors from items
    const colorCounts = items.reduce((acc, item) => {
      const color = (item.color || 'Unknown').trim();
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalItems = items.length;
    
    if (Object.keys(colorCounts).length === 0) {
      return [];
    }

    // Try Claude first, fall back to static map on error
    try {
      const uniqueColors = Object.keys(colorCounts);
      const colorList = uniqueColors.join(', ');
      
      console.log('🎨 [ANALYTICS] Mapping colors with Claude:', uniqueColors);
      
      const claudeResponse = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a color expert. Map these clothing color names to their exact hex color codes.

Colors to map: ${colorList}

Return ONLY a JSON object in this exact format:
{
  "colors": [
    {"name": "black", "hex": "#000000"},
    {"name": "white", "hex": "#FFFFFF"},
    {"name": "navy", "hex": "#000080"}
  ]
}

Rules:
- Use exact color names from the input
- Provide accurate hex codes
- Include all colors from the list`
          }]
        })
      });

      if (!claudeResponse.ok) {
        throw new Error(`Claude API failed: ${claudeResponse.status}`);
      }

      const data = await claudeResponse.json();
      const content = data.content?.[0]?.text || '';
      
      if (!content) {
        throw new Error('No content received from Claude API');
      }

      // Parse JSON response
      const response = JSON.parse(content);

      // Validate response
      if (response && response.colors && Array.isArray(response.colors) && response.colors.length > 0) {
        console.log('✅ [ANALYTICS] Claude color mapping successful');
        
        return response.colors.map((color: any) => {
          const originalName = uniqueColors.find(c => c.toLowerCase() === color.name.toLowerCase()) || color.name;
          return {
            color: originalName,
            hex: color.hex,
            count: colorCounts[originalName] || 0,
            percentage: totalItems > 0 ? ((colorCounts[originalName] || 0) / totalItems) * 100 : 0
          };
        }).sort((a: ColorData, b: ColorData) => b.count - a.count);
      } else {
        console.warn('⚠️ [ANALYTICS] Invalid Claude response, using fallback');
        return this.getFallbackColors(colorCounts, totalItems);
      }
    } catch (error) {
      console.warn('⚠️ [ANALYTICS] Claude error, using fallback colors:', error);
      return this.getFallbackColors(colorCounts, totalItems);
    }
  }

  private async calculateBestValue(items: any[], outfits: any[]): Promise<BestValueItem[]> {
    // First try: Use actual times_worn data
    const actualWornItems = items
      .filter(item => item.price && item.price > 0 && item.times_worn && item.times_worn > 0)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        timesWorn: item.times_worn,
        costPerWear: item.price / item.times_worn,
        stars: this.calculateStars(item.price, item.times_worn)
      }))
      .sort((a, b) => a.costPerWear - b.costPerWear)
      .slice(0, 3);

    if (actualWornItems.length >= 3) {
      console.log('✅ [ANALYTICS] Using actual wear data for best value');
      return actualWornItems;
    }

    // Fallback: Use OpenAI to estimate best value
    console.log('🤖 [ANALYTICS] Using AI to estimate best value items...');
    
    const itemsWithPrice = items.filter(item => item.price && item.price > 0);
    
    if (itemsWithPrice.length === 0) {
      return [];
    }

    try {
      const itemsForAnalysis = itemsWithPrice.slice(0, 20).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        brand: item.brand
      }));

      const response = await getChatGPTJSON(
        'gpt-4o-mini',
        `Analyze these clothing items and identify the top 3 that likely provide the BEST VALUE based on:
1. Versatility (basics like black pants, white tees = high value)
2. Price relative to typical wear frequency
3. Category (everyday items > special occasion)
4. Quality indicators

Items:
${JSON.stringify(itemsForAnalysis, null, 2)}

Return JSON: {"bestValue": [{"id": "...", "estimatedWears": 50, "valueReason": "Versatile basic"}]}`
      );

      if (response && response.bestValue && Array.isArray(response.bestValue)) {
        return response.bestValue.slice(0, 3).map((aiItem: any) => {
          const item = itemsWithPrice.find(i => i.id === aiItem.id);
          if (!item) return null;
          
          const estimatedWears = aiItem.estimatedWears || 10;
          const costPerWear = item.price / estimatedWears;
          
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            timesWorn: estimatedWears,
            costPerWear,
            stars: this.calculateStars(item.price, estimatedWears)
          };
        }).filter(Boolean) as BestValueItem[];
      }
    } catch (error) {
      console.error('❌ [ANALYTICS] AI estimation failed:', error);
    }

    // Final fallback: Show cheapest items with estimated value
    return itemsWithPrice
      .sort((a, b) => a.price - b.price)
      .slice(0, 3)
      .map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        timesWorn: 10, // Estimate
        costPerWear: item.price / 10,
        stars: 3
      }));
  }

  private calculateStars(price: number, timesWorn: number): number {
    if (timesWorn === 0) return 1;
    const costPerWear = price / timesWorn;
    
    if (costPerWear < 1) return 5;
    if (costPerWear < 3) return 4;
    if (costPerWear < 5) return 3;
    if (costPerWear < 10) return 2;
    return 1;
  }

  /**
   * Parse currency strings to numbers
   * Handles formats: "$65", "$65.00", "£50", "€40.99", "65", etc.
   */
  private parseCurrency(priceValue: any): number {
    if (!priceValue) return 0;
    if (typeof priceValue === 'number') return priceValue;
    
    // Remove all non-numeric characters except decimal point
    const cleaned = priceValue.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Static color name to hex code mapping for common clothing colors
   */
  private getStaticColorMap(): Record<string, string> {
    return {
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'blue': '#2563EB',
      'navy': '#1E3A8A',
      'light blue': '#60A5FA',
      'dark blue': '#1E40AF',
      'red': '#DC2626',
      'pink': '#EC4899',
      'hot pink': '#DB2777',
      'light pink': '#F9A8D4',
      'green': '#16A34A',
      'olive': '#84CC16',
      'lime': '#84CC16',
      'yellow': '#EAB308',
      'gold': '#FCD34D',
      'orange': '#F97316',
      'purple': '#9333EA',
      'lavender': '#C4B5FD',
      'violet': '#7C3AED',
      'brown': '#92400E',
      'tan': '#D2B48C',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'burgundy': '#7F1D1D',
      'maroon': '#7F1D1D',
      'khaki': '#C3B091',
      'mint': '#6EE7B7',
      'teal': '#14B8A6',
      'turquoise': '#06B6D4',
      'coral': '#FB7185',
      'peach': '#FED7AA',
      'rose': '#FB7185',
      'ivory': '#FFFFF0',
      'charcoal': '#374151',
      'slate': '#64748B',
      'denim': '#4B6CB7',
      'unknown': '#9CA3AF'
    };
  }

  /**
   * Fallback color analysis using static color map
   */
  private getFallbackColors(colorCounts: Record<string, number>, totalItems: number): ColorData[] {
    const colorMap = this.getStaticColorMap();
    
    return Object.entries(colorCounts)
      .map(([colorName, count]) => {
        const normalizedColor = colorName.toLowerCase().trim();
        return {
          color: colorName.charAt(0).toUpperCase() + colorName.slice(1),
          hex: colorMap[normalizedColor] || '#9CA3AF',
          count,
          percentage: totalItems > 0 ? (count / totalItems) * 100 : 0
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  private async groupWishlistByCategory(wishlist: any[]): Promise<WishlistCategory[]> {
    if (wishlist.length === 0) {
      return [];
    }

    // Assign colors matching closet categories
    const categoryColors: Record<string, string> = {
      'Tops': '#8B5CF6',        // Purple
      'Bottoms': '#10B981',     // Green
      'Dresses': '#EC4899',     // Pink
      'Activewear': '#06B6D4',  // Cyan
      'Outerwear': '#6B7280',   // Gray
      'Shoes': '#3B82F6',       // Blue
      'Accessories': '#F59E0B'  // Amber/Orange
    };

    // Use simple keyword matching (fast and reliable)
    const categoryMap = wishlist.reduce((acc, item) => {
      let category = 'Accessories';  // Better default than "Other"
      
      if (item.name) {
        const name = item.name.toLowerCase();
        
        // More comprehensive keyword matching
        if (name.includes('dress')) category = 'Dresses';
        else if (name.includes('shoe') || name.includes('boot') || name.includes('sneaker') || name.includes('heel') || name.includes('sandal')) category = 'Shoes';
        else if (name.includes('top') || name.includes('shirt') || name.includes('blouse') || name.includes('sweater') || name.includes('tee') || name.includes('tank')) category = 'Tops';
        else if (name.includes('pants') || name.includes('jean') || name.includes('short') || name.includes('skirt') || name.includes('trouser')) category = 'Bottoms';
        else if (name.includes('jacket') || name.includes('coat') || name.includes('blazer') || name.includes('cardigan')) category = 'Outerwear';
        else if (name.includes('bag') || name.includes('purse') || name.includes('wallet') || name.includes('jewelry') || name.includes('belt') || name.includes('hat') || name.includes('scarf') || name.includes('sunglasses') || name.includes('watch')) category = 'Accessories';
        else if (name.includes('active') || name.includes('sport') || name.includes('gym') || name.includes('athletic') || name.includes('yoga') || name.includes('running')) category = 'Activewear';
      }

      if (!acc[category]) {
        acc[category] = 0;
      }
      
      acc[category] += this.parseCurrency(item.price);
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryMap)
      .map(([category, total]) => ({
        category,
        total,
        color: categoryColors[category] || '#F59E0B'
      }))
      .sort((a, b) => b.total - a.total);
  }

  clearCache() {
    this.cache.clear();
    console.log('📊 [ANALYTICS] Cache cleared');
  }
}

export default new ClosetAnalyticsService();
