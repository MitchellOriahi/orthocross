import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const INVITATION_MESSAGES = [
  "has invited you to join",
  "wants you in the group",
  "sent you a group invite for"
];

export const useGroupInvitationNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;
    
    // Skip on web
    if (Capacitor.getPlatform() === 'web') return;

    const channel = supabase
      .channel('group-invitation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_invitations',
          filter: `invitee_id=eq.${userId}`
        },
        async (payload) => {
          const invitation = payload.new as any;
          
          // Get inviter profile
          const { data: inviter } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', invitation.inviter_id)
            .single();

          // Get group name
          const { data: group } = await supabase
            .from('groups')
            .select('name')
            .eq('id', invitation.group_id)
            .single();

          if (!inviter || !group) return;

          // Check notification settings
          const { data: profile } = await supabase
            .from('profiles')
            .select('friends_notifications_enabled')
            .eq('id', userId)
            .single();

          if (!profile?.friends_notifications_enabled) return;

          const message = INVITATION_MESSAGES[Math.floor(Math.random() * INVITATION_MESSAGES.length)];

          await LocalNotifications.schedule({
            notifications: [{
              id: Math.floor(Math.random() * 100000),
              title: "Group Invitation 👀",
              body: `${inviter.username} ${message} "${group.name}"! Will you join?`,
              schedule: { at: new Date(Date.now() + 1000) }
            }]
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
