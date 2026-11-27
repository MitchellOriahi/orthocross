import { useState, useEffect, useRef } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { GroupInvitation } from "@/hooks/useGroupsData";

interface GroupInvitationsListProps {
  invitations: GroupInvitation[];
  userId: string;
  onInvitationHandled: () => void;
}

export const GroupInvitationsList = ({ invitations, userId, onInvitationHandled }: GroupInvitationsListProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const invitationIds = invitations.map(invitation => invitation.id).sort().join(',');

  useEffect(() => {
    const list = listRef.current;
    if (!list || !userId || !invitationIds) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const { error } = await supabase.from('group_invitation_notifications')
        .update({ read: true }).eq('user_id', userId)
        .in('invitation_id', invitationIds.split(',')).eq('read', false);
      if (error) {
        console.error('Failed to mark group invitations as read:', error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['groupInvitationCount', userId] });
    }, { threshold: 0.25 });
    observer.observe(list);
    return () => observer.disconnect();
  }, [invitationIds, userId, queryClient]);

  const handleAccept = async (invitation: GroupInvitation) => {
    setProcessingId(invitation.id);
    try {
      const { error } = await supabase.rpc('accept_group_invitation', {
        p_invitation_id: invitation.id,
      });
      if (error) throw error;

      toast({
        title: "Joined group!",
        description: `You've joined "${invitation.group_name}"`
      });

      onInvitationHandled();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: GroupInvitation) => {
    setProcessingId(invitation.id);
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id)
        .eq('invitee_id', userId);
      if (error) throw error;

      // Mark notification as read
      await supabase
        .from('group_invitation_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('invitation_id', invitation.id);

      toast({
        title: "Invitation declined",
        description: `You declined the invitation to "${invitation.group_name}"`
      });

      onInvitationHandled();
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div ref={listRef} className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Users className="h-4 w-4" />
        Group Invitations ({invitations.length})
      </h4>
      {invitations.map((invitation) => (
        <div 
          key={invitation.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={invitation.inviter_profile_picture_url || undefined} />
            <AvatarFallback>
              {invitation.inviter_username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{invitation.group_name}</p>
            <p className="text-xs text-muted-foreground">
              {invitation.inviter_username} invited you 👀
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
              onClick={() => handleAccept(invitation)}
              disabled={processingId === invitation.id}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => handleDecline(invitation)}
              disabled={processingId === invitation.id}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
