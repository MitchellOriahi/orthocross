import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to listen for group invitation events.
 * Push notifications are sent via the group invite dialog when inviting.
 * This hook handles real-time UI updates.
 */
export const useGroupInvitationNotifications = (userId: string | undefined) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) return;

    // Subscribe to group invitations for real-time UI updates
    const channel = supabase
      .channel('group-invitation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_invitations',
          filter: `invitee_id=eq.${userId}`,
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

          console.log(`[GroupInvitation] ${inviter.username} invited you to "${group.name}"`);
          
          // Push notification will be sent from the inviter's side when they create the invitation
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
