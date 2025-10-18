import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const FRIEND_REQUEST_MESSAGES = [
  "👋 {name} sent you a friend request!",
  "🤝 {name} wants to be your friend!",
  "✨ New friend request from {name}!",
];

const FRIEND_ACCEPTED_MESSAGES = [
  "🎉 {name} accepted your friend request!",
  "✅ You and {name} are now friends!",
  "🤗 {name} is now your friend!",
];

export const useFriendRequestNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      console.log('Friend notifications not supported on web');
      return;
    }

    // Subscribe to new friend requests
    const requestsChannel = supabase
      .channel('friend_requests_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const request = payload.new;
          
          // Fetch sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', request.sender_id)
            .single();

          const senderName = profile?.display_name || profile?.username || 'Someone';
          
          // Select a random message
          const messageTemplate = FRIEND_REQUEST_MESSAGES[
            Math.floor(Math.random() * FRIEND_REQUEST_MESSAGES.length)
          ];
          const message = messageTemplate.replace('{name}', senderName);

          // Check if notifications are enabled
          const { data: settings } = await supabase
            .from('profiles')
            .select('friends_notifications_enabled')
            .eq('id', user.id)
            .single();

          if (settings?.friends_notifications_enabled === false) {
            return;
          }

          // Send local notification
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: "New Friend Request",
                  body: message,
                  id: Math.floor(Math.random() * 100000),
                  sound: 'default',
                  smallIcon: 'ic_stat_icon',
                  iconColor: '#8B4513',
                  channelId: 'orthocross-friends',
                },
              ],
            });
          } catch (error) {
            console.log('Error sending friend request notification:', error);
          }
        }
      )
      .subscribe();

    // Subscribe to friend request status updates (accepted)
    const acceptedChannel = supabase
      .channel('friend_requests_accepted')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_requests',
          filter: `sender_id=eq.${user.id}`,
        },
        async (payload) => {
          const request = payload.new;
          
          // Only notify if status changed to accepted
          if (request.status !== 'accepted') return;

          // Fetch receiver's profile (the person who accepted)
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', request.receiver_id)
            .single();

          const receiverName = profile?.display_name || profile?.username || 'Someone';
          
          // Select a random message
          const messageTemplate = FRIEND_ACCEPTED_MESSAGES[
            Math.floor(Math.random() * FRIEND_ACCEPTED_MESSAGES.length)
          ];
          const message = messageTemplate.replace('{name}', receiverName);

          // Check if notifications are enabled
          const { data: settings } = await supabase
            .from('profiles')
            .select('friends_notifications_enabled')
            .eq('id', user.id)
            .single();

          if (settings?.friends_notifications_enabled === false) {
            return;
          }

          // Send local notification
          try {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: "Friend Request Accepted!",
                  body: message,
                  id: Math.floor(Math.random() * 100000),
                  sound: 'default',
                  smallIcon: 'ic_stat_icon',
                  iconColor: '#8B4513',
                  channelId: 'orthocross-friends',
                },
              ],
            });
          } catch (error) {
            console.log('Error sending friend accepted notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(acceptedChannel);
    };
  }, [user]);
};
