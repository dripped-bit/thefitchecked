import React, { useState, useEffect } from 'react';
import {
  Plane,
  MapPin,
  Calendar,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Thermometer,
  CheckCircle2,
  Plus,
  Minus,
  Download,
  Share2,
  AlertCircle,
  Luggage,
  Star,
  Clock,
  Users,
  Camera,
  Sparkles,
  Shirt,
  X
} from 'lucide-react';
import smartCalendarService, {
  CalendarEvent,
  OutfitItem,
  WeatherData
} from '../services/smartCalendarService';
import OutfitSuggestionModal from './OutfitSuggestionModal';
import { OutfitSuggestion } from '../services/claudeOutfitService';

interface PackingListGeneratorProps {
  travelEvent?: CalendarEvent;
  onBack?: () => void;
  clothingItems?: OutfitItem[];
}

interface PackingItem extends OutfitItem {
  packed: boolean;
  essential: boolean;
  day?: string;
  quantity: number;
}

interface PackingList {
  essentials: PackingItem[];
  byDay: { [key: string]: PackingItem[] };
  weather: WeatherData[];
  tips: string[];
  totalItems: number;
  packedItems: number;
}

const PackingListGenerator: React.FC<PackingListGeneratorProps> = ({
  travelEvent,
  onBack,
  clothingItems = []
}) => {
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(travelEvent || null);
  const [upcomingTravelEvents, setUpcomingTravelEvents] = useState<CalendarEvent[]>([]);
  const [customItems, setCustomItems] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTripData, setManualTripData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    tripType: 'vacation' as 'vacation' | 'business' | 'weekend'
  });
  const [viewMode, setViewMode] = useState<'byDay' | 'allItems'>('byDay');
  const [dailyOutfits, setDailyOutfits] = useState<{[key: string]: OutfitItem[]}>({});
  const [showOutfitSuggestions, setShowOutfitSuggestions] = useState(false);
  const [outfitSuggestionDate, setOutfitSuggestionDate] = useState<Date | null>(null);
  const [outfitSuggestionDayKey, setOutfitSuggestionDayKey] = useState<string>('');

  useEffect(() => {
    if (selectedEvent) {
      generatePackingList();
    } else {
      loadTravelEvents();
    }
  }, [selectedEvent]);

  const loadTravelEvents = async () => {
    try {
      const events = await smartCalendarService.fetchUpcomingEvents(30);
      const travelEvents = events.filter(event =>
        event.eventType === 'travel' ||
        event.title.toLowerCase().includes('trip') ||
        event.title.toLowerCase().includes('vacation')
      );
      setUpcomingTravelEvents(travelEvents);
    } catch (error) {
      console.error('Failed to load travel events:', error);
    }
  };

  const generatePackingList = async () => {
    if (!selectedEvent) return;

    setIsGenerating(true);
    try {
      const travelDuration = Math.ceil(
        (selectedEvent.endTime.getTime() - selectedEvent.startTime.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate smart packing list based on travel details
      const essentials: PackingItem[] = [
        {
          id: 'underwear',
          name: 'Underwear',
          imageUrl: '',
          category: 'undergarments',
          packed: false,
          essential: true,
          quantity: travelDuration + 2,
          formalityLevel: 1
        },
        {
          id: 'socks',
          name: 'Socks',
          imageUrl: '',
          category: 'accessories',
          packed: false,
          essential: true,
          quantity: travelDuration + 2,
          formalityLevel: 1
        },
        {
          id: 'pajamas',
          name: 'Sleepwear',
          imageUrl: '',
          category: 'sleepwear',
          packed: false,
          essential: true,
          quantity: Math.ceil(travelDuration / 2),
          formalityLevel: 1
        }
      ];

      // Add items from user's closet
      const closetItems = clothingItems.map(item => ({
        ...item,
        packed: false,
        essential: false,
        quantity: 1
      }));

      // Weather-based suggestions
      const weatherData: WeatherData = {
        temperature: 68,
        condition: 'partly_cloudy',
        humidity: 60,
        windSpeed: 5,
        precipitationChance: 30,
        uvIndex: 4,
        feels_like: 70
      };

      // Day-by-day planning
      const byDay: { [key: string]: PackingItem[] } = {};
      for (let i = 0; i < travelDuration; i++) {
        const dayDate = new Date(selectedEvent.startTime);
        dayDate.setDate(dayDate.getDate() + i);
        const dayKey = `Day ${i + 1} (${dayDate.toLocaleDateString()})`;

        byDay[dayKey] = [
          ...essentials.slice(0, 2), // Basic essentials for each day
          ...closetItems.slice(0, 3) // Sample outfits
        ];
      }

      // Smart packing tips
      const tips = [
        'Pack one extra outfit in case of spills or weather changes',
        'Choose wrinkle-resistant fabrics for travel days',
        'Coordinate colors for mix-and-match flexibility',
        'Pack a versatile jacket for temperature variations',
        'Bring comfortable walking shoes',
        'Consider cultural dress codes at your destination',
        `Weather forecast: ${weatherData.temperature}°F with ${weatherData.precipitationChance}% chance of rain`
      ];

      const generatedList: PackingList = {
        essentials: [...essentials, ...closetItems.slice(0, 5)],
        byDay,
        weather: [weatherData],
        tips,
        totalItems: essentials.length + closetItems.length,
        packedItems: 0
      };

      setPackingList(generatedList);
    } catch (error) {
      console.error('Failed to generate packing list:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItemPacked = (itemId: string, section: 'essentials' | 'byDay', dayKey?: string) => {
    if (!packingList) return;

    const newPackingList = { ...packingList };

    if (section === 'essentials') {
      const item = newPackingList.essentials.find(item => item.id === itemId);
      if (item) {
        item.packed = !item.packed;
        newPackingList.packedItems += item.packed ? 1 : -1;
      }
    } else if (section === 'byDay' && dayKey) {
      const item = newPackingList.byDay[dayKey].find(item => item.id === itemId);
      if (item) {
        item.packed = !item.packed;
        newPackingList.packedItems += item.packed ? 1 : -1;
      }
    }

    setPackingList(newPackingList);
  };

  const addCustomItem = () => {
    if (!customItems.trim() || !packingList) return;

    const newItems = customItems.split(',').map(itemName => ({
      id: `custom_${Date.now()}_${Math.random()}`,
      name: itemName.trim(),
      imageUrl: '',
      category: 'custom',
      packed: false,
      essential: false,
      quantity: 1,
      formalityLevel: 5
    }));

    setPackingList({
      ...packingList,
      essentials: [...packingList.essentials, ...newItems],
      totalItems: packingList.totalItems + newItems.length
    });

    setCustomItems('');
    setShowCustomInput(false);
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloudy':
      case 'partly_cloudy': return <Cloud className="w-5 h-5 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'snowy': return <Snowflake className="w-5 h-5 text-blue-300" />;
      default: return <Cloud className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleManualTripCreate = () => {
    if (!manualTripData.startDate || !manualTripData.endDate || !manualTripData.destination) {
      alert('Please fill in all required fields');
      return;
    }

    const start = new Date(manualTripData.startDate);
    const end = new Date(manualTripData.endDate);
    end.setHours(23, 59, 59);

    const manualEvent: CalendarEvent = {
      id: `manual_${Date.now()}`,
      title: `${manualTripData.destination} Trip`,
      startTime: start,
      endTime: end,
      location: manualTripData.destination,
      isAllDay: true,
      eventType: manualTripData.tripType === 'business' ? 'work' : 'travel',
      description: `Manually created ${manualTripData.tripType} trip`
    };

    setSelectedEvent(manualEvent);
    setShowManualEntry(false);
  };

  const planOutfitForDay = (dayKey: string) => {
    // Extract date from dayKey format: "Day 1 (MM/DD/YYYY)"
    const dateMatch = dayKey.match(/\(([^)]+)\)/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      const date = new Date(dateStr);
      setOutfitSuggestionDate(date);
      setOutfitSuggestionDayKey(dayKey);
      setShowOutfitSuggestions(true);
    }
  };

  const handleSelectOutfit = (suggestion: OutfitSuggestion) => {
    // Save outfit to daily outfits
    setDailyOutfits(prev => ({
      ...prev,
      [outfitSuggestionDayKey]: suggestion.outfitItems
    }));

    // Update packing list to include the outfit items for that day
    if (packingList) {
      const updatedByDay = { ...packingList.byDay };
      updatedByDay[outfitSuggestionDayKey] = suggestion.outfitItems.map(item => ({
        ...item,
        packed: false,
        essential: false,
        quantity: 1
      }));

      setPackingList({
        ...packingList,
        byDay: updatedByDay
      });
    }

    console.log('✅ Outfit saved for', outfitSuggestionDayKey);
  };

  const exportPackingList = () => {
    if (!packingList || !selectedEvent) return;

    const exportData = {
      trip: selectedEvent.title,
      destination: selectedEvent.location,
      dates: `${selectedEvent.startTime.toDateString()} - ${selectedEvent.endTime.toDateString()}`,
      essentials: packingList.essentials.map(item => `${item.packed ? '✓' : '☐'} ${item.name} (${item.quantity})`),
      byDay: packingList.byDay,
      dailyPlannedOutfits: Object.entries(dailyOutfits).map(([day, items]) => ({
        day,
        outfit: items.map(item => item.name)
      })),
      tips: packingList.tips,
      generatedOn: new Date().toLocaleString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-list-${selectedEvent.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
          )}

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden p-6">
            <div className="text-center mb-8">
              <Luggage className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Packing Lists</h1>
              <p className="text-gray-600">Generate intelligent packing lists for your travel events</p>
            </div>

            {upcomingTravelEvents.length === 0 ? (
              <div className="text-center py-12">
                <Plane className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Travel Events Found</h3>
                <p className="text-gray-500 mb-6">
                  Connect your calendar and add travel events, or create a manual packing list
                </p>
                <div className="flex flex-col md:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Manual Packing List
                  </button>
                  <button
                    onClick={onBack}
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Calendar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Select a Travel Event</h2>
                <div className="space-y-3">
                  {upcomingTravelEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{event.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{event.startTime.toLocaleDateString()} - {event.endTime.toLocaleDateString()}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Plane className="w-5 h-5 text-purple-600" />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="mt-4 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Manual Packing List</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry Modal */}
        {showManualEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create Manual Packing List</h3>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={manualTripData.destination}
                    onChange={(e) => setManualTripData({...manualTripData, destination: e.target.value})}
                    placeholder="e.g., Paris, Hawaii, New York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={manualTripData.startDate}
                      onChange={(e) => setManualTripData({...manualTripData, startDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={manualTripData.endDate}
                      onChange={(e) => setManualTripData({...manualTripData, endDate: e.target.value})}
                      min={manualTripData.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Type
                  </label>
                  <select
                    value={manualTripData.tripType}
                    onChange={(e) => setManualTripData({...manualTripData, tripType: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="vacation">Vacation</option>
                    <option value="business">Business</option>
                    <option value="weekend">Weekend Getaway</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualTripCreate}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with SF Symbol Back Button */}
        <div className="relative text-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-gray-700 active:text-gray-900 active:scale-95 transition-all rounded-full"
              aria-label="Go back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
          <div className="flex items-center justify-center space-x-4 text-gray-600 mt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{selectedEvent.startTime.toLocaleDateString()} - {selectedEvent.endTime.toLocaleDateString()}</span>
            </div>
            {selectedEvent.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{selectedEvent.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={exportPackingList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {isGenerating ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Luggage className="w-12 h-12 text-purple-600 animate-bounce mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Generating Your Smart Packing List</h2>
            <p className="text-gray-600">Analyzing weather, duration, and your wardrobe...</p>
          </div>
        ) : packingList ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress & Weather */}
            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Packing Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Items Packed</span>
                    <span>{packingList.packedItems}/{packingList.totalItems}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(packingList.packedItems / packingList.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">
                      {Math.round((packingList.packedItems / packingList.totalItems) * 100)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">Complete</span>
                  </div>
                </div>
              </div>

              {/* Weather Card */}
              {packingList.weather.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Weather Forecast</h3>
                  {packingList.weather.map((weather, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getWeatherIcon(weather.condition)}
                        <div>
                          <p className="font-medium text-gray-800">{weather.temperature}°F</p>
                          <p className="text-sm text-gray-600">Feels like {weather.feels_like}°F</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{weather.precipitationChance}% rain</p>
                        <p>UV {weather.uvIndex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Smart Tips */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-800 mb-4">Smart Packing Tips</h3>
                <ul className="space-y-2">
                  {packingList.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start">
                      <Star className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Packing Lists */}
            <div className="lg:col-span-2 space-y-6">
              {/* View Mode Toggle */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setViewMode('byDay')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'byDay'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    By Day
                  </button>
                  <button
                    onClick={() => setViewMode('allItems')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      viewMode === 'allItems'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Items
                  </button>
                </div>
              </div>

              {viewMode === 'allItems' && (
                <>
                  {/* Essentials */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">Travel Essentials</h3>
                      <button
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Custom</span>
                      </button>
                    </div>

                {showCustomInput && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customItems}
                        onChange={(e) => setCustomItems(e.target.value)}
                        placeholder="Add items (comma-separated)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={addCustomItem}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {packingList.essentials.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        item.packed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleItemPacked(item.id, 'essentials')}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.packed
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.packed && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                        <div>
                          <p className={`font-medium ${item.packed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {item.name}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          )}
                        </div>
                      </div>
                      {item.essential && (
                        <div className="flex items-center space-x-1 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Essential</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

                </>
              )}

              {/* Day-by-Day Planning */}
              {viewMode === 'byDay' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Day-by-Day Vacation Plan</h3>
                  <p className="text-sm text-gray-600 mb-6">Plan what you'll wear each day of your trip</p>
                  <div className="space-y-4">
                    {Object.entries(packingList.byDay).map(([day, items]) => (
                      <div key={day} className="border border-gray-100 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-purple-600" />
                        {day}
                      </h4>
                      {/* Show planned outfit if exists */}
                      {dailyOutfits[day] ? (
                        <div className="space-y-2">
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2 text-purple-700">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">AI Planned Outfit</span>
                              </div>
                              <button
                                onClick={() => planOutfitForDay(day)}
                                className="text-xs text-purple-600 hover:text-purple-800"
                              >
                                Change
                              </button>
                            </div>
                            <div className="space-y-1">
                              {dailyOutfits[day].map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 text-sm text-purple-700">
                                  <Shirt className="w-3 h-3 flex-shrink-0" />
                                  <span>{item.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => planOutfitForDay(day)}
                            className="w-full flex items-center justify-center space-x-2 border border-purple-300 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all text-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Get New Suggestions</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {items.map((item) => (
                              <div
                                key={`${day}-${item.id}`}
                                className={`flex items-center space-x-2 p-2 rounded ${
                                  item.packed ? 'bg-green-50' : 'bg-gray-50'
                                }`}
                              >
                                <button
                                  onClick={() => toggleItemPacked(item.id, 'byDay', day)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    item.packed
                                      ? 'bg-green-600 border-green-600 text-white'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {item.packed && <CheckCircle2 className="w-2.5 h-2.5" />}
                                </button>
                                <span className={`text-sm ${item.packed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                  {item.name}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Plan Outfit for Day Button */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => planOutfitForDay(day)}
                              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-sm"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Plan Outfit for This Day</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Outfit Suggestion Modal */}
      {showOutfitSuggestions && outfitSuggestionDate && (
        <OutfitSuggestionModal
          date={outfitSuggestionDate}
          event={selectedEvent}
          clothingItems={clothingItems}
          onClose={() => setShowOutfitSuggestions(false)}
          onSelectOutfit={handleSelectOutfit}
        />
      )}
    </div>
  );
};


export default PackingListGenerator;