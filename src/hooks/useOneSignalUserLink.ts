import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    OneSignal?: {
      login?: (externalId: string) => Promise<void>;
      setExternalUserId?: (externalId: string) => void;
      getExternalUserId?: () => Promise<string | null>;
      User?: {
        PushSubscription?: {
          id?: string;
        };
      };
    };
  }
}

/**
 * Hook to link the authenticated Supabase user to OneSignal for push notifications.
 * Runs on login and on app startup if a session already exists.
 */
export const useOneSignalUserLink = () => {
  const { user } = useAuth();
  const linkedUserIdRef = useRef<string | null>(null);

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

      // Wait for OneSignal to be available
      if (!window.OneSignal) {
        console.log('[OneSignal] SDK not loaded yet, will retry...');
        // Retry after a short delay
        const retryTimeout = setTimeout(() => {
          linkUserToOneSignal();
        }, 1000);
        return () => clearTimeout(retryTimeout);
      }

      try {
        const OneSignal = window.OneSignal;

        // Prefer OneSignal.login if available (newer SDK)
        if (typeof OneSignal.login === 'function') {
          console.log('[OneSignal] Using login() to link user:', user.id);
          await OneSignal.login(user.id);
          linkedUserIdRef.current = user.id;
          console.log('[OneSignal] Successfully linked user via login():', user.id);
        } 
        // Fall back to setExternalUserId (older SDK)
        else if (typeof OneSignal.setExternalUserId === 'function') {
          console.log('[OneSignal] Using setExternalUserId() to link user:', user.id);
          OneSignal.setExternalUserId(user.id);
          linkedUserIdRef.current = user.id;
          console.log('[OneSignal] Successfully linked user via setExternalUserId():', user.id);
        } 
        else {
          console.warn('[OneSignal] Neither login() nor setExternalUserId() available');
        }
      } catch (error) {
        console.error('[OneSignal] Error linking user:', error);
      }
    };

    linkUserToOneSignal();
  }, [user?.id]);

  return null;
};
