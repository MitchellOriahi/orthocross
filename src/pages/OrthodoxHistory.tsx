import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Settings as SettingsIcon, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DoveMascot } from "@/components/DoveMascot";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { historyContent } from "@/data/historyContent";
import { IslandPath } from "@/components/history/IslandPath";
import { IslandDetail } from "@/components/history/IslandDetail";
import { AvatarCustomizer } from "@/components/history/AvatarCustomizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProgress {
  campaignId: string;
  islandId: string;
  completed: boolean;
  xpEarned: number;
}

const OrthodoxHistory = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [selectedCampaign, setSelectedCampaign] = useState(historyContent.campaigns[0].id);
  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [hearts, setHearts] = useState(historyContent.maxHearts);
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);

  useEffect(() => {
    loadProgress();
    loadAvatarData();
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orthodox_history_progress')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setProgress(data.map(item => ({
        campaignId: item.campaign_id,
        islandId: item.island_id,
        completed: item.completed,
        xpEarned: item.xp_earned
      })));
    }
  };

  const loadAvatarData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setTotalXp(data.total_xp);
      setHearts(data.hearts);
    } else {
      // Create default avatar
      await supabase.from('user_avatars').insert({
        user_id: user.id,
        gender: 'male',
        skin_tone: 'medium',
        hairstyle: 'short_cropped',
        eye_color: 'brown',
        beard_option: 'none',
        outfit_palette: 'earth'
      });
    }
  };

  const handleIslandComplete = async (campaignId: string, islandId: string, xpEarned: number, score: number) => {
    if (!user) return;

    await supabase.from('orthodox_history_progress').upsert({
      user_id: user.id,
      campaign_id: campaignId,
      island_id: islandId,
      completed: true,
      xp_earned: xpEarned,
      quiz_score: score,
      completed_at: new Date().toISOString()
    });

    await supabase
      .from('user_avatars')
      .update({ total_xp: totalXp + xpEarned })
      .eq('user_id', user.id);

    setTotalXp(prev => prev + xpEarned);
    loadProgress();
    setSelectedIsland(null);
  };

  const campaign = historyContent.campaigns.find(c => c.id === selectedCampaign);
  const completedIslands = progress.filter(p => p.campaignId === selectedCampaign && p.completed).length;
  const progressPercent = campaign ? (completedIslands / campaign.islands.length) * 100 : 0;

  if (selectedIsland && campaign) {
    const island = campaign.islands.find(i => i.id === selectedIsland);
    if (island) {
      return (
        <IslandDetail
          island={island}
          campaignId={campaign.id}
          onComplete={handleIslandComplete}
          onBack={() => setSelectedIsland(null)}
          hearts={hearts}
          setHearts={setHearts}
        />
      );
    }
  }

  if (showAvatarCustomizer) {
    return (
      <AvatarCustomizer
        onClose={() => setShowAvatarCustomizer(false)}
        equippedArmor={progress.filter(p => p.completed).map(p => {
          const c = historyContent.campaigns.find(camp => camp.id === p.campaignId);
          const i = c?.islands.find(isl => isl.id === p.islandId);
          return i?.awardPiece || '';
        })}
      />
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoveMascot size="sm" />
              <h1 className="text-2xl font-bold gradient-sacred bg-clip-text text-transparent">
                Orthodox History Quest
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <Home className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowAvatarCustomizer(true)}>
                <Trophy className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
              <p className="text-muted-foreground">XP: {totalXp} • Hearts: {"❤️".repeat(hearts)}</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedIslands} of {campaign?.islands.length} islands completed in {campaign?.displayName}
          </p>
        </Card>

        <Tabs value={selectedCampaign} onValueChange={setSelectedCampaign} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            {historyContent.campaigns.map(campaign => (
              <TabsTrigger key={campaign.id} value={campaign.id}>
                {campaign.displayName}
              </TabsTrigger>
            ))}
          </TabsList>

          {historyContent.campaigns.map(campaign => (
            <TabsContent key={campaign.id} value={campaign.id}>
              <IslandPath
                campaign={campaign}
                progress={progress.filter(p => p.campaignId === campaign.id)}
                onIslandSelect={setSelectedIsland}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default OrthodoxHistory;
