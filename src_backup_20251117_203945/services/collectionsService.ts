import { supabase } from './supabaseClient'

/**
 * Collections Service
 * Manages outfit collections/boards
 */

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: Date;
}

export interface CollectionWithOutfits extends Collection {
  outfits: any[];
}

class CollectionsService {
  /**
   * Create a new collection
   */
  async createCollection(userId: string, name: string, description?: string): Promise<Collection | null> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: userId,
          name,
          description
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [COLLECTIONS] Error creating collection:', error);
        return null;
      }

      console.log('✅ [COLLECTIONS] Collection created:', data.name);
      return data;
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to create collection:', error);
      return null;
    }
  }

  /**
   * Get user's collections
   */
  async getUserCollections(userId: string): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false});

      if (error) {
        console.error('❌ [COLLECTIONS] Error fetching collections:', error);
        return [];
      }

      console.log(`📚 [COLLECTIONS] Loaded ${data?.length || 0} collections`);
      return data || [];
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to fetch collections:', error);
      return [];
    }
  }

  /**
   * Add outfit to collection
   */
  async addOutfitToCollection(collectionId: string, outfitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_outfits')
        .insert({
          collection_id: collectionId,
          outfit_id: outfitId
        });

      if (error) {
        console.error('❌ [COLLECTIONS] Error adding outfit to collection:', error);
        return false;
      }

      console.log('✅ [COLLECTIONS] Outfit added to collection');
      return true;
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to add outfit to collection:', error);
      return false;
    }
  }

  /**
   * Remove outfit from collection
   */
  async removeOutfitFromCollection(collectionId: string, outfitId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collection_outfits')
        .delete()
        .eq('collection_id', collectionId)
        .eq('outfit_id', outfitId);

      if (error) {
        console.error('❌ [COLLECTIONS] Error removing outfit from collection:', error);
        return false;
      }

      console.log('✅ [COLLECTIONS] Outfit removed from collection');
      return true;
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to remove outfit from collection:', error);
      return false;
    }
  }

  /**
   * Get collection with outfits
   */
  async getCollectionWithOutfits(collectionId: string): Promise<CollectionWithOutfits | null> {
    try {
      // Get collection
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        console.error('❌ [COLLECTIONS] Error fetching collection:', collectionError);
        return null;
      }

      // Get outfits in collection
      const { data: collectionOutfits, error: outfitsError } = await supabase
        .from('collection_outfits')
        .select(`
          outfit_id,
          outfits (*)
        `)
        .eq('collection_id', collectionId);

      if (outfitsError) {
        console.error('❌ [COLLECTIONS] Error fetching collection outfits:', outfitsError);
        return { ...collection, outfits: [] };
      }

      const outfits = collectionOutfits?.map(co => co.outfits) || [];

      console.log(`📚 [COLLECTIONS] Loaded collection with ${outfits.length} outfits`);
      return {
        ...collection,
        outfits
      };
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to fetch collection with outfits:', error);
      return null;
    }
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) {
        console.error('❌ [COLLECTIONS] Error deleting collection:', error);
        return false;
      }

      console.log('🗑️ [COLLECTIONS] Collection deleted');
      return true;
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to delete collection:', error);
      return false;
    }
  }

  /**
   * Update collection
   */
  async updateCollection(collectionId: string, updates: { name?: string; description?: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', collectionId);

      if (error) {
        console.error('❌ [COLLECTIONS] Error updating collection:', error);
        return false;
      }

      console.log('✅ [COLLECTIONS] Collection updated');
      return true;
    } catch (error) {
      console.error('❌ [COLLECTIONS] Failed to update collection:', error);
      return false;
    }
  }
}

// Singleton instance
export const collectionsService = new CollectionsService();
export default collectionsService;
