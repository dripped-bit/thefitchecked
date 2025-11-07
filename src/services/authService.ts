/**
 * Authentication Service
 * Handles user authentication with Supabase Auth
 */

import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
}

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ [AUTH] Sign up error:', error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        emailConfirmed: data.user.email_confirmed_at !== null,
        createdAt: data.user.created_at
      };

      console.log('✅ [AUTH] User signed up successfully:', authUser.email);
      return { user: authUser, error: null };
    } catch (error) {
      console.error('❌ [AUTH] Sign up failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ [AUTH] Sign in error:', error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        emailConfirmed: data.user.email_confirmed_at !== null,
        createdAt: data.user.created_at
      };

      console.log('✅ [AUTH] User signed in successfully:', authUser.email);
      return { user: authUser, error: null };
    } catch (error) {
      console.error('❌ [AUTH] Sign in failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ [AUTH] Google OAuth error:', error);
        return { user: null, error: error.message };
      }

      console.log('✅ [AUTH] Google OAuth redirect initiated');
      // OAuth will redirect, so we return null user for now
      // The actual user will be available after callback
      return { user: null, error: null };
    } catch (error) {
      console.error('❌ [AUTH] Google OAuth failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Google sign in failed' };
    }
  }

  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple'
        // Note: No redirectTo option for Apple - Supabase handles the callback
        // Apple must redirect to https://[project].supabase.co/auth/v1/callback
      });

      if (error) {
        console.error('❌ [AUTH] Apple OAuth error:', error);
        return { user: null, error: error.message };
      }

      console.log('✅ [AUTH] Apple OAuth redirect initiated');
      // OAuth will redirect, so we return null user for now
      // The actual user will be available after callback
      return { user: null, error: null };
    } catch (error) {
      console.error('❌ [AUTH] Apple OAuth failed:', error);
      return { user: null, error: error instanceof Error ? error.message : 'Apple sign in failed' };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ [AUTH] Sign out error:', error);
        return { error: error.message };
      }

      console.log('✅ [AUTH] User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ [AUTH] Sign out failed:', error);
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ [AUTH] Get user error:', error);
        return null;
      }

      if (!user) {
        return null;
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        emailConfirmed: user.email_confirmed_at !== null,
        createdAt: user.created_at
      };

      return authUser;
    } catch (error) {
      console.error('❌ [AUTH] Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Wait for auth to be fully resolved
   * Returns when auth state is stable (SIGNED_IN, INITIAL_SESSION, or definitely logged out)
   * This is critical for preventing race conditions during app initialization
   */
  async waitForAuth(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      let resolved = false;

      console.log('⏳ [AUTH] Waiting for auth to resolve...');

      // Check current state first
      this.getCurrentUser().then(user => {
        if (!resolved) {
          resolved = true;
          console.log('✅ [AUTH] Auth resolved (current user check):', user ? user.email : 'Not logged in');
          resolve(user);
        }
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 [AUTH] Auth event during waitForAuth:', event);

        // Wait for definitive auth events
        if (!resolved && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'SIGNED_OUT')) {
          resolved = true;
          subscription.unsubscribe();

          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              emailConfirmed: session.user.email_confirmed_at !== null,
              createdAt: session.user.created_at
            };
            console.log('✅ [AUTH] Auth resolved (event):', authUser.email);
            resolve(authUser);
          } else {
            console.log('✅ [AUTH] Auth resolved: Not logged in');
            resolve(null);
          }
        }
      });

      // Timeout after 10 seconds as safety fallback
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.unsubscribe();
          console.warn('⚠️ [AUTH] Auth resolution timeout - proceeding without auth');
          resolve(null);
        }
      }, 10000);
    });
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 [AUTH] Auth state changed:', event);

      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          emailConfirmed: session.user.email_confirmed_at !== null,
          createdAt: session.user.created_at
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });

    return subscription;
  }

  /**
   * Reset password (send reset email)
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('❌ [AUTH] Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ [AUTH] Password reset email sent to:', email);
      return { error: null };
    } catch (error) {
      console.error('❌ [AUTH] Password reset failed:', error);
      return { error: error instanceof Error ? error.message : 'Password reset failed' };
    }
  }

  /**
   * Update password (when user is logged in)
   */
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ [AUTH] Password update error:', error);
        return { error: error.message };
      }

      console.log('✅ [AUTH] Password updated successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ [AUTH] Password update failed:', error);
      return { error: error instanceof Error ? error.message : 'Password update failed' };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;
