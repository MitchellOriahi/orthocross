import { useState } from "react";
import { Users, UserPlus, Trophy, Activity, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Friends</h1>
      </div>
      
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
              <div className="text-center text-muted-foreground py-8">
                No friends yet. Add someone to get started!
              </div>
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
              <div className="text-center text-muted-foreground py-8">
                No activity yet. Connect with friends to see their progress!
              </div>
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
              <div className="text-center text-muted-foreground py-8">
                No stats yet. Complete some Bible readings to appear on the leaderboard!
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
