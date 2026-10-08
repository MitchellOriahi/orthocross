import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Friend } from "@/hooks/useFriendsData";
import { useProfileData } from "@/hooks/useProfileData";

interface GroupInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  userId: string;
  friends: Friend[];
  existingMemberIds: string[];
  onInvitesSent: () => void;
}

export const GroupInviteDialog = ({
  open,
  onOpenChange,
  groupId,
  groupName,
  userId,
  friends,
  existingMemberIds,
  onInvitesSent
}: GroupInviteDialogProps) => {
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [pendingInviteIds, setPendingInviteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { profile } = useProfileData();

  const loadPendingInvites = useCallback(async () => {
    const { data } = await supabase
      .from('group_invitations')
      .select('invitee_id')
      .eq('group_id', groupId)
      .eq('status', 'pending');
    setPendingInviteIds(data?.map(i => i.invitee_id) || []);
  }, [groupId]);

  useEffect(() => {
    if (open) {
      loadPendingInvites();
    } else {
      setPendingInviteIds([]);
    }
  }, [open, loadPendingInvites]);

  // Filter out friends who are already members
  const availableFriends = friends.filter(f => !existingMemberIds.includes(f.id));
  const visibleFriends = searchQuery.trim()
    ? availableFriends.filter(f => f.username?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : availableFriends;

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedFriends.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one friend to invite",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Check for existing invitations
      const { data: existingInvites } = await supabase
        .from('group_invitations')
        .select('invitee_id')
        .eq('group_id', groupId)
        .in('invitee_id', selectedFriends)
        .eq('status', 'pending');

      const alreadyInvited = existingInvites?.map(i => i.invitee_id) || [];
      const newInvites = selectedFriends.filter(id => !alreadyInvited.includes(id));

      if (newInvites.length === 0) {
        toast({
          title: "Already invited",
          description: "All selected friends have already been invited",
          duration: 4000
        });
        setSelectedFriends([]);
        return;
      }

      const invitations = newInvites.map(inviteeId => ({
        group_id: groupId,
        inviter_id: userId,
        invitee_id: inviteeId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('group_invitations')
        .insert(invitations);

      if (error) throw error;

      setPendingInviteIds(prev => [...prev, ...newInvites]);

      // Send push notifications to all invited users
      const inviterName = profile?.username || profile?.display_name || 'Someone';
      for (const inviteeId of newInvites) {
        try {
          await supabase.functions.invoke('send-group-invitation-notification', {
            body: {
              to_user_id: inviteeId,
              from_user_name: inviterName,
              group_name: groupName,
            },
          });
        } catch (notifError) {
          console.log('Failed to send group invitation notification:', notifError);
        }
      }

      toast({
        title: "Invite sent!",
        duration: 4000
      });

      setSelectedFriends([]);
      onOpenChange(false);
      onInvitesSent();
    } catch (error) {
      console.error("Error sending invites:", error);
      toast({
        title: "Error",
        description: "Failed to send invitations",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Friends to "{groupName}"
          </DialogTitle>
          <DialogDescription>
            Select friends to invite to this group
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
          {availableFriends.length > 0 && (
            <div className="relative mx-1 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="pl-9"
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto space-y-2">
            {availableFriends.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                All your friends are already members of this group!
              </div>
            ) : visibleFriends.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No friends match "{searchQuery.trim()}"
              </div>
            ) : (
              visibleFriends.map((friend) => {
                const isSelected = selectedFriends.includes(friend.id);
                const isInvited = pendingInviteIds.includes(friend.id);
                return (
                  <div 
                    key={friend.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/20' : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.profile_picture_url || undefined} />
                      <AvatarFallback>{friend.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium flex-1 truncate">{friend.username}</span>
                    {isInvited && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-400/30 shrink-0">
                        Invited
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {availableFriends.length > 0 && (
            <Button 
              onClick={handleSendInvites} 
              disabled={isSending || selectedFriends.length === 0}
              className="w-full"
            >
              {isSending ? "Sending..." : `Send ${selectedFriends.length > 0 ? `(${selectedFriends.length})` : ''} Invite${selectedFriends.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
