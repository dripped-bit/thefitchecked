/**
 * React Query Hooks for Trip Management
 * Provides all hooks for CRUD operations on trips, activities, outfits, and packing lists
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import type { TripType, ActivityType, TimeSlot, AccommodationType, PackingCategory, TripStatus, FormalityLevel } from '../constants/tripTypes';

// ============================================
// TYPES
// ============================================

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: TripType;
  icon?: string;
  color?: string;
  accommodation_type?: AccommodationType;
  number_of_travelers: number;
  notes?: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface TripActivity {
  id: string;
  trip_id: string;
  date: string;
  time_slot: TimeSlot;
  activity_type?: ActivityType;
  title: string;
  location?: string;
  formality_level?: FormalityLevel;
  weather_consideration: boolean;
  notes?: string;
  created_at: string;
}

export interface TripOutfit {
  id: string;
  activity_id: string;
  clothing_item_ids: string[];
  outfit_image_url?: string;
  is_ai_generated: boolean;
  is_confirmed: boolean;
  created_at: string;
}

export interface PackingListItem {
  id: string;
  trip_id: string;
  item_name: string;
  category?: PackingCategory;
  quantity: number;
  is_packed: boolean;
  is_essential: boolean;
  clothing_item_id?: string;
  packed_at?: string;
  created_at: string;
}

export interface TripDayClothes {
  id: string;
  trip_id: string;
  date: string;
  clothing_item_id: string;
  added_manually: boolean;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  trip_id: string;
  item_name: string;
  category: string;
  item_count: number;
  is_checked: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripInput {
  user_id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  trip_type: TripType;
  icon?: string;
  color?: string;
  accommodation_type?: AccommodationType;
  number_of_travelers?: number;
  notes?: string;
  status?: TripStatus;
}

export interface ActivityInput {
  trip_id: string;
  date: string;
  time_slot: TimeSlot;
  activity_type?: ActivityType;
  title: string;
  location?: string;
  formality_level?: FormalityLevel;
  weather_consideration?: boolean;
  notes?: string;
}

export interface TripStats {
  totalActivities: number;
  activitiesWithOutfits: number;
  totalPackingItems: number;
  packedItems: number;
  packingProgress: number;
  hasToiletries?: boolean;
  hasElectronics?: boolean;
  hasDocuments?: boolean;
}

// ============================================
// QUERY KEYS
// ============================================

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (userId: string) => [...tripKeys.lists(), userId] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (tripId: string) => [...tripKeys.details(), tripId] as const,
  trip: (tripId: string) => [...tripKeys.details(), tripId] as const,
  activities: (tripId: string) => [...tripKeys.detail(tripId), 'activities'] as const,
  outfits: (activityId: string) => ['trip-outfits', activityId] as const,
  packingList: (tripId: string) => [...tripKeys.detail(tripId), 'packing'] as const,
  stats: (tripId: string) => [...tripKeys.detail(tripId), 'stats'] as const,
  dayClothes: (tripId: string, date: string) => ['trip-day-clothes', tripId, date] as const,
  checklist: (tripId: string) => [...tripKeys.detail(tripId), 'checklist'] as const,
  insights: (tripId: string) => [...tripKeys.detail(tripId), 'insights'] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * Fetch all trips for a user
 */
export function useTrips(userId: string) {
  return useQuery({
    queryKey: tripKeys.list(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as Trip[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}

/**
 * Fetch a single trip by ID
 */
export function useTrip(tripId: string) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;
      return data as Trip;
    },
    enabled: !!tripId,
  });
}

/**
 * Fetch upcoming trips (next 30 days)
 */
export function useUpcomingTrips(userId: string, limit: number = 5) {
  return useQuery({
    queryKey: [...tripKeys.list(userId), 'upcoming', limit],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Trip[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Fetch activities for a trip
 */
export function useTripActivities(tripId: string, date?: string) {
  return useQuery({
    queryKey: date ? [...tripKeys.activities(tripId), date] : tripKeys.activities(tripId),
    queryFn: async () => {
      let query = supabase
        .from('trip_activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TripActivity[];
    },
    enabled: !!tripId,
  });
}

/**
 * Fetch outfit for an activity
 */
export function useTripOutfit(activityId: string) {
  return useQuery({
    queryKey: tripKeys.outfits(activityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_outfits')
        .select('*')
        .eq('activity_id', activityId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found
      return data as TripOutfit | null;
    },
    enabled: !!activityId,
  });
}

/**
 * Fetch all outfits for a trip (via activities)
 */
export function useAllTripOutfits(tripId: string) {
  return useQuery({
    queryKey: [...tripKeys.outfits('all'), tripId],
    queryFn: async () => {
      // First get all activities for this trip
      const { data: activities, error: activitiesError } = await supabase
        .from('trip_activities')
        .select('id')
        .eq('trip_id', tripId);

      if (activitiesError) throw activitiesError;
      if (!activities || activities.length === 0) return [];

      // Get all outfits for these activities
      const activityIds = activities.map(a => a.id);
      const { data, error } = await supabase
        .from('trip_outfits')
        .select('*')
        .in('activity_id', activityIds);

      if (error) throw error;
      return data as TripOutfit[];
    },
    enabled: !!tripId,
  });
}

/**
 * Fetch packing list for a trip
 */
export function useTripPackingList(tripId: string) {
  return useQuery({
    queryKey: tripKeys.packingList(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_packing_list')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      return data as PackingListItem[];
    },
    enabled: !!tripId,
  });
}

/**
 * Fetch trip statistics
 */
export function useTripStats(tripId: string) {
  return useQuery({
    queryKey: tripKeys.stats(tripId),
    queryFn: async () => {
      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('trip_activities')
        .select('id')
        .eq('trip_id', tripId);

      if (activitiesError) throw activitiesError;

      // Fetch outfits
      const activityIds = activities?.map(a => a.id) || [];
      const { data: outfits, error: outfitsError } = activityIds.length > 0
        ? await supabase
            .from('trip_outfits')
            .select('activity_id')
            .in('activity_id', activityIds)
        : { data: [], error: null };

      if (outfitsError) throw outfitsError;

      // Fetch packing list with category info
      const { data: packingItems, error: packingError } = await supabase
        .from('trip_packing_list')
        .select('is_packed, category')
        .eq('trip_id', tripId);

      if (packingError) throw packingError;

      const totalPackingItems = packingItems?.length || 0;
      const packedItems = packingItems?.filter(item => item.is_packed).length || 0;

      // Check if essential categories have packed items
      const hasToiletries = packingItems?.some(item => 
        item.category === 'toiletries' && item.is_packed
      ) || false;
      
      const hasElectronics = packingItems?.some(item => 
        item.category === 'electronics' && item.is_packed
      ) || false;
      
      const hasDocuments = packingItems?.some(item => 
        item.category === 'documents' && item.is_packed
      ) || false;

      console.log('📊 [TRIP-STATS] Category completion:', {
        toiletries: hasToiletries ? '✅' : '❌',
        electronics: hasElectronics ? '✅' : '❌',
        documents: hasDocuments ? '✅' : '❌'
      });

      return {
        totalActivities: activities?.length || 0,
        activitiesWithOutfits: outfits?.length || 0,
        totalPackingItems,
        packedItems,
        packingProgress: totalPackingItems > 0 ? (packedItems / totalPackingItems) * 100 : 0,
        hasToiletries,
        hasElectronics,
        hasDocuments,
      } as TripStats;
    },
    enabled: !!tripId,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * Create a new trip
 */
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: TripInput) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();

      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.list(data.user_id) });
    },
  });
}

/**
 * Update a trip
 */
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, updates }: { tripId: string; updates: Partial<Trip> }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();

      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.list(data.user_id) });
    },
  });
}

/**
 * Delete a trip
 */
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;
      return tripId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all });
    },
  });
}

/**
 * Create an activity
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: ActivityInput) => {
      const { data, error } = await supabase
        .from('trip_activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data as TripActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.activities(data.trip_id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats(data.trip_id) });
    },
  });
}

/**
 * Update an activity
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, updates }: { activityId: string; updates: Partial<TripActivity> }) => {
      const { data, error } = await supabase
        .from('trip_activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

      if (error) throw error;
      return data as TripActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.activities(data.trip_id) });
    },
  });
}

/**
 * Delete an activity
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      // Get trip_id before deleting
      const { data: activity } = await supabase
        .from('trip_activities')
        .select('trip_id')
        .eq('id', activityId)
        .single();

      const { error } = await supabase
        .from('trip_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      return { activityId, tripId: activity?.trip_id };
    },
    onSuccess: (data) => {
      if (data.tripId) {
        queryClient.invalidateQueries({ queryKey: tripKeys.activities(data.tripId) });
        queryClient.invalidateQueries({ queryKey: tripKeys.stats(data.tripId) });
      }
    },
  });
}

/**
 * Create or update trip outfit
 */
export function useCreateTripOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (outfit: Omit<TripOutfit, 'id' | 'created_at'>) => {
      // Check if outfit exists
      const { data: existing } = await supabase
        .from('trip_outfits')
        .select('id')
        .eq('activity_id', outfit.activity_id)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('trip_outfits')
          .update(outfit)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as TripOutfit;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('trip_outfits')
          .insert(outfit)
          .select()
          .single();

        if (error) throw error;
        return data as TripOutfit;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.outfits(data.activity_id) });
    },
  });
}

/**
 * Toggle packing item status
 */
export function useTogglePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isPacked }: { itemId: string; isPacked: boolean }) => {
      const { data, error } = await supabase
        .from('trip_packing_list')
        .update({ 
          is_packed: isPacked,
          packed_at: isPacked ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data as PackingListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.packingList(data.trip_id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats(data.trip_id) });
    },
  });
}

/**
 * Add packing item
 */
export function useAddPackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<PackingListItem, 'id' | 'created_at' | 'packed_at'>) => {
      const { data, error } = await supabase
        .from('trip_packing_list')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as PackingListItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.packingList(data.trip_id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats(data.trip_id) });
    },
  });
}

/**
 * Delete packing item
 */
export function useDeletePackingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      // Get trip_id before deleting
      const { data: item } = await supabase
        .from('trip_packing_list')
        .select('trip_id')
        .eq('id', itemId)
        .single();

      const { error } = await supabase
        .from('trip_packing_list')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { itemId, tripId: item?.trip_id };
    },
    onSuccess: (data) => {
      if (data.tripId) {
        queryClient.invalidateQueries({ queryKey: tripKeys.packingList(data.tripId) });
        queryClient.invalidateQueries({ queryKey: tripKeys.stats(data.tripId) });
      }
    },
  });
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Calculate trip duration in days
 */
export function useTripDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end day
}

/**
 * Get array of dates for a trip
 */
export function useTripDaysArray(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

// ============================================
// TRIP DAY CLOTHES HOOKS
// ============================================

/**
 * Get manually added clothes for a specific trip day
 */
export function useManualDayClothes(tripId: string, date: string) {
  return useQuery<TripDayClothes[]>({
    queryKey: tripKeys.dayClothes(tripId, date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_day_clothes')
        .select('*')
        .eq('trip_id', tripId)
        .eq('date', date)
        .eq('added_manually', true);
      
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Add clothes to a specific trip day
 */
export function useAddDayClothes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      trip_id,
      date,
      clothing_item_ids,
    }: {
      trip_id: string;
      date: string;
      clothing_item_ids: string[];
    }) => {
      console.log('👕 [ADD-CLOTHES] Saving', clothing_item_ids.length, 'items for', date);
      
      // Insert multiple items
      const items = clothing_item_ids.map(clothing_item_id => ({
        trip_id,
        date,
        clothing_item_id,
        added_manually: true,
      }));
      
      const { data, error } = await supabase
        .from('trip_day_clothes')
        .insert(items)
        .select();
      
      if (error) {
        console.error('❌ [ADD-CLOTHES] Failed:', error);
        throw error;
      }
      
      console.log('✅ [ADD-CLOTHES] Items saved successfully');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.dayClothes(variables.trip_id, variables.date) });
      queryClient.invalidateQueries({ queryKey: tripKeys.trip(variables.trip_id) });
    },
  });
}

/**
 * Delete a manually added clothing item from a trip day
 */
export function useDeleteDayClothes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      trip_id,
      date,
      clothing_item_id,
    }: {
      trip_id: string;
      date: string;
      clothing_item_id: string;
    }) => {
      console.log('🗑️ [CLOTHES-BOX] Removing manual item:', clothing_item_id);
      
      const { error } = await supabase
        .from('trip_day_clothes')
        .delete()
        .eq('trip_id', trip_id)
        .eq('date', date)
        .eq('clothing_item_id', clothing_item_id)
        .eq('added_manually', true);
      
      if (error) {
        console.error('❌ [CLOTHES-BOX] Failed to remove:', error);
        throw error;
      }
      
      console.log('✅ [CLOTHES-BOX] Item removed successfully');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.dayClothes(variables.trip_id, variables.date) });
      queryClient.invalidateQueries({ queryKey: tripKeys.trip(variables.trip_id) });
    },
  });
}

// ============================================
// CHECKLIST HOOKS
// ============================================

/**
 * Fetch checklist items for a trip
 */
export function useTripChecklist(tripId: string) {
  return useQuery({
    queryKey: tripKeys.checklist(tripId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!tripId,
  });
}

/**
 * Toggle checklist item checked state
 */
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      const { error } = await supabase
        .from('trip_checklist')
        .update({ is_checked: isChecked })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

/**
 * Initialize checklist for a trip
 */
export function useInitializeChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, items }: { tripId: string; items: Array<{ item_name: string; category: string; item_count?: number }> }) => {
      const checklistItems = items.map(item => ({
        trip_id: tripId,
        item_name: item.item_name,
        category: item.category,
        item_count: item.item_count || 1,
        is_checked: false,
      }));

      const { error } = await supabase
        .from('trip_checklist')
        .insert(checklistItems);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.checklist(variables.tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.trip(variables.tripId) });
    },
  });
}

/**
 * Delete checklist item
 */
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('trip_checklist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============================================
// INSIGHTS HOOKS
// ============================================

/**
 * Fetch AI-generated insights for a trip
 */
export function useTripInsights(tripId: string) {
  return useQuery({
    queryKey: tripKeys.insights(tripId),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check cache first
      const { data: cached } = await supabase
        .from('trip_insights')
        .select('*')
        .eq('trip_id', tripId)
        .maybeSingle();

      // Return cached if not expired
      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log('✅ [INSIGHTS] Using cached insights');
        return cached.insights_data;
      }

      // Generate new insights
      console.log('🔄 [INSIGHTS] Generating new insights');
      const { collectTripData } = await import('../services/tripInsightsService');
      const { analyzeTrip } = await import('../services/openaiInsightsService');

      const data = await collectTripData(tripId, user.id);
      const insights = await analyzeTrip(data);

      // Cache results
      await supabase
        .from('trip_insights')
        .upsert({
          trip_id: tripId,
          insights_data: insights,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });

      return insights;
    },
    enabled: !!tripId,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}

export default {
  useTrips,
  useTrip,
  useUpcomingTrips,
  useTripActivities,
  useTripOutfit,
  useAllTripOutfits,
  useTripPackingList,
  useTripStats,
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useCreateTripOutfit,
  useTogglePackingItem,
  useAddPackingItem,
  useDeletePackingItem,
  useTripDuration,
  useTripDaysArray,
  useManualDayClothes,
  useAddDayClothes,
  useDeleteDayClothes,
  useTripChecklist,
  useToggleChecklistItem,
  useInitializeChecklist,
  useDeleteChecklistItem,
  useTripInsights,
};
