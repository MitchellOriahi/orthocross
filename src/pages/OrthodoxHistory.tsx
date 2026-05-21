import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
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
  const [progress, setProgress] = useState<UserProgress[]>(() => {
    try {
      const cached = user?.id ? sessionStorage.getItem(`history_progress_${user.id}`) : null;
      if (cached) return JSON.parse(cached) as UserProgress[];
    } catch {}
    return [];
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCampaignType, setCompletedCampaignType] = useState<"eastern" | "oriental" | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      // Hydrate from cache immediately when user becomes available (in case it wasn't ready on init)
      try {
        const cached = sessionStorage.getItem(`history_progress_${user.id}`);
        if (cached) setProgress(JSON.parse(cached) as UserProgress[]);
      } catch {}
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orthodox_history_progress')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      const mapped = data.map(item => ({
        campaignId: item.campaign_id,
        islandId: item.island_id,
        completed: item.completed,
        xpEarned: item.xp_earned
      }));
      setProgress(mapped);
      try { sessionStorage.setItem(`history_progress_${user.id}`, JSON.stringify(mapped)); } catch {}
    }
  };


  const handleIslandComplete = async (campaignId: string, islandId: string, score: number) => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Check if this island was already completed this month
    const { data: existingProgress } = await supabase
      .from('orthodox_history_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('campaign_id', campaignId)
      .eq('island_id', islandId)
      .gte('completed_at', `${currentMonth}-01`)
      .single();

    const isFirstTimeThisMonth = !existingProgress;

    await supabase.from('orthodox_history_progress').upsert({
      user_id: user.id,
      campaign_id: campaignId,
      island_id: islandId,
      completed: true,
      quiz_score: score,
      completed_at: new Date().toISOString()
    });

    // Add point to leaderboard only if first time this month
    if (isFirstTimeThisMonth) {
      const { data: leaderboard } = await supabase
        .from('monthly_leaderboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_date', currentMonth)
        .single();

      if (leaderboard) {
        await supabase
          .from('monthly_leaderboard')
          .update({
            history_islands_completed: (leaderboard.history_islands_completed || 0) + 1,
            total_points: (leaderboard.total_points || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', leaderboard.id);
      } else {
        await supabase
          .from('monthly_leaderboard')
          .insert({
            user_id: user.id,
            month_date: currentMonth,
            history_islands_completed: 1,
            chapters_completed: 0,
            saints_read_count: 0,
            total_points: 1
          });
      }
    }

    // Update streak immediately after completing activity
    const { updateUserStreak } = await import('@/utils/streakManager');
    await updateUserStreak(user.id);

    // Create friend activity for island completion
    const island = historyContent.campaigns
      .find(c => c.id === campaignId)?.islands
      .find(i => i.id === islandId);
    
    if (island) {
      await supabase
        .from('friend_activities')
        .insert({
          user_id: user.id,
          activity_type: 'island_completed',
          activity_data: {
            campaign_id: campaignId,
            island_id: islandId,
            island_name: island.title
          }
        });
    }

    await loadProgress();
    // Don't set selectedIsland to null here - let the modal show and user dismiss it manually

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
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 lg:px-2 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">History</h1>
            </div>
            <nav className="flex items-center gap-1">
              <DonateButton />
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
