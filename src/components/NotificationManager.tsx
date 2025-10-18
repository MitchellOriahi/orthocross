import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLeaderboardNotifications } from '@/hooks/useLeaderboardNotifications';

export const NotificationManager = () => {
  const { scheduleStreakReminders } = useNotifications();
  useLeaderboardNotifications();

  useEffect(() => {
    scheduleStreakReminders();
  }, [scheduleStreakReminders]);

  return null;
};
