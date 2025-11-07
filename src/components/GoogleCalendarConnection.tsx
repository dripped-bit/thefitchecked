/**
 * Google Calendar Connection Component - Updated
 *
 * Now saves calendar tokens to user_calendar_connections table
 * Works regardless of how the user signed in (Google, Apple, email, etc.)
 */

import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { calendarConnectionManager } from '../services/calendar/calendarConnectionManager';

interface GoogleCalendarConnectionProps {
  showInline?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  showInline = false,
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
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      console.log('🔗 [GOOGLE-CALENDAR-UI] Initiating Google Calendar connection...');

      // Store return path
      sessionStorage.setItem('oauth_return_path', window.location.pathname);
      sessionStorage.setItem('oauth_calendar_provider', 'google');

      // Initiate OAuth flow with calendar scope
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback?calendar=google`,
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking Google Calendar...</span>
      </div>
    );
  }

  // Inline compact version
  if (showInline) {
    return (
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Google Calendar Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
          </>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Calendar className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-600'}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Google Calendar
            </h3>
            {isConnected && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>

          {isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              {calendarEmail && (
                <p className="text-sm text-gray-600">{calendarEmail}</p>
              )}
              <p className="text-sm text-gray-600">
                Your calendar events are synced and ready to use.
                Works with any sign-in method.
              </p>
              <button
                onClick={handleDisconnect}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to sync outfit planning with your schedule.
                Works with any sign-in method (Google, Apple, or email).
              </p>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Connect Google Calendar
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500">
                You'll be redirected to Google to grant calendar access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarConnection;
