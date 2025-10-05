import { supabase } from './supabaseClient'

/**
 * Outfit Storage Service
 * Manages persistent storage of generated outfits in Supabase
 */

export interface OutfitData {
  id?: string;
  user_id: string;
  occasion: string;
  style: string;
  image_url: string;
  user_prompt?: string;
  gender?: string;
  seedream_seed?: number;
  clicked: boolean;
  purchased: boolean;
  favorited: boolean;
  share_token?: string;
  rating?: number;
  weather_temp?: number;
  weather_condition?: string;
  location?: string;
  prompt_version?: string;
  prompt_text?: string;
  created_at: Date;
}

class OutfitStorageService {
  /**
   * Save generated outfit to Supabase
   */
  async saveOutfit(userId: string, outfitData: {
    occasion: string;
    style: string;
    imageUrl: string;
    userPrompt?: string;
    gender?: string;
    seedreamSeed?: number;
  }): Promise<OutfitData | null> {
    try {
      const { data, error} = await supabase
        .from('outfits')
        .insert({
          user_id: userId,
          occasion: outfitData.occasion,
          style: outfitData.style,
          image_url: outfitData.imageUrl,
          user_prompt: outfitData.userPrompt,
          gender: outfitData.gender,
          seedream_seed: outfitData.seedreamSeed,
          clicked: false,
          purchased: false,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error saving outfit:', error);
        return null;
      }

      console.log('✅ [OUTFIT-STORAGE] Outfit saved successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to save outfit:', error);
      return null;
    }
  }

  /**
   * Save multiple outfits at once (for triple outfit generation)
   */
  async saveMultipleOutfits(userId: string, outfits: Array<{
    occasion: string;
    style: string;
    imageUrl: string;
    userPrompt?: string;
    gender?: string;
    seedreamSeed?: number;
  }>): Promise<OutfitData[]> {
    try {
      const outfitsToInsert = outfits.map(outfit => ({
        user_id: userId,
        occasion: outfit.occasion,
        style: outfit.style,
        image_url: outfit.imageUrl,
        user_prompt: outfit.userPrompt,
        gender: outfit.gender,
        seedream_seed: outfit.seedreamSeed,
        clicked: false,
        purchased: false,
        created_at: new Date()
      }));

      const { data, error } = await supabase
        .from('outfits')
        .insert(outfitsToInsert)
        .select();

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error saving multiple outfits:', error);
        return [];
      }

      console.log(`✅ [OUTFIT-STORAGE] Saved ${data.length} outfits successfully`);
      return data;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to save multiple outfits:', error);
      return [];
    }
  }

  /**
   * Get user's outfit history
   */
  async getUserOutfits(userId: string): Promise<OutfitData[]> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching outfits:', error);
        return [];
      }

      console.log(`📚 [OUTFIT-STORAGE] Loaded ${data?.length || 0} outfits for user`);
      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch outfits:', error);
      return [];
    }
  }

  /**
   * Delete an outfit
   */
  async deleteOutfit(outfitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error deleting outfit:', error);
        return false;
      }

      console.log('🗑️ [OUTFIT-STORAGE] Outfit deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to delete outfit:', error);
      return false;
    }
  }

  /**
   * Get outfits by occasion
   */
  async getOutfitsByOccasion(userId: string, occasion: string): Promise<OutfitData[]> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('occasion', occasion)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching outfits by occasion:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch outfits by occasion:', error);
      return [];
    }
  }

  /**
   * Mark outfit as clicked
   */
  async markOutfitClicked(outfitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('outfits')
        .update({ clicked: true })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error marking outfit as clicked:', error);
        return false;
      }

      console.log('👆 [OUTFIT-STORAGE] Outfit marked as clicked');
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to mark outfit as clicked:', error);
      return false;
    }
  }

  /**
   * Mark outfit as purchased
   */
  async markOutfitPurchased(outfitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('outfits')
        .update({ purchased: true })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error marking outfit as purchased:', error);
        return false;
      }

      console.log('🛍️ [OUTFIT-STORAGE] Outfit marked as purchased');
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to mark outfit as purchased:', error);
      return false;
    }
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId: string, action: string, styleVariant: string, metadata?: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('interactions')
        .insert({
          user_id: userId,
          action,
          style_variant: styleVariant,
          metadata: metadata || {}
        });

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error tracking interaction:', error);
        return false;
      }

      console.log('📊 [OUTFIT-STORAGE] Interaction tracked:', action);
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to track interaction:', error);
      return false;
    }
  }

  /**
   * Toggle outfit favorite status
   */
  async toggleFavorite(outfitId: string, favorited: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('outfits')
        .update({ favorited })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error toggling favorite:', error);
        return false;
      }

      console.log(`${favorited ? '❤️' : '💔'} [OUTFIT-STORAGE] Outfit ${favorited ? 'favorited' : 'unfavorited'}`);
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to toggle favorite:', error);
      return false;
    }
  }

  /**
   * Get favorited outfits
   */
  async getFavoritedOutfits(userId: string): Promise<OutfitData[]> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('favorited', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching favorited outfits:', error);
        return [];
      }

      console.log(`❤️ [OUTFIT-STORAGE] Loaded ${data?.length || 0} favorited outfits`);
      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch favorited outfits:', error);
      return [];
    }
  }

  /**
   * Generate share link for outfit
   */
  async shareOutfit(outfitId: string): Promise<string | null> {
    try {
      // Generate unique share token
      const shareToken = crypto.randomUUID();

      const { error } = await supabase
        .from('outfits')
        .update({ share_token: shareToken })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error generating share link:', error);
        return null;
      }

      const shareUrl = `${window.location.origin}/outfit/${shareToken}`;
      console.log('🔗 [OUTFIT-STORAGE] Share link generated:', shareUrl);
      return shareUrl;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to generate share link:', error);
      return null;
    }
  }

  /**
   * Get outfit by share token (public access)
   */
  async getOutfitByShareToken(shareToken: string): Promise<OutfitData | null> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching shared outfit:', error);
        return null;
      }

      console.log('👀 [OUTFIT-STORAGE] Loaded shared outfit');
      return data;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch shared outfit:', error);
      return null;
    }
  }

  /**
   * Rate an outfit (1-5 stars)
   */
  async rateOutfit(outfitId: string, rating: number, userId: string): Promise<boolean> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        console.error('❌ [OUTFIT-STORAGE] Invalid rating:', rating);
        return false;
      }

      const { error } = await supabase
        .from('outfits')
        .update({ rating })
        .eq('id', outfitId);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error rating outfit:', error);
        return false;
      }

      // Track interaction
      await this.trackInteraction(userId, 'outfit_rated', '', {
        outfit_id: outfitId,
        rating
      });

      console.log(`⭐ [OUTFIT-STORAGE] Outfit rated: ${rating} stars`);
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to rate outfit:', error);
      return false;
    }
  }

  /**
   * Get highest-rated outfits
   */
  async getTopRatedOutfits(userId: string, minRating: number = 4): Promise<OutfitData[]> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .gte('rating', minRating)
        .order('rating', { ascending: false });

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching top rated outfits:', error);
        return [];
      }

      console.log(`⭐ [OUTFIT-STORAGE] Loaded ${data?.length || 0} highly-rated outfits`);
      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch top rated outfits:', error);
      return [];
    }
  }

  /**
   * Track shop click
   */
  async trackShopClick(outfitId: string, productUrl: string, userId: string): Promise<boolean> {
    try {
      await this.trackInteraction(userId, 'shop_clicked', '', {
        outfit_id: outfitId,
        product_url: productUrl
      });

      console.log('🛍️ [OUTFIT-STORAGE] Shop click tracked');
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to track shop click:', error);
      return false;
    }
  }

  /**
   * Track purchase
   */
  async trackPurchase(outfitId: string, price: number, userId: string): Promise<boolean> {
    try {
      // Mark outfit as purchased
      const { error: updateError } = await supabase
        .from('outfits')
        .update({ purchased: true })
        .eq('id', outfitId);

      if (updateError) {
        console.error('❌ [OUTFIT-STORAGE] Error updating outfit as purchased:', updateError);
        return false;
      }

      // Track purchase interaction
      await this.trackInteraction(userId, 'purchase_confirmed', '', {
        outfit_id: outfitId,
        price
      });

      console.log('💰 [OUTFIT-STORAGE] Purchase tracked');
      return true;
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to track purchase:', error);
      return false;
    }
  }

  /**
   * Get conversion rate analytics
   */
  async getConversionRate(userId: string): Promise<{ total: number; purchased: number; rate: number }> {
    try {
      const { data: allOutfits, error: totalError } = await supabase
        .from('outfits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: purchasedOutfits, error: purchasedError } = await supabase
        .from('outfits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('purchased', true);

      if (totalError || purchasedError) {
        console.error('❌ [OUTFIT-STORAGE] Error calculating conversion rate');
        return { total: 0, purchased: 0, rate: 0 };
      }

      const total = allOutfits?.length || 0;
      const purchased = purchasedOutfits?.length || 0;
      const rate = total > 0 ? (purchased / total) * 100 : 0;

      console.log(`📊 [OUTFIT-STORAGE] Conversion rate: ${rate.toFixed(2)}%`);
      return { total, purchased, rate };
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to calculate conversion rate:', error);
      return { total: 0, purchased: 0, rate: 0 };
    }
  }

  /**
   * Get similar outfits for recommendations ("You might also like...")
   */
  async getSimilarOutfits(outfitId: string, limit: number = 3): Promise<OutfitData[]> {
    try {
      // First get the current outfit
      const { data: currentOutfit, error: currentError } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single();

      if (currentError || !currentOutfit) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching current outfit:', currentError);
        return [];
      }

      // Find outfits with same occasion but different style
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('occasion', currentOutfit.occasion)
        .eq('user_id', currentOutfit.user_id)
        .neq('style', currentOutfit.style)
        .neq('id', outfitId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching similar outfits:', error);
        return [];
      }

      console.log(`🎯 [OUTFIT-STORAGE] Found ${data?.length || 0} similar outfits`);
      return data || [];
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to fetch similar outfits:', error);
      return [];
    }
  }

  /**
   * A/B test prompt versions - randomly assign version
   */
  getPromptVersion(): 'A' | 'B' {
    return Math.random() > 0.5 ? 'A' : 'B';
  }

  /**
   * Get A/B test analytics - which prompt gets more clicks?
   */
  async getPromptVersionAnalytics(userId: string): Promise<{
    versionA: { total: number; clicked: number; clickRate: number };
    versionB: { total: number; clicked: number; clickRate: number };
  }> {
    try {
      // Get stats for version A
      const { data: versionAOutfits, error: errorA } = await supabase
        .from('outfits')
        .select('clicked')
        .eq('user_id', userId)
        .eq('prompt_version', 'A');

      // Get stats for version B
      const { data: versionBOutfits, error: errorB } = await supabase
        .from('outfits')
        .select('clicked')
        .eq('user_id', userId)
        .eq('prompt_version', 'B');

      if (errorA || errorB) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching A/B test analytics');
        return {
          versionA: { total: 0, clicked: 0, clickRate: 0 },
          versionB: { total: 0, clicked: 0, clickRate: 0 }
        };
      }

      const versionATotal = versionAOutfits?.length || 0;
      const versionAClicked = versionAOutfits?.filter(o => o.clicked).length || 0;
      const versionAClickRate = versionATotal > 0 ? (versionAClicked / versionATotal) * 100 : 0;

      const versionBTotal = versionBOutfits?.length || 0;
      const versionBClicked = versionBOutfits?.filter(o => o.clicked).length || 0;
      const versionBClickRate = versionBTotal > 0 ? (versionBClicked / versionBTotal) * 100 : 0;

      console.log(`📊 [OUTFIT-STORAGE] A/B Test Results:`);
      console.log(`   Version A: ${versionAClickRate.toFixed(2)}% click rate (${versionAClicked}/${versionATotal})`);
      console.log(`   Version B: ${versionBClickRate.toFixed(2)}% click rate (${versionBClicked}/${versionBTotal})`);

      return {
        versionA: {
          total: versionATotal,
          clicked: versionAClicked,
          clickRate: versionAClickRate
        },
        versionB: {
          total: versionBTotal,
          clicked: versionBClicked,
          clickRate: versionBClickRate
        }
      };
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to get A/B test analytics:', error);
      return {
        versionA: { total: 0, clicked: 0, clickRate: 0 },
        versionB: { total: 0, clicked: 0, clickRate: 0 }
      };
    }
  }

  /**
   * Get weekly stats for user (for weekly recap notifications)
   */
  async getWeeklyStats(userId: string): Promise<{
    outfitsGenerated: number;
    favoriteCount: number;
    topStyle: string;
    topOccasion: string;
  }> {
    try {
      // Get outfits from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString());

      if (error) {
        console.error('❌ [OUTFIT-STORAGE] Error fetching weekly stats:', error);
        return {
          outfitsGenerated: 0,
          favoriteCount: 0,
          topStyle: 'N/A',
          topOccasion: 'N/A'
        };
      }

      const outfits = data || [];
      const favorited = outfits.filter(o => o.favorited);

      // Find most popular style
      const styleCounts: { [key: string]: number } = {};
      outfits.forEach(o => {
        styleCounts[o.style] = (styleCounts[o.style] || 0) + 1;
      });
      const topStyle = Object.keys(styleCounts).reduce((a, b) =>
        styleCounts[a] > styleCounts[b] ? a : b, 'N/A'
      );

      // Find most popular occasion
      const occasionCounts: { [key: string]: number } = {};
      outfits.forEach(o => {
        occasionCounts[o.occasion] = (occasionCounts[o.occasion] || 0) + 1;
      });
      const topOccasion = Object.keys(occasionCounts).reduce((a, b) =>
        occasionCounts[a] > occasionCounts[b] ? a : b, 'N/A'
      );

      return {
        outfitsGenerated: outfits.length,
        favoriteCount: favorited.length,
        topStyle,
        topOccasion
      };
    } catch (error) {
      console.error('❌ [OUTFIT-STORAGE] Failed to get weekly stats:', error);
      return {
        outfitsGenerated: 0,
        favoriteCount: 0,
        topStyle: 'N/A',
        topOccasion: 'N/A'
      };
    }
  }
}

// Singleton instance
export const outfitStorageService = new OutfitStorageService();
export default outfitStorageService;
