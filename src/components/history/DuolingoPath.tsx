import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flame, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EasternCross, OrientalCross } from "@/components/crosses";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [walking, setWalking] = useState(false);
  const [burstIdx, setBurstIdx] = useState<number | null>(null);

  const completedCount = campaign.islands.filter(
    i => progress.find(p => p.islandId === i.id)?.completed
  ).length;
  // The pilgrim stands at the next quest to take on (or the last, when done)
  const currentIdx = Math.min(completedCount, campaign.islands.length - 1);

  const nodeCenter = (idx: number) => {
    const node = nodeRefs.current[idx];
    const container = containerRef.current;
    if (!node || !container) return null;
    const n = node.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    return { x: n.left - c.left + n.width / 2, y: n.top - c.top + n.height / 2 };
  };

  // Place the marker; if a quest was just conquered, walk it from the old node
  useLayoutEffect(() => {
    const justCompleted = sessionStorage.getItem('quest_just_completed');
    const justIdx = justCompleted
      ? campaign.islands.findIndex(i => i.id === justCompleted)
      : -1;

    const target = nodeCenter(currentIdx);
    if (!target) return;

    if (justIdx >= 0 && justIdx < currentIdx) {
      sessionStorage.removeItem('quest_just_completed');
      const from = nodeCenter(justIdx);
      if (from) {
        setMarkerPos(from);
        setBurstIdx(justIdx);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setWalking(true);
          setMarkerPos(target);
        }));
        const t = setTimeout(() => { setWalking(false); setBurstIdx(null); }, 1800);
        return () => clearTimeout(t);
      }
    }
    setMarkerPos(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, campaign.id]);

  useEffect(() => {
    const onResize = () => setMarkerPos(nodeCenter(currentIdx));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  const isEastern = campaign.id === 'eastern_orthodox_history';

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
    if (!match) return '';
    
    const timeframe = match[1];
    
    // Handle "Present Day" or other non-date strings
    if (timeframe === 'Present Day') {
      return timeframe;
    }
    
    // Split the range and format as "X AD – Y AD"
    const parts = timeframe.split(/[–-]/);
    if (parts.length === 2) {
      const start = parts[0].trim().replace(' AD', '');
      const end = parts[1].trim().replace(' AD', '');
      return `${start} AD – ${end} AD`;
    }
    
    // Single date like "451 AD"
    if (!timeframe.includes('–') && !timeframe.includes('-')) {
      return timeframe.includes('AD') ? timeframe : `${timeframe} AD`;
    }
    
    return timeframe;
  };

  const removeTimeframe = (title: string) => {
    return title.replace(/\s*\([^)]+\)/, '').trim();
  };

  const themeColors = campaign.theme === 'byzantine' 
    ? 'from-amber-500/20 to-yellow-600/20' 
    : 'from-red-500/20 to-orange-600/20';

  return (
    <div ref={containerRef} className="relative py-8" style={{ minHeight: `${campaign.islands.length * 280}px` }}>
      {/* Winding path background */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ zIndex: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {campaign.islands.map((island, index) => {
          if (index === campaign.islands.length - 1) return null;
          
          const isCurrentLeft = index % 2 === 0;
          const isNextLeft = (index + 1) % 2 === 0;
          
          // Check if the next island is completed to determine if path should be solid
          const nextIsland = campaign.islands[index + 1];
          const isNextCompleted = progress.find(p => p.islandId === nextIsland.id)?.completed || false;
          
          // Calculate positions based on actual layout
          const startY = index * 280 + 120;
          const endY = (index + 1) * 280 + 120;
          const midY = (startY + endY) / 2;
          
          // Determine if this is a same-side or cross-over connection
          if (isCurrentLeft === isNextLeft) {
            // Same side - gentle curve
            const x = isCurrentLeft ? '25%' : '75%';
            return (
              <path
                key={index}
                d={`M ${x} ${startY} L ${x} ${endY}`}
                stroke="url(#pathGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={isNextCompleted ? "0" : "12 8"}
                className="transition-all duration-500"
              />
            );
          } else {
            // Cross over - S-curve
            const startX = isCurrentLeft ? '25%' : '75%';
            const endX = isNextLeft ? '25%' : '75%';
            
            return (
              <path
                key={index}
                d={`M ${startX} ${startY} 
                    C ${startX} ${midY - 40}, 
                      ${endX} ${midY + 40}, 
                      ${endX} ${endY}`}
                stroke="url(#pathGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={isNextCompleted ? "0" : "12 8"}
                className="transition-all duration-500"
              />
            );
          }
        })}
      </svg>

      <div className="relative space-y-8" style={{ zIndex: 1 }}>
        {campaign.islands.map((island, index) => {
          const status = getIslandStatus(index, island);
          const isLeftSide = index % 2 === 0;
          
          return (
            <div
              key={island.id}
              className={`flex items-center gap-8 animate-rise-in ${isLeftSide ? 'flex-row' : 'flex-row-reverse'}`}
              style={{ minHeight: '240px', animationDelay: `${Math.min(index, 6) * 70}ms` }}
            >
              {/* Island Card */}
              <div className="flex-1 max-w-md">
                <Card
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer ${
                    status.isCompleted ? 'border-primary shadow-xl' : ''
                  } ${!status.isUnlocked ? 'opacity-60' : ''} ${
                    status.canStart && !status.isCompleted ? 'animate-beckon border-primary/50' : ''
                  }`}
                  onClick={() => status.isUnlocked && onIslandSelect(island.id)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${themeColors} opacity-30`} />
                  
                  <div className="relative z-10 p-6">
                    <div className="text-center mb-4">
                      <div className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                        {extractTimeframe(island.title) || `Island ${index + 1}`}
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">{removeTimeframe(island.title)}</h3>
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

              {/* Status Circle */}
              <div className="flex-shrink-0" ref={(el) => { nodeRefs.current[index] = el; }}>
              {burstIdx === index && (
                <div className="absolute pointer-events-none" style={{ transform: 'translate(-4px, -4px)' }}>
                  <div className="w-24 h-24 rounded-full border-4 border-primary animate-victory-burst" />
                </div>
              )}
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                status.isCompleted 
                  ? 'bg-white dark:bg-gray-900 shadow-lg shadow-primary/50 border-2 border-primary' 
                  : 'bg-card border-4 border-primary/30'
              }`}>
                {status.isCompleted ? (
                  <Flame 
                    className="w-8 h-8 dark:hidden" 
                    style={{ color: '#ff6b35' }}
                    fill="#ff6b35"
                    strokeWidth={2} 
                  />
                ) : null}
                {status.isCompleted ? (
                  <Flame 
                    className="w-8 h-8 hidden dark:block" 
                    style={{ color: '#3b82f6' }}
                    fill="#3b82f6"
                    strokeWidth={2} 
                  />
                ) : null}
                {!status.isCompleted && (
                  <Circle className="w-8 h-8 text-muted-foreground" strokeWidth={3} />
                )}
                </div>
              </div>

              {/* Spacer for other side */}
              <div className="flex-1 max-w-md" />
            </div>
          );
        })}
      </div>

      {/* The pilgrim — stands at the current quest, walks forward after a victory */}
      {markerPos && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: markerPos.x,
            top: markerPos.y,
            transform: 'translate(-50%, -50%)',
            transition: walking ? 'left 1.5s cubic-bezier(0.45, 0, 0.25, 1), top 1.5s cubic-bezier(0.45, 0, 0.25, 1)' : undefined,
          }}
        >
          <div className="animate-pilgrim-bob motion-reduce:animate-none">
            <div className="w-11 h-11 -mt-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 border-2 border-background flex items-center justify-center">
              {isEastern
                ? <EasternCross className="h-6 w-4" />
                : <OrientalCross className="h-6 w-6" />}
            </div>
            <div className="mx-auto w-2 h-2 rotate-45 bg-primary -mt-1" />
          </div>
        </div>
      )}

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
