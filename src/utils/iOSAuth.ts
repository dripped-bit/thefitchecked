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

      // Parse URL to get OAuth parameters
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');
      const errorDescription = urlObj.searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        console.error('❌ [iOS Auth] OAuth error from provider:', error, errorDescription);
        haptics.error();
        return {
          success: false,
          error: errorDescription || error
        };
      }

      // Check if we have an authorization code
      if (!code) {
        console.error('❌ [iOS Auth] No authorization code in callback');
        haptics.error();
        return {
          success: false,
          error: 'No authorization code received'
        };
      }

      console.log('✅ [iOS Auth] Authorization code received');

      // Exchange code for session using Supabase
      // Supabase will automatically handle this via the callback URL
      // We just need to wait for the session to be set

      // Give Supabase a moment to process the session
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ [iOS Auth] Session error:', sessionError);
        haptics.error();
        return {
          success: false,
          error: sessionError.message
        };
      }

      if (!session) {
        console.error('❌ [iOS Auth] No session after OAuth callback');
        haptics.error();
        return {
          success: false,
          error: 'Authentication failed - no session'
        };
      }

      console.log('✅ [iOS Auth] OAuth successful! User:', session.user.email);
      haptics.success();

      return { success: true, error: null };

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
