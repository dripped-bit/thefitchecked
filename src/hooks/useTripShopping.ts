import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  getTripShoppingSuggestions,
  searchForTripItems,
  searchTripOutfitSets,
  searchGoogleShopping,
} from '../services/serpApiService';
import { generateTripRecommendations } from '../services/tripRecommendationsService';
import { useTrip, useAllTripOutfits } from './useTrips';

/**
 * Analyze missing items and get shopping suggestions
 */
export function useTripShoppingSuggestions(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const { data: outfits } = useAllTripOutfits(tripId);

  return useQuery({
    queryKey: ['trip-shopping-suggestions', tripId],
    queryFn: async () => {
      if (!trip || !outfits) return null;

      // Fetch all clothing items for the outfits to determine categories
      const allItemIds = outfits.flatMap((o) => o.clothing_item_ids || []);
      const uniqueItemIds = [...new Set(allItemIds)];

      let itemCategories: Record<string, string> = {};

      if (uniqueItemIds.length > 0) {
        const { data: items } = await supabase
          .from('clothing_items')
          .select('id, category')
          .in('id', uniqueItemIds);

        if (items) {
          itemCategories = Object.fromEntries(
            items.map((item) => [item.id, item.category])
          );
        }
      }

      // Analyze each outfit to count missing categories
      const categoryNeeds = {
        tops: 0,
        bottoms: 0,
        shoes: 0,
        outerwear: 0,
      };

      outfits.forEach((outfit) => {
        const itemIds = outfit.clothing_item_ids || [];
        const categories = itemIds.map((id) => itemCategories[id]).filter(Boolean);

        // Check which categories are missing in this outfit
        if (!categories.includes('tops') && !categories.includes('one-pieces')) {
          categoryNeeds.tops++;
        }
        if (!categories.includes('bottoms') && !categories.includes('one-pieces')) {
          categoryNeeds.bottoms++;
        }
        if (!categories.includes('shoes')) {
          categoryNeeds.shoes++;
        }
        // Outerwear is optional, only count if no jacket/coat
        if (!categories.includes('outerwear')) {
          categoryNeeds.outerwear++;
        }
      });

      // Build missing items array
      const missingItems = Object.entries(categoryNeeds)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({ category, count }));

      if (missingItems.length === 0) {
        return { missingItems: [], suggestions: {} };
      }

      // Get shopping suggestions using your SerpAPI service
      const suggestions = await getTripShoppingSuggestions(missingItems, {
        destination: trip.destination,
        tripType: trip.trip_type,
        weatherTemp: 72, // TODO: Get real weather
        weatherCondition: 'sunny', // TODO: Get real weather
      });

      return {
        missingItems,
        suggestions,
        tripContext: {
          name: trip.name,
          destination: trip.destination,
          tripType: trip.trip_type,
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!trip && !!outfits,
  });
}

/**
 * Search for specific item category
 */
export function useSearchTripCategory(
  tripId: string,
  category: string,
  enabled: boolean = false
) {
  const { data: trip } = useTrip(tripId);

  return useQuery({
    queryKey: ['trip-category-search', tripId, category],
    queryFn: async () => {
      if (!trip) return [];

      return searchForTripItems(
        {
          destination: trip.destination,
          tripType: trip.trip_type as any,
          weatherTemp: 72, // TODO: Real weather
        },
        category
      );
    },
    staleTime: 15 * 60 * 1000,
    enabled: enabled && !!trip,
  });
}

/**
 * General shopping search for trip
 */
export function useShopForTrip(searchQuery: string) {
  return useQuery({
    queryKey: ['trip-shop-search', searchQuery],
    queryFn: () => searchGoogleShopping(searchQuery),
    staleTime: 10 * 60 * 1000,
    enabled: searchQuery.length >= 3,
  });
}

/**
 * Track product views
 */
export function useTrackTripProductView() {
  return useMutation({
    mutationFn: async ({
      userId,
      tripId,
      productId,
      productName,
      productUrl,
      category,
    }: {
      userId: string;
      tripId: string;
      productId: string;
      productName: string;
      productUrl: string;
      category: string;
    }) => {
      await supabase.from('product_clicks').insert({
        user_id: userId,
        product_id: productId,
        product_name: productName,
        product_url: productUrl,
      });

      // Also log to console for debugging
      console.log('Product viewed:', {
        productName,
        category,
        tripId,
      });
    },
  });
}

/**
 * Search for outfit sets for a specific trip
 */
export function useTripOutfitSets(
  tripId: string,
  occasion?: string,
  enabled: boolean = false
) {
  const { data: trip } = useTrip(tripId);

  return useQuery({
    queryKey: ['trip-outfit-sets', tripId, occasion],
    queryFn: async () => {
      if (!trip) return [];

      return searchTripOutfitSets({
        destination: trip.destination,
        tripType: trip.trip_type,
        occasion,
      });
    },
    staleTime: 15 * 60 * 1000,
    enabled: enabled && !!trip,
  });
}

/**
 * Get all shopping-related data for a trip in one hook
 */
export function useTripShoppingData(tripId: string) {
  const suggestions = useTripShoppingSuggestions(tripId);
  const { data: trip } = useTrip(tripId);
  const { data: outfits } = useAllTripOutfits(tripId);

  return {
    suggestions: suggestions.data,
    isLoading: suggestions.isLoading,
    error: suggestions.error,
    trip,
    outfits,
    refetch: suggestions.refetch,
  };
}

/**
 * Get AI-powered trip recommendations
 */
export function useTripRecommendations(tripId: string) {
  const { data: trip } = useTrip(tripId);

  return useQuery({
    queryKey: ['trip-recommendations', tripId],
    queryFn: async () => {
      if (!trip) return [];

      return generateTripRecommendations({
        tripId: trip.id,
        destination: trip.destination,
        tripType: trip.trip_type as any,
        startDate: trip.start_date,
        endDate: trip.end_date,
      });
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - AI recommendations don't change often
    enabled: !!trip,
  });
}
