import React, { useState, useEffect } from 'react';
import {
  Camera,
  CheckCircle,
  Star,
  Calendar,
  MapPin,
  Sun,
  Cloud,
  Clock,
  Users,
  ThumbsUp,
  ThumbsDown,
  X,
  Plus,
  Zap,
  TrendingUp,
  Award,
  Target,
  Loader,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import smartCalendarService, {
  CalendarEvent,
  OutfitItem,
  OutfitHistory,
  WeatherData
} from '../services/smartCalendarService';
import outfitHistoryService from '../services/outfitHistoryService';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';
import ClosetService from '../services/closetService';
import outfitScanService, { ScannedItem, MatchResult } from '../services/outfitScanService';

interface WoreThisTodayTrackerProps {
  onClose?: () => void;
  clothingItems?: OutfitItem[];
  todaysEvents?: CalendarEvent[];
}

interface TodaysOutfit {
  items: OutfitItem[];
  rating?: number;
  event?: CalendarEvent;
  weather?: WeatherData;
  notes?: string;
  mood?: string;
  photo?: string;
}

const WoreThisTodayTracker: React.FC<WoreThisTodayTrackerProps> = ({
  onClose,
  clothingItems: propClothingItems = [],
  todaysEvents: propTodaysEvents = []
}) => {
  const [currentStep, setCurrentStep] = useState<'photo' | 'select' | 'rate' | 'complete'>('photo');
  const [selectedItems, setSelectedItems] = useState<OutfitItem[]>([]);
  const [todaysOutfit, setTodaysOutfit] = useState<TodaysOutfit>({ items: [] });
  const [todaysWeather, setTodaysWeather] = useState<WeatherData | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [outfitPhoto, setOutfitPhoto] = useState<string>('');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [recentHistory, setRecentHistory] = useState<OutfitHistory[]>([]);
  
  // NEW: Load closet items from Supabase
  const [clothingItems, setClothingItems] = useState<OutfitItem[]>(propClothingItems);
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>(propTodaysEvents);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // NEW: Photo upload and AI scanning state
  const [uploadedPhoto, setUploadedPhoto] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<MatchResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    loadTodaysData();
    loadClosetItems();
  }, []);

  const loadTodaysData = async () => {
    try {
      // Get today's weather
      const weather = await smartCalendarService.getWeatherForecast('auto:ip', new Date());
      setTodaysWeather(weather);

      // Load recent outfit history for insights from Supabase
      const history = await outfitHistoryService.getOutfitHistory(7); // Last 7 days
      setRecentHistory(history.map(record => ({
        date: record.worn_date,
        outfitItems: record.outfit_items,
        eventId: record.event_id,
        rating: record.user_rating
      })));
    } catch (error) {
      console.error('Failed to load today\'s data:', error);
    }
  };

  // NEW: Load closet items from Supabase
  const loadClosetItems = async () => {
    try {
      setIsLoadingItems(true);
      setLoadError(null);
      
      const user = await authService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [WORE-THIS] No authenticated user');
        setLoadError('Please sign in to view your closet');
        setIsLoadingItems(false);
        return;
      }

      console.log('📦 [WORE-THIS] Loading closet items for user:', user.id);
      
      // Get from Supabase (source of truth)
      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ [WORE-THIS] Supabase error:', error);
        throw error;
      }
      
      console.log(`✅ [WORE-THIS] Loaded ${data?.length || 0} closet items from Supabase`);
      
      // Convert Supabase items to OutfitItem format
      const outfitItems: OutfitItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.image_url || item.thumbnail_url || '',
        category: item.category || 'other',
        formalityLevel: 5, // Default to medium formality
        lastWorn: item.last_worn ? new Date(item.last_worn) : undefined
      }));
      
      setClothingItems(outfitItems);
      
      // Also sync to localStorage for offline access
      if (data && data.length > 0) {
        console.log('💾 [WORE-THIS] Syncing to localStorage cache');
        // Note: ClosetService uses localStorage, we could optionally sync here
      }
    } catch (error) {
      console.error('❌ [WORE-THIS] Failed to load closet:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load closet items');
      
      // Fallback to localStorage
      console.log('🔄 [WORE-THIS] Falling back to localStorage');
      try {
        const localItems = ClosetService.getAllClothingItems();
        console.log(`📂 [WORE-THIS] Loaded ${localItems.length} items from localStorage`);
        
        const outfitItems: OutfitItem[] = localItems.map(item => ({
          id: item.id.toString(),
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          formalityLevel: 5,
          lastWorn: undefined
        }));
        
        setClothingItems(outfitItems);
      } catch (localError) {
        console.error('❌ [WORE-THIS] localStorage fallback also failed:', localError);
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  const toggleItemSelection = (item: OutfitItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const proceedToRating = () => {
    setTodaysOutfit({
      items: selectedItems,
      event: selectedEvent,
      weather: todaysWeather || undefined,
      photo: outfitPhoto
    });
    setCurrentStep('rate');
  };

  const rateOutfit = (rating: number) => {
    setTodaysOutfit(prev => ({ ...prev, rating }));
  };

  const setOutfitMood = (mood: string) => {
    setTodaysOutfit(prev => ({ ...prev, mood }));
  };

  const addNotes = (notes: string) => {
    setTodaysOutfit(prev => ({ ...prev, notes }));
  };

  const completeTracking = async () => {
    // Save to Supabase via outfit history service
    const historyRecord = {
      worn_date: selectedDate,
      outfit_items: todaysOutfit.items,
      event_id: selectedEvent?.id,
      event_type: selectedEvent?.eventType,
      weather_data: todaysOutfit.weather,
      user_rating: todaysOutfit.rating,
      mood: todaysOutfit.mood,
      notes: todaysOutfit.notes,
      photo_url: uploadedPhoto || undefined
    };

    await outfitHistoryService.saveOutfitHistory(historyRecord);

    // Also record in smart calendar service for backward compatibility
    smartCalendarService.recordOutfitWorn(
      todaysOutfit.items,
      selectedEvent?.id
    );

    // Increment times_worn for each item
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const itemIds = todaysOutfit.items.map(item => item.id);
        await supabase.rpc('increment_multiple_times_worn', { item_ids: itemIds });
        console.log(`✅ [WORE-THIS] Incremented wear count for ${itemIds.length} items`);
      }
    } catch (error) {
      console.error('❌ [WORE-THIS] Failed to increment wear counts:', error);
    }

    setCurrentStep('complete');
  };

  // NEW: Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedPhoto(dataUrl);
      console.log('📸 [WORE-THIS] Photo uploaded');
    };
    reader.readAsDataURL(file);
  };

  // NEW: Scan uploaded outfit photo with AI
  const handleScanOutfit = async () => {
    if (!uploadedPhoto) {
      setScanError('Please upload a photo first');
      return;
    }

    try {
      setIsScanning(true);
      setScanError(null);
      console.log('🔍 [WORE-THIS] Starting AI scan...');

      // Step 1: Scan photo to detect items
      const scanResult = await outfitScanService.scanOutfitPhoto(uploadedPhoto);
      
      if (!scanResult.success || scanResult.items.length === 0) {
        throw new Error(scanResult.error || 'No items detected in photo');
      }

      console.log(`✅ [WORE-THIS] Detected ${scanResult.items.length} items`);

      // Step 2: Match detected items to closet
      const closetItemsForMatching = clothingItems.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
        description: '',
        attributes: {
          color: '', // Could extract from item if available
          style: '',
          season: [] as string[],
          occasion: [] as string[]
        }
      })) as any[];

      const matchResults = await outfitScanService.matchItemsToCloset(
        scanResult.items,
        closetItemsForMatching
      );

      console.log(`✅ [WORE-THIS] Matched ${matchResults.filter(m => m.closetMatch).length}/${matchResults.length} items`);
      
      setScanResults(matchResults);

      // Auto-select matched items
      const matchedItems = matchResults
        .filter(result => result.closetMatch)
        .map(result => result.closetMatch!)
        .map(item => ({
          id: item.id.toString(),
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          formalityLevel: 5,
          lastWorn: undefined
        })) as OutfitItem[];

      setSelectedItems(matchedItems);

      // Move to selection step to review/add missing items
      setCurrentStep('select');

    } catch (error) {
      console.error('❌ [WORE-THIS] Scan failed:', error);
      setScanError(error instanceof Error ? error.message : 'Failed to scan outfit');
    } finally {
      setIsScanning(false);
    }
  };

  // NEW: Skip photo and go directly to manual selection
  const skipPhotoUpload = () => {
    setCurrentStep('select');
  };

  const getOutfitInsights = () => {
    const insights = [];

    // Frequency insights
    const categoryCount = selectedItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostUsedCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostUsedCategory) {
      insights.push(`Your go-to category: ${mostUsedCategory[0]}`);
    }

    // Recent patterns
    if (recentHistory.length > 0) {
      const recentColors = recentHistory.flatMap(entry =>
        entry.outfitItems.map(item => item.category)
      );
      insights.push(`You've worn ${recentColors.length} items this week`);
    }

    // Weather appropriateness
    if (todaysWeather) {
      if (todaysWeather.temperature < 60) {
        insights.push('Great choice for cool weather!');
      } else if (todaysWeather.temperature > 80) {
        insights.push('Perfect for a warm day!');
      }
    }

    return insights;
  };

  const getCategoryIcon = (category: string) => {
    // Simple category mapping - in production, use more sophisticated mapping
    switch (category.toLowerCase()) {
      case 'top': return '👕';
      case 'bottom': return '👖';
      case 'dress': return '👗';
      case 'shoes': return '👟';
      case 'accessories': return '👜';
      default: return '👔';
    }
  };

  // NEW: Render photo upload step
  const renderPhotoUpload = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Take a Photo of Your Outfit</h2>
        <p className="text-gray-600">Upload a photo and let AI identify what you're wearing</p>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          When did you wear this?
        </label>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        {uploadedPhoto ? (
          <div className="relative">
            <img
              src={uploadedPhoto}
              alt="Uploaded outfit"
              className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
            />
            <button
              onClick={() => setUploadedPhoto('')}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Upload a photo of your outfit</p>
            <label className="cursor-pointer">
              <span className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-block">
                Choose Photo
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Error Display */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Scan Failed</p>
              <p className="text-sm text-red-600 mt-1">{scanError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Scan Results Preview */}
      {scanResults.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-700 font-medium">
                Found {scanResults.filter(r => r.closetMatch).length} matching items!
              </p>
              <p className="text-sm text-green-600 mt-1">
                {scanResults.filter(r => !r.closetMatch).length > 0 && 
                  `${scanResults.filter(r => !r.closetMatch).length} items not in your closet`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {uploadedPhoto && (
          <button
            onClick={handleScanOutfit}
            disabled={isScanning}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isScanning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Scanning Outfit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Scan Outfit with AI</span>
              </>
            )}
          </button>
        )}
        
        <button
          onClick={skipPhotoUpload}
          className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Skip Photo - Select Manually
        </button>
      </div>
    </div>
  );

  const renderItemSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">What Did You Wear Today?</h2>
        <p className="text-gray-600">Select the items you wore to track your style journey</p>
      </div>

      {/* Today's Context */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-800">{new Date().toLocaleDateString()}</span>
            </div>
            {todaysWeather && (
              <div className="flex items-center space-x-2">
                {todaysWeather.temperature > 75 ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Cloud className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-gray-700">{todaysWeather.temperature}°F</span>
              </div>
            )}
          </div>
          {todaysEvents.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">{todaysEvents.length} events today</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Selection */}
      {todaysEvents.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Which event was this outfit for?</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedEvent(null)}
              className={`w-full text-left p-3 border rounded-lg transition-colors ${
                !selectedEvent
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-gray-700">General day (no specific event)</span>
            </button>
            {todaysEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  selectedEvent?.id === event.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{event.title}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {event.location && (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outfit Items Selection */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Select your outfit items</h3>
        {isLoadingItems ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Loading your closet...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching items from your wardrobe</p>
          </div>
        ) : loadError ? (
          <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium mb-2">Failed to load closet</p>
            <p className="text-sm text-red-600 mb-4">{loadError}</p>
            <button
              onClick={loadClosetItems}
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : clothingItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No clothing items found in your closet</p>
            <button
              onClick={onClose}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Add items to your closet first
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {clothingItems.map((item) => {
              const isSelected = selectedItems.some(selected => selected.id === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItemSelection(item)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-200 scale-95'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">{item.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Selected Items ({selectedItems.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-green-300"
              >
                <span className="text-sm text-green-700">{item.name}</span>
                <button
                  onClick={() => toggleItemSelection(item)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={proceedToRating}
          disabled={selectedItems.length === 0}
          className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Rating
        </button>
      </div>
    </div>
  );

  const renderRating = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">How Did You Feel?</h2>
        <p className="text-gray-600">Rate your outfit and tell us about your day</p>
      </div>

      {/* Outfit Summary */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium text-gray-800 mb-3">Today's Outfit</h3>
        <div className="flex flex-wrap gap-2">
          {todaysOutfit.items.map((item) => (
            <div key={item.id} className="bg-white px-3 py-1 rounded-full border border-gray-200">
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
        {selectedEvent && (
          <div className="mt-2 text-sm text-gray-600">
            For: {selectedEvent.title}
          </div>
        )}
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">How did you feel in this outfit?</h3>
        <div className="flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => rateOutfit(rating)}
              className={`p-2 rounded-lg transition-colors ${
                todaysOutfit.rating && todaysOutfit.rating >= rating
                  ? 'text-yellow-500'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Star className="w-8 h-8 fill-current" />
            </button>
          ))}
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            {todaysOutfit.rating ? `${todaysOutfit.rating} out of 5 stars` : 'Tap to rate'}
          </p>
        </div>
      </div>

      {/* Mood Selection */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">What was your mood?</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '😍', label: 'Confident' },
            { emoji: '😊', label: 'Happy' },
            { emoji: '😌', label: 'Comfortable' },
            { emoji: '🤩', label: 'Stylish' },
            { emoji: '💪', label: 'Powerful' },
            { emoji: '✨', label: 'Sparkly' }
          ].map((mood) => (
            <button
              key={mood.label}
              onClick={() => setOutfitMood(mood.label)}
              className={`p-3 rounded-lg border transition-colors ${
                todaysOutfit.mood === mood.label
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-sm text-gray-700">{mood.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Any notes about today?</h3>
        <textarea
          value={todaysOutfit.notes || ''}
          onChange={(e) => addNotes(e.target.value)}
          placeholder="How did the outfit work? Any compliments? Weather issues?"
          className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('select')}
          className="flex-1 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={completeTracking}
          className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
        >
          Complete Tracking
        </button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6">
      <div>
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Outfit Tracked! 🎉</h2>
        <p className="text-gray-600">Your style journey continues...</p>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Today's Style Insights</h3>
        <div className="space-y-3">
          {getOutfitInsights().map((insight, index) => (
            <div key={index} className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
        >
          <Target className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">Plan Tomorrow</span>
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
        >
          <Award className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700">View History</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button - TOP LEFT */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${currentStep === 'photo' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'select' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'rate' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${currentStep === 'complete' ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
        </div>

        {/* Close Button - TOP RIGHT (keep existing) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        {currentStep === 'photo' && renderPhotoUpload()}
        {currentStep === 'select' && renderItemSelection()}
        {currentStep === 'rate' && renderRating()}
        {currentStep === 'complete' && renderComplete()}
      </div>
    </div>
  );
};

export default WoreThisTodayTracker;