import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

interface ClosetFilters {
  category?: string;
  color?: string;
  season?: string;
  searchQuery?: string;
}

interface ClosetItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  subcategory: string;
  color: string;
  price: number;
  image_path: string;
  created_at: string;
}

// Fetch closet items with optional filters
export function useClosetItems(userId: string, filters?: ClosetFilters) {
  return useQuery({
    queryKey: queryKeys.closet.list(userId, filters),
    queryFn: async () => {
      let query = supabase
        .from('wardrobe_items')
        .select('id, name, category, subcategory, color, price, image_path, created_at')
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
        query = query.contains('season', [filters.season]);
      }
      if (filters?.searchQuery) {
        query = query.ilike('name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClosetItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId, // Only run if userId exists
  });
}

// Fetch single closet item
export function useClosetItem(itemId: string) {
  return useQuery({
    queryKey: queryKeys.closet.detail(itemId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });
}

// Add item to closet
export function useAddClosetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<ClosetItem>) => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all closet queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.closet.lists() });
      
      // Also invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.closet(data.user_id) 
      });
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
      updates: Partial<ClosetItem> 
    }) => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate specific item
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.closet.detail(data.id) 
      });
      
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.closet.lists() });
    },
  });
}

// Delete closet item
export function useDeleteClosetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      // Invalidate all closet queries
      queryClient.invalidateQueries({ queryKey: queryKeys.closet.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}
