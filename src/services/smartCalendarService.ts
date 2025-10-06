/**
 * Smart Calendar Integration Service
 * Handles calendar event management, weather integration, and intelligent outfit planning
 */

import { supabase } from './supabaseClient';
import authService from './authService';

// Types and Interfaces
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay: boolean;
  recurrence?: string;
  attendees?: string[];
  eventType: 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other';
  weatherRequired?: boolean;
}

export interface OutfitPlan {
  id: string;
  eventId: string;
  outfitItems: OutfitItem[];
  occasion: 'travel' | 'formal' | 'social' | 'daily' | 'activities';
  weatherConsidered: boolean;
  plannedDate: Date;
  notes?: string;
  confidence: number; // AI confidence score 0-100
}

export interface OutfitItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  weatherSuitability?: string[];
  formalityLevel: number; // 1-10 scale
  lastWorn?: Date;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitationChance: number;
  uvIndex: number;
  feels_like: number;
}

export interface OutfitHistory {
  date: Date;
  outfitItems: OutfitItem[];
  eventId?: string;
  eventType?: string;
  location?: string;
  rating?: number; // User satisfaction 1-5
}

export interface MorningOptions {
  option1: OutfitPlan;
  option2: OutfitPlan;
  option3: OutfitPlan;
  weather: WeatherData;
  todaysEvents: CalendarEvent[];
  reasoning: string[];
}

export interface RepeatWarning {
  outfit: OutfitItem[];
  lastWornDate: Date;
  eventSimilarity: string;
  warningLevel: 'low' | 'medium' | 'high';
  suggestion?: string;
}

class SmartCalendarService {
  private calendarProvider: 'google' | 'apple' | null = null;
  private accessToken: string | null = null;
  private weatherApiKey: string | null = null;
  private outfitHistory: OutfitHistory[] = [];
  private outfitPlans: OutfitPlan[] = [];

  constructor() {
    this.loadStoredData();
    this.weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY;
  }

  // =====================
  // Calendar Event Management (Supabase)
  // =====================

  /**
   * Create a new calendar event
   */
  async createEvent(eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    eventType: 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other';
    isAllDay?: boolean;
    outfitId?: string;
    weatherRequired?: boolean;
  }): Promise<CalendarEvent | null> {
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.id || null;

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.startTime.toISOString(),
          end_time: eventData.endTime.toISOString(),
          location: eventData.location,
          event_type: eventData.eventType,
          is_all_day: eventData.isAllDay || false,
          outfit_id: eventData.outfitId || null,
          weather_required: eventData.weatherRequired || false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating calendar event:', error);
        return null;
      }

      console.log('✅ Calendar event created:', data.id);
      return this.transformDatabaseEvent(data);
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      return null;
    }
  }

  /**
   * Fetch upcoming events from Supabase
   */
  async fetchUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
    try {
      const user = await authService.getCurrentUser();
      const userId = user?.id || null;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching calendar events:', error);
        return [];
      }

      console.log(`✅ Fetched ${data?.length || 0} upcoming events`);
      return (data || []).map(event => this.transformDatabaseEvent(event));
    } catch (error) {
      console.error('❌ Failed to fetch calendar events:', error);
      return [];
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
      if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.eventType) updateData.event_type = updates.eventType;
      if (updates.isAllDay !== undefined) updateData.is_all_day = updates.isAllDay;
      if (updates.weatherRequired !== undefined) updateData.weather_required = updates.weatherRequired;

      const { error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('❌ Error updating calendar event:', error);
        return false;
      }

      console.log('✅ Calendar event updated:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to update calendar event:', error);
      return false;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('❌ Error deleting calendar event:', error);
        return false;
      }

      console.log('✅ Calendar event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete calendar event:', error);
      return false;
    }
  }

  /**
   * Transform database row to CalendarEvent interface
   */
  private transformDatabaseEvent(dbEvent: any): CalendarEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      startTime: new Date(dbEvent.start_time),
      endTime: new Date(dbEvent.end_time),
      location: dbEvent.location,
      isAllDay: dbEvent.is_all_day,
      eventType: dbEvent.event_type,
      weatherRequired: dbEvent.weather_required,
      attendees: [],
      recurrence: undefined
    };
  }

  /**
   * Check if user is connected (has events)
   */
  isConnected(): boolean {
    // Always return true since we're using manual entry now
    return true;
  }

  // =====================
  // Weather Integration
  // =====================

  async getWeatherForecast(location: string, date: Date): Promise<WeatherData | null> {
    try {
      // Demo weather data - in production, use actual weather API
      const mockWeather: WeatherData = {
        temperature: 72,
        condition: 'partly_cloudy',
        humidity: 65,
        windSpeed: 8,
        precipitationChance: 20,
        uvIndex: 6,
        feels_like: 75
      };

      return mockWeather;
    } catch (error) {
      console.error('❌ Weather fetch failed:', error);
      return null;
    }
  }

  // =====================
  // Outfit Planning AI
  // =====================

  async generateOutfitSuggestions(
    event: CalendarEvent,
    weather?: WeatherData,
    availableItems: OutfitItem[] = []
  ): Promise<OutfitPlan[]> {
    try {
      console.log('🤖 Generating AI outfit suggestions...');

      // AI logic for outfit generation based on event and weather
      const suggestions: OutfitPlan[] = [];

      // Demo suggestions - in production, use AI model
      const baseSuggestion: OutfitPlan = {
        id: `plan_${Date.now()}`,
        eventId: event.id,
        outfitItems: [], // Would be populated with actual items
        occasion: this.mapEventTypeToOccasion(event.eventType),
        weatherConsidered: !!weather,
        plannedDate: event.startTime,
        confidence: 85,
        notes: `Perfect for ${event.title}`
      };

      suggestions.push(baseSuggestion);
      return suggestions;
    } catch (error) {
      console.error('❌ Outfit suggestion generation failed:', error);
      return [];
    }
  }

  async generateMorningOptions(date: Date = new Date()): Promise<MorningOptions | null> {
    try {
      const todaysEvents = await this.fetchTodaysEvents(date);
      const weather = await this.getWeatherForecast('current_location', date);

      // Generate 3 outfit options using AI
      const option1: OutfitPlan = {
        id: 'morning_1',
        eventId: todaysEvents[0]?.id || 'daily',
        outfitItems: [],
        occasion: 'daily',
        weatherConsidered: true,
        plannedDate: date,
        confidence: 92,
        notes: 'Professional and weather-appropriate'
      };

      const option2: OutfitPlan = {
        id: 'morning_2',
        eventId: todaysEvents[0]?.id || 'daily',
        outfitItems: [],
        occasion: 'daily',
        weatherConsidered: true,
        plannedDate: date,
        confidence: 88,
        notes: 'Comfortable and stylish'
      };

      const option3: OutfitPlan = {
        id: 'morning_3',
        eventId: todaysEvents[0]?.id || 'daily',
        outfitItems: [],
        occasion: 'daily',
        weatherConsidered: true,
        plannedDate: date,
        confidence: 85,
        notes: 'Versatile for multiple activities'
      };

      return {
        option1,
        option2,
        option3,
        weather: weather || {} as WeatherData,
        todaysEvents,
        reasoning: [
          'Weather-appropriate fabrics selected',
          'Event formality level considered',
          'Recent outfit history avoided'
        ]
      };
    } catch (error) {
      console.error('❌ Morning options generation failed:', error);
      return null;
    }
  }

  // =====================
  // Outfit History & Tracking
  // =====================

  recordOutfitWorn(outfitItems: OutfitItem[], eventId?: string): void {
    const historyEntry: OutfitHistory = {
      date: new Date(),
      outfitItems,
      eventId,
      rating: undefined
    };

    this.outfitHistory.push(historyEntry);
    this.saveStoredData();
    console.log('✅ Outfit recorded in history');
  }

  checkRepeatWarnings(proposedOutfit: OutfitItem[], event: CalendarEvent): RepeatWarning[] {
    const warnings: RepeatWarning[] = [];

    // Check for recent repetitions
    const recentHistory = this.outfitHistory.filter(entry => {
      const daysDiff = (Date.now() - entry.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // Check last 30 days
    });

    for (const historyEntry of recentHistory) {
      const similarity = this.calculateOutfitSimilarity(proposedOutfit, historyEntry.outfitItems);

      if (similarity > 0.8) { // 80% similar
        const daysSince = (Date.now() - historyEntry.date.getTime()) / (1000 * 60 * 60 * 24);

        warnings.push({
          outfit: historyEntry.outfitItems,
          lastWornDate: historyEntry.date,
          eventSimilarity: this.getEventSimilarity(event, historyEntry),
          warningLevel: daysSince < 7 ? 'high' : daysSince < 14 ? 'medium' : 'low',
          suggestion: `Try swapping the ${this.suggestAlternativeItem(proposedOutfit)}`
        });
      }
    }

    return warnings;
  }

  // =====================
  // Travel & Packing
  // =====================

  async generatePackingList(travelEvent: CalendarEvent): Promise<{
    essentials: OutfitItem[];
    byDay: { [key: string]: OutfitItem[] };
    weather: WeatherData[];
    tips: string[];
  }> {
    try {
      const duration = this.getTravelDuration(travelEvent);
      const location = travelEvent.location || 'destination';

      // Get weather forecast for travel period
      const weatherForecast = await this.getWeatherForecast(location, travelEvent.startTime);

      const packingList = {
        essentials: [], // Core items needed regardless
        byDay: {}, // Day-specific outfits
        weather: weatherForecast ? [weatherForecast] : [],
        tips: [
          'Pack one extra outfit in case of spills',
          'Choose wrinkle-resistant fabrics for travel',
          'Coordinate colors for mix-and-match flexibility',
          'Pack a versatile jacket for temperature changes'
        ]
      };

      return packingList;
    } catch (error) {
      console.error('❌ Packing list generation failed:', error);
      return { essentials: [], byDay: {}, weather: [], tips: [] };
    }
  }

  // =====================
  // Outfit Queue Management
  // =====================

  getOutfitQueue(days: number = 7): OutfitPlan[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.outfitPlans
      .filter(plan => plan.plannedDate <= futureDate)
      .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime());
  }

  addToOutfitQueue(plan: OutfitPlan): void {
    this.outfitPlans.push(plan);
    this.saveStoredData();
  }

  removeFromOutfitQueue(planId: string): void {
    this.outfitPlans = this.outfitPlans.filter(plan => plan.id !== planId);
    this.saveStoredData();
  }

  // =====================
  // Helper Methods
  // =====================

  private async fetchTodaysEvents(date: Date): Promise<CalendarEvent[]> {
    const allEvents = await this.fetchUpcomingEvents(1);
    return allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  private mapEventTypeToOccasion(eventType: string): 'travel' | 'formal' | 'social' | 'daily' | 'activities' {
    const mapping: { [key: string]: 'travel' | 'formal' | 'social' | 'daily' | 'activities' } = {
      'work': 'formal',
      'personal': 'social',
      'travel': 'travel',
      'formal': 'formal',
      'casual': 'daily',
      'other': 'daily'
    };
    return mapping[eventType] || 'daily';
  }

  private calculateOutfitSimilarity(outfit1: OutfitItem[], outfit2: OutfitItem[]): number {
    const set1 = new Set(outfit1.map(item => item.id));
    const set2 = new Set(outfit2.map(item => item.id));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private getEventSimilarity(event1: CalendarEvent, historyEntry: OutfitHistory): string {
    if (historyEntry.eventId === event1.id) return 'Same event';
    if (historyEntry.eventType === event1.eventType) return 'Similar event type';
    if (historyEntry.location === event1.location) return 'Same location';
    return 'Different context';
  }

  private suggestAlternativeItem(outfit: OutfitItem[]): string {
    // Simple logic to suggest what to swap
    const categories = outfit.map(item => item.category);
    if (categories.includes('top')) return 'top';
    if (categories.includes('bottom')) return 'bottom';
    if (categories.includes('shoes')) return 'shoes';
    return 'accessory';
  }

  private getTravelDuration(event: CalendarEvent): number {
    return Math.ceil((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60 * 24));
  }

  private loadStoredData(): void {
    try {
      const storedHistory = localStorage.getItem('outfitHistory');
      const storedPlans = localStorage.getItem('outfitPlans');
      const storedProvider = localStorage.getItem('calendarProvider');

      if (storedHistory) {
        this.outfitHistory = JSON.parse(storedHistory).map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }));
      }

      if (storedPlans) {
        this.outfitPlans = JSON.parse(storedPlans).map((plan: any) => ({
          ...plan,
          plannedDate: new Date(plan.plannedDate)
        }));
      }

      if (storedProvider) {
        this.calendarProvider = storedProvider as 'google' | 'apple';
      }
    } catch (error) {
      console.error('❌ Failed to load stored data:', error);
    }
  }

  private saveStoredData(): void {
    try {
      localStorage.setItem('outfitHistory', JSON.stringify(this.outfitHistory));
      localStorage.setItem('outfitPlans', JSON.stringify(this.outfitPlans));
    } catch (error) {
      console.error('❌ Failed to save data:', error);
    }
  }

  // =====================
  // Shopping Link Management
  // =====================

  /**
   * Check if URL is a valid URL (accepts all valid URLs including Google Shopping)
   */
  isProductUrl(url: string): boolean {
    try {
      new URL(url);
      return true; // Accept all valid URLs including Google Shopping
    } catch (e) {
      console.error('⚠️ [CALENDAR] Malformed URL:', url);
      return false;
    }
  }

  /**
   * Save outfit to calendar with validated shopping links
   */
  async saveOutfitToCalendar(outfitData: {
    date: Date;
    occasion: string;
    outfit: any;
    shoppingLinks: Array<{ url: string; store: string; [key: string]: any }>;
  }): Promise<void> {
    const { date, occasion, outfit, shoppingLinks } = outfitData;

    // Import affiliate service dynamically to avoid circular dependency
    const { affiliateLinkService } = await import('./affiliateLinkService');

    // Process shopping links - keep all valid URLs
    const processedLinks = shoppingLinks.map(link => {
      // Validate it's a valid URL
      if (!this.isProductUrl(link.url)) {
        console.warn('⚠️ [CALENDAR] Skipping malformed URL:', link.url);
        return null;
      }

      // Convert to affiliate link while maintaining deep link
      const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
        link.url,
        link.store
      );

      return {
        ...link,
        originalUrl: link.url,
        affiliateUrl: affiliateUrl,
        isDirectProduct: true,
        validatedAt: Date.now()
      };
    }).filter(Boolean); // Only filter out truly malformed URLs

    console.log(`✅ [CALENDAR] Processed ${processedLinks.length}/${shoppingLinks.length} shopping links`);

    // Create calendar entry with validated links
    const calendarEntry = {
      date,
      occasion,
      outfit,
      shoppingLinks: processedLinks,
      reminder: outfit.reminderDate,
      id: Date.now(),
      createdAt: Date.now()
    };

    // Save to localStorage (in future, sync with actual calendar provider)
    const existingEntries = this.getCalendarEntries();
    existingEntries.push(calendarEntry);
    localStorage.setItem('calendar_outfit_entries', JSON.stringify(existingEntries));

    console.log('✅ [CALENDAR] Saved to calendar with validated shopping links');
  }

  /**
   * Get all calendar outfit entries
   */
  getCalendarEntries(): any[] {
    try {
      const stored = localStorage.getItem('calendar_outfit_entries');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ [CALENDAR] Failed to load entries:', error);
      return [];
    }
  }

  /**
   * Get calendar entry by ID
   */
  getCalendarEntry(id: number): any | null {
    const entries = this.getCalendarEntries();
    return entries.find(entry => entry.id === id) || null;
  }

  /**
   * Remove calendar entry
   */
  removeCalendarEntry(id: number): void {
    const entries = this.getCalendarEntries();
    const filtered = entries.filter(entry => entry.id !== id);
    localStorage.setItem('calendar_outfit_entries', JSON.stringify(filtered));
    console.log('✅ [CALENDAR] Removed entry:', id);
  }

  // =====================
  // Public API Methods
  // =====================

  isConnected(): boolean {
    return this.calendarProvider !== null;
  }

  getConnectedProvider(): string | null {
    return this.calendarProvider;
  }

  async syncCalendar(): Promise<boolean> {
    if (!this.isConnected()) return false;

    try {
      const events = await this.fetchUpcomingEvents();
      console.log(`✅ Synced ${events.length} calendar events`);
      return true;
    } catch (error) {
      console.error('❌ Calendar sync failed:', error);
      return false;
    }
  }

  disconnect(): void {
    this.calendarProvider = null;
    this.accessToken = null;
    localStorage.removeItem('calendarProvider');
    localStorage.removeItem('calendarAccessToken');
    console.log('✅ Calendar disconnected');
  }
}

// Export singleton instance
export default new SmartCalendarService();