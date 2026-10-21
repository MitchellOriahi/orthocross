import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to listen for leaderboard position changes.
 * When someone passes the current user, this triggers a push notification via edge function.
 * The edge function handles FCM delivery.
 */
export const useLeaderboardNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to leaderboard notifications (inserted by database trigger)
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
          
          // The push itself is sent by the scheduled reminders function
          // (server-side, naming the user who passed us); the client only
          // marks the in-app row as read.

          // Mark notification as read
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
