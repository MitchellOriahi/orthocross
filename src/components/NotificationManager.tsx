import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { useFriendRequestNotifications } from '@/hooks/useFriendRequestNotifications';
import { useLeaderboardNotifications } from '@/hooks/useLeaderboardNotifications';
import { useFriendDonationNotifications } from '@/hooks/useFriendDonationNotifications';

// The rating prompt is scheduled by the shared prompt coordinator (DonationPromptDialog).
export const NotificationManager = () => {
  usePushNotifications();
  useNotificationSetup();
  useFriendRequestNotifications();
  useLeaderboardNotifications();
  useFriendDonationNotifications();
  return null;
};
