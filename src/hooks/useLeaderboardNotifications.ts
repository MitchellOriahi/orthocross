import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NOTIFICATION_MESSAGES = [
  "😱 {name} just passed you on the leaderboard! Open your Bible and catch up quickly.",
  "😤 {name} just passed you on the leaderboard! Open your Bible and show them who's boss.",
  "😧 {name} just passed you on the leaderboard, are you going to let them get away with it?",
  "😬 {name} just overtook you! Time to get back in the game!",
  "🔥 {name} is heating up! Don't let them leave you in the dust!",
  "⚡ {name} just zipped past you! Show them your true power!",
];

// Platform-specific emoji mapping (iOS uses system emojis, Android uses Unicode)
const EMOJI_MAP = {
  ios: {
    '😱': '😱',
    '😤': '😤', 
    '😧': '😧',
    '😬': '😬',
    '🔥': '🔥',
    '⚡': '⚡',
  },
  android: {
    '😱': '😱',
    '😤': '😤',
    '😧': '😧', 
    '😬': '😬',
    '🔥': '🔥',
    '⚡': '⚡',
  },
};

export const useLeaderboardNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const platform = Capacitor.getPlatform();
    const emojiSet = platform === 'ios' ? EMOJI_MAP.ios : EMOJI_MAP.android;

    // Subscribe to leaderboard notifications
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
          const notification = payload.new;
          
          // Fetch the username of the person who passed us
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', notification.passed_by_user_id)
            .single();

          const passedByName = profile?.display_name || profile?.username || 'Someone';
          
          // Select a random message
          const messageTemplate = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];
          let message = messageTemplate.replace('{name}', passedByName);
          
          // Replace emojis with platform-specific ones
          Object.entries(emojiSet).forEach(([emoji]) => {
            message = message.replace(new RegExp(emoji, 'g'), emoji);
          });

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
                  title: "Leaderboard Update!",
                  body: message,
                  id: Math.floor(Math.random() * 100000),
                  sound: 'default',
                  smallIcon: 'ic_stat_icon',
                  iconColor: '#8B4513',
                  channelId: 'orthocross-friends',
                },
              ],
            });

            // Mark notification as read
            await supabase
              .from('leaderboard_notifications')
              .update({ read: true })
              .eq('id', notification.id);
          } catch (error) {
            console.log('Error sending notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
