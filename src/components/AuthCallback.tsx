import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { calendarConnectionManager } from '../services/calendar/calendarConnectionManager';

interface AuthCallbackProps {
  onSuccess: () => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Helper function to handle post-auth redirect
      const handlePostAuthRedirect = () => {
        // Check if there's a specific return path (e.g., from calendar OAuth)
        const returnPath = sessionStorage.getItem('oauth_return_path');

        if (returnPath) {
          console.log('🔄 [AUTH-CALLBACK] Redirecting to return path:', returnPath);
          sessionStorage.removeItem('oauth_return_path');
          window.location.href = returnPath;
        } else {
          // Default behavior: use onSuccess callback
          onSuccess();
        }
      };

      try {
        // Check if this is a calendar OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const isCalendarCallback = urlParams.get('calendar');

        // Check if user already has an active session
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const providerToken = hashParams.get('provider_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Enhanced logging for debugging
        console.log('🔐 [AUTH-CALLBACK] Processing auth callback:', {
          type,
          hasAccessToken: !!accessToken,
          hasProviderToken: !!providerToken,
          hasExistingSession: !!existingSession,
          error,
          errorDescription
        });

        // Handle OAuth errors from provider (e.g., user denied access)
        if (error) {
          console.error('❌ [AUTH-CALLBACK] OAuth error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed. Please try again.');
          setProcessing(false);
          return;
        }

        // Handle re-authentication scenario (user already logged in, adding scopes)
        if (existingSession && !accessToken && !refreshToken && !type) {
          console.log('🔄 [AUTH-CALLBACK] Re-authentication detected for existing session');

          // Refresh the session to get updated tokens/scopes
          const { data, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('❌ [AUTH-CALLBACK] Session refresh error:', refreshError);
            setError('Failed to update permissions. Please try again.');
            setProcessing(false);
            return;
          }

          if (data.session) {
            console.log('✅ [AUTH-CALLBACK] Session refreshed successfully');
            if (data.session.provider_token) {
              console.log('✅ [AUTH-CALLBACK] Provider token available in refreshed session');

              // If this is a calendar OAuth callback, save the connection
              if (isCalendarCallback === 'google') {
                console.log('📅 [AUTH-CALLBACK] Saving Google Calendar connection from refreshed session');

                try {
                  const tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
                  const userEmail = data.session.user.email || null;

                  await calendarConnectionManager.saveConnection(
                    'google',
                    data.session.provider_token,
                    data.session.provider_refresh_token || null,
                    tokenExpiry,
                    userEmail
                  );

                  console.log('✅ [AUTH-CALLBACK] Google Calendar connection saved successfully');
                  sessionStorage.setItem('calendar_connection_success', 'Google Calendar connected!');
                } catch (calendarError) {
                  console.error('❌ [AUTH-CALLBACK] Failed to save calendar connection:', calendarError);
                  // Don't fail the entire auth flow, just log the error
                }
              }
            }
          }

          // Signal to App that OAuth is completing
          sessionStorage.setItem('oauth_in_progress', 'true');

          setTimeout(() => {
            handlePostAuthRedirect();
          }, 1500);
          return;
        }

        // Handle OAuth callbacks (Google, etc.) with fresh tokens
        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('❌ [AUTH-CALLBACK] Session error:', sessionError);
            setError('Failed to complete authentication. Please try again.');
            setProcessing(false);
            return;
          }

          if (data.session) {
            console.log('✅ [AUTH-CALLBACK] Session established');

            // If this is an OAuth callback with provider token (Google Calendar)
            if (providerToken) {
              console.log('✅ [AUTH-CALLBACK] OAuth provider token received (Google Calendar)');

              // If this is a calendar OAuth callback, save the connection
              if (isCalendarCallback === 'google') {
                console.log('📅 [AUTH-CALLBACK] Saving Google Calendar connection from fresh OAuth');

                try {
                  const tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
                  const userEmail = data.session.user.email || null;

                  await calendarConnectionManager.saveConnection(
                    'google',
                    data.session.provider_token!,
                    data.session.provider_refresh_token || null,
                    tokenExpiry,
                    userEmail
                  );

                  console.log('✅ [AUTH-CALLBACK] Google Calendar connection saved successfully');
                  sessionStorage.setItem('calendar_connection_success', 'Google Calendar connected!');
                } catch (calendarError) {
                  console.error('❌ [AUTH-CALLBACK] Failed to save calendar connection:', calendarError);
                  // Don't fail the entire auth flow, just log the error
                }
              }
            }

            // Signal to App that OAuth is completing
            sessionStorage.setItem('oauth_in_progress', 'true');

            // Wait a moment for UI feedback, then redirect
            setTimeout(() => {
              handlePostAuthRedirect();
            }, 1500);
          }
        } else if (type) {
          // Handle other auth types (password reset, magic link without tokens yet, etc)
          console.log('🔐 [AUTH-CALLBACK] Other auth type:', type);

          // Signal OAuth completion for any auth flow
          sessionStorage.setItem('oauth_in_progress', 'true');

          setTimeout(() => {
            handlePostAuthRedirect();
          }, 1000);
        } else {
          // Log additional debug info before showing error
          console.error('❌ [AUTH-CALLBACK] No valid callback parameters found');
          console.error('🔍 [AUTH-CALLBACK] URL hash:', window.location.hash);
          console.error('🔍 [AUTH-CALLBACK] All params:', Object.fromEntries(hashParams));

          setError('Invalid authentication link');
          setProcessing(false);
        }
      } catch (err) {
        console.error('❌ [AUTH-CALLBACK] Callback error:', err);
        setError('Something went wrong. Please try signing in again.');
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [onSuccess]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {processing ? (
          <>
            <div className="mb-4">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Authentication</h2>
            <p className="text-gray-600">Please wait while we verify your connection...</p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Complete!</h2>
            <p className="text-gray-600">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
