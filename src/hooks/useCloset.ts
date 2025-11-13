import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'sweaters' | 'outerwear' | 'shoes' | 'accessories';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all_season';

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  image_url: string;
  thumbnail_url?: string;
  color?: string;
  pattern?: string;
  brand?: string;
  purchase_date?: string;
  price?: number;
  store?: string;
  seasons?: Season[];
  tags?: string[];
  favorite: boolean;
  condition?: string;
  care_instructions?: string;
  last_worn?: string;
  times_worn: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClothingItemInput {
  name: string;
  category: ClothingCategory;
  subcategory?: string;
  image_url: string;
  thumbnail_url?: string;
  color?: string;
  pattern?: string;
  brand?: string;
  purchase_date?: string;
  price?: number;
  store?: string;
  seasons?: Season[];
  tags?: string[];
  favorite?: boolean;
  condition?: string;
  care_instructions?: string;
  notes?: string;
}

export interface CategoryStats {
  category: ClothingCategory;
  count: number;
  favoriteCount: number;
  avgTimesWorn: number;
  mostRecentWear?: string;
}

export const useCloset = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all clothing items
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('clothing_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading closet items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load items by category
  const loadItemsByCategory = useCallback(async (category: ClothingCategory) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error(`Error loading ${category} items:`, err);
      return [];
    }
  }, []);

  // Add new clothing item
  const addItem = useCallback(async (item: ClothingItemInput): Promise<ClothingItem | null> => {
    try {
      // Get current user for RLS policy
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [CLOSET-HOOK] No authenticated user found');
        return null;
      }

      console.log('📝 [CLOSET-HOOK] Adding item with category:', item.category);
      console.log('📝 [CLOSET-HOOK] Item details:', { 
        name: item.name, 
        category: item.category,
        hasImage: !!item.image_url 
      });

      const { data, error: insertError } = await supabase
        .from('clothing_items')
        .insert([item])
        .select()
        .single();

      if (insertError) {
        console.error('❌ [CLOSET-HOOK] Insert error:', insertError);
        throw insertError;
      }
      
      console.log('✅ [CLOSET-HOOK] Item inserted with category:', data?.category);
      
      // Update local state
      if (data) {
        setItems(prev => [data, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error('❌ [CLOSET-HOOK] Error adding item:', err);
      setError(err as Error);
      return null;
    }
  }, []);

  // Update clothing item
  const updateItem = useCallback(async (id: string, updates: Partial<ClothingItemInput>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('clothing_items')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } as ClothingItem : item
      ));

      return true;
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err as Error);
      return false;
    }
  }, []);

  // Delete clothing item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setItems(prev => prev.filter(item => item.id !== id));

      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err as Error);
      return false;
    }
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    const item = items.find(i => i.id === id);
    if (!item) return false;

    return updateItem(id, { favorite: !item.favorite });
  }, [items, updateItem]);

  // Increment times worn
  const markAsWorn = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: rpcError } = await supabase.rpc('increment_times_worn', {
        item_id: id
      });

      if (rpcError) throw rpcError;

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, times_worn: item.times_worn + 1, last_worn: new Date().toISOString() }
          : item
      ));

      return true;
    } catch (err) {
      console.error('Error marking item as worn:', err);
      return false;
    }
  }, []);

  // Get items by category
  const getItemsByCategory = useCallback((category: ClothingCategory) => {
    return items.filter(item => item.category === category);
  }, [items]);

  // Get favorite items
  const getFavoriteItems = useCallback(() => {
    return items.filter(item => item.favorite);
  }, [items]);

  // Get items by season
  const getItemsBySeason = useCallback((season: Season) => {
    return items.filter(item => 
      item.seasons?.includes(season) || item.seasons?.includes('all_season')
    );
  }, [items]);

  // Search items
  const searchItems = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.brand?.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [items]);

  // Get category statistics
  const getCategoryStats = useCallback((): Record<ClothingCategory, CategoryStats> => {
    const categories: ClothingCategory[] = ['tops', 'bottoms', 'dresses', 'sweaters', 'outerwear', 'shoes', 'accessories'];
    
    return categories.reduce((acc, category) => {
      const categoryItems = getItemsByCategory(category);
      const favoriteCount = categoryItems.filter(item => item.favorite).length;
      const totalWears = categoryItems.reduce((sum, item) => sum + item.times_worn, 0);
      const avgTimesWorn = categoryItems.length > 0 ? totalWears / categoryItems.length : 0;
      const mostRecentWear = categoryItems
        .filter(item => item.last_worn)
        .sort((a, b) => new Date(b.last_worn!).getTime() - new Date(a.last_worn!).getTime())[0]?.last_worn;

      acc[category] = {
        category,
        count: categoryItems.length,
        favoriteCount,
        avgTimesWorn: Math.round(avgTimesWorn * 10) / 10,
        mostRecentWear
      };

      return acc;
    }, {} as Record<ClothingCategory, CategoryStats>);
  }, [getItemsByCategory]);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    loadItems,
    loadItemsByCategory,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    markAsWorn,
    getItemsByCategory,
    getFavoriteItems,
    getItemsBySeason,
    searchItems,
    getCategoryStats
  };
};
