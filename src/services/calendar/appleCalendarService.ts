/**
 * Apple Calendar Service - CalDAV Implementation
 *
 * Apple Calendar uses CalDAV protocol for calendar access.
 * Requires app-specific password from iCloud settings.
 */

import { calendarConnectionManager } from './calendarConnectionManager';
import { CalendarEvent } from './googleCalendarService';

interface CalDAVEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  location?: string;
  status?: string;
}

class AppleCalendarService {
  private readonly CALDAV_BASE = 'https://caldav.icloud.com';

  /**
   * Get CalDAV credentials from calendar connection
   */
  private async getCredentials(): Promise<{ username: string; password: string }> {
    try {
      const connection = await calendarConnectionManager.getConnectionByProvider('apple');

      if (!connection) {
        throw new Error('Please connect your Apple Calendar in settings');
      }

      // For Apple Calendar, we store:
      // - access_token = app-specific password
      // - calendar_email = Apple ID email
      return {
        username: connection.calendar_email || '',
        password: connection.access_token,
      };
    } catch (error) {
      console.error('❌ [APPLE-CALENDAR] No Apple Calendar connected:', error);
      throw new Error('Please connect your Apple Calendar in settings');
    }
  }

  /**
   * Make CalDAV request
   */
  private async calDAVRequest(
    method: string,
    path: string,
    body?: string,
    depth: string = '1'
  ): Promise<Response> {
    const credentials = await this.getCredentials();
    const auth = btoa(`${credentials.username}:${credentials.password}`);

    const response = await fetch(`${this.CALDAV_BASE}${path}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': depth,
      },
      body,
    });

    return response;
  }

  /**
   * Get calendar home URL for user
   */
  private async getCalendarHome(): Promise<string> {
    const credentials = await this.getCredentials();

    // Apple's CalDAV home is typically at this path
    return `/${credentials.username.split('@')[0]}/calendars/`;
  }

  /**
   * Parse iCalendar format to our CalendarEvent format
   */
  private parseICalendar(icalData: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Split by VEVENT blocks
    const eventBlocks = icalData.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i];
      const endIndex = block.indexOf('END:VEVENT');
      const eventData = block.substring(0, endIndex);

      // Parse event properties
      const uid = this.extractProperty(eventData, 'UID');
      const summary = this.extractProperty(eventData, 'SUMMARY');
      const description = this.extractProperty(eventData, 'DESCRIPTION');
      const dtstart = this.extractProperty(eventData, 'DTSTART');
      const dtend = this.extractProperty(eventData, 'DTEND');
      const location = this.extractProperty(eventData, 'LOCATION');
      const status = this.extractProperty(eventData, 'STATUS');

      if (uid && dtstart && dtend) {
        events.push({
          id: uid,
          summary: summary || 'Untitled Event',
          description,
          start: this.parseICalDate(dtstart),
          end: this.parseICalDate(dtend),
          location,
          status: status?.toLowerCase(),
        });
      }
    }

    return events;
  }

  /**
   * Extract property from iCalendar data
   */
  private extractProperty(data: string, property: string): string {
    const regex = new RegExp(`${property}[^:]*:(.+)`, 'i');
    const match = data.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Parse iCalendar date to ISO string
   */
  private parseICalDate(icalDate: string): string {
    // iCalendar format: 20231225T120000Z or TZID=America/New_York:20231225T120000
    const dateMatch = icalDate.match(/(\d{8}T\d{6})/);

    if (!dateMatch) return new Date().toISOString();

    const dateStr = dateMatch[1];
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }

  /**
   * Convert ISO date to iCalendar format
   */
  private toICalDate(isoDate: string): string {
    const date = new Date(isoDate);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const second = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hour}${minute}${second}Z`;
  }

  /**
   * Fetch events from Apple Calendar
   */
  async getEvents(
    startDate: Date,
    endDate: Date,
    calendarPath?: string
  ): Promise<CalendarEvent[]> {
    try {
      console.log(`📅 [APPLE-CALENDAR] Fetching events from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

      const calendarHome = await this.getCalendarHome();
      const path = calendarPath || `${calendarHome}home/`;

      // CalDAV REPORT request to get events
      const reportQuery = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${this.toICalDate(startDate.toISOString())}"
                      end="${this.toICalDate(endDate.toISOString())}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

      const response = await this.calDAVRequest('REPORT', path, reportQuery);

      if (!response.ok) {
        throw new Error(`CalDAV request failed: ${response.status}`);
      }

      const xmlText = await response.text();
      const events = this.parseICalendar(xmlText);

      console.log(`✅ [APPLE-CALENDAR] Fetched ${events.length} events`);
      return events;

    } catch (error) {
      console.error('❌ [APPLE-CALENDAR] Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  }): Promise<CalendarEvent> {
    try {
      console.log('📝 [APPLE-CALENDAR] Creating event:', event.summary);

      const calendarHome = await this.getCalendarHome();
      const uid = `${Date.now()}@thefitchecked.com`;
      const eventPath = `${calendarHome}home/${uid}.ics`;

      // Create iCalendar format
      const icalEvent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TheFitChecked//EN
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${this.toICalDate(new Date().toISOString())}
DTSTART:${this.toICalDate(event.start)}
DTEND:${this.toICalDate(event.end)}
SUMMARY:${event.summary}
${event.description ? `DESCRIPTION:${event.description}` : ''}
${event.location ? `LOCATION:${event.location}` : ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

      const response = await this.calDAVRequest('PUT', eventPath, icalEvent);

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      console.log('✅ [APPLE-CALENDAR] Event created:', uid);

      return {
        id: uid,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        status: 'confirmed',
      };

    } catch (error) {
      console.error('❌ [APPLE-CALENDAR] Error creating event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      console.log('🗑️ [APPLE-CALENDAR] Deleting event:', eventId);

      const calendarHome = await this.getCalendarHome();
      const eventPath = `${calendarHome}home/${eventId}.ics`;

      const response = await this.calDAVRequest('DELETE', eventPath);

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }

      console.log('✅ [APPLE-CALENDAR] Event deleted');

    } catch (error) {
      console.error('❌ [APPLE-CALENDAR] Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Check if user has Apple Calendar connected
   */
  async isConnected(): Promise<boolean> {
    try {
      const connection = await calendarConnectionManager.getConnectionByProvider('apple');
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
      const connection = await calendarConnectionManager.getConnectionByProvider('apple');
      return connection?.calendar_email || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Test CalDAV connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const calendarHome = await this.getCalendarHome();
      const response = await this.calDAVRequest('PROPFIND', calendarHome, undefined, '0');
      return response.ok;
    } catch (error) {
      console.error('❌ [APPLE-CALENDAR] Connection test failed:', error);
      return false;
    }
  }
}

export const appleCalendarService = new AppleCalendarService();
