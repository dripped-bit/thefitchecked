import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabaseClient';
import haptics from './haptics';

/**
 * iOS OAuth Authentication with Capacitor Browser
 *
 * Handles Google OAuth for iOS using Capacitor Browser plugin.
 * Opens OAuth flow in secure in-app browser, then handles callback via custom URL scheme.
 *
 * iOS Setup Required:
 * 1. Custom URL scheme configured in Info.plist: com.thefitchecked.app
 * 2. Google Cloud Console iOS OAuth client created
 * 3. Supabase redirect URL configured for iOS
 *
 * Flow:
 * 1. User taps "Sign in with Google"
 * 2. Opens Google OAuth in in-app browser
 * 3. User approves permissions
 * 4. Google redirects to: com.thefitchecked.app://oauth/callback?code=...
 * 5. iOS deep link handler catches URL
 * 6. Exchange code for session
 * 7. Close browser, user is signed in
 */

class IOSAuthService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Get the correct redirect URL for the current platform
   * Web: http://localhost:5173/auth/callback or https://yourdomain.com/auth/callback
   * iOS: com.thefitchecked.app://oauth/callback
   */
  getRedirectURL(): string {
    if (this.isNative && Capacitor.getPlatform() === 'ios') {
      return 'com.thefitchecked.app://oauth/callback';
    }
    return `${window.location.origin}/auth/callback`;
  }

  /**
   * Get the correct Google OAuth Client ID for the current platform
   *
   * Note: For Supabase OAuth, you don't need to use this in the app.
   * The client ID is configured server-side in Supabase dashboard.
   * This is only needed if making direct Google OAuth API calls.
   */
  getGoogleClientID(): string {
    if (this.isNative && Capacitor.getPlatform() === 'ios') {
      // iOS OAuth client ID
      return import.meta.env.VITE_GOOGLE_CLIENT_ID_IOS || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    }
    // Web OAuth client ID
    return import.meta.env.VITE_GOOGLE_CLIENT_ID;
  }

  /**
   * Sign in with Google OAuth on iOS
   * Opens OAuth flow in Capacitor Browser (in-app browser)
   */
  async signInWithGoogleIOS(): Promise<{ success: boolean; error: string | null }> {
    if (!this.isNative) {
      return { success: false, error: 'This method is for native iOS only' };
    }

    try {
      haptics.light();

      console.log('🍎 [iOS Auth] Starting Google OAuth...');

      // Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: this.getRedirectURL(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Skip browser redirect - we'll handle it manually
          skipBrowserRedirect: true,
        }
      });

      if (error) {
        console.error('❌ [iOS Auth] OAuth URL generation failed:', error);
        haptics.error();
        return { success: false, error: error.message };
      }

      if (!data.url) {
        haptics.error();
        return { success: false, error: 'No OAuth URL returned' };
      }

      console.log('🌐 [iOS Auth] Opening OAuth URL in browser...');
      console.log('📍 [iOS Auth] Redirect URL:', this.getRedirectURL());

      // Open OAuth URL in Capacitor Browser (in-app browser)
      await Browser.open({
        url: data.url,
        presentationStyle: 'popover', // iOS-style modal
        toolbarColor: '#000000',
      });

      // Browser will open, user will authenticate
      // When done, iOS will catch the deep link: com.thefitchecked.app://oauth/callback
      // The deep link handler (in App.tsx) should call handleOAuthCallback()

      console.log('✅ [iOS Auth] Browser opened - waiting for callback');
      return { success: true, error: null };

    } catch (err: any) {
      console.error('❌ [iOS Auth] Google OAuth failed:', err);
      haptics.error();
      return { success: false, error: err.message || 'OAuth failed' };
    }
  }

  /**
   * Handle OAuth callback from deep link
   * Called when iOS receives: com.thefitchecked.app://oauth/callback?code=...
   */
  async handleOAuthCallback(url: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🔗 [iOS Auth] Handling OAuth callback:', url);

      // Close the browser
      await Browser.close();

      // Parse URL to get OAuth parameters from BOTH query params and hash fragments
      const urlObj = new URL(url);
      const queryParams = urlObj.searchParams;
      const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // Remove the '#'

      // Check for OAuth errors first (can be in query or hash)
      const error = queryParams.get('error') || hashParams.get('error');
      const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

      if (error) {
        console.error('❌ [iOS Auth] OAuth error from provider:', error, errorDescription);
        haptics.error();
        return {
          success: false,
          error: errorDescription || error
        };
      }

      // Check for tokens in hash fragment (Supabase implicit flow)
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const expiresAt = hashParams.get('expires_at');
      const providerToken = hashParams.get('provider_token');
      const providerRefreshToken = hashParams.get('provider_refresh_token');

      // Enhanced logging to debug what we received
      console.log('🔍 [iOS Auth] Callback parameters:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasProviderToken: !!providerToken,
        expiresAt: expiresAt,
        queryParams: Object.fromEntries(queryParams),
        hashParamKeys: Array.from(hashParams.keys())
      });

      // SCENARIO 1: Tokens in hash (implicit flow - most common for iOS)
      if (accessToken && refreshToken) {
        console.log('✅ [iOS Auth] Tokens received, setting session...');

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('❌ [iOS Auth] Failed to set session:', sessionError);
          haptics.error();
          return {
            success: false,
            error: sessionError.message
          };
        }

        if (!data.session) {
          console.error('❌ [iOS Auth] No session created after setSession');
          haptics.error();
          return {
            success: false,
            error: 'Failed to create session'
          };
        }

        console.log('✅ [iOS Auth] Session set successfully! User:', data.session.user.email);
        haptics.success();
        return { success: true, error: null };
      }

      // SCENARIO 2: Authorization code (code flow - fallback)
      const code = queryParams.get('code') || hashParams.get('code');

      if (code) {
        console.log('✅ [iOS Auth] Authorization code received, exchanging for session...');

        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('❌ [iOS Auth] Failed to exchange code:', exchangeError);
          haptics.error();
          return {
            success: false,
            error: exchangeError.message
          };
        }

        if (!data.session) {
          console.error('❌ [iOS Auth] No session created after code exchange');
          haptics.error();
          return {
            success: false,
            error: 'Failed to create session'
          };
        }

        console.log('✅ [iOS Auth] Code exchanged successfully! User:', data.session.user.email);
        haptics.success();
        return { success: true, error: null };
      }

      // SCENARIO 3: Neither tokens nor code found
      console.error('❌ [iOS Auth] No tokens or authorization code in callback');
      console.error('📋 [iOS Auth] Full URL:', url);
      haptics.error();
      return {
        success: false,
        error: 'No authentication data received'
      };

    } catch (err: any) {
      console.error('❌ [iOS Auth] Callback handling failed:', err);

      // Try to close browser anyway
      try {
        await Browser.close();
      } catch (closeErr) {
        // Ignore close errors
      }

      haptics.error();
      return {
        success: false,
        error: err.message || 'Callback handling failed'
      };
    }
  }

  /**
   * Check if browser is currently open
   */
  async isBrowserOpen(): Promise<boolean> {
    try {
      // Capacitor Browser doesn't have a way to check if open
      // This is a limitation - we'll track it manually if needed
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Close OAuth browser if open
   */
  async closeOAuthBrowser() {
    try {
      await Browser.close();
    } catch (err) {
      // Browser might not be open, ignore error
    }
  }
}

// Export singleton instance
const iOSAuth = new IOSAuthService();
export default iOSAuth;

/**
 * React Hook for iOS OAuth
 *
 * Usage in Login component:
 *
 * const { signInWithGoogle, isLoading } = useIOSAuth();
 *
 * <button onClick={signInWithGoogle}>
 *   Sign in with Google
 * </button>
 */
export const useIOSAuth = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    const result = await iOSAuth.signInWithGoogleIOS();

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
    return result;
  };

  return {
    signInWithGoogle,
    isLoading,
    error,
  };
};

// Import React for hooks
import React from 'react';
