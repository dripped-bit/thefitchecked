/**
 * Calendar Entry Modal
 * Modal for saving generated outfits to calendar with event details
 */

import React, { useState } from 'react';
import { X, Calendar, ShoppingBag, Bell, FileText, MapPin, Loader2 } from 'lucide-react';
import smartCalendarService from '../services/smartCalendarService';
import { affiliateLinkService } from '../services/affiliateLinkService';
import weatherService, { WeatherData } from '../services/weatherService';
import { glassModalClasses } from '../styles/glassEffects';

interface ProductWithImage {
  url: string;
  title?: string;
  imageUrl?: string;
  store?: string;
  price?: string;
}

interface CalendarEntryModalProps {
  outfit: {
    outfit?: any;
    occasion?: string;
    image?: string;
    avatarUrl?: string;
    description?: string;
    imageUrl?: string;
    personality?: { name: string };
  };
  onSave: (calendarEntry: CalendarEntry) => void;
  onClose: () => void;
  initialShoppingLinks?: string[]; // Array of product URLs to pre-fill
  selectedProducts?: ProductWithImage[]; // Array of clicked products with images
}

interface CalendarEntry {
  id: number;
  outfit: any;
  eventDate: string;
  occasion: string;
  shoppingLinks: string[];
  processedLinks?: ProcessedLink[];
  reminderDays: number;
  notes: string;
  createdAt: string;
  status: 'planned' | 'reminded' | 'completed';
}

interface ProcessedLink {
  url: string;
  store: string;
  affiliateUrl: string;
  isValid: boolean;
}

const CalendarEntryModal: React.FC<CalendarEntryModalProps> = ({
  outfit,
  onSave,
  onClose,
  initialShoppingLinks = [],
  selectedProducts = []
}) => {
  const [formData, setFormData] = useState({
    eventDate: '',
    occasionName: outfit?.occasion || '',
    shoppingLinks: initialShoppingLinks.join('\n'),
    reminderDays: 7,
    notes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [eventLocation, setEventLocation] = useState('');
  const [weatherForecast, setWeatherForecast] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Get outfit image URL - prefer product images over generated outfit
  const getOutfitImage = () => {
    // If user clicked on products, show the first product image
    if (selectedProducts.length > 0 && selectedProducts[0].imageUrl) {
      return selectedProducts[0].imageUrl;
    }
    // Otherwise fallback to generated outfit image
    return outfit?.image || outfit?.avatarUrl || outfit?.imageUrl || '';
  };

  // Get all product images for display
  const getProductImages = () => {
    return selectedProducts
      .filter(p => p.imageUrl)
      .map(p => ({
        url: p.imageUrl!,
        title: p.title,
        store: p.store
      }));
  };

  // Get outfit description
  const getOutfitDescription = () => {
    return outfit?.description || outfit?.personality?.name || 'Generated outfit';
  };

  // Weather icon helper
  const getWeatherIcon = (weatherCode: number): string => {
    if (weatherCode === 0 || weatherCode === 1) return '☀️';
    if (weatherCode === 2 || weatherCode === 3) return '⛅';
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 86) return '❄️';
    if (weatherCode >= 95) return '⛈️';
    return '🌤️';
  };

  // Fetch weather when location and date are set
  const handleLocationChange = async () => {
    if (!eventLocation || !formData.eventDate) return;
    
    setLoadingWeather(true);
    try {
      const parts = eventLocation.split(',').map(s => s.trim());
      const city = parts[0];
      const state = parts[1];
      
      const [year, month, day] = formData.eventDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      
      const forecast = await weatherService.getWeatherForecastByCity(city, state, targetDate);
      setWeatherForecast(forecast);
    } catch (error) {
      console.error('Failed to load weather forecast:', error);
      setWeatherForecast(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 [CALENDAR-MODAL] Form submitted:', formData);
    console.log('📝 [CALENDAR-MODAL] Outfit data:', outfit);

    if (!formData.eventDate) {
      console.error('❌ [CALENDAR-MODAL] Validation failed: Missing event date');
      alert('Please select a date for your event');
      return;
    }

    setIsProcessing(true);

    try {
      // Process shopping links if provided
      let processedLinks: ProcessedLink[] = [];
      if (formData.shoppingLinks.trim()) {
        console.log('🔗 [CALENDAR-MODAL] Processing shopping links...');
        processedLinks = await processShoppingLinks(formData.shoppingLinks);
        console.log(`✅ [CALENDAR-MODAL] Processed ${processedLinks.length} shopping links`);
      }

      // Create calendar entry
      const calendarEntry: CalendarEntry = {
        id: Date.now(),
        outfit: outfit,
        eventDate: formData.eventDate,
        occasion: formData.occasionName,
        shoppingLinks: formData.shoppingLinks
          ? formData.shoppingLinks.split('\n').filter(l => l.trim())
          : [],
        processedLinks: processedLinks,
        reminderDays: formData.reminderDays,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: 'planned'
      };

      console.log('💾 [CALENDAR-MODAL] Saving calendar entry:', calendarEntry);

      // Save to Supabase via Smart Calendar service
      // Parse date in local timezone to avoid UTC conversion issues
      const [year, month, day] = formData.eventDate.split('-').map(Number);
      const startTime = new Date(year, month - 1, day, 9, 0, 0);  // 9 AM local time
      const endTime = new Date(year, month - 1, day, 17, 0, 0);   // 5 PM local time

      console.log('📅 [CALENDAR-MODAL] Event date:', {
        input: formData.eventDate,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        localDate: startTime.toLocaleDateString()
      });

      // Map occasion to event type
      const mapOccasionToEventType = (occasion: string): 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other' => {
        const lowerOccasion = occasion.toLowerCase();
        if (lowerOccasion.includes('work') || lowerOccasion.includes('meeting') || lowerOccasion.includes('interview')) return 'work';
        if (lowerOccasion.includes('travel') || lowerOccasion.includes('vacation') || lowerOccasion.includes('trip')) return 'travel';
        if (lowerOccasion.includes('formal') || lowerOccasion.includes('wedding') || lowerOccasion.includes('gala')) return 'formal';
        if (lowerOccasion.includes('casual') || lowerOccasion.includes('daily') || lowerOccasion.includes('everyday')) return 'casual';
        return 'personal';
      };

      // Log outfit ID for debugging
      const outfitId = outfit?.outfit?.supabaseId || null;
      console.log('🔍 [CALENDAR-MODAL] Saving calendar event with outfit ID:', outfitId);

      // Extract outfit items if available
      let outfitItems: any[] = [];

      // Check if outfit has items array (from closet/wardrobe)
      if (outfit?.outfit?.items || outfit?.outfit?.outfitItems) {
        outfitItems = outfit?.outfit?.items || outfit?.outfit?.outfitItems || [];
        console.log('👔 [CALENDAR-MODAL] Using closet outfit items:', outfitItems);
      } else if (outfit?.outfit) {
        // AI-generated outfit from occasion planner - create synthetic OutfitItem
        // GeneratedOutfit has: imageUrl, personality, originalPrompt, supabaseId
        const generatedOutfit = outfit.outfit as any;

        console.log('🤖 [CALENDAR-MODAL] Detected AI-generated outfit, creating synthetic item');

        outfitItems = [{
          id: generatedOutfit.supabaseId || `generated-${Date.now()}`,
          name: outfit.description || generatedOutfit.personality?.name || 'Generated Outfit',
          imageUrl: outfit.image || outfit.imageUrl || outfit.avatarUrl || generatedOutfit.imageUrl || '',
          category: 'complete-outfit',
          formalityLevel: 5, // Default formality
          weatherSuitability: []
        }];

        console.log('✨ [CALENDAR-MODAL] Created synthetic outfit item:', outfitItems[0]);
      }

      console.log('👔 [CALENDAR-MODAL] Outfit items to save:', outfitItems);

      // Calculate reminder in minutes (days * 24 hours * 60 minutes)
      const reminderMinutes = formData.reminderDays * 24 * 60;

      // Build shopping links with product images
      const shoppingLinksWithImages = processedLinks.map((link, index) => {
        // Try to find matching product from selectedProducts
        const matchingProduct = selectedProducts.find(p => p.url === link.url);
        
        return {
          url: link.url,
          store: link.store,
          affiliateUrl: link.affiliateUrl,
          image: matchingProduct?.imageUrl, // Add product image
          imageUrl: matchingProduct?.imageUrl, // Alternative field
          title: matchingProduct?.title,
          price: matchingProduct?.price
        };
      });

      console.log('🖼️ [CALENDAR-MODAL] Shopping links with images:', shoppingLinksWithImages);

      const event = await smartCalendarService.createEvent({
        title: `Outfit for ${formData.occasionName || 'Event'}`,
        description: formData.notes || getOutfitDescription(),
        startTime: startTime,
        endTime: endTime,
        eventType: mapOccasionToEventType(formData.occasionName),
        outfitId: outfitId,
        outfitItems: outfitItems,
        occasion: formData.occasionName,
        reminderMinutes: reminderMinutes,
        shoppingLinks: shoppingLinksWithImages
      });

      if (!event) {
        throw new Error('Failed to create calendar event');
      }

      console.log('✅ [CALENDAR-MODAL] Successfully saved to Smart Calendar:', event.id);

      // Schedule reminder if user selected one
      if (calendarEntry.reminderDays > 0) {
        scheduleReminder(calendarEntry);
        console.log('🔔 [CALENDAR-MODAL] Reminder scheduled for', calendarEntry.reminderDays, 'days before event');
      }

      onSave(calendarEntry);
      onClose();

    } catch (error) {
      console.error('❌ [CALENDAR-MODAL] Error saving to calendar:', error);
      console.error('❌ [CALENDAR-MODAL] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData: formData,
        outfit: outfit
      });
      alert('Failed to save outfit to calendar. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process shopping links - validate and convert to affiliate links
   */
  const processShoppingLinks = async (linksText: string): Promise<ProcessedLink[]> => {
    const urls = linksText.split('\n').filter(l => l.trim());
    const processed: ProcessedLink[] = [];

    for (const url of urls) {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) continue;

      // Validate it's a product URL
      const isValid = smartCalendarService.isProductUrl(trimmedUrl);

      if (!isValid) {
        console.warn('⚠️ [CALENDAR-MODAL] Invalid product URL:', trimmedUrl);
      }

      // Detect store
      const store = affiliateLinkService.detectStoreFromUrl(trimmedUrl);

      // Convert to affiliate link
      const affiliateUrl = affiliateLinkService.convertToAffiliateLink(trimmedUrl, store);

      processed.push({
        url: trimmedUrl,
        store: store,
        affiliateUrl: affiliateUrl,
        isValid: isValid
      });
    }

    return processed;
  };

  /**
   * Schedule reminder for the outfit
   */
  const scheduleReminder = (entry: CalendarEntry) => {
    // Parse date in local timezone to avoid UTC conversion issues
    const [year, month, day] = entry.eventDate.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day, 9, 0, 0);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - entry.reminderDays);

    console.log('🔔 [CALENDAR-MODAL] Reminder scheduled:', {
      eventDate: eventDate.toISOString(),
      reminderDate: reminderDate.toISOString(),
      daysBefore: entry.reminderDays,
      shoppingLinksCount: entry.processedLinks?.length || 0
    });

    // Store reminder data in localStorage with shopping links
    const reminders = JSON.parse(localStorage.getItem('outfit_reminders') || '[]');
    reminders.push({
      id: entry.id,
      reminderDate: reminderDate.toISOString(),
      eventDate: entry.eventDate,
      occasion: entry.occasion,
      message: `Don't forget to shop for your ${entry.occasion} outfit!`,
      shoppingLinks: entry.processedLinks?.map(link => link.affiliateUrl) || []
    });
    localStorage.setItem('outfit_reminders', JSON.stringify(reminders));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`${glassModalClasses.light} max-w-lg w-full max-h-[90vh] overflow-y-auto`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Add to Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Outfit Preview */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              {getOutfitImage() && (
                <img
                  src={getOutfitImage()}
                  alt="Outfit preview"
                  className="w-24 h-32 object-cover rounded-lg shadow-md"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {getOutfitDescription()}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedProducts.length > 0 
                    ? `Saving ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} to calendar`
                    : 'Save this outfit for your upcoming event'}
                </p>
              </div>
            </div>
            
            {/* Product Images Grid - Show when products are selected */}
            {selectedProducts.length > 1 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Selected Products ({selectedProducts.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {getProductImages().slice(0, 8).map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.url}
                        alt={img.title || 'Product'}
                        className="w-full aspect-square object-cover rounded-md shadow-sm"
                        title={img.title || img.store || 'Product'}
                      />
                      {idx === 7 && selectedProducts.length > 8 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            +{selectedProducts.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Event Date */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Event Date *</span>
            </label>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => {
                setFormData({ ...formData, eventDate: e.target.value });
                // Fetch weather if location is already set
                if (eventLocation) {
                  setTimeout(handleLocationChange, 100);
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              <span>Location (City, State)</span>
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              onBlur={handleLocationChange}
              placeholder="e.g., Austin, Texas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Weather forecast will be shown for this location
            </p>
          </div>

          {/* Weather Forecast Display */}
          {loadingWeather && (
            <div className="bg-gray-50 p-4 rounded-lg animate-pulse flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <div className="text-sm text-gray-600">Loading weather forecast...</div>
            </div>
          )}

          {weatherForecast && !loadingWeather && (
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">
                  {getWeatherIcon(weatherForecast.weatherCode)}
                </div>
                <div>
                  <div className="font-semibold text-lg text-gray-900">
                    {weatherForecast.temperature}°F
                  </div>
                  <div className="text-sm text-gray-600">
                    {weatherForecast.weatherDescription}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mt-3">
                <div className="flex items-center gap-1">
                  <span>🌡️</span>
                  <span>Feels {weatherForecast.feelsLike}°F</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💧</span>
                  <span>{weatherForecast.precipitation}" rain</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💨</span>
                  <span>{weatherForecast.windSpeed} mph</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>☀️</span>
                  <span>UV {weatherForecast.uvIndex}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Weather forecast for {eventLocation} on {new Date(formData.eventDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Occasion Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Occasion Name</span>
            </label>
            <input
              type="text"
              value={formData.occasionName}
              onChange={(e) => setFormData({ ...formData, occasionName: e.target.value })}
              placeholder="e.g., Sarah's Birthday, Date Night, Work Conference..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Shopping Links */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Links (Optional)</span>
            </label>
            <textarea
              value={formData.shoppingLinks}
              onChange={(e) => setFormData({ ...formData, shoppingLinks: e.target.value })}
              placeholder="Paste product links here, one per line...&#10;https://www.amazon.com/dp/...&#10;https://www.fashionnova.com/products/..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add direct product links to purchase items for this outfit
            </p>
          </div>

          {/* Reminder to Buy */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Bell className="w-4 h-4" />
              <span>Reminder to Buy</span>
            </label>
            <select
              value={formData.reminderDays}
              onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>No reminder</option>
              <option value={3}>3 days before event</option>
              <option value={7}>1 week before event</option>
              <option value={14}>2 weeks before event</option>
              <option value={30}>1 month before event</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Get reminded to purchase these items before your event
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or styling tips..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEntryModal;
