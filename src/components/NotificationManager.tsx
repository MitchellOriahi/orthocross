import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationManager = () => {
  // Initialize native push notifications (FCM/APNs via Capacitor)
  // This handles:
  // 1. Requesting notification permission on native platforms
  // 2. Registering for push and capturing device token
  // 3. Saving token to push_tokens table via edge function
  // 4. Auto-cleanup of invalid tokens on the backend
  usePushNotifications();

  return null;
};
