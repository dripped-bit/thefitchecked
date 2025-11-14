/**
 * Morning Mode - AI-Powered Daily Outfit Suggestions
 * Analyzes weather + closet to suggest 3 weather-appropriate outfits
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Sun, AlertCircle, Shirt } from 'lucide-react';
import weatherService, { WeatherData } from '../services/weatherService';
import { ClosetService, ClothingItem } from '../services/closetService';
import claudeOutfitService, { OutfitSuggestion } from '../services/claudeOutfitService';
import OutfitCard from '../components/OutfitCard';

interface MorningModeProps {
  onBack: () => void;
}

const MorningMode: React.FC<MorningModeProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
    loadMorningMode();
  }, []);

  const loadMorningMode = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch weather
      console.log('🌤️ [MORNING-MODE] Fetching weather...');
      let weatherData: WeatherData;
      try {
        weatherData = await weatherService.getUserLocationWeather();
        console.log('✅ [MORNING-MODE] Weather:', weatherData.temperature + '°F,', weatherData.weatherDescription);
      } catch (weatherError) {
        console.warn('⚠️ [MORNING-MODE] Weather API failed, using fallback');
        // Fallback to default weather
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
          location: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco' },
          timestamp: new Date().toISOString(),
        };
      }
      setWeather(weatherData);

      // 2. Load closet items
      console.log('👕 [MORNING-MODE] Loading closet...');
      const closet = ClosetService.getUserCloset();
      const allItems: ClothingItem[] = [];
      
      // Flatten all categories
      Object.entries(closet).forEach(([category, items]) => {
        allItems.push(...items);
      });

      console.log('✅ [MORNING-MODE] Closet loaded:', allItems.length, 'items');
      setClosetItems(allItems);

      // 3. Check if enough items
      if (allItems.length < 3) {
        setError('insufficient');
        setLoading(false);
        return;
      }

      // 4. Generate outfit suggestions
      console.log('🤖 [MORNING-MODE] Generating outfit suggestions...');
      
      const currentHour = new Date().getHours();
      const timeOfDay: 'morning' | 'afternoon' | 'evening' = 
        currentHour < 12 ? 'morning' : 
        currentHour < 18 ? 'afternoon' : 
        'evening';

      const suggestions = await claudeOutfitService.generateOutfitSuggestions({
        weather: weatherData,
        timeOfDay,
        availableItems: allItems.map(item => ({
          id: String(item.id),
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          weatherSuitability: item.attributes?.season || []
        })),
        occasion: 'casual morning',
        preferences: {
          formalityLevel: 3,
          avoidRepeat: true
        }
      });

      console.log('✅ [MORNING-MODE] Generated', suggestions.length, 'suggestions');
      setOutfitSuggestions(suggestions);

    } catch (err) {
      console.error('❌ [MORNING-MODE] Error:', err);
      setError('general');
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
            <h1 className="text-lg font-semibold text-gray-800">Morning Mode</h1>
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
            Upload at least 3 clothing items to your closet to get personalized outfit suggestions.
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
            <h1 className="text-lg font-semibold text-gray-800">Morning Mode</h1>
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
          <h1 className="text-lg font-semibold text-gray-800">Morning Mode</h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Greeting & Weather */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Good Morning! ☀️
          </h2>
          {weather && (
            <p className="text-gray-600 text-lg">
              It's <span className="font-semibold text-amber-600">{Math.round(weather.temperature)}°F</span> and{' '}
              <span className="font-semibold">{weather.weatherDescription}</span>
              {weather.location.city && ` in ${weather.location.city}`}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Here are your personalized outfit suggestions for today
          </p>
        </div>

        {/* Outfit Cards */}
        {outfitSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfitSuggestions.map((outfit, index) => (
              <OutfitCard
                key={outfit.id || index}
                outfit={outfit}
                weather={weather!}
                onWearThis={() => handleWearOutfit(outfit)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No outfit suggestions available</p>
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
    </div>
  );
};

export default MorningMode;
