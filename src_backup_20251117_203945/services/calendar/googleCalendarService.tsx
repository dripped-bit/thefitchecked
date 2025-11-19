/**
 * Google Calendar Service - Updated for Multi-Calendar Support
 *
 * Now uses calendarConnectionManager instead of session.provider_token
 * This allows users to connect Google Calendar regardless of how they signed in
 */

import { calendarConnectionManager } from './calendarConnectionManager';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
  htmlLink?: string;
}

class GoogleCalendarService {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

  /**
   * Get access token from calendar connection (not auth session)
   */
  private async getAccessToken(): Promise<string> {
    try {
      return await calendarConnectionManager.getValidToken('google');
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR] No Google Calendar connected:', error);
      throw new Error('Please connect your Google Calendar in settings');
    }
  }

  /**
   * Fetch events from Google Calendar
   */
  async getEvents(
    startDate: Date,
    endDate: Date,
    calendarId: string = 'primary'
  ): Promise<CalendarEvent[]> {
    try {
      const accessToken = await this.getAccessToken();

      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '100',
      });

      console.log(`📅 [GOOGLE-CALENDAR] Fetching events from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CALENDAR] API Error:', error);
        throw new Error(error.error?.message || 'Failed to fetch calendar events');
      }

      const data = await response.json();

      const events: CalendarEvent[] = (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Untitled Event',
        description: item.description,
        start: item.start.dateTime || item.start.date,
        end: item.end.dateTime || item.end.date,
        location: item.location,
        status: item.status,
        htmlLink: item.htmlLink,
      }));

      console.log(`✅ [GOOGLE-CALENDAR] Fetched ${events.length} events`);
      return events;
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR] Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(
    event: {
      summary: string;
      description?: string;
      start: string;
      end: string;
      location?: string;
    },
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    try {
      const accessToken = await this.getAccessToken();

      console.log('📝 [GOOGLE-CALENDAR] Creating event:', event.summary);

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.summary,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            location: event.location,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CALENDAR] Create Error:', error);
        throw new Error(error.error?.message || 'Failed to create event');
      }

      const data = await response.json();

      console.log('✅ [GOOGLE-CALENDAR] Event created:', data.id);

      return {
        id: data.id,
        summary: data.summary,
        description: data.description,
        start: data.start.dateTime || data.start.date,
        end: data.end.dateTime || data.end.date,
        location: data.location,
        status: data.status,
        htmlLink: data.htmlLink,
      };
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR] Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      start?: string;
      end?: string;
      location?: string;
    },
    calendarId: string = 'primary'
  ): Promise<CalendarEvent> {
    try {
      const accessToken = await this.getAccessToken();

      console.log('✏️ [GOOGLE-CALENDAR] Updating event:', eventId);

      const body: any = {};
      if (updates.summary) body.summary = updates.summary;
      if (updates.description) body.description = updates.description;
      if (updates.start) body.start = { dateTime: updates.start };
      if (updates.end) body.end = { dateTime: updates.end };
      if (updates.location) body.location = updates.location;

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CALENDAR] Update Error:', error);
        throw new Error(error.error?.message || 'Failed to update event');
      }

      const data = await response.json();

      console.log('✅ [GOOGLE-CALENDAR] Event updated');

      return {
        id: data.id,
        summary: data.summary,
        description: data.description,
        start: data.start.dateTime || data.start.date,
        end: data.end.dateTime || data.end.date,
        location: data.location,
        status: data.status,
        htmlLink: data.htmlLink,
      };
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR] Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      console.log('🗑️ [GOOGLE-CALENDAR] Deleting event:', eventId);

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ [GOOGLE-CALENDAR] Delete Error:', error);
        throw new Error(error.error?.message || 'Failed to delete event');
      }

      console.log('✅ [GOOGLE-CALENDAR] Event deleted');
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR] Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Check if user has Google Calendar connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const connection = await calendarConnectionManager.getConnectionByProvider('google');
      return connection !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get calendar email (if available)
   */
  async getCalendarEmail(): Promise<string | null> {
    try {
      const connection = await calendarConnectionManager.getConnectionByProvider('google');
      return connection?.calendar_email || null;
    } catch (error) {
      return null;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
