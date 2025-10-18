import { useState } from "react";
import { Users, UserPlus, Trophy, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Friends() {
  const { user } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
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

        {/* Friends List */}
        <TabsContent value="friends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add a Friend</CardTitle>
              <CardDescription>
                Connect with other users by their email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add
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
        </CardContentContent>

        {/* Activity Feed */}
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

        {/* Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leaderboard</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foregroundpy-8">
                No stats yet. Complete some Bible readings to appear on the leaderboard!
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
