import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';

const log = (msg: string) => console.log(msg);

// Dynamically access OneSignal to avoid build errors on web
const getOneSignal = async () => {
  try {
    // @ts-ignore - OneSignal Cordova plugin dynamic import
    const mod = await import('onesignal-cordova-plugin/www/OneSignalPlugin');
    return mod.default;
  } catch {
    return null;
  }
};

/**
 * Hook to link OneSignal external user ID with Supabase auth user.
 */
export const usePushNotifications = () => {
  const { user, loading } = useAuth();
  const linkedRef = useRef(false);

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
