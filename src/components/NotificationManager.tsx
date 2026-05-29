import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { useFriendRequestNotifications } from '@/hooks/useFriendRequestNotifications';
import { useLeaderboardNotifications } from '@/hooks/useLeaderboardNotifications';
import { useAppRating } from '@/hooks/useAppRating';
import { AppRatingDialog } from '@/components/AppRatingDialog';

export const NotificationManager = () => {
  usePushNotifications();
  useNotificationSetup();
  useFriendRequestNotifications();
  useLeaderboardNotifications();
  const { showRatingPrompt, dismissRatingPrompt } = useAppRating();

  return <AppRatingDialog open={showRatingPrompt} onClose={dismissRatingPrompt} />;
};
