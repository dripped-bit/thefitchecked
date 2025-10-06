import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthCallbackProps {
  onSuccess: () => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🔐 [AUTH-CALLBACK] Processing auth callback:', { type, hasAccessToken: !!accessToken });

        if (type === 'signup' || type === 'email') {
          if (accessToken && refreshToken) {
            // Set the session with the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('❌ [AUTH-CALLBACK] Session error:', error);
              setError('Failed to confirm email. Please try again.');
              setProcessing(false);
              return;
            }

            if (data.session) {
              console.log('✅ [AUTH-CALLBACK] Email confirmed, session established');

              // Wait a moment for UI feedback, then redirect
              setTimeout(() => {
                onSuccess();
              }, 1500);
            }
          } else {
            setError('Invalid confirmation link');
            setProcessing(false);
          }
        } else {
          // Handle other auth types (password reset, etc)
          console.log('🔐 [AUTH-CALLBACK] Other auth type:', type);
          setTimeout(() => {
            onSuccess();
          }, 1000);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your account...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmed!</h2>
            <p className="text-gray-600">Redirecting to your account...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
