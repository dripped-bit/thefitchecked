import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

export interface AIOutfit {
  id: string;
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
  primary_colors?: string[];
  color_palette?: any;
  is_creation?: boolean;
  generation_prompt?: string;
  created_at: string;
}

export interface AIOutfitFilters {
  occasion?: string;
  style?: string;
  favorited?: boolean;
  purchased?: boolean;
  minRating?: number;
  colors?: string[];
}

export interface AIOutfitInput {
  occasion: string;
  style: string;
  image_url: string;
  user_prompt?: string;
  gender?: string;
  seedream_seed?: number;
  prompt_version?: string;
  prompt_text?: string;
  weather_temp?: number;
  weather_condition?: string;
  location?: string;
  primary_colors?: string[];
  is_creation?: boolean;
}

// Fetch AI outfits with optional filters
export function useAIOutfits(userId: string, filters?: AIOutfitFilters) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, filters),
    queryFn: async () => {
      let query = supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.occasion) {
        query = query.eq('occasion', filters.occasion);
      }
      if (filters?.style) {
        query = query.eq('style', filters.style);
      }
      if (filters?.favorited !== undefined) {
        query = query.eq('favorited', filters.favorited);
      }
      if (filters?.purchased !== undefined) {
        query = query.eq('purchased', filters.purchased);
      }
      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }
      if (filters?.colors && filters.colors.length > 0) {
        query = query.overlaps('primary_colors', filters.colors);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch single AI outfit
export function useAIOutfit(outfitId: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.detail(outfitId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    enabled: !!outfitId,
  });
}

// Fetch favorited AI outfits
export function useFavoritedAIOutfits(userId: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, { favorited: true }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('favorited', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch purchased AI outfits
export function usePurchasedAIOutfits(userId: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, { purchased: true }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('purchased', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch AI outfits by occasion
export function useAIOutfitsByOccasion(userId: string, occasion: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, { occasion }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('occasion', occasion)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!occasion,
  });
}

// Fetch AI outfits by style
export function useAIOutfitsByStyle(userId: string, style: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, { style }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('style', style)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!style,
  });
}

// Fetch top-rated AI outfits
export function useTopRatedAIOutfits(userId: string, minRating: number = 4) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.list(userId, { minRating }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .gte('rating', minRating)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AIOutfit[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch AI outfit statistics
export function useAIOutfitStats(userId: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.stats(userId),
    queryFn: async () => {
      const { data: outfits, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const totalOutfits = outfits?.length || 0;
      const favoritedCount = outfits?.filter(o => o.favorited).length || 0;
      const purchasedCount = outfits?.filter(o => o.purchased).length || 0;
      const clickedCount = outfits?.filter(o => o.clicked).length || 0;
      const ratedOutfits = outfits?.filter(o => o.rating) || [];
      const avgRating = ratedOutfits.length > 0 
        ? ratedOutfits.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOutfits.length 
        : 0;
      const conversionRate = totalOutfits > 0 ? (purchasedCount / totalOutfits) * 100 : 0;

      return {
        totalOutfits,
        favoritedCount,
        purchasedCount,
        clickedCount,
        avgRating: Math.round(avgRating * 10) / 10,
        ratedCount: ratedOutfits.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

// Fetch shared outfit by token (public access)
export function useSharedAIOutfit(shareToken: string) {
  return useQuery({
    queryKey: queryKeys.aiOutfits.shared(shareToken),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    enabled: !!shareToken,
  });
}

// Create AI outfit
export function useCreateAIOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfit: AIOutfitInput & { user_id: string }) => {
      const { data, error } = await supabase
        .from('outfits')
        .insert({
          ...outfit,
          clicked: false,
          purchased: false,
          favorited: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.stats(data.user_id) });
    },
  });
}

// Update AI outfit metadata
export function useUpdateAIOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      outfitId, 
      updates 
    }: { 
      outfitId: string; 
      updates: Partial<AIOutfit> 
    }) => {
      const { data, error } = await supabase
        .from('outfits')
        .update(updates)
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.lists() });
    },
  });
}

// Delete AI outfit
export function useDeleteAIOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      const { error } = await supabase
        .from('outfits')
        .delete()
        .eq('id', outfitId);

      if (error) throw error;
      return outfitId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.all });
    },
  });
}

// Toggle favorite
export function useToggleAIFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ outfitId, favorited }: { outfitId: string; favorited: boolean }) => {
      const { data, error } = await supabase
        .from('outfits')
        .update({ favorited })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.stats(data.user_id) });
    },
  });
}

// Rate AI outfit (1-5 stars)
export function useRateAIOutfit() {
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
        .from('outfits')
        .update({ rating })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.stats(data.user_id) });
    },
  });
}

// Mark as purchased
export function useMarkAIPurchased() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      const { data, error } = await supabase
        .from('outfits')
        .update({ purchased: true })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.stats(data.user_id) });
    },
  });
}

// Mark as clicked (track interaction)
export function useMarkAIClicked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      const { data, error } = await supabase
        .from('outfits')
        .update({ clicked: true })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;
      return data as AIOutfit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.id) });
    },
  });
}

// Generate share link
export function useShareAIOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfitId: string) => {
      // Generate unique share token
      const shareToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('outfits')
        .update({ share_token: shareToken })
        .eq('id', outfitId)
        .select()
        .single();

      if (error) throw error;

      // Return the full share URL
      const shareUrl = `${window.location.origin}/outfit/${shareToken}`;
      return { outfit: data as AIOutfit, shareUrl };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiOutfits.detail(data.outfit.id) });
    },
  });
}
