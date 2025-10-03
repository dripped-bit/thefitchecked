import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Calendar,
  MapPin,
  Thermometer,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Sparkles,
  ChevronRight,
  Users,
  Briefcase,
  Heart,
  Coffee,
  Plane,
  Zap
} from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';

export interface ParsedOccasion {
  originalInput: string;
  occasion: string;
  formality: 'casual' | 'semi-formal' | 'formal' | 'black-tie';
  date?: string;
  time?: string;
  location?: string;
  weather?: WeatherData;
  confidence: number;
  tags: string[];
}

export interface SmartSuggestion {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  date: string;
  time: string;
  location?: string;
  weather?: {
    temp: number;
    condition: string;
    icon: React.ReactNode;
  };
  formality: 'casual' | 'semi-formal' | 'formal' | 'black-tie';
  color: string;
}

interface SmartOccasionInputProps {
  onOccasionParsed: (occasion: ParsedOccasion) => void;
  onSuggestionSelected: (suggestion: SmartSuggestion) => void;
  className?: string;
}

const SmartOccasionInput: React.FC<SmartOccasionInputProps> = ({
  onOccasionParsed,
  onSuggestionSelected,
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedOccasion, setParsedOccasion] = useState<ParsedOccasion | null>(null);
  const [isReadyToGenerate, setIsReadyToGenerate] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Generate smart suggestions based on upcoming events and common occasions
  useEffect(() => {
    generateSmartSuggestions();
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const generateSmartSuggestions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const mockSuggestions: SmartSuggestion[] = [
      {
        id: 'beach-wedding',
        title: 'Beach Wedding',
        subtitle: 'Outdoor ceremony',
        icon: <Heart className="w-5 h-5" />,
        date: 'Saturday',
        time: '3:00 PM',
        location: 'Malibu, CA',
        weather: {
          temp: 78,
          condition: 'Sunny',
          icon: <Sun className="w-4 h-4 text-yellow-500" />
        },
        formality: 'semi-formal',
        color: 'bg-pink-500'
      },
      {
        id: 'brunch',
        title: 'Sunday Brunch',
        subtitle: 'Casual meetup',
        icon: <Coffee className="w-5 h-5" />,
        date: 'Sunday',
        time: '11:00 AM',
        location: 'Downtown',
        weather: {
          temp: 72,
          condition: 'Partly cloudy',
          icon: <Cloud className="w-4 h-4 text-gray-400" />
        },
        formality: 'casual',
        color: 'bg-orange-500'
      },
      {
        id: 'work-meeting',
        title: 'Board Meeting',
        subtitle: 'Important presentation',
        icon: <Briefcase className="w-5 h-5" />,
        date: 'Monday',
        time: '9:00 AM',
        location: 'Office',
        weather: {
          temp: 65,
          condition: 'Cool',
          icon: <Cloud className="w-4 h-4 text-gray-500" />
        },
        formality: 'formal',
        color: 'bg-blue-600'
      },
      {
        id: 'date-night',
        title: 'Date Night',
        subtitle: 'Dinner & drinks',
        icon: <Heart className="w-5 h-5" />,
        date: 'Friday',
        time: '7:00 PM',
        location: 'City Center',
        weather: {
          temp: 68,
          condition: 'Clear',
          icon: <Sun className="w-4 h-4 text-yellow-500" />
        },
        formality: 'semi-formal',
        color: 'bg-purple-500'
      }
    ];

    setSuggestions(mockSuggestions);
  };

  const parseNaturalLanguage = async (text: string): Promise<ParsedOccasion> => {
    // Simple NLP parsing - could be enhanced with actual NLP service
    const lowerText = text.toLowerCase();

    // Extract occasion type
    let occasion = text;
    let formality: ParsedOccasion['formality'] = 'casual';
    let tags: string[] = [];

    // Formality detection
    if (lowerText.includes('wedding') || lowerText.includes('gala') || lowerText.includes('formal')) {
      formality = 'formal';
      tags.push('formal');
    } else if (lowerText.includes('dinner') || lowerText.includes('date') || lowerText.includes('party')) {
      formality = 'semi-formal';
      tags.push('semi-formal');
    } else if (lowerText.includes('beach') || lowerText.includes('casual') || lowerText.includes('brunch')) {
      formality = 'casual';
      tags.push('casual');
    }

    // Location detection
    let location: string | undefined;
    const locationMatch = text.match(/(?:at|in|near)\s+([A-Za-z\s,]+)/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }

    // Date detection
    let date: string | undefined;
    const datePatterns = [
      /\b(today|tomorrow|tonight)\b/i,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      /\b(\d{1,2}\/\d{1,2}\/?\d{0,4})\b/,
      /\b(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }

    // Time detection
    let time: string | undefined;
    const timeMatch = text.match(/\b(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)\b/);
    if (timeMatch) {
      time = timeMatch[0];
    }

    // Weather lookup if location and date are available
    let weather: WeatherData | undefined;
    if (location && date) {
      try {
        // For demo, we'll use mock weather data
        weather = {
          temperature: 75,
          feelsLike: 78,
          humidity: 60,
          windSpeed: 5,
          weatherCode: 0,
          weatherDescription: 'Clear sky',
          isDay: true,
          precipitation: 0,
          uvIndex: 6,
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            city: location
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.log('Weather lookup failed:', error);
      }
    }

    // Add tags based on content
    if (lowerText.includes('beach')) tags.push('beach', 'outdoor');
    if (lowerText.includes('wedding')) tags.push('wedding', 'celebration');
    if (lowerText.includes('work') || lowerText.includes('office')) tags.push('work', 'professional');
    if (lowerText.includes('date')) tags.push('romantic', 'evening');

    return {
      originalInput: text,
      occasion: occasion,
      formality,
      date,
      time,
      location,
      weather,
      confidence: 0.8, // Mock confidence score
      tags
    };
  };

  const handleInputChange = useCallback((value: string) => {
    setInput(value);

    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reset states when input is too short
    if (value.length < 15) {
      setParsedOccasion(null);
      setIsReadyToGenerate(false);
      setIsLoading(false);
      return;
    }

    // Start loading indicator
    setIsLoading(true);

    // Debounce the parsing (show preview only, don't trigger generation)
    debounceTimer.current = setTimeout(async () => {
      try {
        const parsed = await parseNaturalLanguage(value);
        setParsedOccasion(parsed);
        setIsReadyToGenerate(true);
      } catch (error) {
        console.error('Failed to parse occasion:', error);
        setIsReadyToGenerate(false);
      } finally {
        setIsLoading(false);
      }
    }, 1500); // 1.5 second debounce
  }, []);

  // Handle explicit outfit generation
  const handleGenerateOutfits = () => {
    if (parsedOccasion && isReadyToGenerate) {
      onOccasionParsed(parsedOccasion);
    }
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    setInput(`${suggestion.title} ${suggestion.date} ${suggestion.time}`);
    onSuggestionSelected(suggestion);
  };

  const getWeatherIcon = (temp: number) => {
    if (temp < 40) return <Snowflake className="w-4 h-4 text-blue-300" />;
    if (temp < 60) return <Cloud className="w-4 h-4 text-gray-400" />;
    if (temp < 75) return <CloudRain className="w-4 h-4 text-blue-500" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className={`smart-occasion-input ${className}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What's the occasion?</h2>
          <p className="text-gray-600">
            Tell us about your event and we'll create the perfect outfit instantly
          </p>
        </div>

        {/* Smart Input */}
        <div className="relative">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Describe your occasion in detail... (minimum 15 characters)

Examples:
• Beach wedding this Saturday afternoon for my cousin
• Casual dinner date tomorrow evening at a nice restaurant downtown
• Important work presentation Monday morning to the board of directors
• Birthday party this weekend, outdoor BBQ with friends and family"
              className="w-full p-6 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
              rows={4}
            />
            {isLoading && (
              <div className="absolute right-4 top-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            )}
          </div>

          {/* Character count and status */}
          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${
                input.length < 15 ? 'text-gray-400' :
                input.length < 25 ? 'text-orange-500' : 'text-green-600'
              }`}>
                {input.length}/15 characters
              </span>
              {input.length >= 15 && (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Ready to analyze</span>
                </div>
              )}
            </div>

            {/* Generate button */}
            {isReadyToGenerate && (
              <button
                onClick={handleGenerateOutfits}
                disabled={!parsedOccasion}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                <span>Generate Outfits</span>
              </button>
            )}
          </div>

          {/* Parsed Preview */}
          {parsedOccasion && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-900">Analysis Preview:</h4>
                    {isReadyToGenerate && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Ready to generate!
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-purple-700">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span><strong>{parsedOccasion.occasion}</strong> ({parsedOccasion.formality})</span>
                    </div>
                    {parsedOccasion.date && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{parsedOccasion.date} {parsedOccasion.time && `at ${parsedOccasion.time}`}</span>
                      </div>
                    )}
                    {parsedOccasion.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3" />
                        <span>{parsedOccasion.location}</span>
                        {parsedOccasion.weather && (
                          <span className="flex items-center space-x-1 ml-2">
                            {getWeatherIcon(parsedOccasion.weather.temperature)}
                            <span>{parsedOccasion.weather.temperature}°F</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {parsedOccasion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {parsedOccasion.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {isReadyToGenerate && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">
                        <strong>✓ Ready!</strong> Click "Generate Outfits" above to create perfect outfits for this occasion.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Or pick from upcoming events:
          </h3>

          <div className="flex flex-wrap gap-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex-1 min-w-[280px] group bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${suggestion.color} rounded-lg flex items-center justify-center text-white`}>
                    {suggestion.icon}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>

                <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{suggestion.subtitle}</p>

                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{suggestion.date} {suggestion.time}</span>
                  </div>

                  {suggestion.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{suggestion.location}</span>
                    </div>
                  )}

                  {suggestion.weather && (
                    <div className="flex items-center space-x-1">
                      {suggestion.weather.icon}
                      <span>{suggestion.weather.temp}°F {suggestion.weather.condition}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    suggestion.formality === 'formal' ? 'bg-blue-100 text-blue-700' :
                    suggestion.formality === 'semi-formal' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {suggestion.formality}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartOccasionInput;