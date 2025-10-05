import { Shield, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

interface DuolingoPathProps {
  campaign: Campaign;
  progress: UserProgress[];
  onIslandSelect: (islandId: string) => void;
}

export const DuolingoPath = ({ campaign, progress, onIslandSelect }: DuolingoPathProps) => {
  const getIslandStatus = (index: number, island: Island) => {
    const isCompleted = progress.find(p => p.islandId === island.id)?.completed || false;
    const previousCompleted = index === 0 || progress.find(p => p.islandId === campaign.islands[index - 1].id)?.completed || false;
    
    return {
      isCompleted,
      isUnlocked: index === 0 || previousCompleted,
      canStart: !isCompleted && (index === 0 || previousCompleted)
    };
  };

  const extractTimeframe = (title: string) => {
    const match = title.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  };

  const removeTimeframe = (title: string) => {
    return title.replace(/\s*\([^)]+\)/, '').trim();
  };

  const themeColors = campaign.theme === 'byzantine' 
    ? 'from-amber-500/20 to-yellow-600/20' 
    : 'from-red-500/20 to-orange-600/20';

  return (
    <div className="relative py-8">
      {/* SVG Trail connecting all islands */}
      <svg 
        className="absolute top-0 left-0 w-full pointer-events-none"
        style={{ zIndex: 0, height: `${campaign.islands.length * 300}px` }}
        preserveAspectRatio="none"
      >
        {campaign.islands.map((island, index) => {
          if (index === campaign.islands.length - 1) return null;
          
          // Check if next island is completed to make path solid
          const nextIsland = campaign.islands[index + 1];
          const isNextCompleted = progress.find(p => p.islandId === nextIsland.id)?.completed || false;
          
          // Calculate vertical positions (center of each island)
          const startY = index * 300 + 140;
          const endY = (index + 1) * 300 + 140;
          const midY = (startY + endY) / 2;
          
          // Center position (50%)
          const centerX = '50%';
          
          // Create smooth curved path connecting through center
          const path = `M ${centerX} ${startY} 
                       C ${centerX} ${startY + 80},
                         ${centerX} ${endY - 80},
                         ${centerX} ${endY}`;
          
          return (
            <path
              key={index}
              d={path}
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isNextCompleted ? "0" : "15 10"}
              opacity={isNextCompleted ? "0.9" : "0.5"}
              className="transition-all duration-700"
            />
          );
        })}
      </svg>

      <div className="relative space-y-8" style={{ zIndex: 1 }}>
        {campaign.islands.map((island, index) => {
          const status = getIslandStatus(index, island);
          const isLeftSide = index % 2 === 0;
          
          return (
            <div 
              key={island.id} 
              className="flex items-center justify-center gap-8 relative"
              style={{ minHeight: '280px' }}
            >
              {/* Island Card - Left */}
              <div className={`flex-1 max-w-md ${isLeftSide ? 'text-right' : 'text-left order-3'}`}>
                <Card
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${
                    status.isCompleted ? 'border-primary shadow-xl' : ''
                  } ${!status.isUnlocked ? 'opacity-60' : ''}`}
                  onClick={() => status.isUnlocked && onIslandSelect(island.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${themeColors} opacity-30`} />
                  
                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          {extractTimeframe(island.title) || `Island ${index + 1}`}
                        </div>
                        <h3 className="text-lg font-bold mb-3 line-clamp-2">{removeTimeframe(island.title)}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Shield className="w-4 h-4" />
                      <span className="capitalize">{island.awardPiece.replace(/_/g, ' ')}</span>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onIslandSelect(island.id);
                      }}
                      disabled={!status.isUnlocked}
                      className="w-full"
                      variant={status.canStart ? "default" : "outline"}
                    >
                      {status.isCompleted ? 'Review' : status.canStart ? 'Start Quest' : 'Locked'}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Status Circle - Center */}
              <div className="flex-shrink-0 relative z-10 order-2">
                <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  status.isCompleted 
                    ? 'bg-primary shadow-lg shadow-primary/50' 
                    : 'bg-card border-4 border-primary/30'
                }`}>
                  {status.isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
                  ) : (
                    <Circle className="w-8 h-8 text-muted-foreground" strokeWidth={3} />
                  )}
                </div>
              </div>

              {/* Spacer for other side */}
              <div className={`flex-1 max-w-md ${isLeftSide ? 'order-3' : 'order-1'}`} />
            </div>
          );
        })}
      </div>

      {/* Completion celebration */}
      {progress.filter(p => p.completed).length === campaign.islands.length && (
        <Card className="mt-12 p-8 text-center bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary">
          <svg className="w-20 h-20 mx-auto mb-6 text-primary animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v3c0 2.21 1.79 4 4 4h.19l1.55 6.21c.16.65.76 1.09 1.43 1.09h5.66c.67 0 1.27-.44 1.43-1.09L18.81 16H19c2.21 0 4-1.79 4-4v-3c0-1.1-.9-2-2-2zM6 14c-1.1 0-2-.9-2-2v-2h2v4zm4 4l-1.5-6H10V6h4v6h1.5l-1.5 6h-4zm8-6c0 1.1-.9 2-2 2v-4h2v2z"/>
          </svg>
          <h2 className="text-2xl font-bold mb-2">{campaign.fullSetTitle}</h2>
          <p className="text-muted-foreground">
            Congratulations! You've completed all islands and earned the complete armor set!
          </p>
        </Card>
      )}
    </div>
  );
};
