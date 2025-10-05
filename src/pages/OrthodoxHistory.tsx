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
import { IslandDetail } from "@/components/history/IslandDetail";
import { AvatarCustomizer } from "@/components/history/AvatarCustomizer";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CheckCircle2 } from "lucide-react";

interface UserProgress {
  campaignId: string;
  islandId: string;
  completed: boolean;
  xpEarned: number;
}

const OrthodoxHistory = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [selectedIsland, setSelectedIsland] = useState<{ campaignId: string; islandId: string } | null>(null);
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

    const newTotalXp = totalXp + xpEarned;
    await supabase
      .from('user_avatars')
      .update({ 
        total_xp: newTotalXp,
        hearts: hearts 
      })
      .eq('user_id', user.id);

    setTotalXp(newTotalXp);
    await loadProgress();
    setSelectedIsland(null);
  };

  // Combine all islands from both campaigns into a single path
  const allIslands = historyContent.campaigns.flatMap(campaign => 
    campaign.islands.map(island => ({
      ...island,
      campaignId: campaign.id,
      campaignName: campaign.displayName,
      campaignTheme: campaign.theme
    }))
  );

  const totalCompleted = progress.filter(p => p.completed).length;
  const totalIslands = allIslands.length;
  const progressPercent = (totalCompleted / totalIslands) * 100;

  const getIslandStatus = (index: number, island: any) => {
    const isCompleted = progress.find(p => p.campaignId === island.campaignId && p.islandId === island.id)?.completed || false;
    const previousCompleted = index === 0 || progress.find(p => {
      const prevIsland = allIslands[index - 1];
      return p.campaignId === prevIsland.campaignId && p.islandId === prevIsland.id;
    })?.completed || false;
    
    return {
      isCompleted,
      isUnlocked: index === 0 || previousCompleted,
      canStart: !isCompleted && (index === 0 || previousCompleted)
    };
  };

  if (selectedIsland) {
    const island = allIslands.find(i => i.campaignId === selectedIsland.campaignId && i.id === selectedIsland.islandId);
    if (island) {
      return (
        <IslandDetail
          island={island}
          campaignId={island.campaignId}
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
              <p className="text-muted-foreground">XP: {totalXp} • Hearts: {"❤️".repeat(hearts)}</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {totalCompleted} of {totalIslands} islands completed
          </p>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-sacred bg-clip-text text-transparent">
            Orthodox History Path
          </h2>
          
          <div className="relative">
            {/* Path connector line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-primary opacity-20" />
            
            <div className="space-y-6">
              {allIslands.map((island, index) => {
                const status = getIslandStatus(index, island);
                const themeColors = island.campaignTheme === 'byzantine' 
                  ? 'from-amber-500/20 to-yellow-600/20' 
                  : 'from-red-500/20 to-orange-600/20';

                return (
                  <div key={`${island.campaignId}-${island.id}`} className="relative pl-20">
                    {/* Island number indicator */}
                    <div className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                      status.isCompleted ? 'bg-primary text-primary-foreground' : 
                      status.isUnlocked ? 'bg-card border-2 border-primary' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    <Card className={`transition-all duration-300 hover:scale-[1.02] ${
                      status.isCompleted ? 'border-primary shadow-lg' : ''
                    } ${!status.isUnlocked ? 'opacity-50' : ''}`}>
                      <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${themeColors} opacity-20`} />
                      
                      <div className="relative z-10 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {island.campaignName}
                            </Badge>
                            <h3 className="text-xl font-bold mb-2">{island.title}</h3>
                          </div>
                          {status.isCompleted ? (
                            <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
                          ) : !status.isUnlocked ? (
                            <Lock className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Shield className="w-8 h-8 text-primary/50 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Shield className="w-4 h-4" />
                          <span className="capitalize">{island.awardPiece.replace(/_/g, ' ')}</span>
                        </div>

                        <Button
                          onClick={() => setSelectedIsland({ campaignId: island.campaignId, islandId: island.id })}
                          disabled={!status.isUnlocked}
                          className="w-full"
                          variant={status.canStart ? "default" : "outline"}
                        >
                          {status.isCompleted ? 'Review Island' : status.canStart ? 'Start Quest' : 'Locked'}
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>

              <Card className="mt-12 p-8 text-center bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <svg className="w-full h-full text-primary animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h.19l1.55 6.21c.16.65.76 1.09 1.43 1.09h5.66c.67 0 1.27-.44 1.43-1.09L18.81 16H19c2.21 0 4-1.79 4-4v-3c0-1.1-.9-2-2-2zM6 14c-1.1 0-2-.9-2-2v-2h2v4zm4 4l-1.5-6H10V6h4v6h1.5l-1.5 6h-4zm8-6c0 1.1-.9 2-2 2v-4h2v2z"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4 gradient-sacred bg-clip-text text-transparent">
                  Complete Mastery Achieved!
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  You've completed all islands in Orthodox History!
                </p>
                <p className="text-sm text-muted-foreground">
                  You now possess the Full Eastern and Oriental Armor of God
                </p>
              </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrthodoxHistory;
