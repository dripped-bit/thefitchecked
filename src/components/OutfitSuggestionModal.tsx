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

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) return '☀️';
    if (desc.includes('partly') || desc.includes('mainly')) return '⛅';
    if (desc.includes('overcast') || desc.includes('cloudy')) return '☁️';
    if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
    if (desc.includes('snow') || desc.includes('freezing')) return '❄️';
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
    if (desc.includes('fog')) return '🌫️';
    return '🌤️';
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
    <div className="fixed inset-0 ios-blur bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="ios-card ios-slide-up max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-ios-separator p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="w-6 h-6 text-ios-purple" />
              <h2 className="ios-large-title">AI Outfit Suggestions</h2>
            </div>
            <p className="ios-body text-ios-label-secondary">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {event && ` • ${event.title}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ios-fill rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-ios-label-tertiary" />
          </button>
        </div>

        {/* Weather Context */}
        {weather && (
          <div className="p-6 bg-gradient-to-r from-ios-blue/10 to-ios-purple/10 border-b border-ios-separator">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {getWeatherIcon(weather.weatherDescription)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-ios-label-secondary" />
                    <span className="ios-title-3 font-bold">{weather.temperature}°F</span>
                    <span className="ios-callout text-ios-label-secondary">(feels like {weather.feelsLike}°F)</span>
                  </div>
                  <p className="ios-callout text-ios-label-secondary">{weather.weatherDescription}</p>
                </div>
              </div>
              <div className="text-right ios-caption-1 text-ios-label-secondary">
                <p>💧 {weather.precipitation}" rain</p>
                <p>💨 {weather.windSpeed} mph</p>
                <p>☀️ UV {weather.uvIndex}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="p-12 text-center">
            <Sparkles className="w-12 h-12 text-ios-purple animate-pulse mx-auto mb-4" />
            <h3 className="ios-title-1 mb-2">Generating Outfits...</h3>
            <p className="ios-body text-ios-label-secondary">Claude AI is analyzing your closet, weather, and occasion</p>
          </div>
        )}

        {/* Suggestions */}
        {!isGenerating && suggestions.length > 0 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="ios-title-2">
                {suggestions.length} Outfit{suggestions.length !== 1 ? 's' : ''} for You
              </h3>
              <button
                onClick={handleRegenerate}
                className="flex items-center space-x-2 text-ios-purple hover:text-ios-purple/80 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="ios-callout font-semibold">Regenerate</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`border-2 rounded-ios-xl p-6 transition-all cursor-pointer ${
                    selectedSuggestion === suggestion.id
                      ? 'border-ios-purple bg-ios-purple/10 ring-2 ring-ios-purple/20'
                      : 'border-ios-separator hover:border-ios-purple/50 hover:shadow-ios-md'
                  }`}
                  onClick={() => handleSelectOutfit(suggestion)}
                >
                  {/* Outfit Number & Confidence */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-ios-purple text-white rounded-full flex items-center justify-center font-bold shadow-ios-sm">
                        {index + 1}
                      </div>
                      {selectedSuggestion === suggestion.id && (
                        <Check className="w-5 h-5 text-ios-purple" />
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-ios-yellow fill-current" />
                      <span className="ios-callout font-semibold">{suggestion.confidence}%</span>
                    </div>
                  </div>

                  {/* Outfit Items */}
                  <div className="mb-4">
                    <h4 className="ios-caption-2 font-semibold text-ios-label-tertiary uppercase mb-2">Outfit Items</h4>
                    <div className="space-y-2">
                      {suggestion.outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2"
                        >
                          <Shirt className="w-4 h-4 text-ios-purple flex-shrink-0" />
                          <span className="ios-callout truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-4">
                    <h4 className="ios-caption-2 font-semibold text-ios-label-tertiary uppercase mb-2">Why This Works</h4>
                    <p className="ios-callout text-ios-label-secondary">{suggestion.reasoning}</p>
                  </div>

                  {/* Style Notes */}
                  {suggestion.styleNotes.length > 0 && (
                    <div>
                      <h4 className="ios-caption-2 font-semibold text-ios-label-tertiary uppercase mb-2">Style Tips</h4>
                      <ul className="space-y-1">
                        {suggestion.styleNotes.map((note, idx) => (
                          <li key={idx} className="ios-caption-1 text-ios-label-secondary flex items-start">
                            <span className="w-1 h-1 bg-ios-purple rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
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
                className="ios-button-secondary px-6 py-3"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveOutfit();
                  onClose();
                }}
                disabled={!selectedSuggestion}
                className="ios-button-primary px-6 py-3"
              >
                Save to Weekly Queue
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && suggestions.length === 0 && (
          <div className="p-12 text-center">
            <Shirt className="w-12 h-12 text-ios-label-quaternary mx-auto mb-4" />
            <h3 className="ios-title-2 mb-2">No Suggestions Available</h3>
            <p className="ios-body text-ios-label-secondary mb-4">
              {clothingItems.length === 0
                ? 'Add clothing items to your closet to get AI outfit suggestions'
                : 'Could not generate outfit suggestions. Please try again.'}
            </p>
            {clothingItems.length > 0 && (
              <button
                onClick={handleRegenerate}
                className="ios-button-primary"
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
