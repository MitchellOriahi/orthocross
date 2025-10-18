import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLeaderboardNotifications } from '@/hooks/useLeaderboardNotifications';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';

export const NotificationManager = () => {
  const { scheduleStreakReminders } = useNotifications();
  useLeaderboardNotifications();
  useNotificationSetup();

  useEffect(() => {
    scheduleStreakReminders();
  }, [scheduleStreakReminders]);

  return null;
};
