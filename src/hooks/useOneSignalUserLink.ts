import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ONESIGNAL_APP_ID } from '@/config/onesignal';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: OneSignalInstance) => void | Promise<void>>;
    OneSignal?: OneSignalInstance;
  }
}

interface OneSignalInstance {
  init: (config: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User?: {
    PushSubscription?: {
      id?: string;
    };
  };
}

/**
 * Hook to initialize OneSignal and link the authenticated Supabase user.
 * 
 * Timing guarantees:
 * - OneSignal SDK initializes on first mount
 * - User linking ONLY occurs after auth loading is complete (loading === false)
 * - Never calls login with null/undefined user
 * - Idempotent: tracks linked user to prevent duplicate calls
 * 
 * Runs in these cases:
 * 1. On authenticated app startup (session restoration)
 * 2. On fresh login
 * 3. On auth state changes
 */
export const useOneSignalUserLink = () => {
  const { user, loading } = useAuth();
  const initRef = useRef(false);
  const linkedUserIdRef = useRef<string | null>(null);

  // Initialize OneSignal SDK on mount (only once)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log('[OneSignal] Initializing SDK with App ID:', ONESIGNAL_APP_ID);
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
        console.log('[OneSignal] SDK initialized successfully');
      } catch (error) {
        console.error('[OneSignal] Initialization error:', error);
      }
    });
  }, []);

  // Link user to OneSignal ONLY after auth is fully loaded
  useEffect(() => {
    // CRITICAL: Wait for auth loading to complete before doing anything
    if (loading) {
      console.log('[OneSignal] Auth still loading, waiting...');
      return;
    }

    console.log('[OneSignal] Auth loaded. User:', user?.id ?? 'none');

    // Handle logout: clear linked user ref when user becomes null
    if (!user?.id) {
      if (linkedUserIdRef.current) {
        console.log('[OneSignal] User logged out, clearing linked user ref');
        linkedUserIdRef.current = null;
        // Optionally logout from OneSignal
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            await OneSignal.logout();
            console.log('[OneSignal] Logged out from OneSignal');
          } catch (error) {
            console.error('[OneSignal] Logout error:', error);
          }
        });
      }
      return;
    }

    // Idempotency check: skip if same user already linked
    if (linkedUserIdRef.current === user.id) {
      console.log('[OneSignal] User already linked:', user.id);
      return;
    }

    // Link the authenticated user to OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        console.log('[OneSignal] Calling login() with External User ID:', user.id);
        await OneSignal.login(user.id);
        linkedUserIdRef.current = user.id;
        console.log('[OneSignal] Successfully linked user. External User ID:', user.id);
        console.log('[OneSignal] This user will now receive push notifications via include_external_user_ids');
      } catch (error) {
        console.error('[OneSignal] Error linking user:', error);
      }
    });
  }, [user?.id, loading]); // Depend on both user.id AND loading state

  return null;
};
