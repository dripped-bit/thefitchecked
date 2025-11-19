/**
 * Closet Pairing Service
 * Uses OpenAI GPT-4o to generate intelligent outfit pairing suggestions
 * Matches wishlist items with existing closet pieces for complete outfits
 */

import { getChatGPTJSON } from '../lib/openai';
import { supabase } from '../lib/supabase';
import { ClothingItem } from './closetService';
import authService from './authService';

export interface PairingSuggestion {
  itemId: string;
  itemName: string;
  category: string;
  imageUrl: string;
  reason: string;
  styleScore: number;
  colorMatch: string;
  occasions: string[];
}

export interface PairingResult {
  suggestions: PairingSuggestion[];
  reasoning: string;
  completenessNote: string;
  cached: boolean;
  generatedAt: Date;
}

export interface WishlistItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  price: string;
  retailer?: string;
  notes?: string;
  image: string;
}

class ClosetPairingService {
  private readonly CACHE_DURATION_DAYS = 7;
  private readonly MAX_SUGGESTIONS = 3;

  /**
   * Generate pairing suggestions for wishlist item
   */
  async generatePairings(
    wishlistItem: WishlistItem,
    forceRefresh: boolean = false
  ): Promise<PairingResult> {
    console.log('👗 [PAIRING] Generating pairing suggestions for:', wishlistItem.name);

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedPairings = await this.getCachedPairings(wishlistItem.id);
      
      if (cachedPairings) {
        console.log('✨ [PAIRING] Using cached pairings');
        return cachedPairings;
      }
    }

    // Fetch user's closet items
    const closetItems = await this.getUserClosetItems();

    if (closetItems.length === 0) {
      console.log('ℹ️  [PAIRING] User has empty closet, cannot generate pairings');
      return {
        suggestions: [],
        reasoning: "Your closet is empty. Add some items to see pairing suggestions!",
        completenessNote: "Start building your closet to get personalized outfit ideas.",
        cached: false,
        generatedAt: new Date()
      };
    }

    console.log(`📊 [PAIRING] Analyzing ${closetItems.length} closet items`);

    // Generate pairings using OpenAI
    const startTime = Date.now();
    const pairings = await this.generateWithOpenAI(wishlistItem, closetItems);
    const generationTime = Date.now() - startTime;

    // Map suggestions to actual closet items
    const mappedSuggestions = this.mapSuggestionsToItems(pairings.suggestions, closetItems);

    const result: PairingResult = {
      suggestions: mappedSuggestions,
      reasoning: pairings.overallReasoning,
      completenessNote: pairings.completenessNote,
      cached: false,
      generatedAt: new Date()
    };

    // Cache the results
    await this.cachePairings(
      wishlistItem.id,
      result,
      closetItems.length,
      generationTime
    );

    console.log(`✅ [PAIRING] Generated ${mappedSuggestions.length} suggestions in ${generationTime}ms`);

    return result;
  }

  /**
   * Generate pairings using OpenAI GPT-4o
   */
  private async generateWithOpenAI(
    wishlistItem: WishlistItem,
    closetItems: ClothingItem[]
  ): Promise<any> {
    const prompt = this.buildPairingPrompt(wishlistItem, closetItems);

    const systemMessage = `You are a professional fashion stylist with expertise in:
- Color theory and coordination (complementary, analogous, monochromatic schemes)
- Body proportions and silhouette balance
- Seasonal styling and fabric pairing
- Current 2025 fashion trends
- Outfit building for various occasions
- Mixing high and low fashion pieces

Provide thoughtful, practical, and fashion-forward pairing suggestions that create complete, wearable outfits.`;

    try {
      const response = await getChatGPTJSON(prompt, {
        model: 'gpt-4o',
        temperature: 0.7,
        systemMessage
      });

      return response;

    } catch (error: any) {
      console.error('❌ [PAIRING] OpenAI error:', error);
      throw new Error(`Failed to generate pairings: ${error.message}`);
    }
  }

  /**
   * Build detailed prompt for OpenAI
   */
  private buildPairingPrompt(wishlistItem: WishlistItem, closetItems: ClothingItem[]): string {
    return `I'm considering buying this item and want to know what I can pair it with from my existing closet.

WISHLIST ITEM TO STYLE:
- Name: ${wishlistItem.name}
- Category: ${wishlistItem.category || 'unknown'}
- Subcategory: ${wishlistItem.subcategory || 'unknown'}
- Brand: ${wishlistItem.brand || 'unknown'}
- Price: ${wishlistItem.price}
- Store: ${wishlistItem.retailer || 'unknown'}
${wishlistItem.notes ? `- My notes: ${wishlistItem.notes}` : ''}

MY CLOSET INVENTORY (${closetItems.length} items):
${closetItems.map((item, i) => {
  const color = item.attributes?.color || 'unknown color';
  const style = item.attributes?.style || item.attributes?.subcategory || 'casual';
  const brand = item.attributes?.brand || '';
  return `${i + 1}. ${item.name} - ${item.category} - ${color} - ${style}${brand ? ` by ${brand}` : ''}`;
}).join('\n')}

TASK:
Suggest the TOP ${this.MAX_SUGGESTIONS} items from my closet that would create the best outfits with this wishlist item.

STYLING CRITERIA:
1. **Color Harmony** - Use color wheel theory:
   - Complementary colors (opposite on wheel): Blue & Orange, Red & Green, Yellow & Purple
   - Analogous colors (adjacent): Blue, Blue-Green, Green
   - Monochromatic: Different shades of same color
   - Neutrals (black, white, gray, beige, navy) work with everything
   - Metallics (gold, silver) as accents

2. **Style Consistency** - Match aesthetic and formality:
   - Casual with casual (jeans, t-shirts, sneakers)
   - Formal with formal (suits, dresses, heels)
   - Streetwear with streetwear (hoodies, joggers, sneakers)
   - Business casual appropriately mixed

3. **Silhouette Balance** - Create visually appealing proportions:
   - Fitted top + loose bottom OR loose top + fitted bottom
   - Long + short balance (long cardigan with shorts)
   - Volume distribution (avoid baggy on top AND bottom)

4. **Versatility** - Ensure outfits are:
   - Actually wearable (not just theoretically stylish)
   - Appropriate for multiple occasions
   - Comfortable and practical

5. **Current Trends** (2025 Fashion):
   - Oversized tailoring
   - Monochrome dressing
   - Cargo and utility styles
   - Sustainable, timeless pieces
   - Bold color blocking

6. **Outfit Completeness**:
   - Must have top + bottom (or dress)
   - Consider layering opportunities
   - Think about shoes if in closet
   - Accessories to complete the look

IMPORTANT RULES:
- ONLY suggest items that actually exist in my closet inventory above
- Match the item ID EXACTLY from the list
- Prioritize items that create COMPLETE outfits
- Be specific about WHY items work together
- Consider the season and formality

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "itemId": "uuid-from-closet",
      "itemName": "Black Skinny Jeans",
      "category": "bottoms",
      "reason": "Creates a classic monochrome look. The black jeans complement the white top perfectly, creating a timeless, elegant outfit. This pairing is versatile for both day and evening wear, and the fitted silhouette balances well with the looser top.",
      "styleScore": 0.95,
      "colorMatch": "monochromatic",
      "occasions": ["casual", "date night", "brunch"]
    },
    {
      "itemId": "uuid-from-closet",
      "itemName": "Tan Leather Jacket",
      "category": "outerwear",
      "reason": "Adds a sophisticated layer to elevate the outfit. The warm tan leather creates beautiful contrast with cooler tones while maintaining a cohesive neutral palette. Perfect for transitional weather and adds edge to casual looks.",
      "styleScore": 0.88,
      "colorMatch": "complementary",
      "occasions": ["casual", "weekend", "night out"]
    },
    {
      "itemId": "uuid-from-closet",
      "itemName": "White Canvas Sneakers",
      "category": "shoes",
      "reason": "Keeps the outfit grounded in casual-chic territory. White sneakers are the perfect finishing touch for a relaxed yet polished look. They echo the top's color for cohesive styling.",
      "styleScore": 0.92,
      "colorMatch": "monochromatic",
      "occasions": ["casual", "everyday", "running errands"]
    }
  ],
  "overallReasoning": "This wishlist item is a versatile piece that works beautifully with neutrals in your closet. The suggestions focus on creating balanced, trend-forward outfits that can transition from day to night. Each pairing considers color harmony, proportion balance, and current styling trends while ensuring the outfits are actually wearable and appropriate for various occasions.",
  "completenessNote": "You'll have 3 complete outfits ready to wear! Each suggestion creates a different vibe - from monochrome minimal to casual-chic layered looks."
}

If my closet doesn't have good matches, be honest and suggest what type of items would complete the outfit in the reasoning.`;
  }

  /**
   * Map AI suggestions to actual closet items
   */
  private mapSuggestionsToItems(
    suggestions: any[],
    closetItems: ClothingItem[]
  ): PairingSuggestion[] {
    const mapped: PairingSuggestion[] = [];

    for (const suggestion of suggestions) {
      // Find the actual item in closet
      const item = closetItems.find(i => i.id === suggestion.itemId);

      if (item) {
        mapped.push({
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          imageUrl: item.imageUrl || item.image_url || '',
          reason: suggestion.reason,
          styleScore: suggestion.styleScore || 0.8,
          colorMatch: suggestion.colorMatch || 'neutral',
          occasions: suggestion.occasions || ['casual']
        });
      } else {
        console.warn(`⚠️  [PAIRING] Item ${suggestion.itemId} not found in closet`);
      }
    }

    return mapped.slice(0, this.MAX_SUGGESTIONS);
  }

  /**
   * Get cached pairings if valid
   */
  private async getCachedPairings(wishlistItemId: string): Promise<PairingResult | null> {
    const { data, error } = await supabase
      .from('wishlist_pairings')
      .select('*')
      .eq('wishlist_item_id', wishlistItemId)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      suggestions: data.suggestions as PairingSuggestion[],
      reasoning: data.reasoning,
      completenessNote: data.completeness_note,
      cached: true,
      generatedAt: new Date(data.generated_at)
    };
  }

  /**
   * Cache pairing results
   */
  private async cachePairings(
    wishlistItemId: string,
    result: PairingResult,
    closetSize: number,
    generationTimeMs: number
  ): Promise<void> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      console.warn('⚠️  [PAIRING] No authenticated user, skipping cache');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.CACHE_DURATION_DAYS);

    const { error } = await supabase
      .from('wishlist_pairings')
      .insert({
        wishlist_item_id: wishlistItemId,
        user_id: user.id,
        suggestions: result.suggestions,
        reasoning: result.reasoning,
        completeness_note: result.completenessNote,
        expires_at: expiresAt.toISOString(),
        model_used: 'gpt-4o',
        generation_time_ms: generationTimeMs,
        closet_size_at_generation: closetSize
      });

    if (error) {
      console.error('❌ [PAIRING] Failed to cache pairings:', error);
    } else {
      console.log('✅ [PAIRING] Cached pairings until:', expiresAt);
    }
  }

  /**
   * Get user's closet items
   */
  private async getUserClosetItems(): Promise<ClothingItem[]> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      console.error('❌ [PAIRING] No authenticated user');
      return [];
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('date_added', { ascending: false });

    if (error) {
      console.error('❌ [PAIRING] Failed to fetch closet items:', error);
      return [];
    }

    return (data || []) as ClothingItem[];
  }

  /**
   * Invalidate cached pairings for user (call when closet changes significantly)
   */
  async invalidateAllPairings(): Promise<void> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return;
    }

    console.log('🔄 [PAIRING] Invalidating all cached pairings for user');

    const { error } = await supabase
      .from('wishlist_pairings')
      .update({ expires_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ [PAIRING] Failed to invalidate pairings:', error);
    } else {
      console.log('✅ [PAIRING] All pairings invalidated');
    }
  }

  /**
   * Get pairing statistics for analytics
   */
  async getPairingStats(): Promise<any> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .rpc('get_pairing_stats', { p_user_id: user.id });

    if (error) {
      console.error('❌ [PAIRING] Failed to fetch stats:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if pairings need refresh
   */
  async needsRefresh(wishlistItemId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('pairings_need_refresh', { p_item_id: wishlistItemId });

    if (error) {
      console.error('❌ [PAIRING] Failed to check refresh status:', error);
      return true; // Default to needing refresh on error
    }

    return data as boolean;
  }
}

export default new ClosetPairingService();
