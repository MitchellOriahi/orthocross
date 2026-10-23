import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Marks leaderboard notifications as read when they arrive while the app is open.
 * The push itself is sent server-side by send-scheduled-reminders.
 */
export const useLeaderboardNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('leaderboard_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leaderboard_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;
          if (notification.month_date === 'friend_request') return;

          try {
            await supabase
              .from('leaderboard_notifications')
              .update({ read: true })
              .eq('id', notification.id);
          } catch (error) {
            console.log('Error marking notification as read:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
