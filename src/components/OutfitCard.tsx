/**
 * Outfit Card Component
 * Displays a single outfit suggestion with items, weather info, and AI reasoning
 */

import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Sparkles, Heart } from 'lucide-react';
import { OutfitSuggestion } from '../services/claudeOutfitService';
import { WeatherData } from '../services/weatherService';
import haptics from '../utils/haptics';

interface OutfitCardProps {
  outfit: OutfitSuggestion;
  weather: WeatherData;
  onWearThis: () => void;
  onSave?: (outfit: OutfitSuggestion) => void;
  isSaved?: boolean;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, weather, onWearThis, onSave, isSaved = false }) => {
  const [isAnimatingSave, setIsAnimatingSave] = useState(false);

  const handleSave = () => {
    if (onSave) {
      haptics.doubleTap(); // Double tap for "like" feeling
      setIsAnimatingSave(true);
      onSave(outfit);
      
      // Reset animation after 500ms
      setTimeout(() => setIsAnimatingSave(false), 500);
    }
  };

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    const condition = weather.weatherDescription.toLowerCase();
    if (condition.includes('rain')) return <CloudRain className="w-5 h-5" />;
    if (condition.includes('snow')) return <Snowflake className="w-5 h-5" />;
    if (condition.includes('cloud')) return <Cloud className="w-5 h-5" />;
    if (condition.includes('wind')) return <Wind className="w-5 h-5" />;
    return <Sun className="w-5 h-5" />;
  };

  // Get confidence color
  const getConfidenceColor = () => {
    if (outfit.confidence >= 80) return 'text-green-600 bg-green-50';
    if (outfit.confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      {/* Outfit Items Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4 relative">
          {/* Save Button Overlay */}
          {onSave && (
            <button
              onClick={handleSave}
              className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-all active:scale-95"
              style={{
                animation: isAnimatingSave ? 'pulse 0.5s ease-in-out' : 'none'
              }}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isSaved ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
              />
            </button>
          )}
          {outfit.outfitItems.slice(0, 4).map((item, index) => (
            <div key={item.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate">{item.name}</p>
                  <p className="text-white/80 text-[10px] capitalize">{item.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weather Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
            {getWeatherIcon()}
            <span>{Math.round(weather.temperature)}°F</span>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getConfidenceColor()}`}>
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{outfit.confidence}% Match</span>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="mb-4">
          <p className="text-gray-700 text-sm leading-relaxed mb-2">{outfit.reasoning}</p>
          {outfit.styleNotes && outfit.styleNotes.length > 0 && (
            <div className="space-y-1">
              {outfit.styleNotes.map((note, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weather Appropriate Badge */}
        {outfit.weatherAppropriate && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Weather Appropriate</span>
          </div>
        )}

        {/* Wear This Button */}
        <button
          onClick={onWearThis}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
        >
          Wear This Today
        </button>
      </div>
    </div>
  );
};

export default OutfitCard;
