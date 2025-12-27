import { useState, useEffect } from "react";
import { Users, UserPlus, Trophy, Activity, Settings as SettingsIcon, UserMinus, Heart, ThumbsUp, PartyPopper, Flame, Star, AlertCircle, Zap, Frown, Hand, Award, Cross, Circle, Check, X, ChevronDown, ChevronUp, UsersRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
import { MonthlyPodiumModal } from "@/components/MonthlyPodiumModal";
import { StreakFlame } from "@/components/StreakFlame";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";
import { useFriendsData } from "@/hooks/useFriendsData";
import { useProfileData } from "@/hooks/useProfileData";
import { useGroupsData } from "@/hooks/useGroupsData";
import { useQueryClient } from "@tanstack/react-query";
import type { Friend } from "@/hooks/useFriendsData";
import { GroupsList } from "@/components/groups/GroupsList";

interface PodiumEntry {
  id: string;
  username: string;
  profile_picture_url: string | null;
  total_points: number;
  rank: number;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  books_completed: number;
  profile_picture_url: string | null;
}

interface DonatorEntry {
  user_id: string;
  username: string;
  total_donated: number;
  profile_picture_url: string | null;
}

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  // Use the friends data hook
  const { 
    friends, 
    sentRequests, 
    receivedRequests, 
    unreadNotificationCount: hookUnreadCount,
    activities, 
    refetch 
  } = useFriendsData(user?.id);

  // Use the groups data hook
  const {
    groups,
    invitations: groupInvitations,
    unreadInvitationCount: groupUnreadCount,
    refetch: refetchGroups
  } = useGroupsData(user?.id);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useProfileData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topDonators, setTopDonators] = useState<DonatorEntry[]>([]);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const [podiumData, setPodiumData] = useState<PodiumEntry[]>([]);
  const [lastMonthName, setLastMonthName] = useState("");
  const [activityTabOpen, setActivityTabOpen] = useState(() => {
    const saved = localStorage.getItem('friendActivityTabOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [pendingRequestsOpen, setPendingRequestsOpen] = useState(() => {
    const saved = localStorage.getItem('pendingRequestsOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [friendsListOpen, setFriendsListOpen] = useState(() => {
    const saved = localStorage.getItem('friendsListOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const REACTION_EMOJIS = [
    { emoji: "👍", icon: ThumbsUp, label: "Like" },
    { emoji: "❤️", icon: Heart, label: "Love" },
    { emoji: "🔥", icon: Flame, label: "Fire" },
    { emoji: "🎉", icon: PartyPopper, label: "Celebrate" },
    { emoji: "⭐", icon: Star, label: "Star" },
    { emoji: "🙏", icon: Hand, label: "Pray" }
  ];

  // Persist collapsible section states
  useEffect(() => {
    localStorage.setItem('friendActivityTabOpen', JSON.stringify(activityTabOpen));
  }, [activityTabOpen]);

  useEffect(() => {
    localStorage.setItem('pendingRequestsOpen', JSON.stringify(pendingRequestsOpen));
  }, [pendingRequestsOpen]);

  useEffect(() => {
    localStorage.setItem('friendsListOpen', JSON.stringify(friendsListOpen));
  }, [friendsListOpen]);

  // Sync unread count from hook
  useEffect(() => {
    setUnreadNotificationCount(hookUnreadCount);
  }, [hookUnreadCount]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
      checkMonthlyPodium();
    }

    if (!user) return;

    // Set up comprehensive realtime subscriptions
    const friendRequestsChannel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['receivedRequests', user.id] });
          queryClient.invalidateQueries({ queryKey: ['sentRequests', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_request_notifications',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['receivedRequests', user.id] });
        }
      )
      .subscribe();

    // Subscribe to friendship changes
    const friendshipsChannel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
        },
        (payload) => {
          // Refetch if the current user is involved
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          if (newRecord?.user_id === user.id || newRecord?.friend_id === user.id ||
              oldRecord?.user_id === user.id || oldRecord?.friend_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['friends', user.id] });
            queryClient.invalidateQueries({ queryKey: ['friendActivities', user.id] });
            loadLeaderboard();
          }
        }
      )
      .subscribe();

    // Subscribe to friend activities
    const activitiesChannel = supabase
      .channel('friend-activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_activities',
        },
        () => {
          // Force immediate refresh by invalidating the query
          queryClient.invalidateQueries({ queryKey: ['friendActivities', user.id] });
        }
      )
      .subscribe();

    // Subscribe to activity reactions
    const reactionsChannel = supabase
      .channel('activity-reactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_reactions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['friendActivities', user.id] });
        }
      )
      .subscribe();

    // Subscribe to streak updates for friends
    const streaksChannel = supabase
      .channel('friend-streaks-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_streaks',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['friends', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendRequestsChannel);
      supabase.removeChannel(friendshipsChannel);
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(streaksChannel);
    };
  }, [user, refetch]);

  const markNotificationsAsRead = async () => {
    if (!user) return;

    await supabase
      .from('friend_request_notifications')
      .update({ read: true })
      .eq('receiver_id', user.id)
      .eq('read', false);

    setUnreadNotificationCount(0);
  };

  const loadLeaderboard = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    // Load global leaderboard (all users, not just friends)
    const { data: leaderboardData } = await supabase
      .from('monthly_leaderboard')
      .select('user_id, total_points')
      .eq('month_date', currentMonth)
      .order('total_points', { ascending: false })
      .limit(50);

    if (leaderboardData && leaderboardData.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', leaderboardData.map(l => l.user_id));

      const leaderboardWithUsernames = leaderboardData.map(entry => ({
        id: entry.user_id,
        username: profilesData?.find(p => p.id === entry.user_id)?.username || 'Unknown User',
        profile_picture_url: profilesData?.find(p => p.id === entry.user_id)?.profile_picture_url || null,
        books_completed: entry.total_points || 0
      }));

      setLeaderboard(leaderboardWithUsernames);
    }

    // Load top donators
    const { data: donatorsData } = await supabase
      .rpc('get_top_donators', { limit_count: 10 });

    if (donatorsData) {
      setTopDonators(donatorsData.map((d: { user_id: string; total_donated: number; username: string | null; profile_picture_url: string | null }) => ({
        user_id: d.user_id,
        username: d.username || 'Anonymous',
        total_donated: d.total_donated,
        profile_picture_url: d.profile_picture_url
      })));
    }
  };

  const handleAddFriend = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username or phone number",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add friends",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Search for user using secure database function
      const { data: userId, error: searchError } = await supabase
        .rpc('search_user_for_friend_request', { 
          search_term: searchQuery.trim() 
        });

      if (searchError) {
        console.error("Search error:", searchError);
        throw searchError;
      }

      if (!userId) {
        toast({
          title: "User not found",
          description: "No user found with that username, display name, or phone number",
          variant: "destructive",
        });
        return;
      }

      const profileData = { id: userId };


      if (profileData.id === user.id) {
        toast({
          title: "Error",
          description: "You cannot add yourself as a friend",
          variant: "destructive",
        });
        return;
      }

      // Check if already friends
      const { data: existingFriendship } = await supabase
        .from("friends")
        .select("id")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profileData.id}),and(user_id.eq.${profileData.id},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existingFriendship) {
        toast({
          title: "Already friends",
          description: "You are already friends with this user",
        });
        return;
      }

      // Check if friend request already exists
      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id, status")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileData.id}),and(sender_id.eq.${profileData.id},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: "Request already exists",
          description: existingRequest.status === "pending" 
            ? "A friend request is already pending with this user"
            : "You already have a friend request with this user",
        });
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          sender_id: user.id,
          receiver_id: profileData.id,
          status: "pending",
        });

      if (error) throw error;

      setSearchQuery("");
      refetch.sentRequests();
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user || !requestToCancel) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestToCancel);

      if (error) throw error;

      toast({
        title: "Request cancelled",
        description: "Friend request has been cancelled",
      });

      refetch.sentRequests();
      refetch.receivedRequests();
      setShowCancelDialog(false);
      setRequestToCancel(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('accept_friend_request', { request_id: requestId });

      if (error) throw error;

      await markNotificationsAsRead();
      refetch.friends();
      refetch.receivedRequests();
      refetch.activities();
      loadLeaderboard();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request denied",
        description: "Friend request has been denied",
      });

      await markNotificationsAsRead();
      refetch.receivedRequests();
    } catch (error) {
      console.error("Error denying request:", error);
      toast({
        title: "Error",
        description: "Failed to deny request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !friendToRemove) return;

    try {
      // Find and delete the friendship record
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendToRemove.id}),and(user_id.eq.${friendToRemove.id},friend_id.eq.${user.id})`);

      if (error) throw error;

      toast({
        title: "Friend removed",
        description: `${friendToRemove.username} has been removed from your friends list`,
      });

      // Reload friends list
      refetch.friends();
      refetch.sentRequests();
      refetch.receivedRequests();
      refetch.activities();
      loadLeaderboard();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowRemoveDialog(false);
      setFriendToRemove(null);
    }
  };

  const checkMonthlyPodium = async () => {
    if (!user) return;

    // Use a ref-like approach with localStorage to prevent multiple triggers
    const podiumCheckKey = `podium_check_${user.id}`;
    const lastCheck = localStorage.getItem(podiumCheckKey);
    const now = Date.now();
    
    // Only check once per session (prevent multiple triggers)
    if (lastCheck && now - parseInt(lastCheck) < 60000) {
      return;
    }
    localStorage.setItem(podiumCheckKey, now.toString());

    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const lastMonthDate = lastMonth.toISOString().slice(0, 7);

    // Check if user has seen this month's podium
    const { data: viewedData } = await supabase
      .from('monthly_podium_views')
      .select('id')
      .eq('user_id', user.id)
      .eq('month_date', lastMonthDate)
      .maybeSingle();

    if (!viewedData) {
      // Load last month's top 3 (global now, not friends-only)
      const { data: leaderboardData } = await supabase
        .from('monthly_leaderboard')
        .select('user_id, total_points')
        .eq('month_date', lastMonthDate)
        .order('total_points', { ascending: false })
        .limit(3);

      if (leaderboardData && leaderboardData.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, profile_picture_url')
          .in('id', leaderboardData.map(l => l.user_id));

        const topThree = leaderboardData.map((entry, index) => ({
          id: entry.user_id,
          username: profilesData?.find(p => p.id === entry.user_id)?.username || 'Unknown User',
          profile_picture_url: profilesData?.find(p => p.id === entry.user_id)?.profile_picture_url || null,
          total_points: entry.total_points,
          rank: index + 1
        }));

        setPodiumData(topThree);
        setLastMonthName(lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        setShowPodium(true);
      }
    }
  };

  const handlePodiumClose = async () => {
    if (!user) return;

    // Close immediately to prevent glitching
    setShowPodium(false);

    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1);
    const lastMonthDate = lastMonth.toISOString().slice(0, 7);

    // Use upsert to prevent duplicate key errors
    const { error } = await supabase
      .from('monthly_podium_views')
      .upsert(
        { user_id: user.id, month_date: lastMonthDate },
        { onConflict: 'user_id,month_date', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Error saving podium view:', error);
      // Still keep it closed even if save fails
    }
  };

  const handleReaction = async (activityId: string, emoji: string) => {
    if (!user) return;

    // Check if user already reacted with this emoji
    const activity = activities.find(a => a.id === activityId);
    const existingReaction = activity?.reactions?.find(r => r.emoji === emoji && r.userReacted);

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (!error) {
        refetch.activities();
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('activity_reactions')
        .insert({ activity_id: activityId, user_id: user.id, emoji });

      if (!error) {
        refetch.activities();
      }
    }
  };

  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen gradient-peaceful pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Friends</h1>
            </div>
            <nav className="flex items-center gap-1">
              <DonateButton />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 h-12 w-12">
                    <Avatar className="h-12 w-12 cursor-pointer">
                      <AvatarImage src={profile?.profile_picture_url || undefined} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profile Picture</DialogTitle>
                  </DialogHeader>
                  <ProfilePictureUpload />
                </DialogContent>
              </Dialog>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-4">
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends
            {groupUnreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {groupUnreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add a Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="username/phone #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                />
                <Button onClick={handleAddFriend} disabled={isLoading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isLoading ? "Adding..." : "Add"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Friends</CardTitle>
                </div>
                {receivedRequests.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2" onClick={() => markNotificationsAsRead()}>
                        Requests
                        {unreadNotificationCount > 0 && (
                          <Badge variant="destructive" className="ml-1">
                            {unreadNotificationCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-background">
                      <div className="p-2 space-y-2">
                        {receivedRequests.map((request) => (
                          <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Avatar className="h-10 w-10">
                              {request.profile_picture_url ? (
                                <AvatarImage src={request.profile_picture_url} />
                              ) : (
                                <AvatarFallback className="bg-muted">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{request.username}</p>
                              <p className="text-xs text-muted-foreground">wants to be friends</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                                onClick={() => handleAcceptRequest(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDenyRequest(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sentRequests.length > 0 && (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto hover:bg-transparent"
                    onClick={() => setPendingRequestsOpen(!pendingRequestsOpen)}
                  >
                    <h3 className="text-sm font-semibold text-muted-foreground">Pending Requests ({sentRequests.length})</h3>
                    {pendingRequestsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  {pendingRequestsOpen && (
                    <div className="space-y-2">
                      {sentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {request.profile_picture_url ? (
                                <AvatarImage src={request.profile_picture_url} />
                              ) : (
                                <AvatarFallback className="bg-muted">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.username}</p>
                              <p className="text-xs text-muted-foreground">Request sent</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRequestToCancel(request.id);
                              setShowCancelDialog(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                  onClick={() => setFriendsListOpen(!friendsListOpen)}
                >
                  <h3 className="text-sm font-semibold text-muted-foreground">Your Friends ({friends.length})</h3>
                  {friendsListOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                {friendsListOpen && (
                  <>
                    {friends.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No friends yet. Add someone to get started!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map(friend => (
                          <div 
                            key={friend.id} 
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                          >
                            <div 
                              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => navigate(`/friends/${friend.id}`)}
                            >
                              <Avatar>
                                <AvatarImage src={friend.profile_picture_url || undefined} />
                                <AvatarFallback>{friend.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{friend.username}</span>
                                {friend.streak_visible && friend.current_streak > 0 && (
                                  <StreakFlame days={friend.current_streak} size="xs" />
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFriendToRemove(friend);
                                setShowRemoveDialog(true);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Friend Activity Collapsible Section */}
              <div className="space-y-3 pt-6 border-t border-border/50">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setActivityTabOpen(!activityTabOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Friend Activity</span>
                  </div>
                  {activityTabOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {activityTabOpen && (
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No activity yet. Connect with friends to see their progress!
                      </div>
                    ) : (
                      <div className="space-y-3">
                         {activities.map(activity => (
                           <div key={activity.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <Avatar className="h-8 w-8">
                                   {activity.profile_picture_url ? (
                                     <AvatarImage src={activity.profile_picture_url} alt={activity.username} />
                                   ) : null}
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
                                  <>
                                    ✨ Completed {activity.activity_data?.book_key ? 
                                      `${activity.activity_data.book_key} Chapter ${activity.activity_data.chapter}` : 
                                      'a chapter'}
                                  </>
                                )}
                                {activity.activity_type === 'book_completed' && (
                                  <>
                                    📚 Completed {activity.activity_data?.book_name || 'a book'}!
                                  </>
                                )}
                                {activity.activity_type === 'bible_completed' && (
                                  <>
                                    📖 Completed the entire Bible!
                                  </>
                                )}
                                {activity.activity_type === 'saint_completed' && (
                                  <>
                                    👤 Finished reading about {activity.activity_data?.saint_name || 'a saint'}
                                  </>
                                )}
                                {activity.activity_type === 'island_completed' && (
                                  <>
                                    ⛰️ Completed island: {activity.activity_data?.island_name || 'Unknown Island'}
                                  </>
                                )}
                              </p>
                            </div>
                            
                            {/* Reactions */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Display existing reactions */}
                              {activity.reactions?.map((reactionData) => (
                                <button
                                  key={reactionData.emoji}
                                  onClick={() => handleReaction(activity.id, reactionData.emoji)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                    reactionData.userReacted 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                >
                                  <span>{reactionData.emoji}</span>
                                  {reactionData.count > 0 && <span>{reactionData.count}</span>}
                                </button>
                              ))}
                              
                              {/* Dropdown to add new reactions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                  >
                                    Add Reaction
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 bg-background">
                                  {REACTION_EMOJIS.map(({ emoji, icon: Icon, label }) => (
                                    <DropdownMenuItem
                                      key={emoji}
                                      onClick={() => handleReaction(activity.id, emoji)}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <Icon className="w-4 h-4" />
                                      <span>{emoji} {label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Groups Section - moved under Your Friends */}
          <GroupsList
            groups={groups}
            invitations={groupInvitations}
            unreadInvitationCount={groupUnreadCount}
            userId={user?.id || ''}
            onGroupClick={(groupId) => navigate(`/groups/${groupId}`)}
            onRefresh={() => {
              refetchGroups.groups();
              refetchGroups.invitations();
              refetchGroups.unreadCount();
            }}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          {/* Top Donators Section - now first */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Top Donators
              </CardTitle>
              <CardDescription>
                Generous supporters of the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topDonators.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No donations yet. Be the first to support the community!
                </div>
              ) : (
                <div className="space-y-3">
                  {topDonators.map((donator, index) => {
                    const getCardBackground = () => {
                      if (index === 0) return "bg-rose-400/10";
                      if (index === 1) return "bg-rose-300/10";
                      if (index === 2) return "bg-rose-200/10";
                      return "bg-muted/50";
                    };
                    
                    const getRankColors = () => {
                      if (index === 0) return "bg-rose-400/20 text-rose-400";
                      if (index === 1) return "bg-rose-300/20 text-rose-300";
                      if (index === 2) return "bg-rose-200/20 text-rose-500";
                      return "bg-primary/10 text-primary";
                    };
                    
                    return (
                      <div key={donator.user_id} className={`flex items-center gap-3 p-3 rounded-lg ${getCardBackground()}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${getRankColors()}`}>
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src={donator.profile_picture_url || undefined} />
                          <AvatarFallback>{donator.username?.substring(0, 2).toUpperCase() || 'A'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium flex-1">{donator.username}</span>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Heart className="h-3 w-3 text-rose-500" />
                          ${(donator.total_donated / 100).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Leaderboard Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Monthly Leaderboard
              </CardTitle>
              <CardDescription>
                Top users for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No stats yet. Complete islands, chapters, or read about saints to appear on the leaderboard!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const getCardBackground = () => {
                      if (index === 0) return "bg-amber-400/10";
                      if (index === 1) return "bg-slate-300/10";
                      if (index === 2) return "bg-amber-700/10";
                      return "bg-muted/50";
                    };
                    
                    const getRankColors = () => {
                      if (index === 0) return "bg-amber-400/20 text-amber-400";
                      if (index === 1) return "bg-slate-300/20 text-slate-300";
                      if (index === 2) return "bg-amber-700/20 text-amber-700";
                      return "bg-primary/10 text-primary";
                    };
                    
                    return (
                      <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${getCardBackground()}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${getRankColors()}`}>
                          {index + 1}
                        </div>
                        <Avatar>
                          <AvatarImage src={entry.profile_picture_url || undefined} />
                          <AvatarFallback>{entry.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium flex-1">{entry.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {entry.books_completed} {entry.books_completed === 1 ? 'point' : 'points'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {friendToRemove?.username} from your friends list? 
              You can add them again later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFriendToRemove(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Friend Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this friend request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowCancelDialog(false);
              setRequestToCancel(null);
            }}>
              No, Keep It
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MonthlyPodiumModal
        isOpen={showPodium}
        onClose={handlePodiumClose}
        topThree={podiumData}
        monthName={lastMonthName}
      />

      <BottomNavigation />
    </div>
  );
}
