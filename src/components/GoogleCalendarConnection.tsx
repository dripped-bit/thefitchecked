/**
 * Google Calendar Connection Component
 * Shows connection status and allows users to connect their Google Calendar
 * for automatic outfit event syncing
 */

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import googleCalendarService from '../services/googleCalendarService';
import { supabase } from '../services/supabaseClient';

interface GoogleCalendarConnectionProps {
  showInline?: boolean; // If true, shows compact inline version
}

const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  showInline = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await googleCalendarService.isConnected();
      setIsConnected(connected);
    } catch (error) {
      console.error('L [GOOGLE-CAL-UI] Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('L [GOOGLE-CAL-UI] Error connecting Google Calendar:', error);
        alert('Failed to connect Google Calendar. Please try again.');
        setConnecting(false);
      }
      // OAuth redirect will happen, so we don't need to handle success here
    } catch (error) {
      console.error('L [GOOGLE-CAL-UI] Connection error:', error);
      alert('Failed to connect Google Calendar. Please try again.');
      setConnecting(false);
    }
  };

  // Loading state
  if (loading) {
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
              disabled={connecting}
              className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Google Calendar'}
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
              Google Calendar Sync
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
              <p className="text-sm text-gray-600">
                Your outfit events will automatically sync to your Google Calendar.
                You'll see them in Google Calendar, your phone's calendar app, and anywhere your calendar is synced.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to automatically sync outfit events.
                Your outfits will appear in your calendar alongside your other events.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {connecting ? (
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
