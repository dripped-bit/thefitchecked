/**
 * Trip Packing Service
 * Auto-generates packing lists from planned outfits and trip details
 */

import { supabase } from './supabaseClient';
import type { Trip, PackingListItem } from '../hooks/useTrips';
import type { PackingCategory } from '../constants/tripTypes';

interface PackingItemInput {
  trip_id: string;
  item_name: string;
  category: PackingCategory;
  quantity: number;
  is_essential: boolean;
  clothing_item_id?: string;
}

/**
 * Generate essential items based on trip duration and type
 */
export async function generateEssentials(trip: Trip): Promise<PackingItemInput[]> {
  const duration = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const essentials: PackingItemInput[] = [
    // Undergarments
    {
      trip_id: trip.id,
      item_name: 'Underwear',
      category: 'essentials',
      quantity: duration + 2,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Socks',
      category: 'essentials',
      quantity: duration + 2,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Sleepwear',
      category: 'essentials',
      quantity: Math.max(2, Math.ceil(duration / 2)),
      is_essential: true,
    },

    // Toiletries
    {
      trip_id: trip.id,
      item_name: 'Toothbrush & Toothpaste',
      category: 'toiletries',
      quantity: 1,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Shampoo & Conditioner',
      category: 'toiletries',
      quantity: 1,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Deodorant',
      category: 'toiletries',
      quantity: 1,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Sunscreen',
      category: 'toiletries',
      quantity: 1,
      is_essential: true,
    },

    // Documents
    {
      trip_id: trip.id,
      item_name: 'ID / Passport',
      category: 'documents',
      quantity: 1,
      is_essential: true,
    },
    {
      trip_id: trip.id,
      item_name: 'Travel Tickets / Confirmations',
      category: 'documents',
      quantity: 1,
      is_essential: true,
    },

    // Electronics
    {
      trip_id: trip.id,
      item_name: 'Phone Charger',
      category: 'electronics',
      quantity: 1,
      is_essential: true,
    },
  ];

  // Add trip-type specific essentials
  if (trip.trip_type === 'business') {
    essentials.push({
      trip_id: trip.id,
      item_name: 'Laptop & Charger',
      category: 'electronics',
      quantity: 1,
      is_essential: true,
    });
  }

  if (trip.trip_type === 'adventure' || trip.trip_type === 'weekend') {
    essentials.push({
      trip_id: trip.id,
      item_name: 'First Aid Kit',
      category: 'other',
      quantity: 1,
      is_essential: true,
    });
  }

  if (trip.trip_type === 'vacation') {
    essentials.push({
      trip_id: trip.id,
      item_name: 'Camera',
      category: 'electronics',
      quantity: 1,
      is_essential: false,
    });
  }

  return essentials;
}

/**
 * Generate packing list from planned outfits
 */
export async function generatePackingListFromOutfits(tripId: string): Promise<{
  success: boolean;
  itemsAdded: number;
  error?: string;
}> {
  try {
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !trip) {
      return { success: false, itemsAdded: 0, error: 'Trip not found' };
    }

    // Get all activities for this trip
    const { data: activities, error: activitiesError } = await supabase
      .from('trip_activities')
      .select('id')
      .eq('trip_id', tripId);

    if (activitiesError) {
      return { success: false, itemsAdded: 0, error: 'Failed to fetch activities' };
    }

    const activityIds = activities?.map(a => a.id) || [];

    // Get all outfits for these activities
    const { data: outfits, error: outfitsError } = activityIds.length > 0
      ? await supabase
          .from('trip_outfits')
          .select('clothing_item_ids')
          .in('activity_id', activityIds)
      : { data: [], error: null };

    if (outfitsError) {
      return { success: false, itemsAdded: 0, error: 'Failed to fetch outfits' };
    }

    // Collect all unique clothing item IDs
    const clothingItemIds = new Set<string>();
    outfits?.forEach((outfit) => {
      outfit.clothing_item_ids?.forEach((id: string) => clothingItemIds.add(id));
    });

    // Fetch clothing item details
    const clothingItems = clothingItemIds.size > 0
      ? await supabase
          .from('clothing_items')
          .select('id, name, category')
          .in('id', Array.from(clothingItemIds))
      : { data: [], error: null };

    if (clothingItems.error) {
      return { success: false, itemsAdded: 0, error: 'Failed to fetch clothing items' };
    }

    // Check existing packing list items
    const { data: existingItems } = await supabase
      .from('trip_packing_list')
      .select('clothing_item_id')
      .eq('trip_id', tripId);

    const existingClothingIds = new Set(existingItems?.map(item => item.clothing_item_id).filter(Boolean));

    // Prepare packing list items from outfits
    const outfitItems: PackingItemInput[] = (clothingItems.data || [])
      .filter(item => !existingClothingIds.has(item.id))
      .map((item) => ({
        trip_id: tripId,
        item_name: item.name,
        category: mapCategoryToPackingCategory(item.category),
        quantity: 1,
        is_essential: false,
        clothing_item_id: item.id,
      }));

    // Generate essentials
    const essentials = await generateEssentials(trip);

    // Check which essentials already exist
    const existingEssentialNames = new Set(existingItems?.map(item => item.item_name));
    const newEssentials = essentials.filter(item => !existingEssentialNames.has(item.item_name));

    // Combine all items
    const allItems = [...outfitItems, ...newEssentials];

    if (allItems.length === 0) {
      return { success: true, itemsAdded: 0 };
    }

    // Insert into database
    const { error: insertError } = await supabase
      .from('trip_packing_list')
      .insert(allItems);

    if (insertError) {
      console.error('Failed to insert packing items:', insertError);
      return { success: false, itemsAdded: 0, error: 'Failed to save packing list' };
    }

    return { success: true, itemsAdded: allItems.length };
  } catch (error: any) {
    console.error('Error generating packing list:', error);
    return { success: false, itemsAdded: 0, error: error.message };
  }
}

/**
 * Map clothing category to packing category
 */
function mapCategoryToPackingCategory(clothingCategory: string): PackingCategory {
  const categoryMap: Record<string, PackingCategory> = {
    tops: 'clothing',
    bottoms: 'clothing',
    dresses: 'clothing',
    outerwear: 'clothing',
    activewear: 'clothing',
    shoes: 'clothing',
    accessories: 'accessories',
  };

  return categoryMap[clothingCategory.toLowerCase()] || 'clothing';
}

/**
 * Get packing suggestions based on trip details
 */
export function getPackingSuggestions(trip: Trip): string[] {
  const suggestions: string[] = [];
  const duration = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Duration-based suggestions
  if (duration > 7) {
    suggestions.push('Consider laundry options for longer trips');
    suggestions.push('Pack versatile pieces that can be mixed and matched');
  }

  // Trip type suggestions
  if (trip.trip_type === 'business') {
    suggestions.push('Don\'t forget business cards and professional attire');
    suggestions.push('Pack wrinkle-resistant fabrics');
  }

  if (trip.trip_type === 'vacation') {
    suggestions.push('Bring a camera or ensure phone storage for photos');
    suggestions.push('Pack comfortable walking shoes');
  }

  if (trip.trip_type === 'adventure') {
    suggestions.push('Check weather forecast and pack layers');
    suggestions.push('Bring appropriate outdoor gear');
  }

  if (trip.trip_type === 'event' || trip.trip_type === 'multi-destination') {
    suggestions.push('Research dress codes for your events');
    suggestions.push('Pack a versatile outfit for unexpected occasions');
  }

  // General suggestions
  suggestions.push('Roll clothes instead of folding to save space');
  suggestions.push('Keep important items in carry-on luggage');
  suggestions.push('Leave room for souvenirs and purchases');

  return suggestions;
}

export default {
  generateEssentials,
  generatePackingListFromOutfits,
  getPackingSuggestions,
};
