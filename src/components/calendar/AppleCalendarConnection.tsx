/**
 * Apple Calendar Connection Component
 *
 * Apple Calendar uses app-specific passwords instead of OAuth.
 * Users need to generate an app-specific password from iCloud settings.
 */

import { useState, useEffect } from 'react';
import { calendarConnectionManager } from '../../services/calendar/calendarConnectionManager';
import { appleCalendarService } from '../../services/calendar/appleCalendarService';
import '../../styles/calendarSettings.css';

interface AppleCalendarConnectionProps {
  isConnected: boolean;
  calendarEmail?: string | null;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const AppleCalendarConnection: React.FC<AppleCalendarConnectionProps> = ({
  isConnected,
  calendarEmail,
  onConnectionChange
}) => {
  const [showSetup, setShowSetup] = useState(false);

  // Form state
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      console.log('🔗 [APPLE-CALENDAR-UI] Connecting Apple Calendar...');

      // Save connection to database
      await calendarConnectionManager.saveConnection(
        'apple',
        appPassword, // App-specific password stored as access_token
        null, // No refresh token for CalDAV
        null, // No expiry for app-specific passwords
        appleId
      );

      // Test the connection
      const isValid = await appleCalendarService.testConnection();

      if (!isValid) {
        throw new Error('Invalid credentials. Please check your Apple ID and app-specific password.');
      }

      setShowSetup(false);
      setAppleId('');
      setAppPassword('');

      console.log('✅ [APPLE-CALENDAR-UI] Calendar connected successfully, notifying parent');
      onConnectionChange?.(true);

      alert('Apple Calendar connected successfully!');

    } catch (error: any) {
      console.error('❌ [APPLE-CALENDAR-UI] Connection error:', error);
      setError(error.message || 'Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Apple Calendar?')) {
      return;
    }

    try {
      await calendarConnectionManager.deleteConnection('apple');

      console.log('🗑️ [APPLE-CALENDAR-UI] Calendar disconnected, notifying parent');
      onConnectionChange?.(false);

      alert('Apple Calendar disconnected successfully');
    } catch (error) {
      console.error('❌ [APPLE-CALENDAR-UI] Disconnect error:', error);
      alert('Failed to disconnect calendar. Please try again.');
    }
  };

  return (
    <div className="calendar-connection-card">
      <div className="calendar-header">
        <div className="calendar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" fill="#FF3B30"/>
            <text x="12" y="16" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
              {new Date().getDate()}
            </text>
          </svg>
        </div>
        <div className="calendar-info">
          <h3>Apple Calendar</h3>
          {isConnected && calendarEmail && (
            <p className="calendar-email">{calendarEmail}</p>
          )}
        </div>
        {isConnected && (
          <span className="connection-badge connected">Connected</span>
        )}
      </div>

      {!isConnected && !showSetup && (
        <>
          <div className="calendar-description">
            <p>
              Connect your Apple Calendar (iCloud Calendar) to sync outfit planning with your schedule.
            </p>
            <p className="text-small text-muted">
              Requires an app-specific password from your Apple ID account.
            </p>
          </div>

          <div className="calendar-actions">
            <button
              onClick={() => setShowSetup(true)}
              className="btn-connect"
            >
              Connect Apple Calendar
            </button>
          </div>
        </>
      )}

      {!isConnected && showSetup && (
        <div className="calendar-setup-form">
          <h4>Connect Apple Calendar</h4>

          <div className="setup-instructions">
            <p><strong>Step 1:</strong> Get an App-Specific Password</p>
            <ol>
              <li>Go to <a href="https://appleid.apple.com" target="_blank" rel="noopener">appleid.apple.com</a></li>
              <li>Sign in with your Apple ID</li>
              <li>In the Security section, click "App-Specific Passwords"</li>
              <li>Click the + button to generate a new password</li>
              <li>Name it "TheFitChecked" and copy the password</li>
            </ol>

            <p><strong>Step 2:</strong> Enter your credentials below</p>
          </div>

          <form onSubmit={handleConnect}>
            <div className="form-group">
              <label htmlFor="apple-id">Apple ID (Email)</label>
              <input
                id="apple-id"
                type="email"
                value={appleId}
                onChange={(e) => setAppleId(e.target.value)}
                placeholder="your-email@icloud.com"
                required
                disabled={isConnecting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="app-password">App-Specific Password</label>
              <input
                id="app-password"
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                required
                disabled={isConnecting}
              />
              <p className="form-help">
                This is NOT your regular Apple ID password. Use the app-specific password you generated.
              </p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setShowSetup(false);
                  setError(null);
                  setAppleId('');
                  setAppPassword('');
                }}
                className="btn-secondary"
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Calendar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isConnected && (
        <div className="calendar-actions">
          <button
            onClick={handleDisconnect}
            className="btn-disconnect"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
