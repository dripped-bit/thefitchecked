import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  price: number;
  url: string;
  image_url: string;
  created_at: string;
}

// Fetch wishlist items
export function useWishlist(userId: string) {
  return useQuery({
    queryKey: queryKeys.wishlist.list(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WishlistItem[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Add to wishlist
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<WishlistItem>) => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.wishlist.list(data.user_id) 
      });
      
      // Also invalidate analytics
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.all 
      });
    },
  });
}

// Remove from wishlist
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// Get wishlist summary (for analytics)
export function useWishlistSummary(userId: string) {
  return useQuery({
    queryKey: [...queryKeys.wishlist.list(userId), 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('category, price')
        .eq('user_id', userId);

      if (error) throw error;

      // Calculate totals by category
      const summary = data.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = 0;
        }
        acc[item.category] += item.price || 0;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(summary).reduce((sum, val) => sum + val, 0);

      return {
        total,
        byCategory: Object.entries(summary).map(([category, value]) => ({
          category,
          value,
          percentage: (value / total) * 100,
        })),
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}
