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
  User?: {
    PushSubscription?: {
      id?: string;
    };
  };
}

/**
 * Hook to initialize OneSignal and link the authenticated Supabase user.
 * Runs on app startup and links user on login.
 */
export const useOneSignalUserLink = () => {
  const { user } = useAuth();
  const initRef = useRef(false);
  const linkedUserIdRef = useRef<string | null>(null);

  // Initialize OneSignal on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

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

  // Link user to OneSignal when authenticated
  useEffect(() => {
    const linkUserToOneSignal = async () => {
      // Do nothing if no authenticated user
      if (!user?.id) {
        linkedUserIdRef.current = null;
        return;
      }

      // Avoid duplicate calls if the same user is already linked
      if (linkedUserIdRef.current === user.id) {
        console.log('[OneSignal] User already linked:', user.id);
        return;
      }

      // Use OneSignalDeferred to ensure SDK is ready
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          console.log('[OneSignal] Linking user:', user.id);
          await OneSignal.login(user.id);
          linkedUserIdRef.current = user.id;
          console.log('[OneSignal] Successfully linked user:', user.id);
        } catch (error) {
          console.error('[OneSignal] Error linking user:', error);
        }
      });
    };

    linkUserToOneSignal();
  }, [user?.id]);

  return null;
};
