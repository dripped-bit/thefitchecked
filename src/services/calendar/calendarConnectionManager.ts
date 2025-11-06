/**
 * Calendar Connection Manager
 * Handles storing and retrieving calendar connections from Supabase
 * Decouples calendar providers from authentication
 */

import { supabase } from '../supabaseClient';
import { CalendarConnection } from './ICalendarService';

interface CalendarConnectionRow {
  id: string;
  user_id: string;
  provider: 'google' | 'apple' | 'outlook';
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  calendar_email: string | null;
  calendar_name: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

class CalendarConnectionManager {
  private readonly TABLE_NAME = 'user_calendar_connections';

  /**
   * Get all calendar connections for current user
   */
  async getConnections(): Promise<CalendarConnection[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('ℹ️ [CAL-MANAGER] No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [CAL-MANAGER] Error fetching connections:', error);
        return [];
      }

      return (data as CalendarConnectionRow[]).map(this.rowToConnection);
    } catch (error) {
      console.error('❌ [CAL-MANAGER] Error in getConnections:', error);
      return [];
    }
  }

  /**
   * Get connection for specific provider
   */
  async getConnection(provider: 'google' | 'apple' | 'outlook'): Promise<CalendarConnection | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found - this is OK
          return null;
        }
        console.error(`❌ [CAL-MANAGER] Error fetching ${provider} connection:`, error);
        return null;
      }

      return this.rowToConnection(data as CalendarConnectionRow);
    } catch (error) {
      console.error(`❌ [CAL-MANAGER] Error in getConnection(${provider}):`, error);
      return null;
    }
  }

  /**
   * Save or update calendar connection
   */
  async saveConnection(
    provider: 'google' | 'apple' | 'outlook',
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    },
    metadata: {
      email: string;
      name?: string;
    }
  ): Promise<CalendarConnection | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [CAL-MANAGER] No authenticated user');
        return null;
      }

      const connectionData = {
        user_id: user.id,
        provider,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken || null,
        token_expires_at: tokens.expiresAt?.toISOString() || null,
        calendar_email: metadata.email,
        calendar_name: metadata.name || null,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      };

      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert(connectionData, {
          onConflict: 'user_id,provider',
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ [CAL-MANAGER] Error saving ${provider} connection:`, error);
        return null;
      }

      console.log(`✅ [CAL-MANAGER] Saved ${provider} connection for ${metadata.email}`);
      return this.rowToConnection(data as CalendarConnectionRow);
    } catch (error) {
      console.error(`❌ [CAL-MANAGER] Error in saveConnection(${provider}):`, error);
      return null;
    }
  }

  /**
   * Get access token for provider
   */
  async getAccessToken(provider: 'google' | 'apple' | 'outlook'): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('access_token, token_expires_at')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)
        .single();

      if (error) {
        return null;
      }

      // TODO: Check expiration and refresh if needed
      return (data as any).access_token;
    } catch (error) {
      console.error(`❌ [CAL-MANAGER] Error getting access token for ${provider}:`, error);
      return null;
    }
  }

  /**
   * Update last sync time
   */
  async updateLastSync(provider: 'google' | 'apple' | 'outlook'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      await supabase
        .from(this.TABLE_NAME)
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', provider);
    } catch (error) {
      console.error(`❌ [CAL-MANAGER] Error updating last sync for ${provider}:`, error);
    }
  }

  /**
   * Disconnect calendar provider
   */
  async disconnect(provider: 'google' | 'apple' | 'outlook'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      await supabase
        .from(this.TABLE_NAME)
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider);

      console.log(`✅ [CAL-MANAGER] Disconnected ${provider} calendar`);
    } catch (error) {
      console.error(`❌ [CAL-MANAGER] Error disconnecting ${provider}:`, error);
    }
  }

  /**
   * Convert database row to CalendarConnection object
   */
  private rowToConnection(row: CalendarConnectionRow): CalendarConnection {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      calendarEmail: row.calendar_email || '',
      calendarName: row.calendar_name || undefined,
      isActive: row.is_active,
      lastSyncAt: row.last_sync_at ? new Date(row.last_sync_at) : null,
      createdAt: new Date(row.created_at),
    };
  }
}

// Export singleton instance
export const calendarConnectionManager = new CalendarConnectionManager();
export default calendarConnectionManager;
