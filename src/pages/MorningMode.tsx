/**
 * Weather Picks - AI-Powered Daily Outfit Suggestions
 * Analyzes weather + closet to suggest weather-appropriate outfits
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sun, AlertCircle, Shirt, RefreshCw, Heart, Bookmark } from 'lucide-react';
import weatherService, { WeatherData } from '../services/weatherService';
import { useCloset } from '../hooks/useCloset';
import claudeOutfitService, { OutfitSuggestion } from '../services/claudeOutfitService';
import contextAwareOccasionService, { OccasionContext } from '../services/contextAwareOccasionService';
import OutfitCard from '../components/OutfitCard';
import PullToRefresh from '../components/PullToRefresh';
import SavedWeatherPicksModal from '../components/SavedWeatherPicksModal';
import { useWeatherPicksCache } from '../hooks/useWeatherPicksCache';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import haptics from '../utils/haptics';

interface MorningModeProps {
  onBack: () => void;
}

const MorningMode: React.FC<MorningModeProps> = ({ onBack }) => {
  // Use Supabase closet instead of localStorage
  const { items: supabaseItems, loading: closetLoading } = useCloset();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
  const [closetItems, setClosetItems] = useState<any[]>([]);
  const [occasionContext, setOccasionContext] = useState<OccasionContext | null>(null);
  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set());
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Cache hook
  const { cache, isLoadingCache, hasCache, cacheAge, saveToCache } = useWeatherPicksCache();

  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Helper function for dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 18) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  // Save outfit mutation
  const saveOutfitMutation = useMutation({
    mutationFn: async (outfit: OutfitSuggestion) => {
      if (!userId) throw new Error('Not authenticated');

      // Auto-generate name
      const name = `${Math.round(weather?.temperature || 0)}°F ${occasionContext?.occasion || 'Daily'} • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      const { data, error } = await supabase
        .from('saved_outfits')
        .insert({
          user_id: userId,
          name,
          occasion: occasionContext?.occasion || 'casual_daily',
          weather: weather ? [weather.weatherDescription] : [],
          top_id: outfit.outfitItems.find(i => /top|shirt|blouse/i.test(i.category))?.id,
          bottom_id: outfit.outfitItems.find(i => /bottom|pant|skirt|jean/i.test(i.category))?.id,
          shoes_id: outfit.outfitItems.find(i => /shoe/i.test(i.category))?.id,
          outerwear_id: outfit.outfitItems.find(i => /outer|jacket|coat/i.test(i.category))?.id,
          tags: ['weather_picks'],
          notes: outfit.reasoning
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['savedOutfits'] });
      setSavedOutfitIds(prev => new Set(prev).add(data.id));
      setToastMessage('Outfit saved!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      haptics.success();
    },
    onError: (error) => {
      console.error('Failed to save outfit:', error);
      setToastMessage('Failed to save outfit');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      haptics.error();
    }
  });

  // Load cached suggestions first, then fetch fresh
  useEffect(() => {
    if (!isLoadingCache && hasCache && cache) {
      console.log(`📦 [CACHE] Loading cached suggestions (${cacheAge} min old)`);
      setWeather(cache.weather);
      setOutfitSuggestions(cache.suggestions);
      setOccasionContext(cache.occasionContext);
      setLoading(false);
    }
  }, [isLoadingCache, hasCache, cache, cacheAge]);

  useEffect(() => {
    // Load when closet is ready
    if (!closetLoading) {
      if (supabaseItems.length > 0) {
        loadMorningMode();
      } else {
        // No items in closet
        setError('insufficient');
        setLoading(false);
      }
    }
  }, [closetLoading, supabaseItems]);

  const loadMorningMode = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch weather
      console.log('🌤️ [MORNING-MODE] Fetching weather...');
      let weatherData: WeatherData;
      try {
        // Use getUserSavedLocation which checks profile first, then geolocation
        weatherData = await weatherService.getUserSavedLocation();
        console.log('✅ [MORNING-MODE] Weather:', weatherData.temperature + '°F,', weatherData.weatherDescription);
        console.log('📍 [MORNING-MODE] Location:', weatherData.location.city || 'Unknown');
      } catch (weatherError) {
        console.error('❌ [MORNING-MODE] Weather fetch failed:', weatherError);
        console.warn('⚠️ [MORNING-MODE] Using fallback weather');
        // Fallback weather (make it obvious it's fallback)
        weatherData = {
          temperature: 70,
          feelsLike: 70,
          humidity: 50,
          windSpeed: 5,
          weatherCode: 0,
          weatherDescription: 'Clear',
          isDay: true,
          precipitation: 0,
          uvIndex: 5,
          location: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco (Fallback)' },
          timestamp: new Date().toISOString(),
        };
      }
      setWeather(weatherData);

      // 2. Load closet items from Supabase
      console.log('👕 [MORNING-MODE] Loading closet from Supabase...');
      const allItems = supabaseItems;
      console.log('✅ [MORNING-MODE] Closet loaded:', allItems.length, 'items');
      setClosetItems(allItems);

      // 3. Check if enough items (minimum 2: 1 top + 1 bottom)
      if (allItems.length < 2) {
        setError('insufficient');
        setLoading(false);
        return;
      }

      // 4. Determine smart occasion based on context
      console.log('🎯 [MORNING-MODE] Determining context-aware occasion...');
      const occasionCtx = await contextAwareOccasionService.determineOccasion();
      console.log('✅ [MORNING-MODE] Smart occasion determined:', occasionCtx);
      setOccasionContext(occasionCtx);

      // 5. Generate outfit suggestions
      console.log('🤖 [MORNING-MODE] Generating outfit suggestions...');
      
      const currentHour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' = 
        currentHour < 12 ? 'morning' : 
        currentHour < 18 ? 'afternoon' : 
        'evening';

      // Map Supabase items to Claude format (snake_case to camelCase)
      const availableItems = allItems.map(item => ({
        id: String(item.id),
        name: item.name,
        imageUrl: item.image_url, // ✅ Map snake_case to camelCase
        category: item.category,
        weatherSuitability: item.seasons || []
      }));

      const suggestions = await claudeOutfitService.generateOutfitSuggestions({
        weather: weatherData,
        timeOfDay,
        availableItems,
        occasion: occasionCtx.occasion,
        preferences: {
          formalityLevel: occasionCtx.formalityLevel,
          avoidRepeat: true
        }
      });

      console.log('✅ [MORNING-MODE] Generated', suggestions.length, 'suggestions');
      
      // Log if fewer than 3 (this is OK)
      if (suggestions.length < 3) {
        console.log('ℹ️ [MORNING-MODE] Generated fewer than 3 outfits (this is OK)');
      }
      
      // This should never happen with good fallback logic
      if (suggestions.length === 0) {
        console.error('⚠️ [MORNING-MODE] AI returned 0 suggestions - this should not happen');
        console.log('📊 [MORNING-MODE] Item breakdown:', {
          total: allItems.length,
          tops: allItems.filter(i => /top|shirt/i.test(i.category)).length,
          bottoms: allItems.filter(i => /bottom|pant/i.test(i.category)).length,
          dresses: allItems.filter(i => /dress/i.test(i.category)).length
        });
      }
      
      setOutfitSuggestions(suggestions);

      // Save to cache
      saveToCache(weatherData, suggestions, occasionCtx);

      // Success haptic
      haptics.success();

    } catch (err) {
      console.error('❌ [MORNING-MODE] Error:', err);
      setError('general');
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleWearOutfit = (outfit: OutfitSuggestion) => {
    console.log('👔 [MORNING-MODE] User selected outfit:', outfit.id);
    // TODO: Save to calendar or outfit history
    alert(`Great choice! Outfit saved for today.`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-400 flex flex-col items-center justify-center z-50">
        <div className="animate-spin" style={{ animationDuration: '2s' }}>
          <Sun className="w-32 h-32 text-white drop-shadow-lg" />
        </div>
        <p className="text-white text-2xl font-semibold mt-6 animate-pulse">
          Finding your perfect outfits...
        </p>
        <p className="text-white/80 text-sm mt-2">
          Analyzing weather & your closet
        </p>
      </div>
    );
  }

  // Error States
  if (error === 'insufficient') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-amber-600 hover:text-amber-700"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-base font-medium">StyleHub</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Weather Picks</h1>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <Shirt className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            Not Enough Clothes Yet
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            Upload at least 2 clothing items (1 top + 1 bottom) to your closet to get outfit suggestions.
          </p>
          <div className="space-y-3 w-full max-w-sm">
            <button
              onClick={onBack}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-md"
            >
              Go to Closet
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Back to StyleHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'general') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-amber-600 hover:text-amber-700"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-base font-medium">StyleHub</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Weather Picks</h1>
            <div className="w-20"></div>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            We couldn't generate outfit suggestions. Please try again.
          </p>
          <div className="space-y-3 w-full max-w-sm">
            <button
              onClick={loadMorningMode}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-md"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Back to StyleHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Show Outfits
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-amber-600 hover:text-amber-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-base font-medium">StyleHub</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Weather Picks</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Content with Pull-to-Refresh */}
      <PullToRefresh
        onRefresh={async () => {
          await loadMorningMode();
        }}
        disabled={loading}
      >
        <div className="px-4 py-6">
          {/* Greeting & Weather */}
          <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}
          </h2>
          {weather && (
            <p className="text-gray-600 text-lg">
              It's <span className="font-semibold text-amber-600">{Math.round(weather.temperature)}°F</span> and{' '}
              <span className="font-semibold">{weather.weatherDescription}</span>
              {weather.location.city && ` in ${weather.location.city}`}
            </p>
          )}
        </div>

        {/* Context Banner - Show why these suggestions */}
        {occasionContext && (
          <div className="mb-6 p-4 bg-white/80 backdrop-blur rounded-xl border border-amber-200 shadow-sm">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-amber-600">
                {contextAwareOccasionService.getOccasionDisplayText(occasionContext.occasion)}
              </span>
              {' '}suggestions for{' '}
              <span className="font-semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              {' '}
              {occasionContext.occasion !== 'casual_daily' && (
                <>
                  {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
                </>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {occasionContext.reasoning}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex justify-center gap-3">
          {/* Saved Outfits Button */}
          {userId && (
            <button
              onClick={() => {
                haptics.light();
                setShowSavedModal(true);
              }}
              className="px-6 py-3 bg-white border-2 border-amber-400 text-amber-600 font-semibold rounded-full shadow-lg hover:bg-amber-50 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => {
              console.log('🔄 [MORNING-MODE] Refresh button clicked');
              haptics.medium(); // Haptic feedback on refresh
              loadMorningMode();
            }}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-full shadow-lg hover:from-amber-500 hover:to-orange-600 transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ minWidth: '200px' }}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh Ideas'}</span>
          </button>
        </div>

        {/* Cache Indicator */}
        {hasCache && cacheAge !== null && cacheAge < 60 && (
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-500">
              💾 Showing cached suggestions ({cacheAge} min old)
            </p>
          </div>
        )}

        {/* Outfit Cards */}
        {outfitSuggestions.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfitSuggestions.map((outfit, index) => (
                <OutfitCard
                  key={outfit.id || index}
                  outfit={outfit}
                  weather={weather!}
                  onWearThis={() => handleWearOutfit(outfit)}
                  onSave={(outfit) => saveOutfitMutation.mutate(outfit)}
                  isSaved={savedOutfitIds.has(outfit.id)}
                />
              ))}
            </div>
            
            {/* Encourage adding more items if fewer than 3 outfits */}
            {outfitSuggestions.length < 3 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  💡 Add more items to your closet for more outfit options!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Unable to generate outfits</p>
            <p className="text-xs text-gray-400 mt-2">
              Please make sure your closet has tops and bottoms
            </p>
            <button
              onClick={loadMorningMode}
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

          {/* Closet Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Based on {closetItems.length} items in your closet
            </p>
          </div>
        </div>
      </PullToRefresh>

      {/* Saved Weather Picks Modal */}
      {userId && (
        <SavedWeatherPicksModal
          isOpen={showSavedModal}
          onClose={() => setShowSavedModal(false)}
          userId={userId}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MorningMode;
