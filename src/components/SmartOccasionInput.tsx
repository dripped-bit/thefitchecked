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
  Zap,
  ShoppingBag,
  Shirt,
  Building,
  Umbrella,
  Moon,
  Dumbbell,
  GraduationCap
} from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';

export interface BudgetRange {
  label: string;
  range: string;
  min: number;
  max: number;
}

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
  userTypedInput?: string; // User's custom typed text from input field
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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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

  // Comprehensive categorized occasions
  const occasions = {
    'Formal': [
      { id: 'business-conf', title: 'Business Conference', subtitle: 'Professional networking', icon: <Briefcase className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-blue-600', category: 'Business' },
      { id: 'gala', title: 'Gala Dinner', subtitle: 'Black-tie event', icon: <Heart className="w-5 h-5" />, formality: 'black-tie' as const, color: 'bg-purple-700', category: 'Formal' },
      { id: 'wedding-guest', title: 'Wedding Guest', subtitle: 'Formal ceremony', icon: <Heart className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-pink-500', category: 'Formal' },
      { id: 'award-ceremony', title: 'Award Ceremony', subtitle: 'Cocktail attire', icon: <Sparkles className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-yellow-600', category: 'Formal' },
      { id: 'baby-shower', title: 'Baby Shower', subtitle: 'Celebration event', icon: <Heart className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-pink-400', category: 'Formal' },
      { id: 'charity-event', title: 'Charity Event', subtitle: 'Fundraising gala', icon: <Sparkles className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-rose-600', category: 'Formal' },
      { id: 'engagement-party', title: 'Engagement Party', subtitle: 'Celebration dinner', icon: <Heart className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-fuchsia-500', category: 'Formal' }
    ],
    'Casual': [
      { id: 'brunch', title: 'Sunday Brunch', subtitle: 'Casual meetup', icon: <Coffee className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-orange-500', category: 'Casual' },
      { id: 'coffee-date', title: 'Coffee Date', subtitle: 'Relaxed cafe', icon: <Coffee className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-amber-600', category: 'Casual' },
      { id: 'shopping', title: 'Shopping Trip', subtitle: 'Day out', icon: <ShoppingBag className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-teal-500', category: 'Casual' },
      { id: 'movie-night', title: 'Movie Night', subtitle: 'Cinema outing', icon: <Users className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-indigo-500', category: 'Casual' },
      { id: 'garden-party', title: 'Garden Party', subtitle: 'Outdoor gathering', icon: <Sun className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-green-500', category: 'Casual' },
      { id: 'picnic', title: 'Picnic', subtitle: 'Park outing', icon: <Sun className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-lime-500', category: 'Casual' },
      { id: 'farmers-market', title: 'Farmer\'s Market', subtitle: 'Morning shopping', icon: <ShoppingBag className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-emerald-600', category: 'Casual' }
    ],
    'Beach': [
      { id: 'beach-wedding', title: 'Beach Wedding', subtitle: 'Outdoor ceremony', icon: <Heart className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-cyan-500', category: 'Beach' },
      { id: 'beach-party', title: 'Beach Party', subtitle: 'Seaside celebration', icon: <Sun className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-yellow-400', category: 'Beach' },
      { id: 'resort-dinner', title: 'Resort Dinner', subtitle: 'Tropical evening', icon: <Plane className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-green-500', category: 'Beach' },
      { id: 'pool-party', title: 'Pool Party', subtitle: 'Poolside fun', icon: <Umbrella className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-blue-400', category: 'Beach' },
      { id: 'yacht-party', title: 'Yacht Party', subtitle: 'Luxury cruise', icon: <Plane className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-sky-600', category: 'Beach' },
      { id: 'beach-photoshoot', title: 'Beach Photoshoot', subtitle: 'Seaside photos', icon: <Sun className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-amber-400', category: 'Beach' }
    ],
    'Evening': [
      { id: 'date-night', title: 'Date Night', subtitle: 'Dinner & drinks', icon: <Heart className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-purple-500', category: 'Evening' },
      { id: 'cocktail-party', title: 'Cocktail Party', subtitle: 'Upscale gathering', icon: <Sparkles className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-pink-600', category: 'Evening' },
      { id: 'theater', title: 'Theater Show', subtitle: 'Cultural event', icon: <Users className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-red-600', category: 'Evening' },
      { id: 'night-out', title: 'Night Out', subtitle: 'Club & bars', icon: <Moon className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-violet-600', category: 'Evening' },
      { id: 'opera-ballet', title: 'Opera/Ballet', subtitle: 'Performing arts', icon: <Sparkles className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-indigo-700', category: 'Evening' },
      { id: 'wine-tasting', title: 'Wine Tasting', subtitle: 'Vineyard event', icon: <Coffee className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-purple-600', category: 'Evening' }
    ],
    'Active': [
      { id: 'gym', title: 'Gym Workout', subtitle: 'Fitness session', icon: <Dumbbell className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-red-500', category: 'Active' },
      { id: 'yoga', title: 'Yoga Class', subtitle: 'Wellness activity', icon: <Users className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-green-400', category: 'Active' },
      { id: 'hiking', title: 'Hiking Trip', subtitle: 'Outdoor adventure', icon: <Sun className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-emerald-600', category: 'Active' },
      { id: 'sports', title: 'Sports Event', subtitle: 'Athletic activity', icon: <Zap className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-orange-600', category: 'Active' },
      { id: 'running-event', title: 'Running Event', subtitle: '5K/Marathon', icon: <Dumbbell className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-blue-500', category: 'Active' },
      { id: 'cycling-trip', title: 'Cycling Trip', subtitle: 'Bike adventure', icon: <Zap className="w-5 h-5" />, formality: 'casual' as const, color: 'bg-cyan-600', category: 'Active' }
    ],
    'Business': [
      { id: 'board-meeting', title: 'Board Meeting', subtitle: 'Important presentation', icon: <Briefcase className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-blue-700', category: 'Business' },
      { id: 'job-interview', title: 'Job Interview', subtitle: 'Professional meeting', icon: <Building className="w-5 h-5" />, formality: 'formal' as const, color: 'bg-slate-700', category: 'Business' },
      { id: 'client-lunch', title: 'Client Lunch', subtitle: 'Business meal', icon: <Coffee className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-gray-600', category: 'Business' },
      { id: 'networking', title: 'Networking Event', subtitle: 'Professional mixer', icon: <Users className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-indigo-600', category: 'Business' },
      { id: 'trade-show', title: 'Trade Show', subtitle: 'Industry exhibition', icon: <Building className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-slate-600', category: 'Business' },
      { id: 'corporate-retreat', title: 'Corporate Retreat', subtitle: 'Team building', icon: <Users className="w-5 h-5" />, formality: 'semi-formal' as const, color: 'bg-teal-600', category: 'Business' }
    ]
  };

  // Filter occasions by selected category
  const getFilteredOccasions = (category: string) => {
    if (!category || category === '') {
      return [];
    }
    return occasions[category as keyof typeof occasions] || [];
  };

  // Handle occasion card click - trigger outfit generation immediately
  const handleOccasionClick = (occasion: any) => {
    // Capture user's typed text (if any) before creating suggestion
    const userText = input.trim();

    // Create suggestion object for generation
    const suggestion = {
      ...occasion,
      date: 'This Weekend',
      time: '6:00 PM',
      location: 'TBD',
      weather: {
        temp: 72,
        condition: 'Clear',
        icon: <Sun className="w-4 h-4 text-yellow-500" />
      },
      userTypedInput: userText || undefined // Include user's typed text if present
    };

    console.log('📝 [OCCASION-CLICK] User clicked occasion:', {
      occasion: occasion.title,
      userTypedText: userText || 'none',
      willCombine: !!userText
    });

    // Trigger outfit generation immediately without budget
    handleSuggestionClick(suggestion);
  };

  const generateSmartSuggestions = () => {
    // Initialize with all occasions for backward compatibility
    const allOccasions = Object.values(occasions).flat();
    const formatted = allOccasions.map(occ => ({
      ...occ,
      date: 'This Weekend',
      time: '6:00 PM',
      location: 'TBD',
      weather: {
        temp: 72,
        condition: 'Clear',
        icon: <Sun className="w-4 h-4 text-yellow-500" />
      }
    }));
    setSuggestions(formatted);
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

    // Weather lookup if location is available
    let weather: WeatherData | undefined;
    if (location) {
      try {
        console.log('🌤️ [WEATHER] Fetching real weather for:', location);

        // Parse location into city and optional state
        const locationParts = location.split(',').map(s => s.trim());
        const city = locationParts[0];
        const state = locationParts[1];

        // Fetch real weather from weatherService
        if (state) {
          weather = await weatherService.getWeatherByCity(city, state);
        } else {
          weather = await weatherService.getWeatherByCity(city);
        }

        console.log('✅ [WEATHER] Real weather fetched:', weather);
      } catch (error) {
        console.error('❌ [WEATHER] Failed to fetch weather for location, using current location fallback:', error);
        try {
          // Fallback to current location weather
          weather = await weatherService.getCurrentWeather();
          console.log('✅ [WEATHER] Using current location weather as fallback');
        } catch (fallbackError) {
          console.error('❌ [WEATHER] Current location fallback also failed:', fallbackError);
        }
      }
    } else {
      // No location specified, use current location weather
      try {
        console.log('🌤️ [WEATHER] No location specified, using current location');
        weather = await weatherService.getCurrentWeather();
        console.log('✅ [WEATHER] Current location weather fetched');
      } catch (error) {
        console.error('❌ [WEATHER] Failed to get current location weather:', error);
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
    if (value.length < 100) {
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
            Tell me about the outfit you'd like for your upcoming event
          </p>
        </div>

        {/* Smart Input */}
        <div className="relative">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Describe your occasion in detail... (minimum 150 characters for best results)

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
                input.length < 150 ? 'text-gray-400' : 'text-green-600'
              }`}>
                {input.length}/150 characters
              </span>
              {input.length >= 150 && (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Ready to generate outfits</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown-based Occasion Selector */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            then pick from upcoming events:
          </h3>

          {/* Category Dropdown */}
          <div className="mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full max-w-md px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
            >
              <option value="">Select occasion type</option>
              <option value="Formal">Formal Events</option>
              <option value="Casual">Casual Outings</option>
              <option value="Beach">Beach/Resort</option>
              <option value="Evening">Evening Events</option>
              <option value="Active">Active/Sports</option>
              <option value="Business">Business</option>
            </select>
          </div>

          {/* Vertical Occasion Cards */}
          {selectedCategory && (
            <div className="relative">
              <div className="flex flex-col space-y-4">
                {getFilteredOccasions(selectedCategory).map((occasion) => (
                  <button
                    key={occasion.id}
                    onClick={() => handleOccasionClick(occasion)}
                    className="w-full group bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${occasion.color} rounded-lg flex items-center justify-center text-white`}>
                        {occasion.icon}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>

                    <h4 className="font-medium text-gray-900 mb-1">{occasion.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{occasion.subtitle}</p>

                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        occasion.formality === 'formal' || occasion.formality === 'black-tie'
                          ? 'bg-blue-100 text-blue-700'
                          : occasion.formality === 'semi-formal'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {occasion.formality}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Preview - Moved here for better flow */}
          {parsedOccasion && (
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
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
                        <strong>✓ Ready!</strong> Click "Generate Outfits" below to create perfect outfits for this occasion.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Generate button - Moved here for better flow */}
          {isReadyToGenerate && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleGenerateOutfits}
                disabled={!parsedOccasion}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                <span>Generate Outfits</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartOccasionInput;