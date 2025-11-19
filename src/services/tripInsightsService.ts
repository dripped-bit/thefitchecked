/**
 * Trip Insights Service
 * Collects and aggregates trip data for AI analysis
 */

import { supabase } from './supabaseClient';
import type { Trip, TripActivity, TripOutfit } from '../hooks/useTrips';
import type { ClothingItem } from '../hooks/useCloset';

// ============================================
// TYPES
// ============================================

export interface TripAnalysisData {
  trip: Trip;
  activities: TripActivity[];
  outfits: TripOutfit[];
  clothingItems: ClothingItem[];
  weatherData: WeatherDataPoint[];
}

export interface WeatherDataPoint {
  date: string;
  temp_low: number;
  temp_high: number;
  condition: string;
  icon: string;
}

export interface AIInsights {
  packingInsights: PackingInsight[];
  missingItems: MissingItemCategory[];
  outfitRecommendations: OutfitRecommendation[];
}

export interface PackingInsight {
  type: 'warning' | 'confirmation' | 'info';
  icon: string;
  message: string;
  details?: string;
}

export interface MissingItemCategory {
  category: string;
  label: string;
  reason: string;
  items: string[];
}

export interface OutfitRecommendation {
  day: number;
  date: string;
  activityTitle: string;
  currentOutfit: string[];
  suggestion: string;
  fashionTip: string;
  suggestedItems?: string[];
}

// ============================================
// DATA COLLECTION
// ============================================

/**
 * Collect all trip data for AI analysis
 */
export async function collectTripData(
  tripId: string,
  userId: string
): Promise<TripAnalysisData> {
  console.log('📊 [INSIGHTS] Collecting trip data for analysis');

  try {
    // 1. Fetch trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();

    if (tripError) throw tripError;
    if (!trip) throw new Error('Trip not found');

    // 2. Fetch all activities
    const { data: activities = [], error: activitiesError } = await supabase
      .from('trip_activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (activitiesError) throw activitiesError;

    // 3. Fetch all outfits
    const activityIds = activities.map(a => a.id);
    let outfits: TripOutfit[] = [];
    
    if (activityIds.length > 0) {
      const { data: outfitsData = [], error: outfitsError } = await supabase
        .from('trip_outfits')
        .select('*')
        .in('activity_id', activityIds);

      if (outfitsError) throw outfitsError;
      outfits = outfitsData;
    }

    // 4. Fetch user's closet items
    const { data: clothingItems = [], error: closetError } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId);

    if (closetError) throw closetError;

    // 5. Fetch weather data (mock for now - can be replaced with real API)
    const weatherData = await fetchWeatherData(trip);

    console.log('✅ [INSIGHTS] Data collected:', {
      activities: activities.length,
      outfits: outfits.length,
      clothingItems: clothingItems.length,
      weatherPoints: weatherData.length,
    });

    return {
      trip,
      activities,
      outfits,
      clothingItems,
      weatherData,
    };
  } catch (error) {
    console.error('❌ [INSIGHTS] Failed to collect trip data:', error);
    throw error;
  }
}

/**
 * Fetch weather data for trip dates
 */
async function fetchWeatherData(trip: Trip): Promise<WeatherDataPoint[]> {
  // For now, return mock data
  // TODO: Integrate with real weather API
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const days = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push({
      date: d.toISOString().split('T')[0],
      temp_low: 70 + Math.floor(Math.random() * 10),
      temp_high: 75 + Math.floor(Math.random() * 10),
      condition: ['Sunny', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 3)],
      icon: '☀️',
    });
  }

  return days;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get outfit description for an activity
 */
export function getOutfitDescription(
  activityId: string,
  outfits: TripOutfit[],
  clothingItems: ClothingItem[]
): string {
  const outfit = outfits.find(o => o.activity_id === activityId);
  
  if (!outfit || !outfit.clothing_item_ids || outfit.clothing_item_ids.length === 0) {
    return 'No outfit planned';
  }

  const items = outfit.clothing_item_ids
    .map(id => clothingItems.find(item => item.id === id))
    .filter(Boolean)
    .map(item => item!.name);

  return items.length > 0 ? items.join(', ') : 'No outfit planned';
}

/**
 * Count items by category
 */
export function countByCategory(items: ClothingItem[], category: string): number {
  return items.filter(item => item.category.toLowerCase() === category.toLowerCase()).length;
}

/**
 * Get day number from date
 */
export function getDayNumber(date: string, startDate: string): number {
  const start = new Date(startDate);
  const current = new Date(date);
  const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

/**
 * Build closet summary
 */
export function buildClosetSummary(items: ClothingItem[]): Record<string, number> {
  const summary: Record<string, number> = {};
  
  items.forEach(item => {
    const category = item.category.toLowerCase();
    summary[category] = (summary[category] || 0) + 1;
  });

  return summary;
}
