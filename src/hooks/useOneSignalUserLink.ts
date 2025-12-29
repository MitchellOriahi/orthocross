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
  Notifications?: {
    requestPermission: (fallbackToSettings?: boolean) => Promise<void>;
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
  // All hooks MUST be at top level (unconditional)
  const { user, loading } = useAuth();
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

        // If auth is already ready in this session, login immediately from the same callback.
        if (!loading && user?.id) {
          console.log('[OneSignal] Waiting for permission handling before login...');
          
          // Wait for permission handling to ensure native bridge is ready
          if (OneSignal.Notifications?.requestPermission) {
            await OneSignal.Notifications.requestPermission(false);
            console.log('[OneSignal] Permission handling complete');
          }
          
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
        }
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
        console.log('[OneSignal] Waiting for permission handling before login...');
        
        // Wait for permission handling to ensure native bridge is ready
        if (OneSignal.Notifications?.requestPermission) {
          await OneSignal.Notifications.requestPermission(false);
          console.log('[OneSignal] Permission handling complete');
        }
        
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
