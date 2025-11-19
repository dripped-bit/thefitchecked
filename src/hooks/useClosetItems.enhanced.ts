import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'activewear' | 'outerwear' | 'shoes' | 'accessories';
export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all_season';

export interface ClosetFilters {
  category?: ClothingCategory;
  color?: string;
  season?: Season;
  searchQuery?: string;
  favorite?: boolean;
}

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
  price?: number;
  store?: string;
  seasons?: Season[];
  tags?: string[];
  favorite: boolean;
  times_worn: number;
  last_worn?: string;
  condition?: string;
  care_instructions?: string;
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
  totalValue: number;
}

// Fetch closet items with optional filters
export function useClosetItems(userId: string, filters?: ClosetFilters) {
  return useQuery({
    queryKey: queryKeys.closetItems.list(userId, filters),
    queryFn: async () => {
      let query = supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.color) {
        query = query.eq('color', filters.color);
      }
      if (filters?.season) {
        query = query.contains('seasons', [filters.season]);
      }
      if (filters?.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`);
      }
      if (filters?.favorite !== undefined) {
        query = query.eq('favorite', filters.favorite);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClothingItem[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch single closet item
export function useClosetItem(itemId: string) {
  return useQuery({
    queryKey: queryKeys.closetItems.detail(itemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    enabled: !!itemId,
  });
}

// Fetch items by category
export function useClosetByCategory(userId: string, category: ClothingCategory) {
  return useQuery({
    queryKey: queryKeys.closetItems.list(userId, { category }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClothingItem[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch favorite items
export function useFavoriteItems(userId: string) {
  return useQuery({
    queryKey: queryKeys.closetItems.favorites(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId)
        .eq('favorite', true)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data as ClothingItem[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch closet statistics
export function useClosetStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.closetItems.stats(userId),
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const categories: ClothingCategory[] = ['tops', 'bottoms', 'dresses', 'activewear', 'outerwear', 'shoes', 'accessories'];
      
      const stats: CategoryStats[] = categories.map(category => {
        const categoryItems = items?.filter(item => item.category === category) || [];
        const favoriteCount = categoryItems.filter(item => item.favorite).length;
        const totalWears = categoryItems.reduce((sum, item) => sum + (item.times_worn || 0), 0);
        const avgTimesWorn = categoryItems.length > 0 ? totalWears / categoryItems.length : 0;
        const totalValue = categoryItems.reduce((sum, item) => sum + (item.price || 0), 0);

        return {
          category,
          count: categoryItems.length,
          favoriteCount,
          avgTimesWorn: Math.round(avgTimesWorn * 10) / 10,
          totalValue,
        };
      });

      return stats;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Add item to closet
export function useAddClosetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: ClothingItemInput & { user_id: string }) => {
      const { data, error } = await supabase
        .from('clothing_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.stats(data.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.closet(data.user_id) });
    },
  });
}

// Update closet item
export function useUpdateClosetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      updates 
    }: { 
      itemId: string; 
      updates: Partial<ClothingItem> 
    }) => {
      const { data, error } = await supabase
        .from('clothing_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.stats(data.user_id) });
    },
  });
}

// Delete closet item
export function useDeleteClosetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// Toggle favorite status
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, favorite }: { itemId: string; favorite: boolean }) => {
      const { data, error } = await supabase
        .from('clothing_items')
        .update({ favorite })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.favorites(data.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.lists() });
    },
  });
}

// Mark item as worn (increment times_worn)
export function useMarkAsWorn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      // First get the current item
      const { data: currentItem, error: fetchError } = await supabase
        .from('clothing_items')
        .select('times_worn')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      // Increment times_worn
      const { data, error } = await supabase
        .from('clothing_items')
        .update({ 
          times_worn: (currentItem.times_worn || 0) + 1,
          last_worn: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as ClothingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.closetItems.stats(data.user_id) });
    },
  });
}
