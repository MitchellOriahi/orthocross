import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationManager = () => {
  // Initialize OneSignal push notifications (native only)
  // This handles:
  // 1. Requesting notification permission on native platforms
  // 2. Linking OneSignal external user ID with Supabase auth user
  // 3. Logging out from OneSignal when user logs out
  // 4. Retry logic for reliability
  usePushNotifications();

  return null;
};
