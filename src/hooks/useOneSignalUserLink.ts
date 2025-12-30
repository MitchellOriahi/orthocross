import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';

// OneSignal Capacitor plugin types
declare const OneSignal: {
  initialize: (appId: string) => void;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  Notifications: {
    requestPermission: (fallbackToSettings: boolean) => Promise<boolean>;
    hasPermission: () => boolean;
  };
} | undefined;

// Enable dev logging only in development
const DEV_MODE = import.meta.env.DEV;
const log = (msg: string) => DEV_MODE && console.log(msg);

// Retry delays in milliseconds: 0s, 2s, 5s
const RETRY_DELAYS = [0, 2000, 5000];

/**
 * Hook to initialize OneSignal and link the authenticated Supabase user.
 * Uses the OneSignal Capacitor/Cordova plugin (NOT web SDK).
 * 
 * Flow:
 * 1. Initialize OneSignal once on app startup
 * 2. Wait for auth to finish loading (session restore or login)
 * 3. Wait for notification permission to be resolved
 * 4. Call OneSignal.login(user.id) with retry logic (0s, 2s, 5s)
 * 5. On logout, call OneSignal.logout()
 */
export const useOneSignalUserLink = () => {
  const { user, loading } = useAuth();
  const linkedUserIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const loginAttemptRef = useRef(false);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Clear any pending retry timeouts
  const clearRetryTimeouts = useCallback(() => {
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = [];
  }, []);

  // Initialize OneSignal once on app startup
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      if (typeof OneSignal !== 'undefined') {
        OneSignal.initialize(ONESIGNAL_APP_ID);
        initializedRef.current = true;
        log('[OneSignal] init');
      }
    } catch (error) {
      // Silent fail in production
      DEV_MODE && console.error('[OneSignal] init error:', error);
    }
  }, []);

  // Attempt to login with retry logic
  const attemptLogin = useCallback(async (userId: string, retryIndex: number = 0): Promise<boolean> => {
    if (typeof OneSignal === 'undefined') return false;
    
    try {
      await OneSignal.login(userId);
      linkedUserIdRef.current = userId;
      console.log(`[OneSignal] login ${userId.substring(0, 8)}...`);
      return true;
    } catch (error) {
      // Schedule retry if we haven't exhausted all attempts
      if (retryIndex < RETRY_DELAYS.length - 1) {
        const nextDelay = RETRY_DELAYS[retryIndex + 1];
        const timeout = setTimeout(() => {
          attemptLogin(userId, retryIndex + 1);
        }, nextDelay);
        retryTimeoutsRef.current.push(timeout);
      } else {
        DEV_MODE && console.error('[OneSignal] login failed after retries');
      }
      return false;
    }
  }, []);

  // Handle login/logout based on auth state
  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    const handleAuthChange = async () => {
      // OneSignal not available (web browser)
      if (typeof OneSignal === 'undefined') return;

      // User logged in (session restored or fresh login)
      if (user?.id) {
        // Skip if already linked for this user
        if (linkedUserIdRef.current === user.id) return;

        // Prevent duplicate login attempts
        if (loginAttemptRef.current) return;
        
        loginAttemptRef.current = true;
        clearRetryTimeouts();

        try {
          // Check current permission state
          let hasPermission = false;
          try {
            hasPermission = OneSignal.Notifications.hasPermission();
            log(`[OneSignal] permission ${hasPermission ? 'granted' : 'denied'}`);
          } catch {
            // Ignore permission check errors
          }

          // Request permission if not granted
          if (!hasPermission) {
            try {
              hasPermission = await OneSignal.Notifications.requestPermission(true);
              log(`[OneSignal] permission ${hasPermission ? 'granted' : 'denied'}`);
            } catch {
              // Re-check permission after error
              try {
                hasPermission = OneSignal.Notifications.hasPermission();
              } catch {
                // Ignore
              }
            }
          }

          // Proceed with login regardless of permission state
          // (External ID can be set even without push permission)
          await attemptLogin(user.id, 0);
          
        } catch {
          // Silent fail
        } finally {
          loginAttemptRef.current = false;
        }
      } 
      // User logged out
      else if (linkedUserIdRef.current !== null) {
        clearRetryTimeouts();
        loginAttemptRef.current = false;
        
        try {
          await OneSignal.logout();
          linkedUserIdRef.current = null;
          console.log('[OneSignal] logout');
        } catch {
          // Silent fail
        }
      }
    };

    handleAuthChange();
  }, [user?.id, loading, attemptLogin, clearRetryTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRetryTimeouts();
    };
  }, [clearRetryTimeouts]);
};
