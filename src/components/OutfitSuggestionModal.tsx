/**
 * Outfit Suggestion Modal
 * Shows AI-generated outfit suggestions for a specific date/event
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Star,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Cloud,
  Sun,
  Thermometer,
  RefreshCw,
  Check,
  Shirt
} from 'lucide-react';
import claudeOutfitService, { OutfitSuggestion } from '../services/claudeOutfitService';
import smartCalendarService, { CalendarEvent, WeatherData, OutfitItem } from '../services/smartCalendarService';
import { glassModalClasses } from '../styles/glassEffects';

interface OutfitSuggestionModalProps {
  date: Date;
  event?: CalendarEvent;
  clothingItems: OutfitItem[];
  onClose: () => void;
  onSelectOutfit?: (suggestion: OutfitSuggestion) => void;
}

const OutfitSuggestionModal: React.FC<OutfitSuggestionModalProps> = ({
  date,
  event,
  clothingItems,
  onClose,
  onSelectOutfit
}) => {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    loadWeatherAndGenerate();
  }, [date]);

  const loadWeatherAndGenerate = async () => {
    setIsGenerating(true);

    try {
      // Get weather for the date
      const weatherData = await smartCalendarService.getWeatherForecast('auto:ip', date);
      setWeather(weatherData);

      // Determine time of day based on event or date
      const timeOfDay = getTimeOfDay();

      // Get outfit history for context
      const history = JSON.parse(localStorage.getItem('outfitHistory') || '[]')
        .map((entry: any) => ({ ...entry, date: new Date(entry.date) }))
        .slice(0, 10); // Last 10 outfits

      // Generate suggestions
      const outfitSuggestions = await claudeOutfitService.generateOutfitSuggestions({
        event,
        weather: weatherData!,
        timeOfDay,
        availableItems: clothingItems,
        outfitHistory: history,
        occasion: event?.title || 'Daily wear',
        preferences: {
          avoidRepeat: true
        }
      });

      setSuggestions(outfitSuggestions);

    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    if (event) {
      const hour = event.startTime.getHours();
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    }

    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('sun') || condition.includes('clear')) {
      return <Sun className="w-5 h-5 text-yellow-500" />;
    }
    return <Cloud className="w-5 h-5 text-gray-500" />;
  };

  const handleSelectOutfit = (suggestion: OutfitSuggestion) => {
    setSelectedSuggestion(suggestion.id);
  };

  const handleSaveOutfit = () => {
    const selected = suggestions.find(s => s.id === selectedSuggestion);
    if (selected) {
      // Save to weekly outfit queue
      const outfitKey = date.toISOString().split('T')[0];
      const plannedOutfits = JSON.parse(localStorage.getItem('weeklyOutfitQueue') || '{}');
      plannedOutfits[outfitKey] = {
        items: selected.outfitItems,
        confidence: selected.confidence,
        reasoning: selected.reasoning,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('weeklyOutfitQueue', JSON.stringify(plannedOutfits));
      console.log('✅ Outfit saved to weekly queue for', outfitKey);

      if (onSelectOutfit) {
        onSelectOutfit(selected);
      }
    }
  };

  const handleRegenerate = () => {
    loadWeatherAndGenerate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`${glassModalClasses.light} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Outfit Suggestions</h2>
            </div>
            <p className="text-gray-600">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {event && ` • ${event.title}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Weather Context */}
        {weather && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getWeatherIcon(weather.condition)}
                <div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{weather.temperature}°F</span>
                    <span className="text-gray-600">(feels like {weather.feels_like}°F)</span>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{weather.condition.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Precipitation: {weather.precipitationChance}%</p>
                <p>Humidity: {weather.humidity}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Generating Outfits...</h3>
            <p className="text-gray-600">Claude AI is analyzing your closet, weather, and occasion</p>
          </div>
        )}

        {/* Suggestions */}
        {!isGenerating && suggestions.length > 0 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {suggestions.length} Outfit{suggestions.length !== 1 ? 's' : ''} for You
              </h3>
              <button
                onClick={handleRegenerate}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Regenerate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
                    selectedSuggestion === suggestion.id
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectOutfit(suggestion)}
                >
                  {/* Outfit Number & Confidence */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      {selectedSuggestion === suggestion.id && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{suggestion.confidence}%</span>
                    </div>
                  </div>

                  {/* Outfit Items */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Outfit Items</h4>
                    <div className="space-y-2">
                      {suggestion.outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <Shirt className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-gray-800 truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Why This Works</h4>
                    <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
                  </div>

                  {/* Style Notes */}
                  {suggestion.styleNotes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Style Tips</h4>
                      <ul className="space-y-1">
                        {suggestion.styleNotes.map((note, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start">
                            <span className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveOutfit();
                  onClose();
                }}
                disabled={!selectedSuggestion}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save to Weekly Queue
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && suggestions.length === 0 && (
          <div className="p-12 text-center">
            <Shirt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Suggestions Available</h3>
            <p className="text-gray-500 mb-4">
              {clothingItems.length === 0
                ? 'Add clothing items to your closet to get AI outfit suggestions'
                : 'Could not generate outfit suggestions. Please try again.'}
            </p>
            {clothingItems.length > 0 && (
              <button
                onClick={handleRegenerate}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitSuggestionModal;
