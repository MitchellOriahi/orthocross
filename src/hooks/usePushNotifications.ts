import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const log = (msg: string) => console.log(msg);

/**
 * Hook to register for native push notifications using @capacitor/push-notifications.
 * 
 * Flow:
 * 1. Wait for auth to finish loading
 * 2. On native platforms, request permission and register
 * 3. On 'registration' event, save token to push_tokens table via edge function
 * 4. On logout, optionally clean up
 */
export const usePushNotifications = () => {
  const { user, loading } = useAuth();
  const registeredRef = useRef(false);
  const savedTokenRef = useRef<string | null>(null);

  const saveToken = useCallback(async (token: string, userId: string) => {
    if (savedTokenRef.current === token) return;

    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[Push] No session for token registration');
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/register-push-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token, platform }),
        }
      );

      if (response.ok) {
        savedTokenRef.current = token;
        log(`[Push] Token saved for ${userId.substring(0, 8)}... (${platform})`);
      } else {
        const err = await response.json();
        console.error('[Push] Failed to save token:', err);
      }
    } catch (error) {
      console.error('[Push] Error saving token:', error);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      // User logged out - reset state
      registeredRef.current = false;
      savedTokenRef.current = null;
      return;
    }

    // Only works on native platforms
    if (!Capacitor.isNativePlatform()) {
      log('[Push] Skipping - not a native platform');
      return;
    }

    if (registeredRef.current) return;
    registeredRef.current = true;

    const setupPush = async () => {
      try {
        // Dynamically import to avoid issues on web
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        log(`[Push] Permission: ${permResult.receive}`);

        if (permResult.receive !== 'granted') {
          log('[Push] Permission denied');
          return;
        }

        // Listen for registration success
        await PushNotifications.addListener('registration', async (token) => {
          log(`[Push] Registered token: ${token.value.substring(0, 20)}...`);
          await saveToken(token.value, user.id);
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[Push] Registration error:', error);
        });

        // Listen for incoming notifications (foreground)
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          log(`[Push] Received: ${notification.title}`);
        });

        // Listen for notification taps
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          log(`[Push] Tapped: ${action.notification.title}`);
        });

        // Register with FCM/APNs
        await PushNotifications.register();
        log('[Push] Registration initiated');
      } catch (error) {
        console.error('[Push] Setup error:', error);
      }
    };

    setupPush();
  }, [user?.id, loading, saveToken]);
};
