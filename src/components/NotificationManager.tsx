import { useOneSignalUserLink } from '@/hooks/useOneSignalUserLink';

export const NotificationManager = () => {
  // Initialize OneSignal user linking
  // This handles:
  // 1. OneSignal SDK initialization
  // 2. Requesting notification permission
  // 3. Linking Supabase user.id as OneSignal External User ID
  // 4. Logging out on user sign out
  useOneSignalUserLink();

  // Notifications are now handled server-side via the send-notifications Edge Function:
  // - Streak reminders: sent at 6pm local time if user hasn't completed any readings
  // - Fasting reminders: sent at 8pm local time the day before fasts/feasts

  return null;
};
