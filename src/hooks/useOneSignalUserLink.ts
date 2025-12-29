import { useEffect, useState, useRef } from 'react';
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
 * Hook to initialize OneSignal and link the authenticated user via External User ID.
 *
 * Guarantees:
 * - OneSignal SDK initializes once per runtime
 * - OneSignal.login(user.id) fires exactly once when ALL are true:
 *   1) auth loading === false
 *   2) user.id exists
 *   3) OneSignal SDK initialized
 */
export const useOneSignalUserLink = () => {
  const { user, loading } = useAuth();

  // NOTE: React dev mode can mount effects twice; this prevents double init.
  const initRef = useRef(false);

  const [sdkReady, setSdkReady] = useState(false);
  const [loginCalled, setLoginCalled] = useState(false);

  // Initialize OneSignal SDK on mount (only once)
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

        setSdkReady(true);
        console.log('[OneSignal] SDK initialized');
      } catch (error) {
        setSdkReady(false);
        console.error('[OneSignal] Initialization error:', error);
      }
    });
  }, []);

  // Login when BOTH auth + SDK are ready
  useEffect(() => {
    // REQUIRED CONDITIONS (no other gates):
    // - auth loading === false
    // - user.id exists
    // - SDK initialized
    if (loading) return;
    if (!user?.id) return;
    if (!sdkReady) return;

    // Fire exactly once
    if (loginCalled) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        console.log('[OneSignal] Calling login() with External User ID:', user.id);
        await OneSignal.login(user.id);

        setLoginCalled(true);

        console.log('[OneSignal] login() succeeded. External User ID:', user.id);

        // Keep debug panel working (dev-only)
        window.dispatchEvent(
          new CustomEvent('onesignal-login-called', {
            detail: { userId: user.id },
          })
        );
      } catch (error) {
        console.error('[OneSignal] login() error:', error);
      }
    });
  }, [loading, user?.id, sdkReady, loginCalled]);

  return null;
};
