/**
 * Smart Notification Service
 * Handles: daily outfit suggestions, weather-based alerts, wishlist item sales,
 * new style recommendations, and outfit planning for upcoming events
 */

import { weatherService, WeatherData } from './weatherService';
import { personalizedFashionService, DailySuggestions } from './personalizedFashionService';
import { enhancedClosetService, WishlistItemWithPriceHistory } from './enhancedClosetService';
import { userDataService } from './userDataService';

export interface NotificationPreferences {
  dailyOutfitSuggestions: {
    enabled: boolean;
    time: string; // "08:00" format
    daysOfWeek: string[]; // ["monday", "tuesday", ...]
  };
  weatherAlerts: {
    enabled: boolean;
    severityThreshold: 'low' | 'medium' | 'high';
    leadTime: number; // hours in advance
  };
  priceAlerts: {
    enabled: boolean;
    percentageThreshold: number; // notify when price drops by X%
    checkFrequency: 'hourly' | 'daily' | 'weekly';
  };
  styleRecommendations: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  eventPlanning: {
    enabled: boolean;
    leadTime: number; // days in advance
    calendarIntegration: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface Notification {
  id: string;
  type: 'daily_outfit' | 'weather_alert' | 'price_drop' | 'style_recommendation' | 'event_planning' | 'general';
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor: string;
  sentAt?: string;
  readAt?: string;
  data?: any;
  expiresAt?: string;
}

export interface WeatherAlert {
  severity: 'low' | 'medium' | 'high';
  type: 'temperature_change' | 'precipitation' | 'wind' | 'uv_warning' | 'extreme_weather';
  message: string;
  recommendations: string[];
  affectedTimeRange: {
    start: string;
    end: string;
  };
}

export interface PriceAlert {
  itemId: string;
  itemName: string;
  oldPrice: number;
  newPrice: number;
  percentageOff: number;
  store: string;
  validUntil?: string;
}

export interface EventOutfitPlanning {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventType: 'work' | 'social' | 'formal' | 'casual' | 'special';
  venue?: string;
  weatherForecast?: WeatherData;
  suggestedOutfits: string[]; // outfit IDs
  planningDeadline: string;
}

class SmartNotificationService {
  private notificationQueue: Notification[] = [];
  private scheduledNotifications = new Map<string, NodeJS.Timeout>();
  private backgroundTasks = new Map<string, NodeJS.Timeout>();

  private readonly DEFAULT_PREFERENCES: NotificationPreferences = {
    dailyOutfitSuggestions: {
      enabled: true,
      time: "08:00",
      daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    weatherAlerts: {
      enabled: true,
      severityThreshold: 'medium',
      leadTime: 2
    },
    priceAlerts: {
      enabled: true,
      percentageThreshold: 20,
      checkFrequency: 'daily'
    },
    styleRecommendations: {
      enabled: true,
      frequency: 'weekly'
    },
    eventPlanning: {
      enabled: true,
      leadTime: 3,
      calendarIntegration: false
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00"
    }
  };

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the notification service
   */
  private initializeService(): void {
    this.loadNotificationQueue();
    this.scheduleRecurringTasks();
    this.registerServiceWorker();
    console.log('🔔 [NOTIFICATIONS] Service initialized');
  }

  /**
   * Get user notification preferences
   */
  getNotificationPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('notificationPreferences');
      if (stored) {
        return { ...this.DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences');
    }
    return this.DEFAULT_PREFERENCES;
  }

  /**
   * Update notification preferences
   */
  updateNotificationPreferences(preferences: Partial<NotificationPreferences>): void {
    const current = this.getNotificationPreferences();
    const updated = { ...current, ...preferences };

    localStorage.setItem('notificationPreferences', JSON.stringify(updated));
    this.rescheduleRecurringTasks();
    console.log('🔔 [NOTIFICATIONS] Preferences updated');
  }

  /**
   * Schedule daily outfit suggestion notifications
   */
  scheduleDailyOutfitNotifications(): void {
    const preferences = this.getNotificationPreferences();

    if (!preferences.dailyOutfitSuggestions.enabled) return;

    preferences.dailyOutfitSuggestions.daysOfWeek.forEach(day => {
      const notification = this.createDailyOutfitNotification(
        preferences.dailyOutfitSuggestions.time,
        day
      );
      this.scheduleNotification(notification);
    });

    console.log('🔔 [NOTIFICATIONS] Daily outfit notifications scheduled');
  }

  /**
   * Create daily outfit notification
   */
  private createDailyOutfitNotification(time: string, dayOfWeek: string): Notification {
    const [hour, minute] = time.split(':').map(Number);
    const scheduledFor = this.getNextScheduleTime(dayOfWeek, hour, minute);

    return {
      id: `daily_outfit_${dayOfWeek}_${Date.now()}`,
      type: 'daily_outfit',
      title: '✨ Your Daily Outfit Suggestions Are Ready!',
      message: 'Check out 3 personalized outfit recommendations based on today\'s weather and your style.',
      priority: 'medium',
      scheduledFor: scheduledFor.toISOString(),
      actionUrl: '/outfits/daily',
      actionLabel: 'View Outfits',
      data: { dayOfWeek, time }
    };
  }

  /**
   * Check and send weather alerts
   */
  async checkWeatherAlerts(): Promise<void> {
    const preferences = this.getNotificationPreferences();

    if (!preferences.weatherAlerts.enabled) return;

    try {
      const currentWeather = await weatherService.getCurrentWeather();
      const alerts = this.analyzeWeatherForAlerts(currentWeather, preferences.weatherAlerts);

      for (const alert of alerts) {
        const notification = this.createWeatherAlertNotification(alert, currentWeather);
        await this.sendNotification(notification);
      }

      console.log(`🌤️ [NOTIFICATIONS] Checked weather alerts (${alerts.length} sent)`);
    } catch (error) {
      console.error('Failed to check weather alerts:', error);
    }
  }

  /**
   * Analyze weather for alert conditions
   */
  private analyzeWeatherForAlerts(weather: WeatherData, alertSettings: any): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const conditions = weatherService.analyzeWeatherConditions(weather);

    // Temperature alerts
    if (conditions.temperature === 'freezing' || conditions.temperature === 'hot') {
      alerts.push({
        severity: 'high',
        type: 'temperature_change',
        message: `Extreme ${conditions.temperature} weather expected`,
        recommendations: this.getTemperatureRecommendations(conditions.temperature),
        affectedTimeRange: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // Precipitation alerts
    if (conditions.precipitation === 'heavy' || conditions.precipitation === 'moderate') {
      alerts.push({
        severity: conditions.precipitation === 'heavy' ? 'high' : 'medium',
        type: 'precipitation',
        message: `${conditions.precipitation} rain expected`,
        recommendations: ['Bring waterproof jacket', 'Wear waterproof shoes', 'Carry umbrella'],
        affectedTimeRange: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // UV warnings
    if (conditions.uv === 'very_high' || conditions.uv === 'high') {
      alerts.push({
        severity: 'medium',
        type: 'uv_warning',
        message: `${conditions.uv} UV levels today`,
        recommendations: ['Wear sunglasses', 'Use sunscreen', 'Consider long sleeves', 'Wear a hat'],
        affectedTimeRange: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // Filter by severity threshold
    return alerts.filter(alert =>
      this.meetsSeverityThreshold(alert.severity, alertSettings.severityThreshold)
    );
  }

  /**
   * Get temperature-specific recommendations
   */
  private getTemperatureRecommendations(temperature: string): string[] {
    const recommendations = {
      'freezing': ['Layer with thermal underwear', 'Wear heavy coat', 'Don\'t forget gloves and hat', 'Waterproof boots recommended'],
      'cold': ['Layer up', 'Wear warm coat', 'Consider scarf and gloves'],
      'hot': ['Wear light colors', 'Choose breathable fabrics', 'Stay hydrated', 'Wear sunscreen'],
      'warm': ['Light layers', 'Breathable materials', 'Consider removing jacket']
    };

    return recommendations[temperature as keyof typeof recommendations] || [];
  }

  /**
   * Create weather alert notification
   */
  private createWeatherAlertNotification(alert: WeatherAlert, weather: WeatherData): Notification {
    const emoji = this.getWeatherEmoji(alert.type);

    return {
      id: `weather_alert_${Date.now()}`,
      type: 'weather_alert',
      title: `${emoji} Weather Alert`,
      message: alert.message,
      priority: alert.severity,
      scheduledFor: new Date().toISOString(),
      data: { alert, weather },
      expiresAt: alert.affectedTimeRange.end
    };
  }

  /**
   * Check wishlist for price drops
   */
  async checkPriceAlerts(): Promise<void> {
    const preferences = this.getNotificationPreferences();

    if (!preferences.priceAlerts.enabled) return;

    try {
      const wishlistWithPrices = await enhancedClosetService.monitorWishlistPrices();
      const priceDrops = this.identifyPriceDrops(wishlistWithPrices, preferences.priceAlerts);

      for (const priceDrop of priceDrops) {
        const notification = this.createPriceAlertNotification(priceDrop);
        await this.sendNotification(notification);
      }

      console.log(`💰 [NOTIFICATIONS] Checked price alerts (${priceDrops.length} drops found)`);
    } catch (error) {
      console.error('Failed to check price alerts:', error);
    }
  }

  /**
   * Identify price drops from wishlist monitoring
   */
  private identifyPriceDrops(wishlist: WishlistItemWithPriceHistory[], alertSettings: any): PriceAlert[] {
    const priceDrops: PriceAlert[] = [];

    wishlist.forEach(item => {
      if (item.priceHistory.length < 2) return;

      const currentPrice = item.currentPrice;
      const previousPrice = item.priceHistory[item.priceHistory.length - 2].price;

      if (previousPrice > currentPrice) {
        const percentageOff = ((previousPrice - currentPrice) / previousPrice) * 100;

        if (percentageOff >= alertSettings.percentageThreshold) {
          priceDrops.push({
            itemId: item.id,
            itemName: item.name,
            oldPrice: previousPrice,
            newPrice: currentPrice,
            percentageOff,
            store: item.store || 'Unknown Store'
          });
        }
      }
    });

    return priceDrops;
  }

  /**
   * Create price alert notification
   */
  private createPriceAlertNotification(priceDrop: PriceAlert): Notification {
    return {
      id: `price_alert_${priceDrop.itemId}_${Date.now()}`,
      type: 'price_drop',
      title: '💸 Price Drop Alert!',
      message: `${priceDrop.itemName} is now ${priceDrop.percentageOff.toFixed(0)}% off at ${priceDrop.store}`,
      priority: 'high',
      scheduledFor: new Date().toISOString(),
      actionUrl: `/wishlist/${priceDrop.itemId}`,
      actionLabel: 'Shop Now',
      data: priceDrop,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  /**
   * Generate style recommendations
   */
  async generateStyleRecommendations(): Promise<void> {
    const preferences = this.getNotificationPreferences();

    if (!preferences.styleRecommendations.enabled) return;

    try {
      const recommendations = userDataService.getPersonalizedRecommendations();
      const closetAnalytics = enhancedClosetService.analyzeCloset();

      // Find style gaps and opportunities
      const styleGaps = this.identifyStyleGaps(closetAnalytics, recommendations);

      if (styleGaps.length > 0) {
        const notification = this.createStyleRecommendationNotification(styleGaps);
        await this.sendNotification(notification);
      }

      console.log(`🎨 [NOTIFICATIONS] Generated style recommendations (${styleGaps.length} gaps found)`);
    } catch (error) {
      console.error('Failed to generate style recommendations:', error);
    }
  }

  /**
   * Identify style gaps from closet analysis
   */
  private identifyStyleGaps(analytics: any, recommendations: any): string[] {
    const gaps: string[] = [];

    // Check for seasonal gaps
    if (analytics.seasonalGaps?.length > 0) {
      gaps.push(`Missing ${analytics.seasonalGaps.join(', ')} clothing`);
    }

    // Check for occasion gaps
    if (analytics.occasionGaps?.length > 0) {
      gaps.push(`Need more ${analytics.occasionGaps.join(', ')} outfits`);
    }

    // Check utilization
    if (analytics.utilizationRate < 0.3) {
      gaps.push('Many items are underutilized - try new combinations');
    }

    // Check style consistency
    if (analytics.styleConsistency < 0.5) {
      gaps.push('Consider adding signature pieces to define your style');
    }

    return gaps.slice(0, 3); // Limit to top 3 recommendations
  }

  /**
   * Create style recommendation notification
   */
  private createStyleRecommendationNotification(gaps: string[]): Notification {
    return {
      id: `style_recommendation_${Date.now()}`,
      type: 'style_recommendation',
      title: '👗 New Style Insights!',
      message: `We found ${gaps.length} ways to enhance your wardrobe`,
      priority: 'low',
      scheduledFor: new Date().toISOString(),
      actionUrl: '/closet/analytics',
      actionLabel: 'View Insights',
      data: { gaps }
    };
  }

  /**
   * Plan outfits for upcoming events
   */
  async planEventOutfits(): Promise<void> {
    const preferences = this.getNotificationPreferences();

    if (!preferences.eventPlanning.enabled) return;

    try {
      const upcomingEvents = await this.getUpcomingEvents(preferences.eventPlanning.leadTime);

      for (const event of upcomingEvents) {
        const outfitPlan = await this.createEventOutfitPlan(event);
        const notification = this.createEventPlanningNotification(outfitPlan);
        await this.sendNotification(notification);
      }

      console.log(`📅 [NOTIFICATIONS] Planned outfits for ${upcomingEvents.length} events`);
    } catch (error) {
      console.error('Failed to plan event outfits:', error);
    }
  }

  /**
   * Get upcoming events (mock implementation)
   */
  private async getUpcomingEvents(leadTimeDays: number): Promise<any[]> {
    // In a real implementation, this would integrate with calendar APIs
    // For now, return mock events based on common schedules
    const events = [];
    const now = new Date();

    // Example: work meetings, social events, etc.
    for (let i = 1; i <= leadTimeDays; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + i);

      // Mock business events on weekdays
      if (eventDate.getDay() >= 1 && eventDate.getDay() <= 5) {
        events.push({
          id: `work_event_${eventDate.getTime()}`,
          name: 'Important Meeting',
          date: eventDate.toISOString(),
          type: 'work',
          venue: 'Office'
        });
      }

      // Mock social events on weekends
      if (eventDate.getDay() === 6 || eventDate.getDay() === 0) {
        events.push({
          id: `social_event_${eventDate.getTime()}`,
          name: 'Social Gathering',
          date: eventDate.toISOString(),
          type: 'social',
          venue: 'Restaurant'
        });
      }
    }

    return events.slice(0, 2); // Limit to 2 events for demo
  }

  /**
   * Create outfit plan for an event
   */
  private async createEventOutfitPlan(event: any): Promise<EventOutfitPlanning> {
    // Generate outfit suggestions based on event type
    const suggestions = await personalizedFashionService.generateDailySuggestions(
      this.mapEventTypeToOccasion(event.type)
    );

    return {
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventType: event.type,
      venue: event.venue,
      suggestedOutfits: suggestions.suggestions.map(s => s.id),
      planningDeadline: new Date(new Date(event.date).getTime() - 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Map event type to occasion for outfit generation
   */
  private mapEventTypeToOccasion(eventType: string): string {
    const mapping = {
      'work': 'work_casual',
      'social': 'dinner_out',
      'formal': 'date_night',
      'casual': 'weekend_casual',
      'special': 'dinner_out'
    };

    return mapping[eventType as keyof typeof mapping] || 'weekend_casual';
  }

  /**
   * Create event planning notification
   */
  private createEventPlanningNotification(plan: EventOutfitPlanning): Notification {
    const eventDate = new Date(plan.eventDate);
    const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      id: `event_planning_${plan.eventId}`,
      type: 'event_planning',
      title: '📅 Outfit Planning Reminder',
      message: `Plan your outfit for "${plan.eventName}" in ${daysUntil} days`,
      priority: 'medium',
      scheduledFor: new Date().toISOString(),
      actionUrl: `/events/${plan.eventId}/outfits`,
      actionLabel: 'Plan Outfit',
      data: plan,
      expiresAt: plan.planningDeadline
    };
  }

  /**
   * Send notification to user
   */
  async sendNotification(notification: Notification): Promise<void> {
    // Check quiet hours
    if (this.isQuietHours()) {
      notification.scheduledFor = this.getNextActiveTime().toISOString();
      this.scheduleNotification(notification);
      return;
    }

    // Add to queue
    this.notificationQueue.push(notification);
    this.saveNotificationQueue();

    // Mark as sent
    notification.sentAt = new Date().toISOString();

    // Show notification based on environment
    if (this.isServiceWorkerAvailable()) {
      await this.sendPushNotification(notification);
    } else {
      this.showBrowserNotification(notification);
    }

    console.log(`🔔 [NOTIFICATIONS] Sent: ${notification.title}`);
  }

  /**
   * Schedule a notification for later delivery
   */
  scheduleNotification(notification: Notification): void {
    const scheduleTime = new Date(notification.scheduledFor).getTime();
    const now = Date.now();
    const delay = scheduleTime - now;

    if (delay > 0) {
      const timeoutId = setTimeout(async () => {
        await this.sendNotification(notification);
        this.scheduledNotifications.delete(notification.id);
      }, delay);

      this.scheduledNotifications.set(notification.id, timeoutId);
      console.log(`🔔 [NOTIFICATIONS] Scheduled: ${notification.title} for ${notification.scheduledFor}`);
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        tag: notification.id,
        data: notification.data
      });

      browserNotification.onclick = () => {
        window.focus();

        // Handle shopping links from reminders
        if (notification.data?.shoppingLinks && notification.data.shoppingLinks.length > 0) {
          console.log('🛍️ [NOTIFICATION] Opening shopping links from reminder:', {
            count: notification.data.shoppingLinks.length,
            occasion: notification.data.occasion
          });

          // Open shopping links in new tabs
          notification.data.shoppingLinks.forEach((link: string, index: number) => {
            setTimeout(() => {
              window.open(link, '_blank');
              console.log(`✅ [NOTIFICATION] Opened shopping link ${index + 1}/${notification.data.shoppingLinks.length}`);
            }, index * 300); // Stagger by 300ms to avoid popup blocker
          });

          // Track conversion
          this.trackNotificationConversion(notification);
        } else if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }

        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => browserNotification.close(), 10000);
    }
  }

  /**
   * Track when user clicks through notification to shopping links
   */
  private trackNotificationConversion(notification: Notification): void {
    try {
      const conversion = {
        notificationId: notification.id,
        reminderId: notification.data?.reminderId,
        occasion: notification.data?.occasion,
        linksCount: notification.data?.shoppingLinks?.length || 0,
        timestamp: Date.now()
      };

      // Store conversion in localStorage for analytics
      const conversions = JSON.parse(localStorage.getItem('notification_conversions') || '[]');
      conversions.push(conversion);
      localStorage.setItem('notification_conversions', JSON.stringify(conversions.slice(-100))); // Keep last 100

      console.log('📊 [CONVERSION] Notification click-through tracked:', conversion);
    } catch (error) {
      console.error('❌ [CONVERSION] Failed to track conversion:', error);
    }
  }

  /**
   * Send push notification via service worker
   */
  private async sendPushNotification(notification: Notification): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: notification.data,
          actions: notification.actionLabel ? [{
            action: 'view',
            title: notification.actionLabel
          }] : undefined
        });
      } catch (error) {
        console.error('Failed to send push notification:', error);
        this.showBrowserNotification(notification);
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Register service worker for push notifications
   */
  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('🔔 [NOTIFICATIONS] Service worker registered');
        })
        .catch(error => {
          console.error('Service worker registration failed:', error);
        });
    }
  }

  /**
   * Check if it's currently quiet hours
   */
  private isQuietHours(): boolean {
    const preferences = this.getNotificationPreferences();

    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHours.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Spans midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get next active time (after quiet hours)
   */
  private getNextActiveTime(): Date {
    const preferences = this.getNotificationPreferences();
    const now = new Date();
    const nextActiveTime = new Date(now);

    if (preferences.quietHours.enabled) {
      const [endHour, endMinute] = preferences.quietHours.endTime.split(':').map(Number);
      nextActiveTime.setHours(endHour, endMinute, 0, 0);

      if (nextActiveTime <= now) {
        nextActiveTime.setDate(nextActiveTime.getDate() + 1);
      }
    }

    return nextActiveTime;
  }

  /**
   * Helper methods
   */
  private getNextScheduleTime(dayOfWeek: string, hour: number, minute: number): Date {
    const dayMap = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
      'friday': 5, 'saturday': 6, 'sunday': 0
    };

    const targetDay = dayMap[dayOfWeek as keyof typeof dayMap];
    const now = new Date();
    const scheduledDate = new Date();

    scheduledDate.setHours(hour, minute, 0, 0);

    const daysUntil = (targetDay + 7 - now.getDay()) % 7;
    if (daysUntil === 0 && now.getTime() > scheduledDate.getTime()) {
      scheduledDate.setDate(scheduledDate.getDate() + 7);
    } else {
      scheduledDate.setDate(scheduledDate.getDate() + daysUntil);
    }

    return scheduledDate;
  }

  private meetsSeverityThreshold(alertSeverity: string, threshold: string): boolean {
    const severityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'urgent': 4 };
    return severityLevels[alertSeverity as keyof typeof severityLevels] >=
           severityLevels[threshold as keyof typeof severityLevels];
  }

  private getWeatherEmoji(alertType: string): string {
    const emojis = {
      'temperature_change': '🌡️',
      'precipitation': '🌧️',
      'wind': '💨',
      'uv_warning': '☀️',
      'extreme_weather': '⚠️'
    };
    return emojis[alertType as keyof typeof emojis] || '🌤️';
  }

  private isServiceWorkerAvailable(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Recurring task management
   */
  private scheduleRecurringTasks(): void {
    // Schedule daily outfit notifications
    this.scheduleDailyOutfitNotifications();

    // Weather alerts every 4 hours
    this.backgroundTasks.set('weather_alerts', setInterval(() => {
      this.checkWeatherAlerts();
    }, 4 * 60 * 60 * 1000));

    // Price alerts based on frequency
    const priceAlertInterval = this.getIntervalFromFrequency(
      this.getNotificationPreferences().priceAlerts.checkFrequency
    );
    this.backgroundTasks.set('price_alerts', setInterval(() => {
      this.checkPriceAlerts();
    }, priceAlertInterval));

    // Style recommendations weekly
    this.backgroundTasks.set('style_recommendations', setInterval(() => {
      this.generateStyleRecommendations();
    }, 7 * 24 * 60 * 60 * 1000));

    // Event planning daily
    this.backgroundTasks.set('event_planning', setInterval(() => {
      this.planEventOutfits();
    }, 24 * 60 * 60 * 1000));
  }

  private rescheduleRecurringTasks(): void {
    // Clear existing tasks
    this.backgroundTasks.forEach(task => clearInterval(task));
    this.backgroundTasks.clear();

    this.scheduledNotifications.forEach(task => clearTimeout(task));
    this.scheduledNotifications.clear();

    // Reschedule with new preferences
    this.scheduleRecurringTasks();
  }

  private getIntervalFromFrequency(frequency: string): number {
    const intervals = {
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000
    };
    return intervals[frequency as keyof typeof intervals] || intervals.daily;
  }

  /**
   * Notification queue management
   */
  private loadNotificationQueue(): void {
    try {
      const stored = localStorage.getItem('notificationQueue');
      if (stored) {
        this.notificationQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load notification queue');
    }
  }

  private saveNotificationQueue(): void {
    try {
      localStorage.setItem('notificationQueue', JSON.stringify(this.notificationQueue));
    } catch (error) {
      console.error('Failed to save notification queue');
    }
  }

  /**
   * Get notification history
   */
  getNotificationHistory(limit: number = 50): Notification[] {
    return this.notificationQueue
      .filter(n => n.sentAt)
      .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())
      .slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notificationQueue.find(n => n.id === notificationId);
    if (notification) {
      notification.readAt = new Date().toISOString();
      this.saveNotificationQueue();
    }
  }

  /**
   * Clear old notifications
   */
  clearOldNotifications(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.notificationQueue = this.notificationQueue.filter(notification => {
      const notificationDate = new Date(notification.scheduledFor);
      return notificationDate > cutoffDate;
    });

    this.saveNotificationQueue();
    console.log('🧹 [NOTIFICATIONS] Cleared old notifications');
  }
}

// Singleton instance
export const smartNotificationService = new SmartNotificationService();
export default smartNotificationService;