import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, ChevronRight, Globe, Lock, Crown } from "lucide-react";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { GroupSearchDialog } from "./GroupSearchDialog";
import { GroupInvitationsList } from "./GroupInvitationsList";
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
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
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
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
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
