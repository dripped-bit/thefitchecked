/**
 * Calendar Service Interface
 * Abstract interface for calendar integrations
 * Allows supporting multiple calendar providers (Google, Apple, Outlook, etc.)
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  eventType?: 'work' | 'personal' | 'travel' | 'formal' | 'casual' | 'other';
  source: 'google_calendar' | 'apple_calendar' | 'outlook_calendar' | 'manual';
}

export interface CalendarConnection {
  id: string;
  userId: string;
  provider: 'google' | 'apple' | 'outlook';
  calendarEmail: string;
  calendarName?: string;
  isActive: boolean;
  lastSyncAt: Date | null;
  createdAt: Date;
}

export interface CalendarSyncStatus {
  isConnected: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  accountEmail: string | null;
}

/**
 * Abstract Calendar Service Interface
 * All calendar providers must implement these methods
 */
export interface ICalendarService {
  /**
   * Provider identifier
   */
  readonly provider: 'google' | 'apple' | 'outlook';

  /**
   * Check if this calendar provider is connected for the current user
   */
  isConnected(): Promise<boolean>;

  /**
   * Initiate OAuth flow to connect calendar
   * @param returnPath Optional path to redirect to after OAuth
   */
  connect(returnPath?: string): Promise<void>;

  /**
   * Disconnect calendar provider
   */
  disconnect(): Promise<void>;

  /**
   * Get current sync status
   */
  getSyncStatus(): Promise<CalendarSyncStatus>;

  /**
   * Fetch events from calendar
   * @param daysAhead Number of days to fetch ahead (default 30)
   */
  fetchEvents(daysAhead?: number): Promise<CalendarEvent[]>;

  /**
   * Create event in calendar
   */
  createEvent?(event: Partial<CalendarEvent>): Promise<CalendarEvent>;

  /**
   * Update event in calendar
   */
  updateEvent?(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent>;

  /**
   * Delete event from calendar
   */
  deleteEvent?(eventId: string): Promise<void>;
}
