import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { useFriendRequestNotifications } from '@/hooks/useFriendRequestNotifications';
import { useLeaderboardNotifications } from '@/hooks/useLeaderboardNotifications';
import { useAppRating } from '@/hooks/useAppRating';
import { AppRatingDialog } from '@/components/AppRatingDialog';
import { useFriendDonationNotifications } from '@/hooks/useFriendDonationNotifications';

export const NotificationManager = () => {
  usePushNotifications();
  useNotificationSetup();
  useFriendRequestNotifications();
  useLeaderboardNotifications();
  useFriendDonationNotifications();
  const { showRatingPrompt, dismissRatingPrompt } = useAppRating();

  return <AppRatingDialog open={showRatingPrompt} onClose={dismissRatingPrompt} />;
};
