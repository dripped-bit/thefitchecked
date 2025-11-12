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

      // Store return path so user goes to smart calendar dashboard after OAuth
      sessionStorage.setItem('oauth_return_path', '/closet?view=smart-calendar');
      // Don't set oauth_success_message - AuthCallback sets calendar_connection_success instead

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
    <div className="ios-card rounded-ios-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-ios-label-secondary" />
          <h3 className="ios-title-2">Calendar Connections</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-ios-label-tertiary hover:text-ios-label-secondary transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Google Calendar Connection */}
      <div className="space-y-4">
        <div className="ios-card rounded-ios-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ios-blue/10 rounded-ios-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-ios-blue" />
              </div>
              <div>
                <h4 className="ios-subheadline font-semibold">Google Calendar</h4>
                <p className="ios-callout text-ios-label-secondary">Sync your Google Calendar events</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {googleConnected ? (
                <div className="flex items-center space-x-2 text-ios-green">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="ios-callout font-semibold">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-ios-label-tertiary">
                  <XCircle className="w-5 h-5" />
                  <span className="ios-callout font-semibold">Not Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Connected Info */}
          {googleConnected && googleEmail && (
            <div className="bg-ios-blue/10 rounded-ios-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-ios-blue mb-2">
                <Mail className="w-4 h-4" />
                <span className="ios-callout">{googleEmail}</span>
              </div>
              {lastSync && (
                <div className="flex items-center space-x-2 text-ios-blue">
                  <Clock className="w-4 h-4" />
                  <span className="ios-callout">
                    Last synced: {lastSync.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {syncError && (
            <div className="bg-ios-red/10 border border-ios-red/20 rounded-ios-lg p-3 mb-3">
              <div className="flex items-center space-x-2 text-ios-red">
                <AlertCircle className="w-4 h-4" />
                <span className="ios-callout">{syncError}</span>
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
                  className="ios-button-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  onClick={handleDisconnectGoogle}
                  className="ios-button-secondary flex items-center space-x-2 border-ios-red text-ios-red"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="ios-button-primary w-full flex items-center justify-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Google Calendar'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Apple Calendar (Coming Soon) */}
        <div className="ios-card rounded-ios-lg p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ios-fill rounded-ios-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-ios-label-tertiary" />
              </div>
              <div>
                <h4 className="ios-subheadline font-semibold">Apple Calendar</h4>
                <p className="ios-callout text-ios-label-secondary">CalDAV sync - Coming soon</p>
              </div>
            </div>
            <span className="ios-caption-2 text-ios-label-tertiary bg-ios-fill px-3 py-1 rounded-ios-full">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-ios-purple/10 border border-ios-purple/20 rounded-ios-lg p-4">
          <h5 className="ios-subheadline font-semibold text-ios-purple mb-2">About Calendar Sync</h5>
          <ul className="ios-callout text-ios-purple space-y-1">
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
