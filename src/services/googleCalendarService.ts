/**
 * Google Calendar Service
 * Syncs outfit calendar events to user's Google Calendar using Supabase OAuth
 * Requires Google OAuth with Calendar scope
 */

import { supabase } from './supabaseClient';

interface GoogleCalendarEvent {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

class GoogleCalendarService {
  /**
   * Check if user has Google Calendar connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isConnected = !!(session?.provider_token && session?.provider === 'google');

      if (isConnected) {
        console.log('✅ [GOOGLE-CAL] User has Google Calendar access');
      } else {
        console.log('ℹ️ [GOOGLE-CAL] Google Calendar not connected');
      }

      return isConnected;
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error checking connection:', error);
      return false;
    }
  }

  /**
   * Get user's Google access token from Supabase session
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token || null;

      if (!token) {
        console.warn('⚠️ [GOOGLE-CAL] No access token available');
      }

      return token;
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error getting access token:', error);
      return null;
    }
  }

  /**
   * Sync event to Google Calendar
   */
  async syncEvent(eventData: GoogleCalendarEvent): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        throw new Error('No Google Calendar access token');
      }

      // Format event for Google Calendar API
      const calendarEvent = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.start_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.end_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location || '',
      };

      console.log('📅 [GOOGLE-CAL] Syncing event to Google Calendar:', calendarEvent.summary);

      // Create event in Google Calendar
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CAL] Sync failed:', error);
        throw new Error(`Failed to sync to Google Calendar: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ [GOOGLE-CAL] Event synced successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error syncing event:', error);
      throw error;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(googleEventId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        throw new Error('No Google Calendar access token');
      }

      console.log('🗑️ [GOOGLE-CAL] Deleting event:', googleEventId);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ [GOOGLE-CAL] Delete failed:', error);
        throw new Error('Failed to delete from Google Calendar');
      }

      console.log('✅ [GOOGLE-CAL] Event deleted successfully');
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(googleEventId: string, eventData: GoogleCalendarEvent): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        throw new Error('No Google Calendar access token');
      }

      const calendarEvent = {
        summary: eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.start_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.end_time,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location || '',
      };

      console.log('📝 [GOOGLE-CAL] Updating event:', googleEventId);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CAL] Update failed:', error);
        throw new Error('Failed to update Google Calendar event');
      }

      const result = await response.json();
      console.log('✅ [GOOGLE-CAL] Event updated successfully');
      return result;
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error updating event:', error);
      throw error;
    }
  }

  /**
   * Fetch events from Google Calendar (optional - for future two-way sync)
   */
  async fetchEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();

      if (!accessToken) {
        throw new Error('No Google Calendar access token');
      }

      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      console.log('🔍 [GOOGLE-CAL] Fetching events from Google Calendar');

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Google Calendar events');
      }

      const result = await response.json();
      console.log(`✅ [GOOGLE-CAL] Fetched ${result.items?.length || 0} events`);
      return result.items || [];
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Get detailed sync status with last sync time and email
   */
  async getSyncStatus(): Promise<{
    isConnected: boolean;
    lastSync: string | null;
    email: string | null;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.provider_token || session?.provider !== 'google') {
        return {
          isConnected: false,
          lastSync: null,
          email: null
        };
      }

      return {
        isConnected: true,
        lastSync: new Date().toISOString(),
        email: session.user?.email || null
      };
    } catch (error) {
      console.error('❌ [GOOGLE-CAL] Error getting sync status:', error);
      return {
        isConnected: false,
        lastSync: null,
        email: null
      };
    }
  }

  /**
   * Disconnect Google Calendar
   * Note: Supabase doesn't provide direct scope revocation
   * Users should manage this in their Google Account settings
   */
  async disconnect(): Promise<void> {
    console.log('ℹ️ [GOOGLE-CAL] To fully disconnect Google Calendar:');
    console.log('1. Go to https://myaccount.google.com/permissions');
    console.log('2. Find "TheFitChecked" and remove access');
    console.log('3. Or sign out and sign back in without calendar permissions');
  }
}

// Export singleton instance
export default new GoogleCalendarService();
