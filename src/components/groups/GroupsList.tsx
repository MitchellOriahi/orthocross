import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, ChevronRight, Globe, Lock, Crown, Pin } from "lucide-react";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupSearchDialog } from "./GroupSearchDialog";
import { GroupInvitationsList } from "./GroupInvitationsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Group, GroupInvitation } from "@/hooks/useGroupsData";

interface GroupsListProps {
  groups: Group[];
  invitations: GroupInvitation[];
  unreadInvitationCount: number;
  userId: string;
  onGroupClick: (groupId: string) => void;
  onRefresh: () => void;
}

export const GroupsList = ({
  groups,
  invitations,
  unreadInvitationCount,
  userId,
  onGroupClick,
  onRefresh
}: GroupsListProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [pinnedGroupIds, setPinnedGroupIds] = useState<Set<string>>(() => {
    try {
      const cached = sessionStorage.getItem(`pinned_groups_${userId}`);
      if (cached) return new Set(JSON.parse(cached) as string[]);
    } catch {}
    return new Set();
  });
  const { toast } = useToast();

  // Refresh pinned groups in the background
  useEffect(() => {
    if (!userId) return;

    const loadPinnedGroups = async () => {
      const { data } = await supabase
        .from('pinned_groups')
        .select('group_id')
        .eq('user_id', userId);

      if (data) {
        const ids = data.map(p => p.group_id);
        setPinnedGroupIds(new Set(ids));
        try { sessionStorage.setItem(`pinned_groups_${userId}`, JSON.stringify(ids)); } catch {}
      }
    };

    loadPinnedGroups();
  }, [userId]);

  const handlePinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!userId) {
      toast({ description: "Please sign in to pin groups", variant: "destructive" });
      return;
    }

    const isPinned = pinnedGroupIds.has(groupId);

    if (isPinned) {
      // Unpin
      await supabase
        .from('pinned_groups')
        .delete()
        .eq('user_id', userId)
        .eq('group_id', groupId);
      
      const newPinned = new Set(pinnedGroupIds);
      newPinned.delete(groupId);
      setPinnedGroupIds(newPinned);
      toast({ description: "Group unpinned!", duration: 1500 });
    } else {
      // Check limit (max 3 pinned groups)
      if (pinnedGroupIds.size >= 3) {
        toast({ description: "You can only pin up to 3 groups", variant: "destructive" });
        return;
      }

      // Pin
      await supabase
        .from('pinned_groups')
        .insert({ user_id: userId, group_id: groupId });
      
      const newPinned = new Set(pinnedGroupIds);
      newPinned.add(groupId);
      setPinnedGroupIds(newPinned);
      toast({ description: "Group pinned to top!", duration: 1500 });
    }
  };

  // Sort groups: pinned first, then by name
  const sortedGroups = [...groups].sort((a, b) => {
    const aIsPinned = pinnedGroupIds.has(a.id);
    const bIsPinned = pinnedGroupIds.has(b.id);
    
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Groups
            {unreadInvitationCount > 0 && (
              <Badge variant="destructive">{unreadInvitationCount}</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSearchDialog(true)}
            >
              <Search className="h-4 w-4 mr-1" />
              Find
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invitations */}
        <GroupInvitationsList
          invitations={invitations}
          userId={userId}
          onInvitationHandled={onRefresh}
        />

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No groups yet.</p>
            <p className="text-sm">Create a group or search for one to join!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedGroups.map((group) => {
              const isPinned = pinnedGroupIds.has(group.id);
              return (
                <div
                  key={group.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors ${
                    isPinned ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                  }`}
                  onClick={() => onGroupClick(group.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{group.name}</p>
                      {group.user_role === 'owner' && (
                        <Crown className="h-3 w-3 text-amber-400" />
                      )}
                      {isPinned && (
                        <Pin className="h-3 w-3 text-primary fill-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {group.is_public ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      <span>{group.member_count} members</span>
                      {group.member_count < 3 && (
                        <Badge variant="secondary" className="text-xs py-0">
                          Need {3 - group.member_count} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={(e) => handlePinGroup(e, group.id)}
                    title={isPinned ? "Unpin group" : "Pin group"}
                  >
                    <Pin className={`h-4 w-4 ${isPinned ? 'fill-primary' : ''}`} />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
        onGroupCreated={onRefresh}
      />

      <GroupSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        userId={userId}
        userGroupIds={groups.map(g => g.id)}
        onRequestSent={onRefresh}
      />
    </Card>
  );
};