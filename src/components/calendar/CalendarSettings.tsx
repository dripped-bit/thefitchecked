/**
 * Calendar Settings Page - Multi-Calendar Support
 *
 * Shows both Google and Apple calendar connection options
 */

import { useState, useEffect } from 'react';
import { GoogleCalendarConnection } from './GoogleCalendarConnection';
import { AppleCalendarConnection } from './AppleCalendarConnection';
import { calendarConnectionManager } from '../../services/calendar/calendarConnectionManager';

export const CalendarSettings = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnections();

    // Check for success message from OAuth callback
    const successMessage = sessionStorage.getItem('calendar_connection_success');
    if (successMessage) {
      alert(successMessage);
      sessionStorage.removeItem('calendar_connection_success');
    }

    const errorMessage = sessionStorage.getItem('calendar_connection_error');
    if (errorMessage) {
      alert(errorMessage);
      sessionStorage.removeItem('calendar_connection_error');
    }
  }, []);

  const loadConnections = async () => {
    try {
      const allConnections = await calendarConnectionManager.getConnections();
      setConnections(allConnections);
      console.log('📅 [CALENDAR-SETTINGS] Loaded connections:', allConnections);
    } catch (error) {
      console.error('❌ [CALENDAR-SETTINGS] Error loading connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionChange = () => {
    // Reload connections when any calendar is connected/disconnected
    loadConnections();
  };

  return (
    <div className="calendar-settings-page">
      <div className="settings-header">
        <h1>Calendar Connections</h1>
        <p>Connect your calendars to sync outfit planning with your schedule</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading calendar connections...</p>
        </div>
      ) : (
        <div className="calendar-providers">

          {/* Summary of connected calendars */}
          {connections.length > 0 && (
            <div className="connections-summary">
              <h3>Connected Calendars ({connections.length})</h3>
              <ul>
                {connections.map((conn) => (
                  <li key={conn.id}>
                    <span className="provider-name">
                      {conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)}
                    </span>
                    <span className="provider-email">{conn.calendar_email}</span>
                    {conn.is_primary && (
                      <span className="badge-primary">Primary</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Google Calendar */}
          <section className="calendar-provider-section">
            <GoogleCalendarConnection onConnectionChange={handleConnectionChange} />
          </section>

          {/* Apple Calendar */}
          <section className="calendar-provider-section">
            <AppleCalendarConnection onConnectionChange={handleConnectionChange} />
          </section>

          {/* Future: Outlook Calendar */}
          <section className="calendar-provider-section coming-soon">
            <div className="calendar-connection-card disabled">
              <div className="calendar-header">
                <div className="calendar-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#0078D4"/>
                    <text x="12" y="16" fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">
                      O
                    </text>
                  </svg>
                </div>
                <div className="calendar-info">
                  <h3>Outlook Calendar</h3>
                  <p className="text-muted">Coming soon</p>
                </div>
                <span className="connection-badge coming-soon">Coming Soon</span>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* Help Section */}
      <div className="calendar-help-section">
        <h3>About Calendar Connections</h3>
        <div className="help-content">
          <div className="help-item">
            <h4>🔐 Secure & Private</h4>
            <p>Your calendar credentials are encrypted and stored securely. We only access your calendar data when you explicitly request it.</p>
          </div>

          <div className="help-item">
            <h4>🔄 Independent from Sign-In</h4>
            <p>You can connect any calendar regardless of how you signed in. Sign in with Apple? You can still use Google Calendar!</p>
          </div>

          <div className="help-item">
            <h4>📅 Multiple Calendars</h4>
            <p>Connect multiple calendar providers and switch between them. Your primary calendar is used by default.</p>
          </div>

          <div className="help-item">
            <h4>❓ Need Help?</h4>
            <p>
              <strong>Google Calendar:</strong> Uses OAuth - just click connect and authorize.<br/>
              <strong>Apple Calendar:</strong> Requires an app-specific password from <a href="https://appleid.apple.com" target="_blank" rel="noopener">appleid.apple.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
