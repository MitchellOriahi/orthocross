import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to listen for leaderboard position changes.
 * When someone passes the current user, this triggers a push notification via edge function.
 * The edge function handles OneSignal delivery.
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
          
          // Fetch the username of the person who passed us
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', notification.passed_by_user_id)
            .single();

          const passedByName = profile?.display_name || profile?.username || 'Someone';
          
          // Call edge function to send push notification via OneSignal
          try {
            await supabase.functions.invoke('send-leaderboard-notification', {
              body: {
                passed_user_ids: [user.id],
                current_user_name: passedByName,
                group_name: null, // Global leaderboard
              },
            });
          } catch (error) {
            console.log('Error triggering leaderboard notification:', error);
          }

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
