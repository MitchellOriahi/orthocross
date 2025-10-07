import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNavigation } from "@/components/BottomNavigation";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { historyContent } from "@/data/historyContent";
import { IslandDetail } from "@/components/history/IslandDetail";
import { AvatarCustomizer } from "@/components/history/AvatarCustomizer";
import { DuolingoPath } from "@/components/history/DuolingoPath";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignCompletionModal } from "@/components/history/CampaignCompletionModal";

interface UserProgress {
  campaignId: string;
  islandId: string;
  completed: boolean;
  xpEarned: number;
}

const OrthodoxHistory = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();
  const [selectedCampaign, setSelectedCampaign] = useState(historyContent.campaigns[0].id);
  const [selectedIsland, setSelectedIsland] = useState<{ campaignId: string; islandId: string } | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCampaignType, setCompletedCampaignType] = useState<"eastern" | "oriental" | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadProgress();
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


  const handleIslandComplete = async (campaignId: string, islandId: string, score: number) => {
    if (!user) return;

    await supabase.from('orthodox_history_progress').upsert({
      user_id: user.id,
      campaign_id: campaignId,
      island_id: islandId,
      completed: true,
      quiz_score: score,
      completed_at: new Date().toISOString()
    });

    // Update streak immediately after completing activity
    const { updateUserStreak } = await import('@/utils/streakManager');
    await updateUserStreak(user.id);

    await loadProgress();
    setSelectedIsland(null);

    // Check if campaign is completed
    const campaign = historyContent.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      const updatedProgress = await supabase
        .from('orthodox_history_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('campaign_id', campaignId);

      const completedInCampaign = updatedProgress.data?.filter(p => p.completed).length || 0;
      
      if (completedInCampaign === campaign.islands.length) {
        const campaignType = campaignId === 'eastern-orthodoxy' ? 'eastern' : 'oriental';
        setCompletedCampaignType(campaignType);
        setShowCompletionModal(true);
      }
    }
  };

  const campaign = historyContent.campaigns.find(c => c.id === selectedCampaign);
  const completedIslands = progress.filter(p => p.campaignId === selectedCampaign && p.completed).length;
  const progressPercent = campaign ? (completedIslands / campaign.islands.length) * 100 : 0;

  if (selectedIsland && campaign) {
    const island = campaign.islands.find(i => i.id === selectedIsland.islandId);
    if (island) {
      return (
        <IslandDetail
          island={island}
          campaignId={selectedIsland.campaignId}
          onComplete={handleIslandComplete}
          onBack={() => setSelectedIsland(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-20">

      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={theme === 'light' ? orthodoxCrossLight : orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">History</h1>
            </div>
            <nav className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {completedIslands} of {campaign?.islands.length} islands completed in {campaign?.displayName}
          </p>
        </Card>

        <Tabs value={selectedCampaign} onValueChange={setSelectedCampaign} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            {historyContent.campaigns.map(c => (
              <TabsTrigger key={c.id} value={c.id} className="text-xs sm:text-sm whitespace-normal py-2">
                {c.displayName}
              </TabsTrigger>
            ))}
          </TabsList>

          {historyContent.campaigns.map(campaignItem => (
            <TabsContent key={campaignItem.id} value={campaignItem.id}>
              <DuolingoPath
                campaign={campaignItem}
                progress={progress.filter(p => p.campaignId === campaignItem.id)}
                onIslandSelect={(islandId) => setSelectedIsland({ campaignId: campaignItem.id, islandId })}
              />
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <BottomNavigation />

      {completedCampaignType && (
        <CampaignCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          campaignType={completedCampaignType}
        />
      )}
    </div>
  );
};

export default OrthodoxHistory;
