import React, { useState } from 'react';
import { Sparkles, Settings } from 'lucide-react';

interface SmartClothingGeneratorProps {
  avatarImage?: string | File;
  onTryOnComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onAdvanced?: () => void;
  avatarData?: any;
  className?: string;
}

interface GenerationSettings {
  style: 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy';
  occasion: 'work' | 'weekend' | 'date' | 'party' | 'sport' | 'travel';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  weatherTemp: number;
  personalizedSuggestions: boolean;
}

const SmartClothingGenerator: React.FC<SmartClothingGeneratorProps> = ({
  avatarImage,
  onTryOnComplete,
  onError,
  onAdvanced,
  avatarData,
  className = ''
}) => {
  const [settings, setSettings] = useState<GenerationSettings>({
    style: 'casual',
    occasion: 'weekend',
    season: 'spring',
    weatherTemp: 70,
    personalizedSuggestions: true
  });

  // Style options
  const styleOptions = [
    { id: 'casual', name: 'Casual', description: 'Relaxed everyday wear', emoji: '👕' },
    { id: 'formal', name: 'Formal', description: 'Professional business attire', emoji: '👔' },
    { id: 'trendy', name: 'Trendy', description: 'Latest fashion trends', emoji: '✨' },
    { id: 'vintage', name: 'Vintage', description: 'Classic retro styles', emoji: '🕰️' },
    { id: 'minimalist', name: 'Minimalist', description: 'Clean simple designs', emoji: '⚪' },
    { id: 'edgy', name: 'Edgy', description: 'Bold statement pieces', emoji: '🔥' }
  ];

  const occasionOptions = [
    { id: 'work', name: 'Work', description: 'Office & meetings', emoji: '💼' },
    { id: 'weekend', name: 'Weekend', description: 'Casual outings', emoji: '🌟' },
    { id: 'date', name: 'Date Night', description: 'Romantic dinner', emoji: '💕' },
    { id: 'party', name: 'Party', description: 'Social events', emoji: '🎉' },
    { id: 'sport', name: 'Active', description: 'Exercise & sports', emoji: '🏃' },
    { id: 'travel', name: 'Travel', description: 'Vacation & trips', emoji: '✈️' }
  ];

  const seasonOptions = [
    { id: 'spring', name: 'Spring', emoji: '🌸', temp: [50, 70] },
    { id: 'summer', name: 'Summer', emoji: '☀️', temp: [70, 90] },
    { id: 'fall', name: 'Fall', emoji: '🍂', temp: [45, 65] },
    { id: 'winter', name: 'Winter', emoji: '❄️', temp: [20, 45] }
  ];


  const renderPreferencesStep = () => (
    <div className="preferences-step space-y-8">
      <div className="text-center">
        <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Preferences</h2>
        <p className="text-gray-600">Set your style preferences to get personalized outfit recommendations</p>
      </div>

      {/* Style Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Style Preference</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {styleOptions.map((style) => (
            <button
              key={style.id}
              onClick={() => setSettings(prev => ({ ...prev, style: style.id as any }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.style === style.id
                  ? 'border-purple-500 bg-purple-50 text-purple-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{style.emoji}</div>
              <div className="font-medium">{style.name}</div>
              <div className="text-sm text-gray-600">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Occasion Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Occasion</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {occasionOptions.map((occasion) => (
            <button
              key={occasion.id}
              onClick={() => setSettings(prev => ({ ...prev, occasion: occasion.id as any }))}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.occasion === occasion.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{occasion.emoji}</div>
              <div className="font-medium">{occasion.name}</div>
              <div className="text-sm text-gray-600">{occasion.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Season & Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Season</h3>
          <div className="grid grid-cols-2 gap-3">
            {seasonOptions.map((season) => (
              <button
                key={season.id}
                onClick={() => setSettings(prev => ({ ...prev, season: season.id as any }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.season === season.id
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-xl mb-1">{season.emoji}</div>
                <div className="font-medium text-sm">{season.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Temperature</h3>
          <div className="space-y-3">
            <input
              type="range"
              min="20"
              max="100"
              value={settings.weatherTemp}
              onChange={(e) => setSettings(prev => ({ ...prev, weatherTemp: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900">{settings.weatherTemp}°F</span>
              <div className="text-sm text-gray-600">
                {settings.weatherTemp < 40 ? '🥶 Very Cold' :
                 settings.weatherTemp < 60 ? '🧥 Cool' :
                 settings.weatherTemp < 75 ? '👔 Comfortable' :
                 settings.weatherTemp < 85 ? '☀️ Warm' : '🔥 Hot'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personalization</h3>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={settings.personalizedSuggestions}
            onChange={(e) => setSettings(prev => ({ ...prev, personalizedSuggestions: e.target.checked }))}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-gray-700">Use my measurements and style profile for personalized suggestions</span>
        </label>
      </div>

      {/* Advanced Options Only */}
      <div className="text-center space-y-4">
        {onAdvanced && (
          <div className="border-t pt-4 mt-6">
            <p className="text-gray-500 text-sm mb-3">Need even more options?</p>
            <button
              onClick={onAdvanced}
              className="px-6 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Advanced Outfit Search
            </button>
          </div>
        )}
      </div>
    </div>
  );


  return (
    <div className={`smart-clothing-generator ${className}`}>
      <div className="max-w-4xl mx-auto">
        {renderPreferencesStep()}
      </div>
    </div>
  );
};

export default SmartClothingGenerator;