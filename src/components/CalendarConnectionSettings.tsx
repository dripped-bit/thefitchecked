/**
 * Calendar Connection Settings Component
 * Allows users to connect/disconnect external calendars (Google, Apple)
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Link,
  Unlink,
  Clock,
  Mail,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import googleCalendarService from '../services/googleCalendarService';
import { supabase } from '../services/supabaseClient';

interface CalendarConnectionSettingsProps {
  onSync?: (events: any[]) => void;
  onClose?: () => void;
}

const CalendarConnectionSettings: React.FC<CalendarConnectionSettingsProps> = ({
  onSync,
  onClose
}) => {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const status = await googleCalendarService.getSyncStatus();
      setGoogleConnected(status.isConnected);
      setGoogleEmail(status.email);
      if (status.lastSync) {
        setLastSync(new Date(status.lastSync));
      }
    } catch (error) {
      console.error('❌ [CAL-SETTINGS] Error checking connection status:', error);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setSyncError(null);

    try {
      // Check if user already has a valid session with potential calendar access
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.provider_token && session?.provider === 'google') {
        console.log('✅ [CAL-SETTINGS] Provider token exists, testing calendar access...');

        // Test if the existing token has calendar permissions
        try {
          const testResponse = await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList',
            {
              headers: {
                'Authorization': `Bearer ${session.provider_token}`,
              },
            }
          );

          if (testResponse.ok) {
            console.log('✅ [CAL-SETTINGS] Calendar access already granted!');
            setGoogleConnected(true);
            setGoogleEmail(session.user?.email || null);
            setLastSync(new Date());
            setIsConnecting(false);
            return;
          } else if (testResponse.status === 401) {
            console.log('⚠️ [CAL-SETTINGS] Token expired, proceeding with OAuth');
          } else {
            console.log('⚠️ [CAL-SETTINGS] Token exists but lacks calendar scope, proceeding with OAuth');
          }
        } catch (err) {
          console.log('⚠️ [CAL-SETTINGS] Calendar test failed, proceeding with OAuth:', err);
        }
      }

      // Proceed with OAuth flow
      console.log('🔐 [CAL-SETTINGS] Initiating Google OAuth for calendar access...');

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
        console.error('❌ [CAL-SETTINGS] Failed to connect Google Calendar:', error);
        setSyncError('Failed to connect. Please try again.');
        setIsConnecting(false);
      }
      // OAuth redirect will happen, so we don't need to handle success here
    } catch (error) {
      console.error('❌ [CAL-SETTINGS] Connection error:', error);
      setSyncError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await googleCalendarService.disconnect();
      setGoogleConnected(false);
      setGoogleEmail(null);
      setLastSync(null);
      setSyncError(null);
      console.log('ℹ️ [CAL-SETTINGS] Google Calendar disconnected');
    } catch (error) {
      console.error('❌ [CAL-SETTINGS] Error disconnecting:', error);
    }
  };

  const handleSync = async () => {
    if (!googleConnected) {
      setSyncError('Please connect your calendar first');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Calculate timeMin (now) and timeMax (60 days from now)
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

      const events = await googleCalendarService.fetchEvents(timeMin, timeMax);

      // Call parent onSync callback
      if (onSync) {
        onSync(events);
      }

      setLastSync(new Date());
      console.log(`✅ [CAL-SETTINGS] Synced ${events.length} events from Google Calendar`);
    } catch (error) {
      console.error('❌ [CAL-SETTINGS] Sync failed:', error);
      setSyncError('Sync failed. Please check your connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-800">Calendar Connections</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        )}
      </div>

      {/* Google Calendar Connection */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Google Calendar</h4>
                <p className="text-sm text-gray-500">Sync your Google Calendar events</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {googleConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-400">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Not Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Connected Info */}
          {googleConnected && googleEmail && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{googleEmail}</span>
              </div>
              {lastSync && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Last synced: {lastSync.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {syncError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{syncError}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {googleConnected ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="flex items-center space-x-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Google Calendar'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Apple Calendar (Coming Soon) */}
        <div className="border border-gray-200 rounded-lg p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Apple Calendar</h4>
                <p className="text-sm text-gray-500">CalDAV sync - Coming soon</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-800 mb-2">About Calendar Sync</h5>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Events are synced automatically every hour</li>
            <li>• Only upcoming events (next 60 days) are imported</li>
            <li>• Events are categorized automatically for outfit suggestions</li>
            <li>• Your calendar data stays private and secure</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CalendarConnectionSettings;
