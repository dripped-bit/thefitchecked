/**
 * Google Calendar Connection Component - Updated
 *
 * Now saves calendar tokens to user_calendar_connections table
 * Works regardless of how the user signed in (Google, Apple, email, etc.)
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { calendarConnectionManager } from '../../services/calendar/calendarConnectionManager';
import '../../styles/calendarSettings.css';

interface GoogleCalendarConnectionProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  onConnectionChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    console.log('🔍 [GOOGLE-CALENDAR-UI] Checking for existing connection...');
    try {
      const connection = await calendarConnectionManager.getConnectionByProvider('google');

      if (connection) {
        setIsConnected(true);
        setCalendarEmail(connection.calendar_email);
        onConnectionChange?.(true);
        console.log('✅ [GOOGLE-CALENDAR-UI] Calendar connected:', connection.calendar_email);
      } else {
        setIsConnected(false);
        setCalendarEmail(null);
        onConnectionChange?.(false);
        console.log('ℹ️ [GOOGLE-CALENDAR-UI] No calendar connected');
      }
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR-UI] Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      // Don't log isConnected here - it's a stale closure value
      // The actual state update happens correctly in the try block above
      console.log('📊 [GOOGLE-CALENDAR-UI] Connection check complete');
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('🔗 [GOOGLE-CALENDAR-UI] Initiating Google Calendar connection...');

      // Initiate OAuth flow with calendar scope
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback?calendar=google&returnTo=/closet?view=smart-calendar`,
          queryParams: {
            access_type: 'offline', // Get refresh token
            prompt: 'consent', // Force consent screen to get refresh token
          },
        },
      });

      if (error) {
        console.error('❌ [GOOGLE-CALENDAR-UI] OAuth error:', error);
        alert('Failed to connect calendar. Please try again.');
        setIsConnecting(false);
      }

      // User will be redirected to Google OAuth
      // Callback is handled in AuthCallback.tsx
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR-UI] Connection error:', error);
      alert('Failed to connect calendar. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) {
      return;
    }

    try {
      setIsLoading(true);
      await calendarConnectionManager.deleteConnection('google');

      setIsConnected(false);
      setCalendarEmail(null);
      onConnectionChange?.(false);

      console.log('🗑️ [GOOGLE-CALENDAR-UI] Calendar disconnected');
      alert('Google Calendar disconnected successfully');
    } catch (error) {
      console.error('❌ [GOOGLE-CALENDAR-UI] Disconnect error:', error);
      alert('Failed to disconnect calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🎨 [GOOGLE-CALENDAR-UI] Rendering component. isLoading:', isLoading, 'isConnected:', isConnected);

  if (isLoading) {
    return (
      <div className="calendar-connection-card">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="calendar-connection-card">
      <div className="calendar-header">
        <div className="calendar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"
              fill="#4285F4"
            />
          </svg>
        </div>
        <div className="calendar-info">
          <h3>Google Calendar</h3>
          {isConnected && calendarEmail && (
            <p className="calendar-email">{calendarEmail}</p>
          )}
        </div>
        {isConnected && (
          <span className="connection-badge connected">Connected</span>
        )}
      </div>

      <div className="calendar-actions">
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="btn-disconnect"
            disabled={isLoading}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="btn-connect"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        )}
      </div>

      {!isConnected && (
        <div className="calendar-description">
          <p>
            Connect your Google Calendar to sync outfit planning with your schedule.
            Works with any sign-in method (Google, Apple, or email).
          </p>
        </div>
      )}
    </div>
  );
};
