/**
 * Trip Recommendations Service
 * AI-powered fashion recommendations for trips using OpenAI
 * Analyzes destination, weather, style preferences, closet, wishlist, and analytics
 */

import { getChatGPTJSON } from '../lib/openai';
import { supabase } from './supabaseClient';
import authService from './authService';
import stylePreferencesService from './stylePreferencesService';
import closetAnalyticsService from './closetAnalyticsService';
import { searchGoogleShopping } from './serpApiService';

export interface TripRecommendationRequest {
  tripId: string;
  destination: string;
  tripType: 'vacation' | 'business' | 'weekend' | 'event' | 'adventure' | 'multi-destination';
  startDate: string;
  endDate: string;
}

export interface TripRecommendation {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'accessories' | 'outerwear';
  reasoning: string;
  priority: 'essential' | 'recommended' | 'optional';
  imageUrl?: string;
  matchesUserStyle: boolean;
}

interface RecommendationContext {
  trip: TripRecommendationRequest;
  weather: any[];
  stylePrefs: any;
  closetSummary: any;
  wishlistSummary: any;
  analytics: any;
  gender: string;
  measurements: any;
}

/**
 * Generate AI-powered trip recommendations
 */
export async function generateTripRecommendations(
  request: TripRecommendationRequest
): Promise<TripRecommendation[]> {
  try {
    console.log('✨ [TRIP-RECS] Generating AI recommendations for', request.destination);

    // 1. Gather user context
    const user = await authService.getCurrentUser();
    if (!user) {
      console.warn('⚠️ [TRIP-RECS] No user found');
      return [];
    }

    const [stylePrefs, closetItems, wishlist, analytics] = await Promise.all([
      stylePreferencesService.loadStyleProfile(),
      getClosetInventory(user.id),
      getWishlist(user.id),
      closetAnalyticsService.getAnalytics().catch(() => null),
    ]);

    // 2. Get weather forecast (simplified - in production, use real weather API)
    const weather = await getSimplifiedWeather(request.destination, request.startDate);

    // 3. Summarize data for prompt
    const closetSummary = summarizeCloset(closetItems);
    const wishlistSummary = summarizeWishlist(wishlist);

    // 4. Build comprehensive prompt for OpenAI
    const prompt = buildRecommendationPrompt({
      trip: request,
      weather,
      stylePrefs,
      closetSummary,
      wishlistSummary,
      analytics: {
        topColors: analytics?.colors?.slice(0, 5) || [],
        mostWornCategories: analytics?.categories?.slice(0, 3) || [],
        favoriteStyles: stylePrefs?.fashionPersonality?.archetypes || [],
      },
      gender: stylePrefs?.sizes?.gender || 'women',
      measurements: stylePrefs?.sizes || {},
    });

    console.log('🤖 [TRIP-RECS] Calling OpenAI GPT-4...');

    // 5. Call OpenAI GPT-4
    const response = await getChatGPTJSON(prompt, {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
    });

    if (!response || !response.recommendations) {
      console.error('❌ [TRIP-RECS] Invalid OpenAI response:', response);
      return [];
    }

    // 6. Parse recommendations
    const recommendations: TripRecommendation[] = response.recommendations.map((rec: any, index: number) => ({
      id: `rec_${Date.now()}_${index}`,
      name: rec.name || 'Unknown item',
      category: rec.category || 'tops',
      reasoning: rec.reasoning || '',
      priority: rec.priority || 'recommended',
      matchesUserStyle: rec.matchesUserStyle !== false,
    }));

    console.log(`✅ [TRIP-RECS] Generated ${recommendations.length} recommendations`);

    // 7. Fetch product images for top 8 recommendations
    const top8 = recommendations.slice(0, 8);
    await Promise.all(
      top8.map(async (rec) => {
        try {
          const searchQuery = `${rec.name} ${stylePrefs?.sizes?.gender || ''}`;
          const products = await searchGoogleShopping(searchQuery);
          if (products.length > 0) {
            rec.imageUrl = products[0].imageUrl;
          }
        } catch (error) {
          console.warn(`⚠️ [TRIP-RECS] Failed to fetch image for "${rec.name}"`);
        }
      })
    );

    return top8;
  } catch (error) {
    console.error('❌ [TRIP-RECS] Failed to generate recommendations:', error);
    return [];
  }
}

/**
 * Get closet inventory for user
 */
async function getClosetInventory(userId: string) {
  const { data: items } = await supabase
    .from('clothing_items')
    .select('id, name, category, color, price, thumbnail_url')
    .eq('user_id', userId)
    .limit(100);

  return items || [];
}

/**
 * Get wishlist for user
 */
async function getWishlist(userId: string) {
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('id, name, category, store, price')
    .eq('user_id', userId)
    .limit(20);

  return items || [];
}

/**
 * Summarize closet for prompt
 */
function summarizeCloset(items: any[]) {
  const categoryCount: Record<string, number> = {};
  const colorCount: Record<string, number> = {};

  items.forEach((item) => {
    categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    if (item.color) {
      colorCount[item.color] = (colorCount[item.color] || 0) + 1;
    }
  });

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topColors = Object.entries(colorCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalItems: items.length,
    topCategories,
    topColors,
    hasGaps: topCategories.some((cat) => cat.count < 3),
  };
}

/**
 * Summarize wishlist for prompt
 */
function summarizeWishlist(items: any[]) {
  return {
    totalItems: items.length,
    items: items.slice(0, 10).map((item) => ({
      name: item.name,
      category: item.category,
      store: item.store || 'Unknown',
    })),
  };
}

/**
 * Get simplified weather forecast
 * In production, integrate with real weather API (OpenWeatherMap, Weather.com, etc.)
 */
async function getSimplifiedWeather(destination: string, startDate: string) {
  // For now, return seasonal estimates based on month
  const month = new Date(startDate).getMonth();
  
  // Simplified weather logic
  const isWinter = month === 11 || month === 0 || month === 1;
  const isSummer = month >= 5 && month <= 8;
  
  let avgTemp = 65;
  let condition = 'mild';
  
  if (destination.toLowerCase().includes('hawaii') || 
      destination.toLowerCase().includes('miami') ||
      destination.toLowerCase().includes('caribbean')) {
    avgTemp = isSummer ? 85 : 78;
    condition = 'tropical';
  } else if (destination.toLowerCase().includes('new york') ||
             destination.toLowerCase().includes('chicago') ||
             destination.toLowerCase().includes('boston')) {
    avgTemp = isWinter ? 35 : (isSummer ? 80 : 65);
    condition = isWinter ? 'cold' : (isSummer ? 'hot' : 'mild');
  } else if (destination.toLowerCase().includes('los angeles') ||
             destination.toLowerCase().includes('san diego')) {
    avgTemp = isSummer ? 75 : 65;
    condition = 'sunny';
  }

  return [
    { date: startDate, temp: avgTemp, condition },
    { date: startDate, temp: avgTemp + 2, condition },
    { date: startDate, temp: avgTemp - 2, condition },
  ];
}

/**
 * Calculate trip duration in days
 */
function getDuration(trip: TripRecommendationRequest): number {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Build comprehensive AI prompt
 */
function buildRecommendationPrompt(context: RecommendationContext): string {
  const duration = getDuration(context.trip);
  
  return `You are an expert fashion stylist creating personalized packing recommendations for a trip.

## Trip Details
- Destination: ${context.trip.destination}
- Trip Type: ${context.trip.tripType}
- Duration: ${duration} days
- Dates: ${context.trip.startDate} to ${context.trip.endDate}

## Weather Forecast
${context.weather.map((w) => `- ${w.date}: ${w.temp}°F, ${w.condition}`).join('\n')}

## User Style Profile
- Gender: ${context.gender}
- Sizes: Tops ${context.measurements.tops || 'not specified'}, Bottoms ${context.measurements.bottoms || 'not specified'}, Shoes ${context.measurements.shoes || 'not specified'}
- Style Archetypes: ${context.stylePrefs?.fashionPersonality?.archetypes?.join(', ') || 'Not specified'}
- Preferred Colors: ${context.stylePrefs?.fashionPersonality?.colorPalette?.join(', ') || 'All colors'}
- Avoid Colors: ${context.stylePrefs?.fashionPersonality?.avoidColors?.join(', ') || 'None'}
- Preferred Materials: ${context.stylePrefs?.preferences?.materials?.join(', ') || 'Any'}
- Preferred Fits: ${context.stylePrefs?.preferences?.fits?.join(', ') || 'Any'}
- Favorite Stores: ${context.stylePrefs?.shopping?.favoriteStores?.join(', ') || 'Not specified'}

## Current Closet
- Total Items: ${context.closetSummary.totalItems}
- Top Categories: ${context.closetSummary.topCategories.map((c: any) => `${c.name} (${c.count})`).join(', ')}
- Top Colors: ${context.closetSummary.topColors.map((c: any) => `${c.name} (${c.count})`).join(', ')}
- Most Worn Categories: ${context.analytics.mostWornCategories.map((c: any) => c.category).join(', ')}

## Wishlist Insights
${context.wishlistSummary.items.length > 0 ? context.wishlistSummary.items.map((w: any) => `- ${w.name} (${w.category}) - ${w.store}`).join('\n') : '- No wishlist items'}

## Task
Generate 8 clothing or accessory recommendations for this trip that:

1. **Match the destination fashion culture** - Research typical fashion in ${context.trip.destination}
2. **Are weather-appropriate** - Consider ${context.weather[0].temp}°F ${context.weather[0].condition} weather
3. **Align with user's style preferences** - Respect their archetypes, colors, materials, fits
4. **Fill gaps in their closet** - Recommend items they might not have
5. **Match their gender and measurements** - ${context.gender} sizing
6. **Consider their wishlist** - Prioritize items similar to what they're interested in
7. **Are occasion-appropriate** - ${context.trip.tripType} trip activities
8. **Reflect their shopping habits** - Suggest appropriate stores

## Important Guidelines
- For tropical destinations (Hawaii, Caribbean, Miami) in ${context.weather[0].condition} weather: DO NOT recommend outerwear, jackets, or coats
- For warm/hot weather: Focus on breathable fabrics like linen, cotton, light dresses
- For cold weather: Include warm layers, outerwear, boots
- For business trips: Include professional attire
- For adventure trips: Include practical, comfortable clothing
- Match the user's preferred color palette and avoid their disliked colors
- Recommend versatile items that can be mixed and matched

## Output Format
Return a JSON object with "recommendations" array containing exactly 8 items:
{
  "recommendations": [
    {
      "name": "Linen button-up shirt in sage green",
      "category": "tops",
      "reasoning": "Perfect for Hawaii's tropical climate at 80°F. Linen is breathable. Sage green matches your earth tone preferences.",
      "priority": "recommended",
      "matchesUserStyle": true
    }
  ]
}

Categories: tops, bottoms, dresses, shoes, accessories, outerwear
Priorities: essential, recommended, optional

Return ONLY valid JSON, no additional text.`;
}

export default {
  generateTripRecommendations,
};
