import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';
import type { ClothingItem, Season } from './useClosetItems.enhanced';

export interface SavedOutfit {
  id: string;
  user_id: string;
  name: string;
  image_url?: string;
  occasion?: string;
  season?: Season[];
  weather?: string[];
  top_id?: string;
  bottom_id?: string;
  shoes_id?: string;
  outerwear_id?: string;
  accessories_ids?: string[];
  wear_count: number;
  last_worn?: string;
  rating?: number;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  
  // Joined data
  top?: ClothingItem;
  bottom?: ClothingItem;
  shoes?: ClothingItem;
  outerwear?: ClothingItem;
}

export interface SavedOutfitInput {
  name: string;
  occasion?: string;
  season?: Season[];
  weather?: string[];
  top_id?: string;
  bottom_id?: string;
  shoes_id?: string;
  outerwear_id?: string;
  accessories_ids?: string[];
  notes?: string;
  tags?: string[];
}

export interface SavedOutfitFilters {
  occasion?: string;
  season?: Season;
  minRating?: number;
}

// Fetch saved outfits with optional filters
export function useSavedOutfits(userId: string, filters?: SavedOutfitFilters) {
  return useQuery({
    queryKey: queryKeys.savedOutfits.list(userId, filters),
    queryFn: async () => {
      let query = supabase
        .from('saved_outfits')
        .select(`
          *,
          top:top_id(id, name, image_url, category),
          bottom:bottom_id(id, name, image_url, category),
          shoes:shoes_id(id, name, image_url, category),
          outerwear:outerwear_id(id, name, image_url, category)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.occasion) {
        query = query.eq('occasion', filters.occasion);
      }
      if (filters?.season) {
        query = query.contains('season', [filters.season]);
      }
      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SavedOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch single saved outfit with items
export function useSavedOutfit(outfitId: string) {
  return useQuery({
    queryKey: queryKeys.savedOutfits.detail(outfitId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select(`
          *,
          top:top_id(id, name, image_url, category, brand, color),
          bottom:bottom_id(id, name, image_url, category, brand, color),
          shoes:shoes_id(id, name, image_url, category, brand, color),
          outerwear:outerwear_id(id, name, image_url, category, brand, color)
        `)
        .eq('id', outfitId)
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    enabled: !!outfitId,
  });
}

// Fetch outfits by occasion
export function useSavedOutfitsByOccasion(userId: string, occasion: string) {
  return useQuery({
    queryKey: queryKeys.savedOutfits.list(userId, { occasion }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('occasion', occasion)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!occasion,
  });
}

// Fetch outfits by season
export function useSavedOutfitsBySeason(userId: string, season: Season) {
  return useQuery({
    queryKey: queryKeys.savedOutfits.list(userId, { season }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId)
        .contains('season', [season])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch recently worn outfits
export function useRecentOutfits(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.savedOutfits.list(userId), 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId)
        .not('last_worn', 'is', null)
        .order('last_worn', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SavedOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch outfit usage statistics
export function useOutfitStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.savedOutfits.stats(userId),
    queryFn: async () => {
      const { data: outfits, error } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const totalOutfits = outfits?.length || 0;
      const totalWears = outfits?.reduce((sum, outfit) => sum + (outfit.wear_count || 0), 0) || 0;
      const avgWears = totalOutfits > 0 ? totalWears / totalOutfits : 0;
      const ratedOutfits = outfits?.filter(o => o.rating) || [];
      const avgRating = ratedOutfits.length > 0 
        ? ratedOutfits.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOutfits.length 
        : 0;

      return {
        totalOutfits,
        totalWears,
        avgWears: Math.round(avgWears * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
        ratedCount: ratedOutfits.length,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Save new outfit
export function useSaveOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfit: SavedOutfitInput & { user_id: string }) => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .insert(outfit)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.stats(data.user_id) });
    },
  });
}

// Update outfit details
export function useUpdateOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      outfitId, 
      updates 
    }: { 
      outfitId: string; 
      updates: Partial<SavedOutfit> 
    }) => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .update(updates)
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.lists() });
    },
  });
}

// Delete outfit
export function useDeleteOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId);

      if (error) throw error;
      return outfitId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.all });
    },
  });
}

// Add item to outfit
export function useAddItemToOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      outfitId, 
      itemId, 
      slot 
    }: { 
      outfitId: string; 
      itemId: string; 
      slot: 'top_id' | 'bottom_id' | 'shoes_id' | 'outerwear_id';
    }) => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .update({ [slot]: itemId })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.detail(data.id) });
    },
  });
}

// Remove item from outfit
export function useRemoveItemFromOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      outfitId, 
      slot 
    }: { 
      outfitId: string; 
      slot: 'top_id' | 'bottom_id' | 'shoes_id' | 'outerwear_id';
    }) => {
      const { data, error } = await supabase
        .from('saved_outfits')
        .update({ [slot]: null })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.detail(data.id) });
    },
  });
}

// Mark outfit as worn (increment wear_count)
export function useMarkOutfitWorn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      // Get current outfit
      const { data: currentOutfit, error: fetchError } = await supabase
        .from('saved_outfits')
        .select('wear_count')
        .eq('id', outfitId)
        .single();

      if (fetchError) throw fetchError;

      // Increment wear_count
      const { data, error } = await supabase
        .from('saved_outfits')
        .update({ 
          wear_count: (currentOutfit.wear_count || 0) + 1,
          last_worn: new Date().toISOString()
        })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.stats(data.user_id) });
    },
  });
}

// Rate outfit (1-5 stars)
export function useRateOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      outfitId, 
      rating 
    }: { 
      outfitId: string; 
      rating: number 
    }) => {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { data, error } = await supabase
        .from('saved_outfits')
        .update({ rating })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as SavedOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.savedOutfits.stats(data.user_id) });
    },
  });
}
