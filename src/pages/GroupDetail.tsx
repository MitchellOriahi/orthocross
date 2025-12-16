import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Settings as SettingsIcon, UserPlus, Trophy, Activity, Crown, ChevronDown, ChevronUp, MoreVertical, LogOut, UserMinus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupDetail, GroupMember, GroupActivity, GroupJoinRequest } from "@/hooks/useGroupsData";
import { useFriendsData } from "@/hooks/useFriendsData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
import { GroupMemberBadge } from "@/components/groups/GroupMemberBadge";
import { GroupInviteDialog } from "@/components/groups/GroupInviteDialog";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { friends } = useFriendsData(user?.id);
  
  const { members, activities, joinRequests, isLoading, refetch } = useGroupDetail(groupId, user?.id);
  
  const [group, setGroup] = useState<{ name: string; description: string | null; is_public: boolean } | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [activityOpen, setActivityOpen] = useState(true);
  const [rankingOpen, setRankingOpen] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  useEffect(() => {
    if (!groupId) return;
    
    const loadGroupInfo = async () => {
      const { data } = await supabase
        .from('groups')
        .select('name, description, is_public')
        .eq('id', groupId)
        .single();
      
      if (data) setGroup(data);
    };

    loadGroupInfo();
  }, [groupId]);

  useEffect(() => {
    if (user && members.length > 0) {
      const currentMember = members.find(m => m.user_id === user.id);
      setCurrentUserRole(currentMember?.role || null);
    }
  }, [user, members]);

  const isActive = members.length >= 3;
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Left group",
        description: `You have left "${group?.name}"`
      });

      navigate('/friends');
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive"
      });
    }
    setShowLeaveDialog(false);
  };

  const handleAcceptJoinRequest = async (request: GroupJoinRequest) => {
    if (!groupId) return;

    try {
      // Update request status
      await supabase
        .from('group_join_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      // Add user to group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: request.user_id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: "Request accepted",
        description: `${request.username} has joined the group`
      });

      refetch.members();
      refetch.requests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive"
      });
    }
  };

  const handleDenyJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from('group_join_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      toast({ title: "Request declined" });
      refetch.requests();
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!groupId) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: `${username} has been removed from the group`
      });

      refetch.members();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  const renderActivityItem = (activity: GroupActivity) => {
    return (
      <div key={activity.id} className="p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.profile_picture_url || undefined} />
            <AvatarFallback className="text-xs">
              {activity.username?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{activity.username}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {activity.activity_type === 'chapter_completed' && (
            <>✨ Completed {activity.activity_data?.book_key ? `${activity.activity_data.book_key} Chapter ${activity.activity_data.chapter}` : 'a chapter'}</>
          )}
          {activity.activity_type === 'book_completed' && (
            <>📚 Completed {activity.activity_data?.book_name || 'a book'}!</>
          )}
          {activity.activity_type === 'saint_completed' && (
            <>👤 Finished reading about {activity.activity_data?.saint_name || 'a saint'}</>
          )}
          {activity.activity_type === 'island_completed' && (
            <>⛰️ Completed island: {activity.activity_data?.island_name || 'Unknown Island'}</>
          )}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-peaceful pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Loading group...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/friends')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{group?.name || 'Group'}</h1>
                <p className="text-xs text-muted-foreground">{members.length} members</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <DonateButton />
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Friends
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {currentUserRole !== 'owner' && (
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowLeaveDialog(true)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Group
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-4">
        {!isActive && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <p className="text-sm">
                  This group needs at least <strong>3 members</strong> to be active. 
                  Invite {3 - members.length} more friend{3 - members.length > 1 ? 's' : ''}!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Requests (for admins/owners) */}
        {canManage && joinRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Join Requests ({joinRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.profile_picture_url || undefined} />
                    <AvatarFallback>{request.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{request.username}</p>
                    <p className="text-xs text-muted-foreground">wants to join</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAcceptJoinRequest(request)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDenyJoinRequest(request.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ranking">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranking">
              <Trophy className="h-4 w-4 mr-2" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Rankings</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isActive ? (
                  <div className="text-center text-muted-foreground py-8">
                    Group needs 3+ members for rankings
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <div key={member.id} className="relative">
                        <GroupMemberBadge
                          username={member.username}
                          profilePictureUrl={member.profile_picture_url}
                          rank={index + 1}
                          consecutiveCount={member.consecutive_rank_count}
                          totalPoints={member.total_points}
                          onClick={() => navigate(`/friends/${member.user_id}`)}
                        />
                        {canManage && member.user_id !== user?.id && member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(member.user_id, member.username);
                            }}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {!isActive ? (
                  <div className="text-center text-muted-foreground py-8">
                    Group needs 3+ members for activity feed
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No activity yet. Complete chapters, read about saints, or finish islands to appear here!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map(renderActivityItem)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <GroupInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        groupId={groupId || ''}
        groupName={group?.name || ''}
        userId={user?.id || ''}
        friends={friends}
        existingMemberIds={members.map(m => m.user_id)}
        onInvitesSent={() => refetch.members()}
      />

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group?.name}"? You'll need to be invited again or request to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
