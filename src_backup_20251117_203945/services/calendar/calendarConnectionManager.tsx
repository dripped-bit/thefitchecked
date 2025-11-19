/**
 * Calendar Connection Manager
 *
 * Manages calendar connections separately from authentication.
 * Allows users to connect multiple calendar providers regardless of how they signed in.
 */

import { supabase } from '../supabaseClient';

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: 'google' | 'apple' | 'outlook';
  access_token: string;
  refresh_token: string | null;
  token_expiry: string | null;
  calendar_email: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

class CalendarConnectionManager {
  /**
   * Get all calendar connections for the current user
   */
  async getConnections(): Promise<CalendarConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [CALENDAR-MANAGER] Error fetching connections:', error);
      throw error;
    }

    console.log(`📅 [CALENDAR-MANAGER] Found ${data?.length || 0} calendar connections`);
    return data || [];
  }

  /**
   * Get connection for a specific provider
   */
  async getConnectionByProvider(provider: 'google' | 'apple' | 'outlook'): Promise<CalendarConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      console.error(`❌ [CALENDAR-MANAGER] Error fetching ${provider} connection:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Get the primary calendar connection (or first available)
   */
  async getPrimaryConnection(): Promise<CalendarConnection | null> {
    const connections = await this.getConnections();

    if (connections.length === 0) {
      return null;
    }

    // Return primary if set
    const primary = connections.find(conn => conn.is_primary);
    if (primary) {
      return primary;
    }

    // Otherwise return first connection
    return connections[0];
  }

  /**
   * Save or update a calendar connection
   */
  async saveConnection(
    provider: 'google' | 'apple' | 'outlook',
    accessToken: string,
    refreshToken: string | null,
    tokenExpiry: Date | null,
    calendarEmail: string | null = null
  ): Promise<CalendarConnection> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`📝 [CALENDAR-MANAGER] Saving ${provider} calendar connection`);

    // Check if connection already exists
    const existing = await this.getConnectionByProvider(provider);

    if (existing) {
      // Update existing connection
      const { data, error } = await supabase
        .from('user_calendar_connections')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry?.toISOString(),
          calendar_email: calendarEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error(`❌ [CALENDAR-MANAGER] Error updating ${provider} connection:`, error);
        throw error;
      }

      console.log(`✅ [CALENDAR-MANAGER] Updated ${provider} calendar connection`);
      return data;
    } else {
      // Create new connection
      const isPrimary = (await this.getConnections()).length === 0; // First connection is primary

      const { data, error } = await supabase
        .from('user_calendar_connections')
        .insert({
          user_id: user.id,
          provider,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry?.toISOString(),
          calendar_email: calendarEmail,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ [CALENDAR-MANAGER] Error creating ${provider} connection:`, error);
        throw error;
      }

      console.log(`✅ [CALENDAR-MANAGER] Created ${provider} calendar connection`);
      return data;
    }
  }

  /**
   * Delete a calendar connection
   */
  async deleteConnection(provider: 'google' | 'apple' | 'outlook'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_calendar_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error(`❌ [CALENDAR-MANAGER] Error deleting ${provider} connection:`, error);
      throw error;
    }

    console.log(`🗑️ [CALENDAR-MANAGER] Deleted ${provider} calendar connection`);
  }

  /**
   * Set a connection as primary
   */
  async setPrimaryConnection(provider: 'google' | 'apple' | 'outlook'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, set all connections to non-primary
    await supabase
      .from('user_calendar_connections')
      .update({ is_primary: false })
      .eq('user_id', user.id);

    // Then set the selected one as primary
    const { error } = await supabase
      .from('user_calendar_connections')
      .update({ is_primary: true })
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      console.error(`❌ [CALENDAR-MANAGER] Error setting primary connection:`, error);
      throw error;
    }

    console.log(`✅ [CALENDAR-MANAGER] Set ${provider} as primary calendar`);
  }

  /**
   * Check if a token needs refresh (expires in less than 5 minutes)
   */
  needsRefresh(connection: CalendarConnection): boolean {
    if (!connection.token_expiry) {
      return false;
    }

    const expiryTime = new Date(connection.token_expiry).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return expiryTime - now < fiveMinutes;
  }

  /**
   * Refresh token for Google Calendar
   */
  async refreshGoogleToken(connection: CalendarConnection): Promise<CalendarConnection> {
    if (!connection.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 [CALENDAR-MANAGER] Refreshing Google token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_SUPABASE_GOOGLE_CLIENT_ID || '',
        client_secret: import.meta.env.VITE_SUPABASE_GOOGLE_CLIENT_SECRET || '',
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google token');
    }

    const data = await response.json();

    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    // Update the connection with new token
    return await this.saveConnection(
      'google',
      data.access_token,
      connection.refresh_token, // Keep same refresh token
      newExpiry,
      connection.calendar_email
    );
  }

  /**
   * Get valid access token (refreshes if needed)
   */
  async getValidToken(provider: 'google' | 'apple' | 'outlook'): Promise<string> {
    let connection = await this.getConnectionByProvider(provider);

    if (!connection) {
      throw new Error(`No ${provider} calendar connected`);
    }

    // Refresh if needed (Google only for now)
    if (provider === 'google' && this.needsRefresh(connection)) {
      connection = await this.refreshGoogleToken(connection);
    }

    return connection.access_token;
  }
}

export const calendarConnectionManager = new CalendarConnectionManager();
