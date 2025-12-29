import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const NotificationManager = () => {
  const { user } = useAuth();
  const { scheduleStreakReminders, scheduleAllFastingReminders } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      // Schedule streak reminders
      await scheduleStreakReminders();
      
      // Check if fasting notifications are enabled and schedule them
      const { data: profile } = await supabase
        .from('profiles')
        .select('fasting_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (profile?.fasting_notifications_enabled) {
        await scheduleAllFastingReminders(user.id);
      }
    };

    initializeNotifications();
  }, [user, scheduleStreakReminders, scheduleAllFastingReminders]);

  return null;
};
