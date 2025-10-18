import { useState, useEffect } from "react";
import { Users, UserPlus, Trophy, Activity, Settings as SettingsIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { useTheme } from "next-themes";

interface Friend {
  id: string;
  username: string;
  profile_picture_url: string | null;
}

interface FriendActivity {
  id: string;
  username: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  books_completed: number;
  profile_picture_url: string | null;
}

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('profile_picture_url, username')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfilePicture(data.profile_picture_url);
        setUsername(data.username || "");
      }
    };

    loadProfile();
    loadFriends();
    loadActivities();
    loadLeaderboard();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;

    const { data: friendsData } = await supabase
      .from('friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendsData) {
      const friendIds = friendsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', friendIds);

      if (profilesData) {
        setFriends(profilesData as Friend[]);
      }
    }
  };

  const loadActivities = async () => {
    if (!user) return;

    const { data: friendsData } = await supabase
      .from('friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendsData) {
      const friendIds = friendsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      const { data: activitiesData } = await supabase
        .from('friend_activities')
        .select('id, user_id, activity_type, activity_data, created_at')
        .in('user_id', friendIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesData) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', activitiesData.map(a => a.user_id));

        const activitiesWithUsernames = activitiesData.map(activity => ({
          ...activity,
          username: profilesData?.find(p => p.id === activity.user_id)?.username || 'Unknown User'
        }));

        setActivities(activitiesWithUsernames as FriendActivity[]);
      }
    }
  };

  const loadLeaderboard = async () => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: friendsData } = await supabase
      .from('friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendsData) {
      const friendIds = friendsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );
      friendIds.push(user.id); // Include current user

      const { data: leaderboardData } = await supabase
        .from('monthly_leaderboard')
        .select('user_id, total_points')
        .eq('month_date', currentMonth)
        .in('user_id', friendIds)
        .order('total_points', { ascending: false });

      if (leaderboardData) {
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
      // Search for user by username
      let { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", searchQuery.trim())
        .maybeSingle();

      // If not found by username, try phone number
      if (!profileData) {
        const { data: phoneData } = await supabase
          .from("user_phone_numbers")
          .select("user_id")
          .eq("phone_number", searchQuery.trim())
          .maybeSingle();

        if (phoneData) {
          profileData = { id: phoneData.user_id };
        }
      }

      if (!profileData) {
        toast({
          title: "User not found",
          description: "No user found with that username or phone number",
          variant: "destructive",
        });
        return;
      }

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

      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully",
      });

      setSearchQuery("");
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

  const getUserInitials = () => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen gradient-peaceful pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Friends</h1>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 h-12 w-12">
                    <Avatar className="h-12 w-12 cursor-pointer">
                      <AvatarImage src={profilePicture || undefined} />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
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
              <CardDescription>
                Connect with other users by their username or phone number
              </CardDescription>
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
              <CardTitle>Your Friends</CardTitle>
              <CardDescription>
                Connect with friends to see their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No friends yet. Add someone to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div 
                      key={friend.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate(`/friends/${friend.id}`)}
                    >
                      <Avatar>
                        <AvatarImage src={friend.profile_picture_url || undefined} />
                        <AvatarFallback>{friend.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.username}</span>
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
              <CardTitle>Friend Activity</CardTitle>
              <CardDescription>
                See what your friends have been accomplishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No activity yet. Connect with friends to see their progress!
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.activity_type === 'chapter_completed' && 'Completed a chapter'}
                        {activity.activity_type === 'book_completed' && `Completed ${activity.activity_data?.book_name || 'a book'}! 🎉`}
                        {activity.activity_type === 'streak_milestone' && `Reached ${activity.activity_data?.streak} day streak!`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leaderboard</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No stats yet. Complete islands, chapters, or read about saints to appear on the leaderboard!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}
