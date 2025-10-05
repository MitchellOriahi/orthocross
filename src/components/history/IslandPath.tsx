import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Island {
  id: string;
  title: string;
  awardPiece: string;
}

interface Campaign {
  id: string;
  displayName: string;
  islands: Island[];
  theme: string;
  fullSetTitle: string;
}

interface UserProgress {
  islandId: string;
  completed: boolean;
}

interface IslandPathProps {
  campaign: Campaign;
  progress: UserProgress[];
  onIslandSelect: (islandId: string) => void;
}

export const IslandPath = ({ campaign, progress, onIslandSelect }: IslandPathProps) => {
  const getIslandStatus = (index: number, island: Island) => {
    const isCompleted = progress.find(p => p.islandId === island.id)?.completed || false;
    const previousCompleted = index === 0 || progress.find(p => p.islandId === campaign.islands[index - 1].id)?.completed || false;
    
    return {
      isCompleted,
      isUnlocked: index === 0 || previousCompleted,
      canStart: !isCompleted && (index === 0 || previousCompleted)
    };
  };

  const themeColors = campaign.theme === 'byzantine' 
    ? 'from-amber-500/20 to-yellow-600/20' 
    : 'from-red-500/20 to-orange-600/20';

  return (
    <div className="relative">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {campaign.islands.map((island, index) => {
          const status = getIslandStatus(index, island);

          return (
            <Card 
              key={island.id} 
              className={`p-6 transition-all duration-300 hover:scale-105 ${
                status.isCompleted ? 'border-primary' : ''
              } ${!status.isUnlocked ? 'opacity-50' : ''}`}
            >
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${themeColors} opacity-20`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={status.isCompleted ? "default" : "outline"}>
                    Island {index + 1}
                  </Badge>
                  {status.isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  ) : !status.isUnlocked ? (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Shield className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2 line-clamp-2">{island.title}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Shield className="w-4 h-4" />
                  <span className="capitalize">{island.awardPiece.replace(/_/g, ' ')}</span>
                </div>

                <Button
                  onClick={() => onIslandSelect(island.id)}
                  disabled={!status.isUnlocked}
                  className="w-full"
                  variant={status.canStart ? "default" : "outline"}
                >
                  {status.isCompleted ? 'Review' : status.canStart ? 'Start Quest' : 'Locked'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {progress.filter(p => p.completed).length === campaign.islands.length && (
        <Card className="mt-8 p-8 text-center bg-gradient-to-br from-primary/20 to-primary/10">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">{campaign.fullSetTitle}</h2>
          <p className="text-muted-foreground">
            Congratulations! You've completed all islands and earned the complete armor set!
          </p>
        </Card>
      )}
    </div>
  );
};

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h.19l1.55 6.21c.16.65.76 1.09 1.43 1.09h5.66c.67 0 1.27-.44 1.43-1.09L18.81 16H19c2.21 0 4-1.79 4-4v-3c0-1.1-.9-2-2-2zM6 14c-1.1 0-2-.9-2-2v-2h2v4zm4 4l-1.5-6H10V6h4v6h1.5l-1.5 6h-4zm8-6c0 1.1-.9 2-2 2v-4h2v2z"/>
  </svg>
);
