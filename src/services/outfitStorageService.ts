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
}

// Singleton instance
export const outfitStorageService = new OutfitStorageService();
export default outfitStorageService;
