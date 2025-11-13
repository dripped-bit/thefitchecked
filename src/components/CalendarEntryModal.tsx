/**
 * Calendar Entry Modal
 * Modal for saving generated outfits to calendar with event details
 */

import React, { useState } from 'react';
import { X, Calendar, ShoppingBag, Bell, FileText, MapPin, Loader2 } from 'lucide-react';
import smartCalendarService from '../services/smartCalendarService';
import { affiliateLinkService } from '../services/affiliateLinkService';
import weatherService, { WeatherData } from '../services/weatherService';
import { pushNotificationService } from '../services/pushNotificationService';
import { glassModalClasses } from '../styles/glassEffects';

interface ProductWithImage {
  url: string;
  title?: string;
  imageUrl?: string;
  store?: string;
  price?: string;
}

interface ParsedOccasion {
  originalInput: string;
  occasion: string;
  formality: 'casual' | 'semi-formal' | 'formal' | 'black-tie';
  date?: string;
  time?: string;
  location?: string;
  weather?: any;
  confidence: number;
  tags: string[];
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
  occasion?: ParsedOccasion; // Occasion context from outfit generation
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
  selectedProducts = [],
  occasion
}) => {
  // Pre-populate from occasion context if available
  const initialOccasionName = occasion?.occasion || outfit?.occasion || '';
  const initialDate = occasion?.date || '';
  const initialLocation = occasion?.location || '';
  const initialNotes = occasion?.formality
    ? `${occasion.formality.charAt(0).toUpperCase() + occasion.formality.slice(1)} event${occasion.originalInput ? ` - ${occasion.originalInput}` : ''}`
    : '';

  const [formData, setFormData] = useState({
    eventDate: initialDate,
    occasionName: initialOccasionName,
    shoppingLinks: initialShoppingLinks.join('\n'),
    reminderDays: 7,
    getReadyReminderHours: 2,
    notes: initialNotes,
    customReminderDays: 7 // For custom reminder input
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [eventLocation, setEventLocation] = useState(initialLocation);
  const [weatherForecast, setWeatherForecast] = useState<WeatherData | null>(occasion?.weather || null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [useCustomReminder, setUseCustomReminder] = useState(false);

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

      // Schedule shopping reminder notification if user selected one
      if (calendarEntry.reminderDays > 0) {
        const pushGranted = await pushNotificationService.scheduleOutfitReminder(
          {
            id: event.id.toString(),
            eventDate: formData.eventDate,
            occasion: formData.occasionName,
            shoppingLinks: processedLinks.map(link => link.affiliateUrl)
          },
          calendarEntry.reminderDays
        );

        if (pushGranted) {
          console.log('🔔 [CALENDAR] Shopping reminder scheduled for', calendarEntry.reminderDays, 'days before event');
        } else {
          console.log('🔔 [CALENDAR] Shopping reminder saved (localStorage fallback)');
        }
      }

      // Schedule get ready reminder notification if user selected one
      if (formData.getReadyReminderHours > 0) {
        const eventDateTime = new Date(formData.eventDate);
        const reminderTime = new Date(eventDateTime.getTime() - (formData.getReadyReminderHours * 60 * 60 * 1000));

        try {
          await pushNotificationService.scheduleNotification({
            title: `Get Ready: ${formData.occasionName}`,
            body: `Time to prepare your outfit for ${formData.occasionName}!`,
            id: `getready-${event.id}`,
            schedule: { at: reminderTime }
          });
          console.log('🔔 [CALENDAR] Get ready reminder scheduled for', formData.getReadyReminderHours, 'hours before event');
        } catch (error) {
          console.error('❌ [CALENDAR] Failed to schedule get ready reminder:', error);
        }
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
      className="fixed inset-0 ios-blur bg-black bg-opacity-70 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="ios-card ios-slide-up w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-ios-separator">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-ios-blue" />
            <h2 className="ios-large-title">Add to Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ios-fill rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-ios-label-tertiary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            {/* Outfit Preview */}
            <div className="p-6 bg-gradient-to-br from-ios-blue/10 to-ios-purple/10">
            <div className="space-y-4">
            <div className="flex gap-4 items-start">
              {getOutfitImage() && (
                <img
                  src={getOutfitImage()}
                  alt="Outfit preview"
                  className="w-24 h-32 object-cover rounded-ios-lg shadow-ios-md"
                />
              )}
              <div className="flex-1">
                <h3 className="ios-headline mb-1">
                  {getOutfitDescription()}
                </h3>
                <p className="ios-callout text-ios-label-secondary">
                  {selectedProducts.length > 0 
                    ? `Saving ${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} to calendar`
                    : 'Save this outfit for your upcoming event'}
                </p>
              </div>
            </div>
            
            {/* Product Images Grid - Show when products are selected */}
            {selectedProducts.length > 1 && (
              <div>
                <p className="ios-caption-2 font-semibold text-ios-label-secondary uppercase mb-2">
                  Selected Products ({selectedProducts.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {getProductImages().slice(0, 8).map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.url}
                        alt={img.title || 'Product'}
                        className="w-full aspect-square object-cover rounded-ios-md shadow-ios-sm"
                        title={img.title || img.store || 'Product'}
                      />
                      {idx === 7 && selectedProducts.length > 8 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 rounded-ios-md flex items-center justify-center">
                          <span className="text-white ios-callout font-semibold">
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

          {/* Form Fields */}
          <div className="p-6 space-y-5">
          {/* Event Date */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
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
              className="ios-input w-full"
            />
          </div>

          {/* Location Input - REQUIRED */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <MapPin className="w-4 h-4" />
              <span>Location (City, State) *</span>
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              onBlur={handleLocationChange}
              placeholder="e.g., Austin, Texas"
              className="ios-input w-full"
              required
            />
            <p className="ios-caption-1 text-ios-label-tertiary mt-1">
              Required for weather forecast and styling recommendations
            </p>
          </div>

          {/* Weather Forecast Display */}
          {loadingWeather && (
            <div className="bg-ios-fill p-4 rounded-ios-lg animate-pulse flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-ios-blue" />
              <div className="ios-callout text-ios-label-secondary">Loading weather forecast...</div>
            </div>
          )}

          {weatherForecast && !loadingWeather && (
            <div className="bg-gradient-to-br from-ios-blue/10 to-ios-blue/5 p-4 rounded-ios-lg border border-ios-blue/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">
                  {getWeatherIcon(weatherForecast.weatherCode)}
                </div>
                <div>
                  <div className="ios-title-3 font-bold">
                    {weatherForecast.temperature}°F
                  </div>
                  <div className="ios-callout text-ios-label-secondary">
                    {weatherForecast.weatherDescription}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 ios-caption-1 text-ios-label-secondary mt-3">
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
              <div className="mt-2 ios-caption-1 text-ios-label-tertiary">
                Weather forecast for {eventLocation} on {new Date(formData.eventDate).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Occasion Name */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <FileText className="w-4 h-4" />
              <span>Occasion Name</span>
            </label>
            <input
              type="text"
              value={formData.occasionName}
              onChange={(e) => setFormData({ ...formData, occasionName: e.target.value })}
              placeholder="e.g., Sarah's Birthday, Date Night, Work Conference..."
              className="ios-input w-full"
            />
          </div>

          {/* Shopping Links */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Links (Optional)</span>
            </label>
            <textarea
              value={formData.shoppingLinks}
              onChange={(e) => setFormData({ ...formData, shoppingLinks: e.target.value })}
              placeholder="Paste product links here, one per line...&#10;https://www.amazon.com/dp/...&#10;https://www.fashionnova.com/products/..."
              rows={4}
              className="ios-input w-full resize-none"
            />
            <p className="mt-1 ios-caption-1 text-ios-label-tertiary">
              Add direct product links to purchase items for this outfit
            </p>
          </div>

          {/* Reminder to Buy */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <Bell className="w-4 h-4" />
              <span>Reminder to Buy</span>
            </label>
            {!useCustomReminder ? (
              <div className="space-y-2">
                <select
                  value={formData.reminderDays}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'custom') {
                      setUseCustomReminder(true);
                    } else {
                      setFormData({ ...formData, reminderDays: Number(value) });
                    }
                  }}
                  className="ios-input w-full"
                >
                  <option value={0}>No reminder</option>
                  <option value={1}>1 day before event</option>
                  <option value={3}>3 days before event</option>
                  <option value={7}>1 week before event</option>
                  <option value={14}>2 weeks before event</option>
                  <option value={21}>3 weeks before event</option>
                  <option value={30}>1 month before event</option>
                  <option value="custom">Custom...</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.customReminderDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      setFormData({
                        ...formData,
                        customReminderDays: days,
                        reminderDays: days
                      });
                    }}
                    className="ios-input flex-1"
                    placeholder="Enter days"
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomReminder(false)}
                    className="ios-button-secondary px-4"
                  >
                    Presets
                  </button>
                </div>
                <p className="ios-caption-1 text-ios-label-secondary">
                  Days before event (1-90)
                </p>
              </div>
            )}
            <p className="mt-1 ios-caption-1 text-ios-label-tertiary">
              Get reminded to purchase these items before your event
            </p>
          </div>

          {/* Get Ready Reminder */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <Bell className="w-4 h-4" />
              <span>Get Ready Reminder</span>
            </label>
            <select
              value={formData.getReadyReminderHours}
              onChange={(e) => setFormData({ ...formData, getReadyReminderHours: Number(e.target.value) })}
              className="ios-input w-full"
            >
              <option value={0}>No reminder</option>
              <option value={1}>1 hour before event</option>
              <option value={2}>2 hours before event</option>
              <option value={3}>3 hours before event</option>
              <option value={4}>4 hours before event</option>
              <option value={6}>6 hours before event</option>
              <option value={12}>12 hours before event</option>
              <option value={24}>1 day before event</option>
              <option value={48}>2 days before event</option>
            </select>
            <p className="mt-1 ios-caption-1 text-ios-label-tertiary">
              Get reminded to plan and prepare your outfit
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 ios-subheadline font-semibold mb-2">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or styling tips..."
              rows={3}
              className="ios-input w-full resize-none"
            />
          </div>
          </div>
          </div>

          {/* Fixed Footer - Action Buttons */}
          <div className="flex-shrink-0 p-6 border-t border-ios-separator bg-white pb-[calc(env(safe-area-inset-bottom)+100px)]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="ios-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="ios-button-primary flex-1"
            >
              {isProcessing ? 'Saving...' : 'Save to Calendar'}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEntryModal;
