/**
 * Google Calendar Integration Service
 * Handles OAuth authentication and calendar event synchronization
 */

import { CalendarEvent } from './smartCalendarService';

// Google Calendar API configuration
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  eventType?: string;
}

interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  accountEmail: string | null;
}

class GoogleCalendarService {
  private gapiInited = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  constructor() {
    this.loadGapi();
  }

  /**
   * Load Google API client library
   */
  private async loadGapi(): Promise<void> {
    try {
      // Load gapi script
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve();
        script.onerror = reject;
        document.body.appendChild(script);
      });

      await this.initializeGapiClient();
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Failed to load Google API:', error);
    }
  }

  /**
   * Initialize Google API client
   */
  private async initializeGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      (window as any).gapi.load('client', async () => {
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

          if (!apiKey) {
            console.warn('⚠️ [GOOGLE-CAL] No Google API key found');
            reject(new Error('No Google API key'));
            return;
          }

          await (window as any).gapi.client.init({
            apiKey: apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });

          this.gapiInited = true;
          console.log('✅ [GOOGLE-CAL] Google API client initialized');
          resolve();
        } catch (error) {
          console.error('❌ [GOOGLE-CAL] Failed to initialize gapi client:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Initialize Google OAuth token client
   */
  private initializeTokenClient(callback: (response: any) => void): void {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error('❌ [GOOGLE-CAL] No Google Client ID found');
      return;
    }

    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: callback,
    });
  }

  /**
   * Connect to Google Calendar (OAuth flow)
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.gapiInited) {
        reject(new Error('Google API not initialized'));
        return;
      }

      // Load GIS (Google Identity Services) library
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.initializeTokenClient((response: any) => {
          if (response.error) {
            console.error('❌ [GOOGLE-CAL] OAuth error:', response);
            reject(response.error);
            return;
          }

          this.accessToken = response.access_token;

          // Store access token in localStorage
          localStorage.setItem('google_calendar_token', this.accessToken);
          localStorage.setItem('google_calendar_connected', 'true');
          localStorage.setItem('google_calendar_last_sync', new Date().toISOString());

          console.log('✅ [GOOGLE-CAL] Successfully connected to Google Calendar');
          resolve(true);
        });

        // Request access token
        this.tokenClient.requestAccessToken({ prompt: '' });
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Disconnect from Google Calendar
   */
  disconnect(): void {
    if (this.accessToken) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken);
      this.accessToken = null;
    }

    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_connected');
    localStorage.removeItem('google_calendar_last_sync');
    localStorage.removeItem('google_calendar_email');

    console.log('🔌 [GOOGLE-CAL] Disconnected from Google Calendar');
  }

  /**
   * Check if Google Calendar is connected
   */
  isConnected(): boolean {
    const connected = localStorage.getItem('google_calendar_connected') === 'true';
    const token = localStorage.getItem('google_calendar_token');

    if (connected && token) {
      this.accessToken = token;
      return true;
    }

    return false;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    const isConnected = this.isConnected();
    const lastSyncStr = localStorage.getItem('google_calendar_last_sync');
    const email = localStorage.getItem('google_calendar_email');

    return {
      isConnected,
      lastSyncTime: lastSyncStr ? new Date(lastSyncStr) : null,
      error: null,
      accountEmail: email
    };
  }

  /**
   * Fetch events from Google Calendar
   */
  async fetchEvents(daysAhead: number = 30): Promise<CalendarEvent[]> {
    if (!this.gapiInited || !this.accessToken) {
      throw new Error('Google Calendar not connected');
    }

    try {
      const now = new Date();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + daysAhead);

      const response = await (window as any).gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: timeMax.toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime',
      });

      const events: CalendarEvent[] = response.result.items.map((event: GoogleCalendarEvent) =>
        this.convertGoogleEventToCalendarEvent(event)
      );

      // Update last sync time
      localStorage.setItem('google_calendar_last_sync', new Date().toISOString());

      console.log(`✅ [GOOGLE-CAL] Fetched ${events.length} events from Google Calendar`);
      return events;

    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Failed to fetch events:', error);
      throw error;
    }
  }

  /**
   * Convert Google Calendar event to our CalendarEvent format
   */
  private convertGoogleEventToCalendarEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
    const startTime = googleEvent.start.dateTime
      ? new Date(googleEvent.start.dateTime)
      : new Date(googleEvent.start.date + 'T00:00:00');

    const endTime = googleEvent.end.dateTime
      ? new Date(googleEvent.end.dateTime)
      : new Date(googleEvent.end.date + 'T23:59:59');

    // Determine event type based on keywords
    const eventType = this.determineEventType(googleEvent.summary, googleEvent.description);

    return {
      id: `google_${googleEvent.id}`,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description,
      location: googleEvent.location,
      startTime,
      endTime,
      isAllDay: !googleEvent.start.dateTime,
      eventType,
      source: 'google_calendar'
    };
  }

  /**
   * Determine event type from title and description
   */
  private determineEventType(title?: string, description?: string): 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other' {
    const text = `${title} ${description}`.toLowerCase();

    if (text.includes('meeting') || text.includes('work') || text.includes('office') || text.includes('conference')) {
      return 'work';
    }
    if (text.includes('trip') || text.includes('flight') || text.includes('travel') || text.includes('vacation')) {
      return 'travel';
    }
    if (text.includes('wedding') || text.includes('gala') || text.includes('formal') || text.includes('black tie')) {
      return 'formal';
    }
    if (text.includes('birthday') || text.includes('party') || text.includes('dinner') || text.includes('lunch')) {
      return 'personal';
    }
    if (text.includes('gym') || text.includes('workout') || text.includes('casual') || text.includes('coffee')) {
      return 'casual';
    }

    return 'other';
  }

  /**
   * Get user's Google account info
   */
  async getUserInfo(): Promise<{ email: string; name: string } | null> {
    if (!this.gapiInited || !this.accessToken) {
      return null;
    }

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      const data = await response.json();

      // Store email
      localStorage.setItem('google_calendar_email', data.email);

      return {
        email: data.email,
        name: data.name
      };
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Sync events with local storage/Supabase
   */
  async syncEvents(saveToSupabase: (events: CalendarEvent[]) => Promise<void>): Promise<number> {
    try {
      const googleEvents = await this.fetchEvents(60); // 60 days ahead

      // Save to Supabase or local storage
      await saveToSupabase(googleEvents);

      console.log(`✅ [GOOGLE-CAL] Synced ${googleEvents.length} events`);
      return googleEvents.length;
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Sync failed:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;
