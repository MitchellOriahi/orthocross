import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';

const log = (msg: string) => console.log(msg);

import OneSignalStatic from 'onesignal-cordova-plugin';

// The SDK must be statically imported so Vite actually bundles it — the old
// runtime import of a bare specifier can never resolve inside the packaged
// app, which meant OneSignal never initialized in any native build. Its
// cordova.exec calls all live inside methods, so importing on web is safe;
// every call site is already gated on Capacitor.isNativePlatform().
const getOneSignal = async () => OneSignalStatic;

let oneSignalInitialized = false;

/**
 * Hook to initialize OneSignal and link the external user ID with Supabase auth user.
 */
export const usePushNotifications = () => {
  const { user, loading } = useAuth();
  const linkedRef = useRef(false);

  // Initialize OneSignal once on first native app launch
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (oneSignalInitialized) return;

    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
    if (!appId) {
      console.error('[OneSignal] VITE_ONESIGNAL_APP_ID is not set');
      return;
    }

    const initialize = async () => {
      const OneSignal = await getOneSignal();
      if (!OneSignal) {
        console.error('[OneSignal] Plugin not available');
        return;
      }
      try {
        OneSignal.initialize(appId);
        oneSignalInitialized = true;
        log('[OneSignal] Initialized');
      } catch (error) {
        console.error('[OneSignal] Initialization error:', error);
      }
    };

    initialize();
  }, []);

  // Link/unlink Supabase user with OneSignal after initialization
  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      linkedRef.current = false;
      if (Capacitor.isNativePlatform()) {
        getOneSignal().then(OneSignal => {
          if (OneSignal) {
            OneSignal.logout();
            log('[OneSignal] Logged out');
          }
        });
      }
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      log('[OneSignal] Skipping - not a native platform');
      return;
    }

    if (linkedRef.current) return;
    linkedRef.current = true;

    const linkUser = async (attempt = 0) => {
      try {
        const OneSignal = await getOneSignal();
        if (!OneSignal) {
          console.error('[OneSignal] Plugin not available');
          return;
        }

        OneSignal.Notifications.requestPermission(true);
        log(`[OneSignal] Permission requested`);

        const delays = [0, 2000, 5000];
        const delay = delays[attempt] || 0;
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        OneSignal.login(user.id);
        log(`[OneSignal] Linked user ${user.id.substring(0, 8)}... (attempt ${attempt + 1})`);
      } catch (error) {
        console.error(`[OneSignal] Link error (attempt ${attempt + 1}):`, error);
        if (attempt < 2) {
          linkUser(attempt + 1);
        }
      }
    };

    linkUser();
  }, [user?.id, loading]);
};
