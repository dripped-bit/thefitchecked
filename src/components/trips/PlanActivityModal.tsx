import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useCreateActivity, useCreateTripOutfit, useTripDaysArray, type Trip } from '../../hooks/useTrips';
import { ACTIVITY_ICONS, TIME_SLOT_LABELS, FORMALITY_LEVELS } from '../../constants/tripTypes';
import type { TimeSlot, ActivityType, FormalityLevel } from '../../constants/tripTypes';
import { WeatherDisplay } from './WeatherDisplay';
import { SequentialCategorySelector } from './SequentialCategorySelector';
import weatherService, { type WeatherData } from '../../services/weatherService';
import claudeOutfitService, { type OutfitSuggestion } from '../../services/claudeOutfitService';
import { useCloset, type ClothingItem } from '../../hooks/useCloset';

interface PlanActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  trip: Trip;
  startDate: string;
  endDate: string;
  preselectedDate?: string;
  preselectedTimeSlot?: TimeSlot;
}

export function PlanActivityModal({
  isOpen,
  onClose,
  tripId,
  trip,
  startDate,
  endDate,
  preselectedDate,
  preselectedTimeSlot,
}: PlanActivityModalProps) {
  const createActivity = useCreateActivity();
  const createTripOutfit = useCreateTripOutfit();
  const tripDays = useTripDaysArray(startDate, endDate);
  const { items: closetItems } = useCloset();

  const [formData, setFormData] = useState({
    date: preselectedDate || tripDays[0]?.toISOString().split('T')[0] || '',
    time_slot: preselectedTimeSlot || ('morning' as TimeSlot),
    activity_type: '' as ActivityType | '',
    title: '',
    location: '',
    formality_level: 3 as FormalityLevel,
    weather_consideration: true,
    notes: '',
  });

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // AI outfit generation state
  const [showOutfitSuggestions, setShowOutfitSuggestions] = useState(false);
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);
  const [generatingOutfits, setGeneratingOutfits] = useState(false);

  // Manual outfit selection state
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [manuallySelectedItems, setManuallySelectedItems] = useState<ClothingItem[]>([]);

  // Fetch weather when date or time slot changes
  useEffect(() => {
    if (isOpen && trip.destination && formData.date) {
      fetchWeather();
    }
  }, [isOpen, formData.date, formData.time_slot, trip.destination]);

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      console.log('🌤️ [PLAN-ACTIVITY] Fetching weather for', trip.destination, formData.date, formData.time_slot);
      const weatherData = await weatherService.getWeatherForDateAndTime(
        trip.destination,
        formData.date,
        formData.time_slot
      );
      setWeather(weatherData);
      console.log('✅ [PLAN-ACTIVITY] Weather loaded:', weatherData.temperature + '°F');
    } catch (error) {
      console.error('❌ [PLAN-ACTIVITY] Failed to load weather:', error);
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleAIPlan = async () => {
    if (!formData.activity_type) {
      alert('Please select an activity type first');
      return;
    }
    if (!formData.title) {
      alert('Please enter an activity title first');
      return;
    }

    setGeneratingOutfits(true);
    
    try {
      console.log('🤖 [AI-PLAN] Generating outfits for:', {
        activity: formData.title,
        type: formData.activity_type,
        weather: weather?.temperature + '°F',
        timeSlot: formData.time_slot,
      });

      // Map closet items to outfit items format
      const availableItems = closetItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category as any,
        subcategory: item.subcategory,
        color: item.color,
        season: item.season,
        image_url: item.thumbnail_url || item.image_url,
      }));

      // Generate suggestions using Claude
      const suggestions = await claudeOutfitService.generateOutfitSuggestions({
        event: {
          id: 'temp-' + Date.now(),
          title: formData.title,
          location: formData.location || trip.destination,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          isAllDay: false,
        },
        weather: weather || {
          temperature: 70,
          feelsLike: 70,
          humidity: 50,
          windSpeed: 5,
          weatherCode: 0,
          weatherDescription: 'Clear',
          isDay: true,
          precipitation: 0,
          uvIndex: 5,
          location: { latitude: 0, longitude: 0 },
          timestamp: new Date().toISOString(),
        },
        timeOfDay: formData.time_slot,
        availableItems,
        preferences: {
          formalityLevel: formData.formality_level,
          avoidRepeat: true,
        },
      });

      console.log('🤖 [AI-PLAN] Generated', suggestions.length, 'outfit suggestions');
      setOutfitSuggestions(suggestions);
      setShowOutfitSuggestions(true);
      
    } catch (error) {
      console.error('❌ [AI-PLAN] Failed:', error);
      alert('Failed to generate outfit suggestions. Please try manual selection.');
    } finally {
      setGeneratingOutfits(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      alert('Please fill in required fields');
      return;
    }

    try {
      // Create activity first
      const newActivity = await createActivity.mutateAsync({
        trip_id: tripId,
        date: formData.date,
        time_slot: formData.time_slot,
        activity_type: formData.activity_type || undefined,
        title: formData.title,
        location: formData.location || undefined,
        formality_level: formData.formality_level,
        weather_consideration: formData.weather_consideration,
        notes: formData.notes || undefined,
      });

      console.log('✅ [PLAN-ACTIVITY] Activity created:', newActivity.id);

      // If outfit was selected (AI or manual), save it
      if (selectedOutfit && selectedOutfit.outfitItems && selectedOutfit.outfitItems.length > 0) {
        console.log('💼 [PLAN-ACTIVITY] Saving AI-generated outfit with', selectedOutfit.outfitItems.length, 'items');
        await createTripOutfit.mutateAsync({
          activity_id: newActivity.id,
          clothing_item_ids: selectedOutfit.outfitItems.map(item => item.id),
          is_ai_generated: true,
          is_confirmed: true,
        });
        console.log('✅ [PLAN-ACTIVITY] AI outfit saved');
      } else if (manuallySelectedItems.length > 0) {
        console.log('💼 [PLAN-ACTIVITY] Saving manually selected outfit with', manuallySelectedItems.length, 'items');
        await createTripOutfit.mutateAsync({
          activity_id: newActivity.id,
          clothing_item_ids: manuallySelectedItems.map(item => item.id),
          is_ai_generated: false,
          is_confirmed: true,
        });
        console.log('✅ [PLAN-ACTIVITY] Manual outfit saved');
      }
      
      // Reset form and outfit state
      setFormData({
        date: preselectedDate || tripDays[0]?.toISOString().split('T')[0] || '',
        time_slot: preselectedTimeSlot || 'morning',
        activity_type: '',
        title: '',
        location: '',
        formality_level: 3,
        weather_consideration: true,
        notes: '',
      });
      setShowOutfitSuggestions(false);
      setOutfitSuggestions([]);
      setSelectedOutfit(null);
      setShowManualSelection(false);
      setManuallySelectedItems([]);

      onClose();
    } catch (error) {
      console.error('❌ [PLAN-ACTIVITY] Failed to create activity:', error);
      alert('Failed to create activity');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Plan {TIME_SLOT_LABELS[formData.time_slot]} Activity
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Weather Display */}
          {loadingWeather && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading weather...</span>
            </div>
          )}
          {weather && !loadingWeather && (
            <WeatherDisplay weather={weather} />
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <select
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {tripDays.map((day) => {
                  const dateStr = day.toISOString().split('T')[0];
                  return (
                    <option key={dateStr} value={dateStr}>
                      {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot *</label>
              <select
                required
                value={formData.time_slot}
                onChange={(e) => setFormData({ ...formData, time_slot: e.target.value as TimeSlot })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {Object.entries(TIME_SLOT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Activity Type</label>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(ACTIVITY_ICONS).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, activity_type: key as ActivityType })}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                    formData.activity_type === key
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                  title={key}
                >
                  <div className="text-3xl mb-1">{icon}</div>
                  <div className="text-xs font-medium capitalize text-gray-700">{key.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Visit Eiffel Tower, Beach Day, Business Meeting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Champ de Mars, Santa Monica Beach"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Outfit Planning Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Outfit Planning (Optional)</h3>
            
            {/* AI Plan Button */}
            <button
              type="button"
              onClick={handleAIPlan}
              disabled={generatingOutfits || !formData.activity_type || !formData.title}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-3"
            >
              {generatingOutfits ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI is creating outfit suggestions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>🤖 AI Plan Outfit from Closet</span>
                </>
              )}
            </button>

            {/* AI Outfit Suggestions Display */}
            {showOutfitSuggestions && outfitSuggestions.length > 0 && (
              <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Generated Outfits
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOutfitSuggestions(false);
                      setSelectedOutfit(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {outfitSuggestions.map((outfit, index) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setSelectedOutfit(outfit)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedOutfit?.id === outfit.id
                          ? 'border-purple-500 bg-white shadow-lg'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="text-sm font-semibold mb-2 text-gray-900">
                        Option {index + 1}
                      </div>
                      {/* Show clothing items */}
                      {outfit.outfitItems && outfit.outfitItems.length > 0 && (
                        <div className="space-y-1 text-xs text-gray-600 text-left">
                          {outfit.outfitItems.slice(0, 4).map(item => (
                            <div key={item.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="truncate">{item.name}</span>
                            </div>
                          ))}
                          {outfit.outfitItems.length > 4 && (
                            <div className="text-xs text-gray-500 text-center mt-1">
                              +{outfit.outfitItems.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs text-purple-600 font-medium">
                          {outfit.confidence}% match
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedOutfit && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-700">
                      <strong>Why this works:</strong> {selectedOutfit.reasoning}
                    </p>
                    {selectedOutfit.styleNotes && selectedOutfit.styleNotes.length > 0 && (
                      <ul className="mt-2 text-xs text-gray-600 space-y-1">
                        {selectedOutfit.styleNotes.map((note, i) => (
                          <li key={i}>• {note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-sm text-gray-500 my-3">or</div>

            {/* Manual Plan Button */}
            <button
              type="button"
              onClick={() => setShowManualSelection(!showManualSelection)}
              className="w-full px-6 py-3 border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span>👗 Plan Outfit Manually</span>
              <span className="text-xs">({manuallySelectedItems.length} items)</span>
            </button>

            {/* Manual Selection UI */}
            {showManualSelection && (
              <div className="mt-4 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                <SequentialCategorySelector
                  closetItems={closetItems}
                  onItemsSelected={setManuallySelectedItems}
                  preselectedItems={manuallySelectedItems}
                />
              </div>
            )}
          </div>

          {/* Formality Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formality Level: {FORMALITY_LEVELS[formData.formality_level - 1].label}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.formality_level}
              onChange={(e) => setFormData({ ...formData, formality_level: parseInt(e.target.value) as FormalityLevel })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Casual</span>
              <span>Casual</span>
              <span>Smart Casual</span>
              <span>Business</span>
              <span>Formal</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {FORMALITY_LEVELS[formData.formality_level - 1].description}
            </p>
          </div>

          {/* Weather Consideration */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.weather_consideration}
                onChange={(e) => setFormData({ ...formData, weather_consideration: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Consider weather when suggesting outfits</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special considerations, dress codes, or reminders..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Submit */}
          <div className="border-t pt-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createActivity.isPending || createTripOutfit.isPending}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {(createActivity.isPending || createTripOutfit.isPending) ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Activity</span>
                    {(selectedOutfit || manuallySelectedItems.length > 0) && (
                      <span className="text-xs opacity-90">(+ outfit)</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
